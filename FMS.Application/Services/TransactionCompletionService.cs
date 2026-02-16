//Cursor: New service for handling transaction completion based on connection type
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Communication;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Services
{
    public interface ITransactionCompletionService
    {
        Task<bool> CompleteTransactionAsync(string deviceId, int pumpId, int transactionId, bool isManualCompletion = false);
        Task<bool> CanAutoCompleteTransaction(string deviceId, int transactionId);
        Task HandleEndOfTransactionAsync(string deviceId, int pumpId, int? detectedTransactionId = null);
        Task<bool> CancelTransactionAsync(string deviceId, int pumpId, int transactionId, string reason);
        Task CleanupExpiredTransactions();
    }

    public class TransactionCompletionService : ITransactionCompletionService
    {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly ITransactionMonitoringService _transactionMonitoringService;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IPumpService _pumpService;
        private readonly IDatabase _redisDb;
        private readonly IMediator _mediator;
        private readonly GpsdataContext _context;
        private readonly ILogger<TransactionCompletionService> _logger;
        private readonly Features.Vehicle.Services.IGPSService? _gpsService;
        private readonly ISystemConfigurationService? _systemConfigService;
        private readonly Features.Vehicle.Services.IVehicleGpsOfflineAlertService? _gpsOfflineAlertService;

        public TransactionCompletionService(
            DeviceConnectionTracker deviceConnectionTracker,
            ITransactionMonitoringService transactionMonitoringService,
            IAuthorizationStateTracker authTracker,
            IPumpService pumpService,
            IConnectionMultiplexer redisConnection,
            IMediator mediator,
            GpsdataContext context,
            ILogger<TransactionCompletionService> logger,
            Features.Vehicle.Services.IGPSService? gpsService = null,
            ISystemConfigurationService? systemConfigService = null,
            Features.Vehicle.Services.IVehicleGpsOfflineAlertService? gpsOfflineAlertService = null)
        {
            _deviceConnectionTracker = deviceConnectionTracker;
            _transactionMonitoringService = transactionMonitoringService;
            _authTracker = authTracker;
            _pumpService = pumpService;
            _redisDb = redisConnection.GetDatabase();
            _mediator = mediator;
            _context = context;
            _logger = logger;
            _gpsService = gpsService;
            _systemConfigService = systemConfigService;
            _gpsOfflineAlertService = gpsOfflineAlertService;
        }

        public async Task<bool> CompleteTransactionAsync(string deviceId, int pumpId, int transactionId, bool isManualCompletion = false)
        {
            try
            {
                _logger.LogInformation("[Completion] Starting transaction completion for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, Manual: {IsManual}",
                    deviceId, pumpId, transactionId, isManualCompletion);

                // Get connection type to determine completion strategy
                var connectionType = await GetConnectionType(deviceId);

                // Get transaction context for additional info
                var transactionContext = await GetTransactionContext(deviceId, transactionId);

                // Execute completion based on connection type
                var completionResult = await ExecuteCompletion(deviceId, pumpId, transactionId, connectionType, isManualCompletion);

                if (completionResult.Success)
                {
                    // Update monitoring service
                    await _transactionMonitoringService.UpdateTransactionProgress(
                        deviceId, pumpId, transactionId, "Completed",
                        completionResult.Volume, completionResult.Amount);

                    // Stop monitoring
                    await _transactionMonitoringService.StopMonitoringTransaction(deviceId, transactionId);

                    // Clear authorization
                    var nozzleId = await GetNozzleFromContext(deviceId, transactionId);
                    if (nozzleId > 0)
                    {
                        await _authTracker.ClearAuthorization(deviceId, nozzleId);
                    }

                    // Save transaction if not already saved
                    if (completionResult.TransactionData != null)
                    {
                        // **CRITICAL FIX**: Enrich transaction with Redis context (Odometer, TankId, VehicleId, Tag, etc.)
                        await EnrichTransactionWithRedisContext(completionResult.TransactionData, deviceId, transactionId);
                        await TryCaptureFuelLevelAfterAsync(completionResult.TransactionData);
                        await SaveTransactionToDatabase(completionResult.TransactionData);
                    }

                    // Cleanup contexts
                    await CleanupTransactionContexts(deviceId, transactionId);

                    _logger.LogInformation("[Completion] Transaction {TransactionId} completed successfully for Device {DeviceId}, Pump {PumpId}",
                        transactionId, deviceId, pumpId);

                    return true;
                }
                else
                {
                    _logger.LogWarning("[Completion] Transaction completion failed for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}: {Reason}",
                        deviceId, pumpId, transactionId, completionResult.ErrorMessage);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error completing transaction for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, transactionId);
                return false;
            }
        }

        public async Task<bool> CanAutoCompleteTransaction(string deviceId, int transactionId)
        {
            try
            {
                // Get transaction context
                var context = await GetTransactionContext(deviceId, transactionId);
                if (context == null)
                {
                    // CRITICAL FIX: Default to TRUE to prevent lost transactions
                    // If Redis context is missing (expired, network issue), still auto-complete
                    _logger.LogWarning("[Completion] No transaction context found for Device {DeviceId}, Transaction {TransactionId}. Defaulting to auto-complete to prevent lost transaction.",
                        deviceId, transactionId);
                    return true;
                }

                // Check if AutoCloseTransaction was enabled during authorization
                var autoClose = true; // Default to true to prevent lost transactions
                if (context.Value.TryGetProperty("AutoCloseTransaction", out var autoCloseProperty))
                {
                    autoClose = autoCloseProperty.GetBoolean();
                }

                if (!autoClose)
                {
                    _logger.LogInformation("[Completion] AutoCloseTransaction is explicitly disabled for Device {DeviceId}, Transaction {TransactionId}",
                        deviceId, transactionId);
                    return false;
                }

                // CRITICAL FIX: Allow all connection types to auto-complete
                // HTTPPolling transactions should also be auto-completed
                var connectionType = await GetConnectionType(deviceId);
                _logger.LogDebug("[Completion] Connection type for Device {DeviceId}: {ConnectionType}", deviceId, connectionType);
                return true; // All connection types can auto-complete
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error checking auto-completion eligibility for Device {DeviceId}, Transaction {TransactionId}. Defaulting to auto-complete.",
                    deviceId, transactionId);
                return true; // CRITICAL FIX: Default to true on error to prevent lost transactions
            }
        }

        public async Task HandleEndOfTransactionAsync(string deviceId, int pumpId, int? detectedTransactionId = null)
        {
            try
            {
                _logger.LogInformation("[Completion] Handling EndOfTransaction for Device {DeviceId}, Pump {PumpId}, Detected Transaction: {DetectedId}",
                    deviceId, pumpId, detectedTransactionId);

                // Get expected transaction from authorization state
                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                var expectedTransactionId = authState?.TransactionId ?? 0;

                // Determine which transaction to complete
                var transactionToComplete = detectedTransactionId ?? expectedTransactionId;

                if (transactionToComplete <= 0)
                {
                    _logger.LogWarning("[Completion] No valid transaction ID found for EndOfTransaction on Device {DeviceId}, Pump {PumpId}",
                        deviceId, pumpId);
                    return;
                }

                // Validate transaction match if both are available
                if (detectedTransactionId.HasValue && expectedTransactionId > 0 && detectedTransactionId.Value != expectedTransactionId)
                {
                    _logger.LogWarning("[Completion] Transaction ID mismatch - Expected: {ExpectedId}, Detected: {DetectedId} for Device {DeviceId}, Pump {PumpId}",
                        expectedTransactionId, detectedTransactionId.Value, deviceId, pumpId);
                }

                // Check if auto-completion is enabled
                var canAutoComplete = await CanAutoCompleteTransaction(deviceId, transactionToComplete);

                if (canAutoComplete)
                {
                    _logger.LogInformation("[Completion] Auto-completing transaction {TransactionId} for Device {DeviceId}, Pump {PumpId}",
                        transactionToComplete, deviceId, pumpId);

                    await CompleteTransactionAsync(deviceId, pumpId, transactionToComplete, isManualCompletion: false);
                }
                else
                {
                    _logger.LogInformation("[Completion] EndOfTransaction detected but auto-completion disabled. Transaction {TransactionId} requires manual completion for Device {DeviceId}, Pump {PumpId}",
                        transactionToComplete, deviceId, pumpId);

                    // Update status to indicate manual completion required
                    await _transactionMonitoringService.UpdateTransactionProgress(
                        deviceId, pumpId, transactionToComplete, "AwaitingManualCompletion");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error handling EndOfTransaction for Device {DeviceId}, Pump {PumpId}",
                    deviceId, pumpId);
            }
        }

        public async Task<bool> CancelTransactionAsync(string deviceId, int pumpId, int transactionId, string reason)
        {
            try
            {
                _logger.LogInformation("[Completion] Cancelling transaction {TransactionId} for Device {DeviceId}, Pump {PumpId}, Reason: {Reason}",
                    transactionId, deviceId, pumpId, reason);

                // Get connection type
                var connectionType = await GetConnectionType(deviceId);

                // Send cancellation command if supported
                if (connectionType == "WebSocket" || connectionType == "HTTPDirect")
                {
                    try
                    {
                        // Send stop pump command
                        var stopResult = await _pumpService.StopPumpAsync(deviceId, pumpId);
                        _logger.LogInformation("[Completion] Stop command sent for Device {DeviceId}, Pump {PumpId}, Result: {Success}",
                            deviceId, pumpId, stopResult?.Success ?? false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[Completion] Failed to send stop command for Device {DeviceId}, Pump {PumpId}",
                            deviceId, pumpId);
                    }
                }

                // Update monitoring status
                await _transactionMonitoringService.UpdateTransactionProgress(
                    deviceId, pumpId, transactionId, "Cancelled");

                // Stop monitoring
                await _transactionMonitoringService.StopMonitoringTransaction(deviceId, transactionId);

                // Clear authorization
                var nozzleId = await GetNozzleFromContext(deviceId, transactionId);
                if (nozzleId > 0)
                {
                    await _authTracker.ClearAuthorization(deviceId, nozzleId);
                }

                // Cleanup contexts
                await CleanupTransactionContexts(deviceId, transactionId);

                _logger.LogInformation("[Completion] Transaction {TransactionId} cancelled for Device {DeviceId}, Pump {PumpId}",
                    transactionId, deviceId, pumpId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error cancelling transaction for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, transactionId);
                return false;
            }
        }

        public async Task CleanupExpiredTransactions()
        {
            try
            {
                _logger.LogDebug("[Completion] Starting cleanup of expired transactions");

                // Get all monitoring keys
                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints().First());
                var monitoringKeys = server.Keys(pattern: "monitoring:*:transaction:*").ToList();

                var expiredCount = 0;
                foreach (var key in monitoringKeys)
                {
                    try
                    {
                        var contextJson = await _redisDb.StringGetAsync(key);
                        if (!contextJson.IsNullOrEmpty)
                        {
                            var context = JsonSerializer.Deserialize<JsonElement>(contextJson);

                            DateTime? startedAt = null;
                            if (context.TryGetProperty("StartedAt", out var startedAtProperty))
                            {
                                startedAt = startedAtProperty.GetDateTime();
                            }

                            // Check if transaction has been running for more than 2 hours
                            if (startedAt.HasValue && DateTime.UtcNow.Subtract(startedAt.Value).TotalHours > 2)
                            {
                                string deviceId = null;
                                int? transactionId = null;

                                if (context.TryGetProperty("DeviceId", out var deviceIdProperty))
                                {
                                    deviceId = deviceIdProperty.GetString();
                                }

                                if (context.TryGetProperty("TransactionId", out var transactionIdProperty))
                                {
                                    transactionId = transactionIdProperty.GetInt32();
                                }

                                if (!string.IsNullOrEmpty(deviceId) && transactionId.HasValue)
                                {
                                    _logger.LogWarning("[Completion] Cleaning up expired transaction {TransactionId} for Device {DeviceId}",
                                        transactionId.Value, deviceId);

                                    await CleanupTransactionContexts(deviceId, transactionId.Value);
                                    expiredCount++;
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[Completion] Error processing expired transaction key {Key}", key.ToString());
                    }
                }

                if (expiredCount > 0)
                {
                    _logger.LogInformation("[Completion] Cleaned up {Count} expired transactions", expiredCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error during expired transaction cleanup");
            }
        }

        private async Task<string> GetConnectionType(string deviceId)
        {
            try
            {
                var wsConnection = await _deviceConnectionTracker.GetWebSocketConnection(deviceId);
                var httpConnection = await _deviceConnectionTracker.GetHttpConnection(deviceId);
                var connectionMode = DeviceConnectionTracker.DetermineConnectionMode(wsConnection, httpConnection);
                return connectionMode.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error determining connection type for device {DeviceId}", deviceId);
                return "Unknown";
            }
        }

        private async Task<JsonElement?> GetTransactionContext(string deviceId, int transactionId)
        {
            try
            {
                var contextKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(contextKey);

                if (!contextJson.IsNullOrEmpty)
                {
                    return JsonSerializer.Deserialize<JsonElement>(contextJson);
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error getting transaction context for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
                return null;
            }
        }

        private async Task<CompletionResult> ExecuteCompletion(string deviceId, int pumpId, int transactionId, string connectionType, bool isManualCompletion)
        {
            switch (connectionType)
            {
                case "WebSocket":
                case "HTTPDirect":
                    return await ExecuteDirectCompletion(deviceId, pumpId, transactionId, isManualCompletion);

                case "HTTPPolling":
                    return await ExecutePollingCompletion(deviceId, pumpId, transactionId);

                default:
                    _logger.LogWarning("[Completion] Unknown connection type {ConnectionType} for device {DeviceId}. Using fallback completion.",
                        connectionType, deviceId);
                    return await ExecutePollingCompletion(deviceId, pumpId, transactionId);
            }
        }

        private async Task<CompletionResult> ExecuteDirectCompletion(string deviceId, int pumpId, int transactionId, bool isManualCompletion)
        {
            try
            {
                // For direct connections, send close transaction command
                var closeResult = await _pumpService.ClosePumpTransactionAsync(deviceId, pumpId, transactionId);

                if (closeResult?.Success == true)
                {
                    //Cursor: ClosePumpTransactionAsync returns FMSResponseMessage, not FMSResponse<T>
                    // We need to get transaction details separately for direct completion
                    var transactionDetails = await _pumpService.GetPumpTransactionInfoAsync(deviceId, pumpId, transactionId);

                    return new CompletionResult
                    {
                        Success = true,
                        TransactionData = transactionDetails,
                        Volume = transactionDetails?.Volume,
                        Amount = transactionDetails?.Amount
                    };
                }
                else
                {
                    return new CompletionResult
                    {
                        Success = false,
                        ErrorMessage = closeResult?.Message ?? "Failed to close transaction"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error in direct completion for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, transactionId);

                return new CompletionResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<CompletionResult> ExecutePollingCompletion(string deviceId, int pumpId, int transactionId)
        {
            try
            {
                // For polling devices, get transaction details from device
                var transactionDetails = await _pumpService.GetPumpTransactionInfoAsync(deviceId, pumpId, transactionId);

                if (transactionDetails != null)
                {
                    return new CompletionResult
                    {
                        Success = true,
                        TransactionData = transactionDetails,
                        Volume = transactionDetails.Volume,
                        Amount = transactionDetails.Amount
                    };
                }
                else
                {
                    // Try to get from database
                    var dbTransaction = _context.Pumptransactions
                        .Where(t => t.PtsId == deviceId && t.Pump == pumpId && t.Transaction == transactionId)
                        .FirstOrDefault();

                    if (dbTransaction != null)
                    {
                        return new CompletionResult
                        {
                            Success = true,
                            TransactionData = dbTransaction,
                            Volume = dbTransaction.Volume,
                            Amount = dbTransaction.Amount
                        };
                    }
                    else
                    {
                        return new CompletionResult
                        {
                            Success = false,
                            ErrorMessage = "Transaction details not found"
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error in polling completion for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                    deviceId, pumpId, transactionId);

                return new CompletionResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
        }

        private async Task<int> GetNozzleFromContext(string deviceId, int transactionId)
        {
            try
            {
                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(monitoringKey);

                if (!contextJson.IsNullOrEmpty)
                {
                    var context = JsonSerializer.Deserialize<JsonElement>(contextJson);
                    if (context.TryGetProperty("NozzleId", out var nozzleProperty))
                    {
                        return nozzleProperty.GetInt32();
                    }
                }
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error getting nozzle from context for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
                return 0;
            }
        }

        /// <summary>
        /// Enriches transaction data with values from Redis transaction context stored during authorization.
        /// This includes Odometer, TankId, VehicleId, Tag, UserId, ConfigurationId, and other authorization data
        /// that the PTS device doesn't have.
        /// </summary>
        private async Task EnrichTransactionWithRedisContext(Pumptransaction transaction, string deviceId, int transactionId)
        {
            try
            {
                var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogDebug("[Completion] No transaction context found in Redis for enrichment - device: {DeviceId}, transaction: {TransactionId}",
                        deviceId, transactionId);
                    return;
                }

                var context = JsonSerializer.Deserialize<JsonElement>(contextJson);

                // Enrich with authorization context values (only if not already set)
                if (transaction.Odometer == null && context.TryGetProperty("Odometer", out var odometerProp) && odometerProp.ValueKind == JsonValueKind.Number)
                {
                    transaction.Odometer = odometerProp.GetDecimal();
                }
                if (transaction.FuelLevelBefore == null && context.TryGetProperty("FuelLevelBefore", out var fuelLevelBeforeProp) && fuelLevelBeforeProp.ValueKind == JsonValueKind.Number)
                {
                    transaction.FuelLevelBefore = fuelLevelBeforeProp.GetDecimal();
                }
                if (transaction.TankId == null && context.TryGetProperty("TankId", out var tankIdProp) && tankIdProp.ValueKind == JsonValueKind.Number)
                {
                    transaction.TankId = tankIdProp.GetInt32();
                }
                if (transaction.VehicleId == null && context.TryGetProperty("VehicleId", out var vehicleIdProp) && vehicleIdProp.ValueKind == JsonValueKind.Number)
                {
                    transaction.VehicleId = vehicleIdProp.GetInt32();
                }
                if (string.IsNullOrEmpty(transaction.Tag) && context.TryGetProperty("Tag", out var tagProp) && tagProp.ValueKind == JsonValueKind.String)
                {
                    transaction.Tag = tagProp.GetString();
                }
                if (string.IsNullOrEmpty(transaction.UserId) && context.TryGetProperty("UserId", out var userIdProp) && userIdProp.ValueKind == JsonValueKind.String)
                {
                    transaction.UserId = userIdProp.GetString();
                }
                if (string.IsNullOrEmpty(transaction.ConfigurationId) && context.TryGetProperty("ConfigurationId", out var configIdProp) && configIdProp.ValueKind == JsonValueKind.String)
                {
                    transaction.ConfigurationId = configIdProp.GetString();
                }
                if (transaction.FuelGradeId == null && context.TryGetProperty("FuelGradeId", out var fuelGradeIdProp) && fuelGradeIdProp.ValueKind == JsonValueKind.Number)
                {
                    transaction.FuelGradeId = fuelGradeIdProp.GetInt32();
                }
                if (string.IsNullOrEmpty(transaction.FuelGradeName) && context.TryGetProperty("FuelGradeName", out var fuelGradeNameProp) && fuelGradeNameProp.ValueKind == JsonValueKind.String)
                {
                    transaction.FuelGradeName = fuelGradeNameProp.GetString();
                }

                _logger.LogInformation("[Completion] Enriched transaction with Redis context - device: {DeviceId}, transaction: {TransactionId}, Odometer: {Odometer}, TankId: {TankId}, VehicleId: {VehicleId}, Tag: {Tag}",
                    deviceId, transactionId, transaction.Odometer, transaction.TankId, transaction.VehicleId, transaction.Tag);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Completion] Error enriching transaction with Redis context for device {DeviceId}, transaction {TransactionId}. Proceeding without enrichment.",
                    deviceId, transactionId);
            }
        }

        /// <summary>
        /// Captures fuel level after fueling from GPS for vehicle refueling transactions.
        /// Applies only when feature is enabled and vehicle has GPS installed.
        /// </summary>
        private async Task TryCaptureFuelLevelAfterAsync(Pumptransaction transaction)
        {
            if (_gpsService == null || _systemConfigService == null)
            {
                return;
            }

            if (transaction.IsTransferMode || !transaction.VehicleId.HasValue || transaction.VehicleId.Value <= 0)
            {
                return;
            }

            try
            {
                var fuelLevelCheckEnabled = await _systemConfigService.GetPtsEnableGPSFuelLevelCheckAsync();
                if (!fuelLevelCheckEnabled)
                {
                    return;
                }

                var hasGpsInstalled = await _context.Vehicles
                    .Where(v => v.VehicleId == transaction.VehicleId.Value)
                    .Select(v => v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (!hasGpsInstalled)
                {
                    return;
                }

                var fuelLevelResult = await _gpsService.GetFuelLevelAsync(transaction.VehicleId.Value);
                if (fuelLevelResult.IsSuccess && fuelLevelResult.Data.HasValue)
                {
                    transaction.FuelLevelAfter = fuelLevelResult.Data.Value;
                    _logger.LogDebug("[Completion] Captured FuelLevelAfter={FuelLevel}L for vehicle {VehicleId}",
                        fuelLevelResult.Data.Value,
                        transaction.VehicleId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "[Completion] Failed to capture fuel level after fueling for vehicle {VehicleId}",
                    transaction.VehicleId);
            }
        }

        private async Task SaveTransactionToDatabase(Pumptransaction transactionData)
        {
            try
            {
                // Check if transaction already exists
                var existingTransaction = _context.Pumptransactions
                    .FirstOrDefault(t => t.PtsId == transactionData.PtsId &&
                        t.Transaction == transactionData.Transaction);

                if (existingTransaction == null)
                {
                    _context.Pumptransactions.Add(transactionData);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("[Completion] Transaction {TransactionId} saved to database for Device {DeviceId}",
                        transactionData.Transaction, transactionData.PtsId);

                    // Check if vehicle GPS is offline and create alert if needed
                    await CheckVehicleGpsOfflineAsync(transactionData);
                }
                else
                {
                    var updated = false;

                    if (!existingTransaction.FuelLevelBefore.HasValue && transactionData.FuelLevelBefore.HasValue)
                    {
                        existingTransaction.FuelLevelBefore = transactionData.FuelLevelBefore;
                        updated = true;
                    }

                    if (!existingTransaction.FuelLevelAfter.HasValue && transactionData.FuelLevelAfter.HasValue)
                    {
                        existingTransaction.FuelLevelAfter = transactionData.FuelLevelAfter;
                        updated = true;
                    }

                    if (updated)
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("[Completion] Updated existing transaction {TransactionId} with GPS fuel levels for Device {DeviceId}",
                            transactionData.Transaction, transactionData.PtsId);
                    }

                    _logger.LogDebug("[Completion] Transaction {TransactionId} already exists in database for Device {DeviceId}",
                        transactionData.Transaction, transactionData.PtsId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error saving transaction to database: {TransactionId}",
                    transactionData.Transaction);
            }
        }

        /// <summary>
        /// Checks if the vehicle GPS is offline and creates an alert if needed.
        /// This is called after an automated pump transaction is completed and saved.
        /// </summary>
        private async Task CheckVehicleGpsOfflineAsync(Pumptransaction transactionData)
        {
            if (_gpsOfflineAlertService == null || transactionData.VehicleId == null)
            {
                return;
            }

            try
            {
                var result = await _gpsOfflineAlertService.CheckAndAlertIfGpsOfflineAsync(
                    transactionData.VehicleId.Value,
                    siteId: null, // PTS doesn't directly track site, will be determined from tank
                    transactionData.Volume,
                    triggeredBy: "PTS System");

                if (result.AlertCreated)
                {
                    _logger.LogWarning("[Completion] GPS offline alert created for vehicle {VehicleId} during pump transaction {TransactionId}: {Message}",
                        transactionData.VehicleId, transactionData.Transaction, result.Message);
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the transaction save
                _logger.LogWarning(ex, "[Completion] Failed to check vehicle GPS offline status for vehicle {VehicleId} during pump transaction {TransactionId}",
                    transactionData.VehicleId, transactionData.Transaction);
            }
        }

        private async Task CleanupTransactionContexts(string deviceId, int transactionId)
        {
            try
            {
                // Delete transaction context
                var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
                await _redisDb.KeyDeleteAsync(transactionKey);

                // Delete monitoring context
                var monitoringKey = $"monitoring:{deviceId}:transaction:{transactionId}";
                await _redisDb.KeyDeleteAsync(monitoringKey);

                _logger.LogDebug("[Completion] Cleaned up contexts for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Completion] Error cleaning up contexts for Device {DeviceId}, Transaction {TransactionId}",
                    deviceId, transactionId);
            }
        }
    }

    public class CompletionResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public Pumptransaction? TransactionData { get; set; }
        public decimal? Volume { get; set; }
        public decimal? Amount { get; set; }
    }
}