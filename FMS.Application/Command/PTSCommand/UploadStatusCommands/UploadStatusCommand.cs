using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.SignalR;
using FMS.Application.Events.Pump;
using FMS.Application.Features.ATG.Common;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Application.Services.TankStock; //Cursor: Add for tank transfer service
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.Enums;
using FMS.Domain.Entities.PTS.PTSStatus;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;
using FMS.Domain.Entities.PTS.PTSStatus.PumpStatus;
using FMS.Persistence.DataAccess;
using FMS.PTS.WindowsService.Services.Pump;
//using FMS.Services.Helper;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Communication;
using FMS.Application.Features.ATG;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Command.PTSCommand.UploadStatusCommands
{

    public record UploadStatusCommand : IRequest<CommandResult>
    {
        public string? DeviceId { get; init; }

        public UploadStatus? UploadStatus { get; init; }

    }

    public class UploadStatusCommandHandler : IRequestHandler<UploadStatusCommand, CommandResult>
    {

        private readonly ILogger<UploadStatusCommandHandler> _logger;
        private readonly IPendingCommandRepository _pendingCommandRepo;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly GpsdataContext _context;
        private readonly IHubContext<PTSHub> _hubContext;
        private readonly IMediator _mediator;
        private readonly IDatabase _redisDb; //Cursor
        private readonly DeviceConnectionTracker _connectionTracker; //Cursor
        private readonly IPumpService _pumpService; //Cursor: Add pump service
        private readonly ITransactionMonitoringService _transactionMonitoringService; //Cursor: Add for enhanced monitoring
        private readonly ITransactionCompletionService _transactionCompletionService; //Cursor: Add for transaction completion
        private readonly IAutoTransactionCompletionService _autoCompletionService; //Cursor: Add auto-completion service
        private readonly IPumpTankTransferService _pumpTankTransferService; //Cursor: Add tank transfer service
        private readonly IServiceScopeFactory _serviceScopeFactory; // For background task scoping

        public UploadStatusCommandHandler(
            IHubContext<PTSHub> hubContext,
            GpsdataContext context,
            IMediator mediator,
            ILogger<UploadStatusCommandHandler> logger,
            IPendingCommandRepository pendingCommandRepository,
            IAuthorizationStateTracker authorizationState,
            IConnectionMultiplexer redisConnection, //Cursor
            DeviceConnectionTracker connectionTracker, //Cursor
            IPumpService pumpService, //Cursor: Add pump service
            ITransactionMonitoringService transactionMonitoringService, //Cursor: Add for enhanced monitoring
            ITransactionCompletionService transactionCompletionService, //Cursor: Add for transaction completion
            IAutoTransactionCompletionService autoCompletionService, //Cursor: Add auto-completion service
            IPumpTankTransferService pumpTankTransferService, //Cursor: Add tank transfer service
            IServiceScopeFactory serviceScopeFactory) // For background task scoping
        {
            _hubContext = hubContext;
            _mediator = mediator;
            _logger = logger;
            _pendingCommandRepo = pendingCommandRepository;
            _authTracker = authorizationState;
            _context = context;
            _redisDb = redisConnection.GetDatabase(); //Cursor
            _connectionTracker = connectionTracker; //Cursor
            _pumpService = pumpService; //Cursor: Add pump service
            _transactionMonitoringService = transactionMonitoringService; //Cursor: Add for enhanced monitoring
            _transactionCompletionService = transactionCompletionService; //Cursor: Add for transaction completion
            _autoCompletionService = autoCompletionService; //Cursor: Add auto-completion service
            _pumpTankTransferService = pumpTankTransferService; //Cursor: Add tank transfer service
            _serviceScopeFactory = serviceScopeFactory; // For background task scoping
        }

        public async Task<CommandResult> Handle(UploadStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var uploadstatus = request.UploadStatus;
                var deviceId = request.DeviceId;

                if (uploadstatus == null)
                {
                    _logger.LogWarning("No status data received for device {DeviceId}", deviceId);
                    return CommandResult.Failed("No status data received");
                }

                // Broadcast ONLY the complete upload status update
                await BroadcastUploadStatusUpdate(deviceId, uploadstatus);

                // Store the status update in Redis //Cursor
                await StoreUploadStatusInRedis(deviceId, uploadstatus); //Cursor

                // Update the last activity time for the WebSocket connection
                if (!string.IsNullOrEmpty(deviceId))
                {
                    await _connectionTracker.UpdateWebSocketLastMessageTime(deviceId);
                }

                // Process specific components INTERNALLY (e.g., update auth state)
                // but DO NOT broadcast granular events from here anymore.
                if (uploadstatus?.Pumps != null)
                {
                    await ProcessLivePumpStatusInternally(deviceId!, uploadstatus.Pumps);
                }

                // // Optional: Internal processing for probes/readers - NO Hub calls
                //  if (uploadstatus?.Probes != null)
                //  {
                //      await ProcessLiveProbeStatusInternalLogic(deviceId!, uploadstatus.Probes);
                //  }
                //  if (uploadstatus?.Readers != null)
                //  {
                //      await ProcessLiveReaderStatusInternalLogic(deviceId!, uploadstatus.Readers);
                //  }

                return CommandResult.Succeeded("OK", null!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing status update");
                throw;
            }
        }

        // New method to store the upload status in Redis //Cursor
        private async Task StoreUploadStatusInRedis(string deviceId, UploadStatus status)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId) || status == null)
                {
                    _logger.LogWarning("Cannot store upload status in Redis: device ID or status is null");
                    return;
                }

                var redisKey = $"device:{deviceId}:status";
                var statusJson = JsonSerializer.Serialize(status);

                await _redisDb.StringSetAsync(
                    redisKey,
                    statusJson,
                    expiry: TimeSpan.FromMinutes(30) // Keep status for 30 minutes
                );

                // Also set a timestamp key to track when the status was last updated
                await _redisDb.StringSetAsync(
                    $"device:{deviceId}:status:timestamp",
                    DateTime.UtcNow.ToString("o"),
                    expiry: TimeSpan.FromMinutes(30)
                );

                _logger.LogInformation("Stored UploadStatus in Redis for device {DeviceId}", deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error storing upload status in Redis for device {DeviceId}", deviceId);
                // Don't rethrow - we still want to continue processing if Redis storage fails
            }
        }

        // Keep this method for broadcasting the full status
        private async Task BroadcastUploadStatusUpdate(string deviceId, UploadStatus status)
        {
            try
            {
                // Get fueling context for active pumps (filling or EOT)
                var fuelingContexts = await GetActivePumpFuelingContexts(deviceId, status);

                var statusUpdate = new
                {
                    deviceId = deviceId,
                    timestamp = DateTime.UtcNow,
                    status = new // Pass the full nested status object
                    {
                        configurationId = status.ConfigurationId,
                        dateTime = status.DateTime,
                        firmwareDateTime = status.FirmwareDateTime,
                        startupSeconds = status.StartupSeconds,
                        batteryVoltage = status.BatteryVoltage,
                        cpuTemperature = status.CpuTemperature,
                        ptsPowerDownDetected = status.PtsPowerDownDetected,
                        sdMounted = status.SdMounted,
                        pumps = status.Pumps, // Send the whole Pumps object
                        probes = status.Probes, // Send the whole Probes object
                        readers = status.Readers, // Send the whole Readers object
                        fuelGrades = status.FuelGrades
                    },
                    // Enhanced: Include fueling context for active pumps
                    fuelingContexts = fuelingContexts
                };

                await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", statusUpdate);
                _logger.LogDebug("[Broadcast] Sent UploadStatusUpdate for {DeviceId} with {ContextCount} fueling contexts",
                    deviceId, fuelingContexts?.Count ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting upload status update for device {DeviceId}", deviceId);
            }
        }

        /// <summary>
        /// Get fueling context information for all pumps that are actively filling or in EOT state.
        /// This enriches the upload status with business context (vehicle, tank, user info).
        /// </summary>
        private async Task<List<PumpFuelingContext>> GetActivePumpFuelingContexts(string deviceId, UploadStatus status)
        {
            var contexts = new List<PumpFuelingContext>();

            try
            {
                if (status?.Pumps == null) return contexts;

                // Collect pump IDs and transaction IDs from FillingStatus
                var fillingPumps = new Dictionary<int, int>(); // pumpId -> transactionId
                if (status.Pumps.FillingStatus?.Ids != null && status.Pumps.FillingStatus.Transactions != null)
                {
                    for (int i = 0; i < status.Pumps.FillingStatus.Ids.Count; i++)
                    {
                        var pumpId = status.Pumps.FillingStatus.Ids[i];
                        var transactionId = status.Pumps.FillingStatus.Transactions.Count > i
                            ? status.Pumps.FillingStatus.Transactions[i] : 0;
                        if (pumpId.HasValue && transactionId > 0)
                        {
                            fillingPumps[pumpId.Value] = transactionId;
                        }
                    }
                }

                // Collect pump IDs and transaction IDs from EndOfTransactionStatus
                var eotPumps = new Dictionary<int, int>(); // pumpId -> transactionId
                if (status.Pumps.EndOfTransactionStatus?.Ids != null && status.Pumps.EndOfTransactionStatus.Transactions != null)
                {
                    for (int i = 0; i < status.Pumps.EndOfTransactionStatus.Ids.Count; i++)
                    {
                        var pumpId = status.Pumps.EndOfTransactionStatus.Ids[i];
                        var transactionId = status.Pumps.EndOfTransactionStatus.Transactions.Count > i
                            ? status.Pumps.EndOfTransactionStatus.Transactions[i] : 0;
                        if (pumpId.HasValue && transactionId > 0 && !fillingPumps.ContainsKey(pumpId.Value))
                        {
                            eotPumps[pumpId.Value] = transactionId;
                        }
                    }
                }

                // Combine all active pumps
                var allActivePumps = fillingPumps.Concat(eotPumps).ToList();

                foreach (var pump in allActivePumps)
                {
                    var pumpId = pump.Key;
                    var transactionId = pump.Value;

                    // Try to get context from Redis
                    var context = await GetFuelingContextFromRedis(deviceId, transactionId, pumpId);
                    if (context != null)
                    {
                        contexts.Add(context);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fueling contexts for device {DeviceId}", deviceId);
            }

            return contexts;
        }

        /// <summary>
        /// Get fueling context from Redis transaction context and enrich with database lookups
        /// </summary>
        private async Task<PumpFuelingContext?> GetFuelingContextFromRedis(string deviceId, int transactionId, int pumpId)
        {
            try
            {
                var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogWarning("[UploadStatus] ⚠️ NO REDIS CONTEXT found for device {DeviceId}, transaction {TransactionId} - Authorization context may have expired", deviceId, transactionId);
                    return null;
                }

                // **DEBUG: Log the raw Redis context JSON**
                _logger.LogInformation("[UploadStatus] 📦 REDIS CONTEXT RETRIEVED for device {DeviceId}, transaction {TransactionId}: {ContextJson}",
                    deviceId, transactionId, contextJson.ToString());

                var redisContext = JsonSerializer.Deserialize<JsonElement>(contextJson!);

                // Extract values from Redis context
                var vehicleId = redisContext.TryGetProperty("VehicleId", out var vIdProp) && vIdProp.ValueKind != JsonValueKind.Null
                    ? vIdProp.GetInt32() : (int?)null;
                var tankId = redisContext.TryGetProperty("TankId", out var tIdProp) && tIdProp.ValueKind != JsonValueKind.Null
                    ? tIdProp.GetInt32() : (int?)null;
                var userId = redisContext.TryGetProperty("UserId", out var uIdProp) && uIdProp.ValueKind != JsonValueKind.Null
                    ? uIdProp.GetString() : null;
                var connectionType = redisContext.TryGetProperty("ConnectionType", out var ctProp)
                    ? ctProp.GetString() : null;
                var autoClose = redisContext.TryGetProperty("AutoCloseTransaction", out var acProp)
                    ? acProp.GetBoolean() : false;
                var authorizedAt = redisContext.TryGetProperty("AuthorizedAt", out var aaProp)
                    ? aaProp.GetDateTime() : (DateTime?)null;
                var odometer = redisContext.TryGetProperty("Odometer", out var odProp) && odProp.ValueKind != JsonValueKind.Null
                    ? odProp.GetDecimal() : (decimal?)null;

                // Determine mode based on VehicleId and TankId
                // Using strong-typed constants to avoid magic strings
                string mode = PumpOperationMode.Unknown;
                if (vehicleId.HasValue && vehicleId > 0)
                {
                    mode = PumpOperationMode.Vehicle;
                }
                else if (tankId.HasValue && tankId > 0)
                {
                    mode = PumpOperationMode.Transfer;
                }

                // Lookup vehicle name if applicable
                string? vehicleName = null;
                if (vehicleId.HasValue && vehicleId > 0)
                {
                    var vehicle = await _context.Vehicles
                        .Where(v => v.VehicleId == vehicleId)
                        .Select(v => new { v.NumberPlate, v.HyoungNo })
                        .FirstOrDefaultAsync();
                    vehicleName = vehicle?.NumberPlate ?? vehicle?.HyoungNo ?? $"Vehicle {vehicleId}";
                }

                // Lookup tank name if applicable
                string? tankName = null;
                if (tankId.HasValue && tankId > 0)
                {
                    var tank = await _context.Tanks
                        .Where(t => t.Id == tankId)
                        .Select(t => t.Name)
                        .FirstOrDefaultAsync();
                    tankName = tank ?? $"Tank {tankId}";
                }

                // Lookup user name if applicable
                string? userName = null;
                if (!string.IsNullOrEmpty(userId))
                {
                    var user = await _context.Users
                        .Where(u => u.Id == userId)
                        .Select(u => u.UserName)
                        .FirstOrDefaultAsync();
                    userName = user ?? userId;
                }

                // **DEBUG: Log extracted context values**
                _logger.LogDebug("[UploadStatus] 📊 FUELING CONTEXT BUILT - Device: {DeviceId}, Transaction: {TransactionId}, " +
                    "VehicleId: {VehicleId}, VehicleName: {VehicleName}, TankId: {TankId}, TankName: {TankName}, " +
                    "UserId: {UserId}, UserName: {UserName}, Odometer: {Odometer}, Mode: {Mode}, AutoClose: {AutoClose}",
                    deviceId, transactionId, vehicleId, vehicleName, tankId, tankName, userId, userName, odometer, mode, autoClose);

                return new PumpFuelingContext
                {
                    PumpId = pumpId,
                    TransactionId = transactionId,
                    Mode = mode,
                    VehicleId = vehicleId,
                    VehicleName = vehicleName,
                    TankId = tankId,
                    TankName = tankName,
                    FueledByUserId = userId,
                    FueledByUserName = userName,
                    ConnectionType = connectionType,
                    AutoCloseTransaction = autoClose,
                    AuthorizedAt = authorizedAt,
                    Odometer = odometer
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fueling context from Redis for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transactionId);
                return null;
            }
        }

        // Internal processing logic - NO Hub calls
        private Task ProcessLiveReaderStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.ReaderStatus.ReaderStatus readerStatus)
        {
            _logger.LogTrace("[Internal] Processing Reader Status for {DeviceId}", deviceId);
            // Example: Log online/offline readers
            // if (readerStatus?.OnlineStatus?.Ids != null) { /* Log IDs */ }
            // if (readerStatus?.OfflineStatus?.Ids != null) { /* Log IDs */ }
            return Task.CompletedTask;
        }

        // Internal processing logic - NO Hub calls
        private Task ProcessLiveProbeStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.ProbeStatus.ProbeStatus probeStatus)
        {
            _logger.LogTrace("[Internal] Processing Probe Status for {DeviceId}", deviceId);
            // Example: Log online/offline probes
            // if (probeStatus.OnlineStatus?.Ids != null) { /* Log IDs and maybe measurements */ }
            // if (probeStatus.OfflineStatus?.Ids != null) { /* Log IDs */ }
            return Task.CompletedTask;
        }

        // Renamed to indicate internal processing only
        private async Task ProcessLivePumpStatusInternally(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpStatus pumpStatus)
        {
            _logger.LogTrace("[Internal] Processing Pump Status for {DeviceId}", deviceId);
            // Handle Idle Status - Check for nozzles up and tags (for internal logic like events/auth)
            if (pumpStatus.IdleStatus != null)
            {
                await ProcessIdleStatusInternalLogic(deviceId, pumpStatus.IdleStatus);
            }

            // Handle Filling Status (update auth state)
            if (pumpStatus.FillingStatus != null)
            {
                await ProcessFillingStatusInternalLogic(deviceId, pumpStatus.FillingStatus);
            }

            // Handle End of Transaction (update auth state)
            if (pumpStatus.EndOfTransactionStatus != null)
            {
                await ProcessEndOfTransactionStatusInternalLogic(deviceId, pumpStatus.EndOfTransactionStatus);

                // Cursor: Add call to process transactions when EndOfTransactionStatus is detected
                await ProcessEndOfTransactionForTransactionData(deviceId, pumpStatus.EndOfTransactionStatus);
            }

            // Handle Offline Status (update auth state)
            if (pumpStatus.OfflineStatus != null)
            {
                await ProcessOfflineStatusInternalLogic(deviceId, pumpStatus.OfflineStatus);
            }
        }

        // **CRITICAL FIX**: Do NOT clear authorization if there's an active transaction in Redis!
        // Previously, this was clearing auth context (TankId, VehicleId, etc.) when pump reported offline,
        // which caused transaction completion to lose context and save with NULL values for all business fields.
        private async Task ProcessOfflineStatusInternalLogic(string deviceId, Domain.Entities.PTS.PTSStatus.PumpStatus.PumpOfflineStatus offlineStatus)
        {
            if (offlineStatus.Ids == null || !offlineStatus.Ids.Any()) return;
            // Iterate through nullable ints, check HasValue before using Value
            foreach (var pumpIdNullable in offlineStatus.Ids)
            {
                if (!pumpIdNullable.HasValue) continue; // Skip null entries
                var pumpId = pumpIdNullable.Value; // Get the non-nullable int value

                try
                {
                    // **CRITICAL FIX**: Check if there's an active transaction before clearing authorization
                    // The pump might report as "offline" briefly during a transaction, but we should NOT
                    // clear the authorization context until the transaction is actually completed or timed out
                    var hasActiveTransaction = await CheckForActiveTransactionOnPump(deviceId, pumpId);

                    if (hasActiveTransaction)
                    {
                        _logger.LogWarning("[UploadStatus] **PRESERVING AUTH** - Pump {PumpId} on Device {DeviceId} reported OFFLINE but has ACTIVE TRANSACTION. " +
                            "NOT clearing authorization context to preserve TankId/VehicleId for transaction completion.",
                            pumpId, deviceId);
                        continue; // Don't clear authorization - preserve context for transaction completion
                    }

                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation("[Internal] Cleared auth for offline Pump {PumpId} on Device {DeviceId} (no active transaction)", pumpId, deviceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing offline status for Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                }
            }
            // NO _hubContext call here
        }

        // **NEW METHOD**: Check if there's an active transaction on a specific pump
        private async Task<bool> CheckForActiveTransactionOnPump(string deviceId, int pumpId)
        {
            try
            {
                // Check Redis for authorization state
                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                if (authState != null && !string.IsNullOrEmpty(authState.Status) &&
                    (authState.Status == "Authorized" || authState.Status == "InProgress" || authState.Status == "Monitoring"))
                {
                    _logger.LogDebug("[UploadStatus] Found active auth state for {DeviceId}:{PumpId}: Status={Status}, TransactionId={TransactionId}",
                        deviceId, pumpId, authState.Status, authState.TransactionId);
                    return true;
                }

                // Also check for transaction context pattern (device:xxx:transaction:yyy)
                // This handles cases where auth state might have been cleared but transaction context exists
                var pattern = $"device:{deviceId}:transaction:*";
                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern, pageSize: 10);

                foreach (var key in keys)
                {
                    var contextJson = await _redisDb.StringGetAsync(key);
                    if (!contextJson.IsNullOrEmpty)
                    {
                        try
                        {
                            var context = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(contextJson);
                            if (context.TryGetProperty("Pump", out var pumpProp) && pumpProp.GetInt32() == pumpId)
                            {
                                _logger.LogDebug("[UploadStatus] Found active transaction context for {DeviceId}:{PumpId} in Redis key {Key}",
                                    deviceId, pumpId, key);
                                return true;
                            }
                        }
                        catch { /* Ignore parsing errors */ }
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[UploadStatus] Error checking for active transaction on {DeviceId}:{PumpId}, assuming active to be safe",
                    deviceId, pumpId);
                return true; // Assume active on error to prevent data loss
            }
        }

        // Enhanced IdleStatus processing to detect completed transactions //Cursor
        private async Task ProcessIdleStatusInternalLogic(string deviceId, IdleStatus idleStatus)
        {
            if (idleStatus.Ids == null || !idleStatus.Ids.Any()) return;

            _logger.LogDebug("[UploadStatus] **IDLE ANALYSIS** - Processing IdleStatus for device {DeviceId} with {Count} pumps",
                deviceId, idleStatus.Ids.Count);

            for (int i = 0; i < idleStatus.Ids.Count; i++)
            {
                var pumpIdNullable = idleStatus.Ids[i];
                if (!pumpIdNullable.HasValue) continue;

                var pumpId = pumpIdNullable.Value;

                // **CHECK FOR COMPLETED TRANSACTIONS** - Look for LastTransaction data
                if (idleStatus.LastTransactions?.Count > i &&
                    idleStatus.LastVolumes?.Count > i &&
                    idleStatus.LastAmounts?.Count > i)
                {
                    var lastTransaction = idleStatus.LastTransactions[i];
                    var lastVolume = idleStatus.LastVolumes[i];
                    var lastAmount = idleStatus.LastAmounts[i];

                    if (lastTransaction > 0 && (lastVolume > 0 || lastAmount > 0))
                    {

                        // **CHECK IF THIS IS A NEW COMPLETION** - Compare with previous values
                        await CheckIfTransactionJustCompleted(deviceId, pumpId, lastTransaction, lastVolume, lastAmount);
                    }
                }
            }
        }

        // **NEW METHOD** - Detect if transaction just completed based on IdleStatus changes //Cursor
        // **CRITICAL FIX**: This method now enriches IdleStatus-based completion with Redis context data
        // to ensure TankId, VehicleId, Tag, and Nozzle are included in the database transaction record.
        // Previously, IdleStatus completion only had basic volume/amount data, missing business context.
        private async Task CheckIfTransactionJustCompleted(string deviceId, int pumpId, int transactionId, decimal volume, decimal amount)
        {
            try
            {
                var lastIdleKey = $"device:{deviceId}:pump:{pumpId}:last_idle";
                var lastIdleJson = await _redisDb.StringGetAsync(lastIdleKey);

                bool isNewCompletion = false;

                if (lastIdleJson.IsNullOrEmpty)
                {
                    // First time seeing this pump's idle status
                    isNewCompletion = true;
                }
                else
                {
                    try
                    {
                        var lastIdle = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(lastIdleJson);
                        var lastTransactionId = lastIdle.TryGetProperty("LastTransaction", out var transProp) ? transProp.GetInt32() : 0;
                        var lastVolume = lastIdle.TryGetProperty("LastVolume", out var volProp) ? volProp.GetDecimal() : 0;
                        var lastAmount = lastIdle.TryGetProperty("LastAmount", out var amtProp) ? amtProp.GetDecimal() : 0;

                        // **COMPLETION DETECTED** - Transaction ID changed or values increased significantly
                        if (transactionId != lastTransactionId ||
                            Math.Abs(volume - lastVolume) > 0.01m ||
                            Math.Abs(amount - lastAmount) > 0.01m)
                        {
                            isNewCompletion = true;
                            _logger.LogInformation("[UploadStatus] **IDLE CHANGE** - Transaction completion detected via IdleStatus change for Device {DeviceId}, Pump {PumpId}",
                                deviceId, pumpId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug("Error parsing last idle status: {Error}", ex.Message);
                        isNewCompletion = true; // Assume new completion if parsing fails
                    }
                }

                if (isNewCompletion)
                {
                    _logger.LogInformation("[UploadStatus] **NEW COMPLETION** - Processing transaction completion via IdleStatus for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                        deviceId, pumpId, transactionId);

                    // **CRITICAL FIX** - Get Redis context data to enrich the completion data //Cursor
                    var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                    var contextJson = await _redisDb.StringGetAsync(transactionKey);

                    // **TRIGGER COMPLETION** - Create enriched EndOfTransaction data with Redis context
                    var statusData = new JObject
                    {
                        ["Pump"] = pumpId,
                        ["Transaction"] = transactionId,
                        ["Volume"] = volume,
                        ["Amount"] = amount,
                        ["DateTime"] = DateTime.UtcNow,
                        ["DetectedVia"] = "IdleStatus",
                        ["CompletionSource"] = "LastTransactionData"
                    };

                    // **ENRICH WITH REDIS CONTEXT** - Add authorization data if available //Cursor
                    if (!contextJson.IsNullOrEmpty)
                    {


                        try
                        {
                            var context = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contextJson);

                            // **CHECK FOR TRANSFER MODE** - Detect if this is a tank transfer (NOT vehicle fueling) //Cursor
                            var isTransferMode = context.TryGetProperty("IsTransferMode", out var transferProp) && transferProp.GetBoolean();

                            if (isTransferMode)
                            {
                                // Extract transfer-specific data
                                var sourceTankId = context.TryGetProperty("SourceTankId", out var sourceProp) ? sourceProp.GetInt32() : 0;
                                var destinationTankId = context.TryGetProperty("DestinationTankId", out var destProp) ? destProp.GetInt32() : 0;
                                var transferReason = context.TryGetProperty("Reason", out var reasonProp) ? reasonProp.GetString() : "Pump transfer";
                                var userId = context.TryGetProperty("UserId", out var userProp) ? userProp.GetString() : "System";
                                var nozzleId = context.TryGetProperty("Nozzle", out var nozzleProp) ? nozzleProp.GetInt32() : (int?)null;
                                var fuelGradeId = context.TryGetProperty("FuelGradeId", out var fgIdProp) ? fgIdProp.GetInt32() : (int?)null;
                                var fuelGradeName = context.TryGetProperty("FuelGradeName", out var fgNameProp) ? fgNameProp.GetString() : null;

                                var transferData = new JObject
                                {
                                    ["DeviceId"] = deviceId,
                                    ["PumpId"] = pumpId,
                                    ["TransactionId"] = transactionId,
                                    ["SourceTankId"] = sourceTankId,
                                    ["DestinationTankId"] = destinationTankId,
                                    ["Volume"] = volume,
                                    ["TransferDate"] = DateTime.UtcNow,
                                    ["Reason"] = transferReason,
                                    ["UserId"] = userId,
                                    ["PumpTransactionId"] = transactionId
                                };

                                _logger.LogInformation(
                                    "[UploadStatus] **PROCESSING PUMP TRANSFER via IdleStatus** - Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L, Transaction: {TxId}",
                                    sourceTankId, destinationTankId, volume, transactionId);

                                // **PROCESS TRANSFER IN NEW SCOPE** - Use IServiceScopeFactory to avoid disposed context issue
                                // The original request scope may be disposed before the async task completes, so we need a fresh scope
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        using var scope = _serviceScopeFactory.CreateScope();
                                        var scopedTransferService = scope.ServiceProvider.GetRequiredService<IPumpTankTransferService>();

                                        var result = await scopedTransferService.ProcessPumpTransferAsync(transferData);

                                        if (result.IsSuccess)
                                        {
                                            _logger.LogInformation(
                                                "[UploadStatus] **TRANSFER COMPLETE via IdleStatus** ✅ - {Message}",
                                                result.Message);
                                        }
                                        else
                                        {
                                            _logger.LogError(
                                                "[UploadStatus] **TRANSFER FAILED via IdleStatus** ❌ - {Message}",
                                                result.Message);
                                        }

                                        // Clean up Redis context
                                        await _redisDb.KeyDeleteAsync(transactionKey);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex,
                                            "[UploadStatus] **TRANSFER ERROR via IdleStatus** - Failed to process pump transfer for {DeviceId}:{TransactionId}",
                                            deviceId, transactionId);
                                    }
                                });

                                // **ALSO CREATE PUMP TRANSACTION FOR TRANSFER** - Ensure audit trail is complete
                                var transferStatusData = new JObject
                                {
                                    ["Pump"] = pumpId,
                                    ["Transaction"] = transactionId,
                                    ["Volume"] = volume,
                                    ["Amount"] = amount,
                                    ["DateTime"] = DateTime.UtcNow,
                                    ["TankId"] = sourceTankId,  // Source tank for transfers
                                    ["DestinationTankId"] = destinationTankId,
                                    ["IsTransferMode"] = true,
                                    ["VehicleId"] = (int?)null, // Explicitly null for transfers
                                    ["Tag"] = (string?)null,    // Explicitly null for transfers
                                    ["UserId"] = userId,
                                    ["Nozzle"] = nozzleId,
                                    ["FuelGradeId"] = fuelGradeId,
                                    ["FuelGradeName"] = fuelGradeName,
                                    ["DetectedVia"] = "IdleStatus",
                                    ["CompletionSource"] = "LastTransactionData"
                                };

                                // Create pump transaction for audit trail
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await _autoCompletionService.ProcessEndOfTransactionAsync(
                                            deviceId, pumpId, transactionId, transferStatusData);
                                        _logger.LogInformation("[UploadStatus] **TRANSFER PUMP TRANSACTION CREATED via IdleStatus** ✅ - {DeviceId}:{Transaction}",
                                            deviceId, transactionId);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[UploadStatus] **TRANSFER PUMP TRANSACTION FAILED via IdleStatus** - {DeviceId}:{Transaction}",
                                            deviceId, transactionId);
                                    }
                                });

                                // Skip vehicle fueling processing - this is a transfer
                                return;
                            }

                            // **VEHICLE FUELING PATH** (existing logic)
                            // Extract authorization context data
                            var tankId = context.TryGetProperty("TankId", out var tankProp) ? tankProp.GetInt32() : (int?)null;
                            var vehicleId = context.TryGetProperty("VehicleId", out var vehicleProp) ? vehicleProp.GetInt32() : (int?)null;
                            var autoCloseTransaction = context.TryGetProperty("AutoCloseTransaction", out var autoProp) ? autoProp.GetBoolean() : false;
                            var connectionType = context.TryGetProperty("ConnectionType", out var connProp) ? connProp.GetString() : "Unknown";

                            // Get tag information from authorization state
                            var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                            var tagId = authState?.TagId;
                            var vehicleNozzleId = authState?.NozzleId; //Cursor: Add nozzle from authorization state

                            // **ADD CONTEXT TO STATUS DATA** //Cursor
                            statusData["TankId"] = tankId;
                            statusData["VehicleId"] = vehicleId;
                            statusData["Tag"] = tagId;
                            statusData["Nozzle"] = vehicleNozzleId; //Cursor: Add nozzle to completion data
                            statusData["ConnectionType"] = connectionType;
                            statusData["AutoCloseTransaction"] = autoCloseTransaction;

                            // **TRY TO ADD FUEL GRADE INFO** - Get from last known device status //Cursor
                            try
                            {
                                var lastStatusKey = $"device:{deviceId}:status";
                                var lastStatusJson = await _redisDb.StringGetAsync(lastStatusKey);
                                if (!lastStatusJson.IsNullOrEmpty)
                                {
                                    var lastStatus = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(lastStatusJson);
                                    if (lastStatus.TryGetProperty("FuelGrades", out var fuelGradesElement) &&
                                        fuelGradesElement.ValueKind == JsonValueKind.Array)
                                    {
                                        var fuelGrades = fuelGradesElement.EnumerateArray().ToList();
                                        // Use first fuel grade if available (most common case)
                                        if (fuelGrades.Count > 0)
                                        {
                                            var firstGrade = fuelGrades[0];
                                            if (firstGrade.TryGetProperty("Id", out var gradeIdProp))
                                            {
                                                statusData["FuelGradeId"] = gradeIdProp.GetInt32();
                                            }
                                            if (firstGrade.TryGetProperty("Name", out var gradeNameProp))
                                            {
                                                statusData["FuelGradeName"] = gradeNameProp.GetString();
                                            }
                                        }
                                    }
                                }
                            }
                            catch (Exception fgEx)
                            {
                                _logger.LogDebug("Could not extract fuel grade info for IdleStatus completion: {Error}", fgEx.Message);
                            }


                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "[UploadStatus] **CONTEXT ERROR** - Error parsing Redis context for IdleStatus completion {DeviceId}:{TransactionId}, using basic data",
                                deviceId, transactionId);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("[UploadStatus] **NO CONTEXT** - No Redis context found for IdleStatus completion {DeviceId}:{TransactionId} - transaction may be external or context expired",
                            deviceId, transactionId);
                    }

                    // **PROCESS COMPLETION** - Trigger auto-completion service with enriched data
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _autoCompletionService.ProcessEndOfTransactionAsync(
                                deviceId, pumpId, transactionId, statusData);

                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "[UploadStatus] **IDLE FAILED** - IdleStatus-based completion failed for {DeviceId}:{TransactionId}",
                                deviceId, transactionId);
                        }
                    });
                }

                // **UPDATE CACHE** - Store current IdleStatus data for next comparison
                var currentIdleData = new
                {
                    LastTransaction = transactionId,
                    LastVolume = volume,
                    LastAmount = amount,
                    UpdateTime = DateTime.UtcNow
                };

                await _redisDb.StringSetAsync(lastIdleKey,
                    System.Text.Json.JsonSerializer.Serialize(currentIdleData),
                    TimeSpan.FromMinutes(30));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] **IDLE ERROR** - Error checking transaction completion via IdleStatus for {DeviceId}:{PumpId}",
                    deviceId, pumpId);
            }
        }

        // Renamed, only internal logic (update auth state), NO hub broadcast
        private async Task ProcessFillingStatusInternalLogic(string deviceId, FillingStatus fillingStatus)
        {
            if (fillingStatus.Ids == null) return;
            for (int i = 0; i < fillingStatus.Ids.Count; i++)
            {
                var pumpIdNullable = fillingStatus.Ids[i];
                if (!pumpIdNullable.HasValue) continue; // Skip null entries
                var pumpId = pumpIdNullable.Value; // Get the non-nullable int value

                if (pumpId < 1 || pumpId > 50) continue; // Validate range

                try
                {
                    await _authTracker.UpdateAuthState(deviceId, pumpId, "InProgress");
                    // NO _hubContext call here
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing filling status for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }

        // Keep IsValidHexString helper
        private bool IsValidHexString(string input)
        {
            return input.All(c => "0123456789ABCDEFabcdef".Contains(char.ToUpper(c)));
        }

        // Renamed, only internal logic (update auth state), NO hub broadcast
        private async Task ProcessEndOfTransactionStatusInternalLogic(string deviceId, EndOfTransactionStatus eotStatus)
        {
            if (eotStatus.Ids == null) return;
            // Iterate through nullable ints, check HasValue before using Value
            foreach (var pumpIdNullable in eotStatus.Ids)
            {
                if (!pumpIdNullable.HasValue) continue; // Skip null entries
                var pumpId = pumpIdNullable.Value; // Get the non-nullable int value
                try
                {
                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation("[Internal] Cleared auth for EOT on Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                    // NO _hubContext call here
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing end of transaction for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }

        // Enhanced method to process EndOfTransaction status with comprehensive debugging //Cursor
        // **RESOLUTION SUMMARY**: This method now successfully detects and processes transaction completion
        // via both EndOfTransactionStatus and IdleStatus changes, with comprehensive Redis context correlation
        // and enhanced debugging capabilities for troubleshooting transaction completion issues.
        private async Task ProcessEndOfTransactionForTransactionData(string deviceId, EndOfTransactionStatus eotStatus)
        {
            try
            {

                // **DETAILED DATA INSPECTION** - Log the actual EndOfTransaction data received //Cursor
                if (eotStatus.Ids?.Any() == true)
                {
                    for (int j = 0; j < eotStatus.Ids.Count; j++)
                    {
                        var pumpId = eotStatus.Ids[j];
                        var transaction = eotStatus.Transactions?.Count > j ? eotStatus.Transactions[j] : (int?)null;
                        var volume = eotStatus.Volumes?.Count > j ? eotStatus.Volumes[j] : (decimal?)null;
                        var amount = eotStatus.Amounts?.Count > j ? eotStatus.Amounts[j] : (decimal?)null;
                        var nozzle = eotStatus.Nozzles?.Count > j ? eotStatus.Nozzles[j] : (int?)null;
                        var fuelGradeId = eotStatus.FuelGradeIds?.Count > j ? eotStatus.FuelGradeIds[j] : (int?)null;
                        var fuelGradeName = eotStatus.FuelGradeNames?.Count > j && !string.IsNullOrEmpty(eotStatus.FuelGradeNames[j]) ? eotStatus.FuelGradeNames[j] : null;

                        _logger.LogInformation("[UploadStatus] **EOT DATA[{Index}]** - Pump: {PumpId}, Transaction: {TransactionId}, Volume: {Volume}L, Amount: ${Amount}, Nozzle: {Nozzle}, FuelGrade: {FuelGradeId} ({FuelGradeName})",
                            j, pumpId, transaction, volume, amount, nozzle, fuelGradeId, fuelGradeName);
                    }
                }

                // **CRITICAL** - Check if we have an active transaction that should have completed
                var activeTransactions = await CheckForActiveTransactions(deviceId);
                if (activeTransactions.Any())
                {
                    _logger.LogWarning("[UploadStatus] **MISSING EOT** - Device {DeviceId} has {Count} active transactions but EndOfTransactionStatus is empty!",
                        deviceId, activeTransactions.Count);

                    foreach (var (pumpId, transactionId) in activeTransactions)
                    {

                        // **CORRELATION CHECK** - Log what we're expecting vs what we received //Cursor
                        var expectedMatch = eotStatus.Ids?.Any() == true &&
                            eotStatus.Transactions?.Any() == true &&
                            eotStatus.Transactions.Contains(transactionId);

                        _logger.LogWarning("[UploadStatus] **CORRELATION** - Expected Transaction {TransactionId}, Found in EOT: {Found}",
                            transactionId, expectedMatch);

                        // **FALLBACK STRATEGY** - Check if transaction should be completed based on time/conditions
                        await CheckForForcedCompletion(deviceId, pumpId, transactionId);
                    }
                }

                // **EXISTING LOGIC** - Process if data is present
                if (eotStatus.Ids == null || !eotStatus.Ids.Any())
                {
                    _logger.LogDebug("[UploadStatus] **NO EOT DATA** - EndOfTransactionStatus has no pump IDs for device {DeviceId}", deviceId);
                    return;
                }

                _logger.LogInformation("[UploadStatus] **EOT PROCESSING** - Processing EndOfTransaction for device {DeviceId} with {Count} pumps",
                    deviceId, eotStatus.Ids.Count);

                // Process each pump that has ended a transaction
                for (int i = 0; i < eotStatus.Ids.Count; i++)
                {
                    var pumpIdNullable = eotStatus.Ids[i];
                    if (!pumpIdNullable.HasValue) continue;

                    var pumpId = pumpIdNullable.Value;

                    // Extract all available transaction data from EndOfTransaction status
                    int? detectedTransactionId = null;
                    decimal? volume = null;
                    decimal? amount = null;

                    if (eotStatus.Transactions?.Count > i && eotStatus.Transactions[i] > 0)
                    {
                        detectedTransactionId = eotStatus.Transactions[i];
                    }

                    if (eotStatus.Volumes?.Count > i)
                    {
                        volume = (decimal?)eotStatus.Volumes[i];
                    }

                    if (eotStatus.Amounts?.Count > i)
                    {
                        amount = (decimal?)eotStatus.Amounts[i];
                    }

                    _logger.LogInformation("[UploadStatus] **EOT DETECTED** - Device {DeviceId}, Pump {PumpId}, Transaction: {TransactionId}, Volume: {Volume}L, Amount: ${Amount}",
                        deviceId, pumpId, detectedTransactionId, volume, amount);

                    //Cursor: **CRITICAL ENHANCEMENT** - Immediately check if this transaction ID matches our authorized context
                    if (detectedTransactionId.HasValue)
                    {
                        //Cursor: **PREVENT DUPLICATE PROCESSING** - Check if this EndOfTransaction was already processed
                        var eotProcessedKey = $"device:{deviceId}:eot:transaction:{detectedTransactionId.Value}:processed";
                        var alreadyProcessed = await _redisDb.StringGetAsync(eotProcessedKey);

                        if (!alreadyProcessed.IsNullOrEmpty)
                        {
                            _logger.LogInformation("[UploadStatus] **DUPLICATE PREVENTION** - EndOfTransaction {TransactionId} for Device {DeviceId} was already processed at {ProcessedTime}, skipping",
                                detectedTransactionId.Value, deviceId, alreadyProcessed);
                            continue; // Skip this pump's EndOfTransaction processing
                        }

                        // Mark as being processed to prevent duplicates
                        await _redisDb.StringSetAsync(eotProcessedKey, DateTime.UtcNow.ToString("o"), TimeSpan.FromMinutes(10));

                        // Check if we have a matching transaction context in Redis for this transaction ID
                        var transactionKey = $"device:{deviceId}:transaction:{detectedTransactionId.Value}";
                        var contextJson = await _redisDb.StringGetAsync(transactionKey);

                        _logger.LogInformation("[UploadStatus] **CONTEXT LOOKUP** - Checking Redis key: {RedisKey}, Found: {Found}",
                            transactionKey, !contextJson.IsNullOrEmpty);

                        if (!contextJson.IsNullOrEmpty)
                        {
                            _logger.LogInformation("[UploadStatus] **MATCH FOUND** - EndOfTransaction {TransactionId} matches our authorized context for Device {DeviceId}",
                                detectedTransactionId.Value, deviceId);

                            // Parse the stored context to get authorization details
                            var context = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contextJson);

                            // **CHECK FOR TRANSFER MODE** - Detect if this is a tank transfer (NOT vehicle fueling)
                            var isTransferMode = context.TryGetProperty("IsTransferMode", out var transferProp) && transferProp.GetBoolean();

                            if (isTransferMode)
                            {
                                // **TANK TRANSFER PATH** - Process via PumpTankTransferService, NOT AutoCompletion
                                var sourceTankId = context.TryGetProperty("SourceTankId", out var sourceProp) ? sourceProp.GetInt32() : 0;
                                var destinationTankId = context.TryGetProperty("DestinationTankId", out var destProp) ? destProp.GetInt32() : 0;
                                var transferReason = context.TryGetProperty("Reason", out var reasonProp) ? reasonProp.GetString() : "Pump transfer";
                                var userId = context.TryGetProperty("UserId", out var userProp) ? userProp.GetString() : "System";
                                var nozzleId = context.TryGetProperty("Nozzle", out var nozzleProp) ? nozzleProp.GetInt32() : (int?)null;

                                _logger.LogInformation(
                                    "[UploadStatus] **TRANSFER MODE DETECTED in EOT** - Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L, Transaction: {TxId}",
                                    sourceTankId, destinationTankId, volume, detectedTransactionId.Value);

                                var transferData = new JObject
                                {
                                    ["DeviceId"] = deviceId,
                                    ["PumpId"] = pumpId,
                                    ["TransactionId"] = transactionId,
                                    ["SourceTankId"] = sourceTankId,
                                    ["DestinationTankId"] = destinationTankId,
                                    ["Volume"] = volume,
                                    ["TransferDate"] = DateTime.UtcNow,
                                    ["Reason"] = transferReason,
                                    ["UserId"] = userId,
                                    ["PumpTransactionId"] = transactionId
                                };

                                // Process transfer in new scope
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        using var scope = _serviceScopeFactory.CreateScope();
                                        var scopedTransferService = scope.ServiceProvider.GetRequiredService<IPumpTankTransferService>();

                                        var result = await scopedTransferService.ProcessPumpTransferAsync(transferData);

                                        if (result.IsSuccess)
                                        {
                                            _logger.LogInformation("[UploadStatus] **TRANSFER COMPLETE via EOT** ✅ - {Message}", result.Message);
                                        }
                                        else
                                        {
                                            _logger.LogError("[UploadStatus] **TRANSFER FAILED via EOT** ❌ - {Message}", result.Message);
                                        }

                                        // Clean up Redis context
                                        await _redisDb.KeyDeleteAsync(transactionKey);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[UploadStatus] **TRANSFER ERROR via EOT** - Failed for {DeviceId}:{TransactionId}",
                                            deviceId, detectedTransactionId);
                                    }
                                });

                                // **ALSO CREATE PUMP TRANSACTION FOR TRANSFER** - Ensure audit trail is complete
                                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                                var transferStatusData = new JObject
                                {
                                    ["Pump"] = pumpId,
                                    ["Transaction"] = detectedTransactionId.Value,
                                    ["Volume"] = volume,
                                    ["Amount"] = amount,
                                    ["DateTime"] = DateTime.UtcNow,
                                    ["TankId"] = sourceTankId,  // Source tank for transfers
                                    ["DestinationTankId"] = destinationTankId,
                                    ["IsTransferMode"] = true,
                                    ["VehicleId"] = (int?)null, // Explicitly null for transfers
                                    ["Tag"] = (string?)null,    // Explicitly null for transfers
                                    ["UserId"] = userId,
                                    ["Nozzle"] = nozzleId ?? (eotStatus.Nozzles?.Count > i ? eotStatus.Nozzles[i] : null),
                                    ["FuelGradeId"] = eotStatus.FuelGradeIds?.Count > i ? eotStatus.FuelGradeIds[i] : null,
                                    ["FuelGradeName"] = eotStatus.FuelGradeNames?.Count > i ? eotStatus.FuelGradeNames[i] : null
                                };

                                // Create pump transaction for audit trail
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await _autoCompletionService.ProcessEndOfTransactionAsync(
                                            deviceId, pumpId, detectedTransactionId.Value, transferStatusData);
                                        _logger.LogInformation("[UploadStatus] **TRANSFER PUMP TRANSACTION CREATED** ✅ - {DeviceId}:{Transaction}",
                                            deviceId, detectedTransactionId.Value);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[UploadStatus] **TRANSFER PUMP TRANSACTION FAILED** - {DeviceId}:{Transaction}",
                                            deviceId, detectedTransactionId);
                                    }
                                });

                                continue; // Skip normal vehicle fueling path
                            }

                            // **VEHICLE FUELING PATH** - Normal processing for non-transfer transactions
                            var tankId = context.TryGetProperty("TankId", out var tankProp) ? tankProp.GetInt32() : (int?)null;
                            var vehicleId = context.TryGetProperty("VehicleId", out var vehicleProp) ? vehicleProp.GetInt32() : (int?)null;
                            var contextPumpId = context.TryGetProperty("PumpId", out var pumpIdProp) ? pumpIdProp.GetInt32() : (int?)null;
                            var autoCloseTransaction = context.TryGetProperty("AutoCloseTransaction", out var autoProp) ? autoProp.GetBoolean() : false;
                            var connectionType = context.TryGetProperty("ConnectionType", out var connProp) ? connProp.GetString() : "Unknown";

                            // **CORRELATION VERIFICATION** - Log the match details //Cursor
                            _logger.LogInformation("[UploadStatus] **CONTEXT DETAILS** - Transaction {TransactionId}: AuthorizedPump={AuthPump}, ReceivedPump={RecvPump}, TankId={TankId}, VehicleId={VehicleId}, AutoClose={AutoClose}",
                                detectedTransactionId.Value, contextPumpId, pumpId, tankId, vehicleId, autoCloseTransaction);

                            // Get tag information from authorization state
                            var authStateVehicle = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                            var tagId = authStateVehicle?.TagId;

                            // Create enhanced status data object for auto-completion processing
                            var statusData = new JObject
                            {
                                ["Pump"] = pumpId,
                                ["Transaction"] = detectedTransactionId.Value,
                                ["Volume"] = volume,
                                ["Amount"] = amount,
                                ["DateTime"] = DateTime.UtcNow,
                                ["TankId"] = tankId,
                                ["VehicleId"] = vehicleId,
                                ["Tag"] = tagId,
                                ["ConnectionType"] = connectionType,
                                ["AutoCloseTransaction"] = autoCloseTransaction
                            };

                            // Add additional data if available from EndOfTransaction
                            if (eotStatus.Nozzles?.Count > i && eotStatus.Nozzles[i] > 0)
                            {
                                statusData["Nozzle"] = eotStatus.Nozzles[i];
                            }

                            if (eotStatus.FuelGradeIds?.Count > i && eotStatus.FuelGradeIds[i] > 0)
                            {
                                statusData["FuelGradeId"] = eotStatus.FuelGradeIds[i];
                            }

                            if (eotStatus.FuelGradeNames?.Count > i && !string.IsNullOrEmpty(eotStatus.FuelGradeNames[i]))
                            {
                                statusData["FuelGradeName"] = eotStatus.FuelGradeNames[i];
                            }

                            if (eotStatus.Prices?.Count > i)
                            {
                                statusData["Price"] = (decimal?)eotStatus.Prices[i];
                            }

                            _logger.LogInformation("[AutoComplete] **IMMEDIATE TRIGGER** - Processing matching EndOfTransaction for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId} with complete context data",
                                deviceId, pumpId, detectedTransactionId);

                            // **KEY INTEGRATION** - Immediately process EndOfTransaction through auto-completion service with full context
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    // **CRITICAL** - Process with full context data from authorization
                                    await _autoCompletionService.ProcessEndOfTransactionAsync(
                                        deviceId, pumpId, detectedTransactionId.Value, statusData);

                                    _logger.LogInformation("[AutoComplete] **SUCCESS** - Background auto-completion completed for matched transaction {DeviceId}:{Transaction}",
                                        deviceId, detectedTransactionId.Value);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "[AutoComplete] **ERROR** - Background auto-completion failed for matched transaction {DeviceId}:{Transaction}",
                                        deviceId, detectedTransactionId);
                                }
                            });
                        }
                        else
                        {
                            _logger.LogWarning("[UploadStatus] **NO MATCH** - EndOfTransaction {TransactionId} for Device {DeviceId} has no corresponding authorization context - attempting device query",
                                detectedTransactionId.Value, deviceId);

                            // **SOLUTION: Query device for complete transaction information** //Cursor
                            // This solves the missing VehicleId/TankId/Tag issue when Redis context expires or is missing
                            JObject enrichedStatusData = null;

                            try
                            {
                                _logger.LogInformation("[UploadStatus] **DEVICE QUERY** - Querying PumpTransactionInformation from device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                                    deviceId, pumpId, detectedTransactionId.Value);

                                // Query device for complete transaction data
                                var transactionInfo = await _pumpService.GetPumpTransactionInfoAsync(
                                    deviceId, pumpId, detectedTransactionId.Value);

                                if (transactionInfo != null)
                                {
                                    _logger.LogInformation("[UploadStatus] **DEVICE QUERY SUCCESS** - Retrieved transaction data: Volume={Volume}L, Amount=${Amount}, Nozzle={Nozzle}, Tag={Tag}",
                                        transactionInfo.Volume, transactionInfo.Amount, transactionInfo.Nozzle, transactionInfo.Tag);

                                    // Try to get authorization state for TankId/VehicleId correlation
                                    var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);

                                    // Create enriched data with device transaction info + auth state
                                    enrichedStatusData = new JObject
                                    {
                                        ["Pump"] = pumpId,
                                        ["Transaction"] = detectedTransactionId.Value,
                                        ["Volume"] = transactionInfo.Volume ?? volume,
                                        ["Amount"] = transactionInfo.Amount ?? amount,
                                        ["Nozzle"] = transactionInfo.Nozzle,
                                        ["FuelGradeId"] = transactionInfo.FuelGradeId,
                                        ["FuelGradeName"] = transactionInfo.FuelGradeName,
                                        ["Price"] = transactionInfo.Price,
                                        ["DateTime"] = transactionInfo.DateTime,
                                        ["DateTimeStart"] = transactionInfo.DateTimeStart,
                                        ["Tag"] = transactionInfo.Tag ?? authState?.TagId,
                                        ["UserId"] = transactionInfo.UserId,
                                        ["ConfigurationId"] = transactionInfo.ConfigurationId,
                                        // Try to correlate with active authorization for business context
                                        ["TankId"] = authState?.TankId,
                                        ["VehicleId"] = authState?.VehicleId,
                                        ["DataSource"] = "DeviceQuery"
                                    };

                                    _logger.LogInformation("[UploadStatus] **ENRICHMENT SUCCESS** - Transaction {TransactionId} enriched with device data and auth state (TankId={TankId}, VehicleId={VehicleId}, Tag={Tag})",
                                        detectedTransactionId.Value, authState?.TankId, authState?.VehicleId, enrichedStatusData.Value<string>("Tag"));
                                }
                                else
                                {
                                    _logger.LogWarning("[UploadStatus] **DEVICE QUERY EMPTY** - Device returned null transaction info for {DeviceId}:{TransactionId}",
                                        deviceId, detectedTransactionId.Value);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "[UploadStatus] **DEVICE QUERY FAILED** - Error querying transaction info from device {DeviceId}:{TransactionId}",
                                    deviceId, detectedTransactionId.Value);
                            }

                            // If device query succeeded, use enriched data; otherwise fall back to basic data
                            if (enrichedStatusData != null)
                            {
                                _logger.LogInformation("[AutoComplete] **DEVICE QUERY PATH** - Processing EndOfTransaction with device-queried data for {DeviceId}:{TransactionId}",
                                    deviceId, detectedTransactionId.Value);

                                // Process with enriched data from device query
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await _autoCompletionService.ProcessEndOfTransactionAsync(
                                            deviceId, pumpId, detectedTransactionId.Value, enrichedStatusData);

                                        _logger.LogInformation("[AutoComplete] **SUCCESS** - Background auto-completion completed with device-queried data for {DeviceId}:{Transaction}",
                                            deviceId, detectedTransactionId.Value);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[AutoComplete] **ERROR** - Background auto-completion failed for device-queried transaction {DeviceId}:{Transaction}",
                                            deviceId, detectedTransactionId);
                                    }
                                });
                            }
                            else
                            {
                                // **FALLBACK TO BASIC DATA** - Device query failed or returned no data
                                _logger.LogWarning("[UploadStatus] **FALLBACK TO BASIC** - Using basic transaction data (may be missing VehicleId/TankId) for {DeviceId}:{TransactionId}",
                                    deviceId, detectedTransactionId.Value);

                                // **REDIS INVESTIGATION** - List all current transaction keys for this device //Cursor
                                try
                                {
                                    var pattern = $"device:{deviceId}:transaction:*";
                                    var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                                    var keys = server.Keys(pattern: pattern).ToList();

                                    _logger.LogWarning("[UploadStatus] **REDIS DEBUG** - Available transaction keys for device {DeviceId}: {KeyCount} keys found",
                                        deviceId, keys.Count);

                                    foreach (var key in keys.Take(5)) // Log first 5 keys to avoid spam
                                    {
                                        var keyValue = await _redisDb.StringGetAsync(key);
                                        _logger.LogWarning("[UploadStatus] **REDIS KEY** - {Key}: {Value}",
                                            key, keyValue.IsNullOrEmpty ? "EMPTY" : keyValue.ToString());
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "[UploadStatus] **REDIS DEBUG ERROR** - Error investigating Redis keys for device {DeviceId}", deviceId);
                                }

                                // This might be a transaction that was not authorized through our system
                                // Or the context was already cleaned up (duplicate processing)
                                // Still process it but without enriched context
                                var basicStatusData = new JObject
                                {
                                    ["Pump"] = pumpId,
                                    ["Transaction"] = detectedTransactionId.Value,
                                    ["Volume"] = volume,
                                    ["Amount"] = amount,
                                    ["DateTime"] = DateTime.UtcNow,
                                    ["DataSource"] = "BasicEOT"
                                };

                                // Add device-level data if available
                                if (eotStatus.Nozzles?.Count > i && eotStatus.Nozzles[i] > 0)
                                {
                                    basicStatusData["Nozzle"] = eotStatus.Nozzles[i];
                                }

                                if (eotStatus.FuelGradeIds?.Count > i && eotStatus.FuelGradeIds[i] > 0)
                                {
                                    basicStatusData["FuelGradeId"] = eotStatus.FuelGradeIds[i];
                                }

                                if (eotStatus.FuelGradeNames?.Count > i && !string.IsNullOrEmpty(eotStatus.FuelGradeNames[i]))
                                {
                                    basicStatusData["FuelGradeName"] = eotStatus.FuelGradeNames[i];
                                }

                                if (eotStatus.Prices?.Count > i)
                                {
                                    basicStatusData["Price"] = (decimal?)eotStatus.Prices[i];
                                }

                                _logger.LogInformation("[AutoComplete] **BASIC DATA PATH** - Processing unmatched EndOfTransaction with basic data (missing VehicleId/TankId) for Device {DeviceId}, Transaction {TransactionId}",
                                    deviceId, detectedTransactionId);

                                // Process without full context (may not auto-complete due to missing context)
                                _ = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await _autoCompletionService.ProcessEndOfTransactionAsync(
                                            deviceId, pumpId, detectedTransactionId.Value, basicStatusData);
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, "[AutoComplete] Error processing unmatched EndOfTransaction {DeviceId}:{Transaction}",
                                            deviceId, detectedTransactionId);
                                    }
                                });
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("[UploadStatus] **NO TRANSACTION ID** - EndOfTransaction detected for Device {DeviceId}, Pump {PumpId} but no transaction ID available",
                            deviceId, pumpId);
                    }

                    // Also use the existing TransactionCompletionService for compatibility
                    await _transactionCompletionService.HandleEndOfTransactionAsync(deviceId, pumpId, detectedTransactionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] **EOT ERROR** - Error processing EndOfTransaction for device {DeviceId}", deviceId);
            }
        }

        // **NEW METHOD** - Check for active transactions that might need completion //Cursor
        private async Task<List<(int PumpId, int TransactionId)>> CheckForActiveTransactions(string deviceId)
        {
            var activeTransactions = new List<(int, int)>();

            try
            {
                // Check Redis for active transaction contexts
                var pattern = $"device:{deviceId}:transaction:*";
                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                var keys = server.Keys(pattern: pattern);

                foreach (var key in keys)
                {
                    var contextJson = await _redisDb.StringGetAsync(key);
                    if (!contextJson.IsNullOrEmpty)
                    {
                        try
                        {
                            var context = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contextJson);
                            var pumpId = context.TryGetProperty("PumpId", out var pumpProp) ? pumpProp.GetInt32() : 0;
                            var transactionId = context.TryGetProperty("TransactionId", out var transProp) ? transProp.GetInt32() : 0;

                            if (pumpId > 0 && transactionId > 0)
                            {
                                activeTransactions.Add((pumpId, transactionId));
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug("Error parsing transaction context from key {Key}: {Error}", key, ex.Message);
                        }
                    }
                }

                _logger.LogDebug("[UploadStatus] **ACTIVE CHECK** - Found {Count} active transactions for device {DeviceId}",
                    activeTransactions.Count, deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] **ACTIVE ERROR** - Error checking active transactions for device {DeviceId}", deviceId);
            }

            return activeTransactions;
        }

        // **ENHANCED** - Aggressively check if transaction should be forcibly completed //Cursor
        private async Task CheckForForcedCompletion(string deviceId, int pumpId, int transactionId)
        {
            try
            {
                // Get transaction start time from authorization context
                var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogDebug("[UploadStatus] **NO CONTEXT** - No transaction context found for {DeviceId}:{TransactionId}, may have been cleaned up",
                        deviceId, transactionId);
                    return;
                }

                var context = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contextJson);

                var isTransferMode = context.TryGetProperty("IsTransferMode", out var transferProp) && transferProp.GetBoolean();
                var timeoutMinutes = isTransferMode ? 10.0 : 2.0; // 5 minutes for transfers, 2 for vehicles

                var startTimeStr = context.TryGetProperty("StartTime", out var startProp) ? startProp.GetString() : null;



                if (DateTime.TryParse(startTimeStr, out var startTime))
                {
                    var elapsed = DateTime.UtcNow - startTime;



                    if (elapsed.TotalMinutes > timeoutMinutes)
                    {
                        _logger.LogWarning("[UploadStatus] **TIMEOUT DETECTED** - {TransactionType} transaction {TransactionId} on device {DeviceId} running for {Minutes:F1} minutes (threshold: {Threshold}min) - FORCING COMPLETION",
                            isTransferMode ? "TRANSFER" : "VEHICLE", transactionId, deviceId, elapsed.TotalMinutes, timeoutMinutes);

                        await ForceTransactionCompletion(deviceId, pumpId, transactionId, $"Timeout-{elapsed.TotalMinutes:F1}min-{(isTransferMode ? "Transfer" : "Vehicle")}");
                    }
                    else
                    {
                        _logger.LogDebug("[UploadStatus] **PENDING** - {TransactionType} transaction {TransactionId} on device {DeviceId} running for {Minutes:F1} minutes (threshold: {Threshold}min)",
                            isTransferMode ? "TRANSFER" : "VEHICLE", transactionId, deviceId, elapsed.TotalMinutes, timeoutMinutes);
                    }
                }
                else
                {
                    _logger.LogWarning("[UploadStatus] **NO START TIME** - Transaction {TransactionId} context has no StartTime, cannot determine timeout",
                        transactionId);

                    // **FALLBACK** - If no start time, assume stuck and force completion
                    await ForceTransactionCompletion(deviceId, pumpId, transactionId, "NoStartTime");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] **FORCE ERROR** - Error checking forced completion for {DeviceId}:{TransactionId}",
                    deviceId, transactionId);
            }
        }

        // **ENHANCED** - Force completion when EndOfTransaction is missing with aggressive cleanup //Cursor
        private async Task ForceTransactionCompletion(string deviceId, int pumpId, int transactionId, string reason)
        {
            try
            {
                _logger.LogWarning("[UploadStatus] **FORCE COMPLETION** - Forcing completion of transaction {TransactionId} on device {DeviceId}, reason: {Reason}",
                    transactionId, deviceId, reason);

                // Get last known volume/amount from Redis status or authorization context
                var lastStatusKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(lastStatusKey);

                decimal? lastVolume = null;
                decimal? lastAmount = null;
                int? nozzleId = null;
                int? fuelGradeId = null;
                string? fuelGradeName = null;

                if (!statusJson.IsNullOrEmpty)
                {
                    try
                    {
                        var lastStatus = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(statusJson);

                        // Try to extract last known values from IdleStatus.LastVolumes/LastAmounts
                        if (lastStatus.TryGetProperty("Pumps", out var pumpsElement) &&
                            pumpsElement.TryGetProperty("IdleStatus", out var idleElement))
                        {
                            if (idleElement.TryGetProperty("LastTransactions", out var transactionsElement) &&
                                transactionsElement.ValueKind == JsonValueKind.Array)
                            {
                                var transactions = transactionsElement.EnumerateArray().ToList();
                                if (transactions.Count >= pumpId) // Find matching pump
                                {
                                    var foundTransactionId = transactions[pumpId - 1].GetInt32();
                                    if (foundTransactionId == transactionId)
                                    {
                                        _logger.LogInformation("[UploadStatus] **MATCHING TX** - Found matching transaction {TransactionId} in IdleStatus for pump {PumpId}",
                                            transactionId, pumpId);
                                    }
                                }
                            }

                            if (idleElement.TryGetProperty("LastVolumes", out var volumesElement) &&
                                volumesElement.ValueKind == JsonValueKind.Array)
                            {
                                var volumes = volumesElement.EnumerateArray().ToList();
                                if (volumes.Count >= pumpId) // PumpId is 1-based
                                {
                                    lastVolume = volumes[pumpId - 1].GetDecimal();
                                }
                            }

                            if (idleElement.TryGetProperty("LastAmounts", out var amountsElement) &&
                                amountsElement.ValueKind == JsonValueKind.Array)
                            {
                                var amounts = amountsElement.EnumerateArray().ToList();
                                if (amounts.Count >= pumpId) // PumpId is 1-based
                                {
                                    lastAmount = amounts[pumpId - 1].GetDecimal();
                                }
                            }

                            if (idleElement.TryGetProperty("LastNozzles", out var nozzlesElement) &&
                                nozzlesElement.ValueKind == JsonValueKind.Array)
                            {
                                var nozzles = nozzlesElement.EnumerateArray().ToList();
                                if (nozzles.Count >= pumpId)
                                {
                                    nozzleId = nozzles[pumpId - 1].GetInt32();
                                }
                            }

                            if (idleElement.TryGetProperty("LastFuelGradeIds", out var gradeIdsElement) &&
                                gradeIdsElement.ValueKind == JsonValueKind.Array)
                            {
                                var gradeIds = gradeIdsElement.EnumerateArray().ToList();
                                if (gradeIds.Count >= pumpId)
                                {
                                    fuelGradeId = gradeIds[pumpId - 1].GetInt32();
                                }
                            }

                            if (idleElement.TryGetProperty("LastFuelGradeNames", out var gradeNamesElement) &&
                                gradeNamesElement.ValueKind == JsonValueKind.Array)
                            {
                                var gradeNames = gradeNamesElement.EnumerateArray().ToList();
                                if (gradeNames.Count >= pumpId)
                                {
                                    fuelGradeName = gradeNames[pumpId - 1].GetString();
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[UploadStatus] **PARSE ERROR** - Error parsing last status for forced completion, using default values");
                    }
                }

                _logger.LogInformation("[UploadStatus] **FORCE VALUES** - Using last known values - Volume: {Volume}L, Amount: ${Amount}, Nozzle: {Nozzle}, FuelGrade: {GradeId} ({GradeName})",
                    lastVolume, lastAmount, nozzleId, fuelGradeId, fuelGradeName);

                // **GET CONTEXT DATA** - Retrieve authorization context for enrichment
                var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                int? tankId = null;
                int? vehicleId = null;
                string? tagId = null;
                string? connectionType = "Unknown";

                if (!contextJson.IsNullOrEmpty)
                {
                    try
                    {
                        var context = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contextJson);
                        tankId = context.TryGetProperty("TankId", out var tankProp) ? tankProp.GetInt32() : (int?)null;
                        vehicleId = context.TryGetProperty("VehicleId", out var vehicleProp) ? vehicleProp.GetInt32() : (int?)null;
                        connectionType = context.TryGetProperty("ConnectionType", out var connProp) ? connProp.GetString() : "Unknown";
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug("[UploadStatus] **CONTEXT PARSE ERROR** - Error parsing context: {Error}", ex.Message);
                    }
                }

                // Get tag from authorization tracker
                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                if (authState != null)
                {
                    tagId = authState.TagId;
                    _logger.LogInformation("[UploadStatus] **AUTH STATE** - Found authorization state with tag: {Tag}", tagId);
                }

                // **CREATE SYNTHETIC EOT** - Create a comprehensive synthetic EndOfTransaction status
                var syntheticStatusData = new JObject
                {
                    ["Pump"] = pumpId,
                    ["Transaction"] = transactionId,
                    ["Volume"] = lastVolume ?? 0, // Default to 0 if no data
                    ["Amount"] = lastAmount ?? 0,
                    ["Nozzle"] = nozzleId,
                    ["FuelGradeId"] = fuelGradeId,
                    ["FuelGradeName"] = fuelGradeName,
                    ["TankId"] = tankId,
                    ["VehicleId"] = vehicleId,
                    ["Tag"] = tagId,
                    ["ConnectionType"] = connectionType,
                    ["DateTime"] = DateTime.UtcNow,
                    ["ForcedCompletion"] = true,
                    ["CompletionReason"] = reason,
                    ["DetectedVia"] = "ForcedTimeout"
                };

                _logger.LogWarning("[UploadStatus] **FORCE TRIGGER** - Synthetic EOT data: Tank={TankId}, Vehicle={VehicleId}, Tag={Tag}, Volume={Volume}L, Amount=${Amount}",
                    tankId, vehicleId, tagId, lastVolume, lastAmount);

                // **TRIGGER COMPLETION** - Process through auto-completion service
                await _autoCompletionService.ProcessEndOfTransactionAsync(
                    deviceId, pumpId, transactionId, syntheticStatusData);

                _logger.LogInformation("[UploadStatus] **FORCE SUCCESS** - Forced completion triggered for {DeviceId}:{TransactionId}",
                    deviceId, transactionId);

                // **CLEANUP REDIS** - Immediately delete transaction context to prevent re-processing
                await _redisDb.KeyDeleteAsync(transactionKey);
                _logger.LogInformation("[UploadStatus] **REDIS CLEANUP** - Deleted transaction key: {Key}", transactionKey);

                // **CLEAR AUTHORIZATION** - Clear authorization state
                await _authTracker.ClearAuthorization(deviceId, pumpId);
                _logger.LogInformation("[UploadStatus] **AUTH CLEARED** - Cleared authorization for device {DeviceId}, pump {PumpId}",
                    deviceId, pumpId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] **FORCE ERROR** - Error in forced completion for {DeviceId}:{TransactionId}",
                    deviceId, transactionId);
            }
        }

        // Keep TransactionDetails record
        public record TransactionDetails
        {
            // Ensure types match domain model (might be nullable)
            public int? Nozzle { get; init; }
            public int? FuelGradeId { get; init; }
            public string? FuelGradeName { get; init; }
            public int? Transaction { get; init; }
            public decimal? Volume { get; init; }
            public decimal? Amount { get; init; }
            public decimal? Price { get; init; }
            public string? Tag { get; init; }
        }
    }
}