//Cursor: Service for automatic transaction completion detection and saving
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Communication;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Application.Services.Configuration;
using FMS.Application.Services.TankStock;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Services
{
    public interface IAutoTransactionCompletionService
    {
        Task ProcessEndOfTransactionAsync(string deviceId, int pump, int transaction, JObject statusData);
        Task<bool> ShouldAutoCompleteTransaction(string deviceId, int transaction);
        Task<bool> CompleteAndSaveTransactionAsync(string deviceId, int pump, int transaction, JObject finalData);
    }

    /// <summary>
    /// Automatically detects and saves completed transactions when EndOfTransaction status is received
    /// This eliminates the need for frontend intervention in the completion process
    /// </summary>
    public class AutoTransactionCompletionService : IAutoTransactionCompletionService
    {
        private const int CloseRetryDelaySeconds = 30;
        private static readonly TimeSpan WarningThrottleWindow = TimeSpan.FromSeconds(60);

        private readonly ITransactionCompletionService _transactionCompletionService;
        private readonly ITransactionMonitoringService _transactionMonitoringService;
        private readonly IDirectHttpTransactionService _directHttpService;
        private readonly DeviceConnectionTracker _connectionTracker;
        private readonly IDatabase _redisDb;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoTransactionCompletionService> _logger;
        private readonly ConcurrentDictionary<string, byte> _pendingCloseRetry = new();
        private readonly ConcurrentDictionary<string, DateTime> _lastWarningLogByKey = new();

        public AutoTransactionCompletionService(
            ITransactionCompletionService transactionCompletionService,
            ITransactionMonitoringService transactionMonitoringService,
            IDirectHttpTransactionService directHttpService,
            DeviceConnectionTracker connectionTracker,
            IConnectionMultiplexer redisConnection,
            IServiceScopeFactory scopeFactory,
            ILogger<AutoTransactionCompletionService> logger)
        {
            _transactionCompletionService = transactionCompletionService;
            _transactionMonitoringService = transactionMonitoringService;
            _directHttpService = directHttpService;
            _connectionTracker = connectionTracker;
            _redisDb = redisConnection.GetDatabase();
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task ProcessEndOfTransactionAsync(string deviceId, int pump, int transaction, JObject statusData)
        {
            try
            {
                _logger.LogInformation("[AutoComplete] EndOfTransaction detected for device {DeviceId}, pump {Pump}, transaction {Transaction}",
                    deviceId, pump, transaction);

                // Step 1: Check if this transaction should be auto-completed
                var shouldAutoComplete = await ShouldAutoCompleteTransaction(deviceId, transaction);

                if (!shouldAutoComplete)
                {
                    _logger.LogInformation("[AutoComplete] Transaction {Transaction} on device {DeviceId} requires manual completion",
                        transaction, deviceId);

                    // Update status to indicate manual completion needed
                    await _transactionMonitoringService.UpdateTransactionProgress(
                        deviceId, pump, transaction, "AwaitingManualCompletion",
                        statusData.Value<decimal?>("Volume"),
                        statusData.Value<decimal?>("Amount"));
                    return;
                }

                // Step 2: Get complete transaction data
                var finalTransactionData = await GetCompleteTransactionData(deviceId, pump, transaction, statusData);
                if (finalTransactionData == null)
                {
                    _logger.LogWarning("[AutoComplete] Could not retrieve complete transaction data for {DeviceId}:{Transaction}",
                        deviceId, transaction);
                    return;
                }

                // Step 3: Complete and save the transaction
                var success = await CompleteAndSaveTransactionAsync(deviceId, pump, transaction, finalTransactionData);

                if (success)
                {
                    _logger.LogInformation("[AutoComplete] Transaction {Transaction} automatically completed and saved for device {DeviceId}",
                        transaction, deviceId);
                }
                else
                {
                    _logger.LogError("[AutoComplete] Failed to complete transaction {Transaction} for device {DeviceId}",
                        transaction, deviceId);
                }

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error processing EndOfTransaction for device {DeviceId}, transaction {Transaction}",
                    deviceId, transaction);
            }
        }

        public async Task<bool> ShouldAutoCompleteTransaction(string deviceId, int transaction)
        {
            try
            {
                // Check if auto-completion is enabled for this device/transaction
                var transactionKey = $"device:{deviceId}:transaction:{transaction}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                if (contextJson.IsNullOrEmpty)
                {
                    // CRITICAL FIX: If no context found, DEFAULT TO TRUE to ensure transaction is saved
                    // Context might have expired (10 min TTL) or Redis was unavailable during authorization
                    // It's better to save a transaction without full context than to lose it entirely
                    _logger.LogWarning("[AutoComplete] ⚠️ No transaction context found for {DeviceId}:{Transaction}. " +
                        "DEFAULTING TO AUTO-COMPLETE to prevent transaction loss. Context may have expired or authorization happened without storing context.",
                        deviceId, transaction);
                    return true; // Default to auto-complete to prevent lost transactions
                }

                var context = JsonSerializer.Deserialize<JsonElement>(contextJson);
                var autoClose = context.TryGetProperty("AutoCloseTransaction", out var autoCloseElement) ?
                    autoCloseElement.GetBoolean() :
                    true; // CRITICAL FIX: Default to true if property missing

                // Check connection type - WebSocket and HTTPDirect typically support auto-completion
                var connectionType = context.TryGetProperty("ConnectionType", out var connTypeElement) ?
                    connTypeElement.GetString() :
                    "Unknown";

                // CRITICAL FIX: Default to true for unknown connection types to prevent lost transactions
                bool supportsAutoCompletion = connectionType switch
                {
                    "WebSocket" => true, // Real-time communication supports auto-completion
                    "HTTPDirect" => true, // Direct HTTP can auto-complete
                    "HTTPPolling" => true, // CHANGED: Polling should also auto-complete to prevent lost transactions
                    _ => true // CHANGED: Default to true for unknown types
                };

                var shouldAuto = autoClose && supportsAutoCompletion;

                _logger.LogInformation("[AutoComplete] Auto-completion check for {DeviceId}:{Transaction} - AutoClose: {AutoClose}, ConnectionType: {ConnectionType}, Result: {ShouldAuto}",
                    deviceId, transaction, autoClose, connectionType, shouldAuto);

                return shouldAuto;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error checking auto-completion eligibility for {DeviceId}:{Transaction}. DEFAULTING TO TRUE to prevent transaction loss.",
                    deviceId, transaction);
                return true; // CRITICAL FIX: Default to auto-complete on error to prevent lost transactions
            }
        }

        public async Task<bool> CompleteAndSaveTransactionAsync(string deviceId, int pump, int transaction, JObject finalData)
        {
            var completionLockKey = $"autocompletion:save:lock:{deviceId}:{transaction}";
            var completionLockValue = Guid.NewGuid().ToString("N");
            var lockAcquired = false;

            try
            {
                // Prevent duplicate inserts when multiple completion paths race on the same transaction.
                lockAcquired = await _redisDb.StringSetAsync(
                    completionLockKey,
                    completionLockValue,
                    expiry: TimeSpan.FromSeconds(45),
                    when: When.NotExists);

                if (!lockAcquired)
                {
                    _logger.LogWarning(
                        "[AutoComplete] Save lock already held for {DeviceId}:{Transaction}. Skipping duplicate completion attempt.",
                        deviceId, transaction);
                    return true;
                }

                _logger.LogInformation("[AutoComplete] Starting automatic completion and save for {DeviceId}:{Transaction}",
                    deviceId, transaction);

                //Cursor: **ENHANCED LOGGING** - Log the complete final data being processed
                _logger.LogInformation("[AutoComplete] Final transaction data for {DeviceId}:{Transaction}: {FinalData}",
                    deviceId, transaction, finalData.ToString());

                // Capture fuel level after fueling for vehicle refueling mode (GPS-enabled vehicles only).
                await TryEnrichFuelLevelAfterAsync(finalData);

                // Step 1: Create Pumptransaction entity from final data
                var pumpTransaction = CreatePumpTransactionFromData(deviceId, pump, transaction, finalData);

                //Cursor: **VALIDATE ENTITY** - Log the created entity before saving
                _logger.LogInformation("[AutoComplete] Created Pumptransaction entity - PtsId: {PtsId}, Pump: {Pump}, Transaction: {Transaction}, Nozzle: {Nozzle}, Volume: {Volume}, Amount: {Amount}, Tag: {Tag}, TankId: {TankId}, VehicleId: {VehicleId}",
                    pumpTransaction.PtsId, pumpTransaction.Pump, pumpTransaction.Transaction,
                    pumpTransaction.Nozzle, pumpTransaction.Volume, pumpTransaction.Amount,
                    pumpTransaction.Tag, pumpTransaction.TankId, pumpTransaction.VehicleId);

                // Step 2: Save to database within a transaction scope
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                try
                {
                    //Cursor: **DATABASE CONNECTION CHECK** - Verify context is valid
                    if (context.Database == null)
                    {
                        _logger.LogError("[AutoComplete] Database context is null for transaction {Transaction} device {DeviceId}",
                            transaction, deviceId);
                        return false;
                    }

                    //Cursor: **CONNECTION VERIFICATION** - Test database connectivity
                    try
                    {
                        var canConnect = await context.Database.CanConnectAsync();
                        if (!canConnect)
                        {
                            _logger.LogError("[AutoComplete] Cannot connect to database for transaction {Transaction} device {DeviceId}",
                                transaction, deviceId);
                            return false;
                        }
                        _logger.LogDebug("[AutoComplete] Database connection verified for transaction {Transaction}", transaction);
                    }
                    catch (Exception connEx)
                    {
                        _logger.LogError(connEx, "[AutoComplete] Database connection test failed for transaction {Transaction} device {DeviceId}",
                            transaction, deviceId);
                        return false;
                    }

                    // Check if transaction already exists (prevent duplicates)
                    var existingTransaction = await context.Pumptransactions
                        .FirstOrDefaultAsync(t => t.PtsId == deviceId && t.Transaction == transaction);

                    if (existingTransaction != null)
                    {
                        _logger.LogWarning("[AutoComplete] Transaction {Transaction} already exists for device {DeviceId}, updating instead",
                            transaction, deviceId);

                        // Update existing transaction with final data
                        UpdateExistingTransaction(existingTransaction, pumpTransaction);
                        existingTransaction.HasBeenProcessed = true;

                        //Cursor: **LOG UPDATE DETAILS**
                        _logger.LogInformation("[AutoComplete] Updated existing transaction - Volume: {Volume}, Amount: {Amount}, DateTime: {DateTime}",
                            existingTransaction.Volume, existingTransaction.Amount, existingTransaction.DateTime);
                    }
                    else
                    {
                        // Add new transaction
                        pumpTransaction.HasBeenProcessed = true; // Mark as processed since we're auto-completing
                        context.Pumptransactions.Add(pumpTransaction);
                        _logger.LogInformation("[AutoComplete] Added new transaction {Transaction} for device {DeviceId} to context",
                            transaction, deviceId);
                    }

                    //Cursor: **PRE-SAVE VALIDATION** - Check entity state before saving
                    var entityEntry = context.Entry(existingTransaction ?? pumpTransaction);
                    _logger.LogDebug("[AutoComplete] Entity state before save: {EntityState} for transaction {Transaction}",
                        entityEntry.State, transaction);

                    //Cursor: **SAVE WITH DETAILED ERROR HANDLING**
                    var saveResult = await context.SaveChangesAsync();
                    _logger.LogInformation("[AutoComplete] **DATABASE SAVE SUCCESS** - {SaveResult} records saved for transaction {Transaction} device {DeviceId}",
                        saveResult, transaction, deviceId);

                    //Cursor: **VERIFY SAVE** - Query back to confirm the save worked
                    var verifyTransaction = await context.Pumptransactions
                        .FirstOrDefaultAsync(t => t.PtsId == deviceId && t.Transaction == transaction);

                    if (verifyTransaction != null)
                    {
                        _logger.LogInformation("[AutoComplete] **SAVE VERIFIED** - Transaction {Transaction} successfully saved and can be retrieved from database",
                            transaction);

                        // Mark transaction as saved to prevent subsequent IdleStatus duplicate processing.
                        var savedMarkerKey = $"autocompletion:saved:{deviceId}:{transaction}";
                        await _redisDb.StringSetAsync(
                            savedMarkerKey,
                            DateTime.UtcNow.ToString("o"),
                            TimeSpan.FromDays(1));

                        // **CRITICAL FIX**: Process TankVolumeHistory for automated dispensing
                        // This was missing - causing transactions to be saved but NOT recorded in tank ledger

                        var isTransferMode = verifyTransaction.IsTransferMode;
                        if (isTransferMode)
                        {
                            try
                            {
                                var transferService = scope.ServiceProvider.GetRequiredService<IPumpTankTransferService>();
                                var transferDate = verifyTransaction.DateTime.Date;
                                var volume = verifyTransaction.Volume ?? 0;
                                var sourceTankId = verifyTransaction.TankId;
                                var destTankId = verifyTransaction.DestinationTankId;
                                var userId = verifyTransaction.UserId?.ToString() ?? "System";

                                // Redis idempotency key for tank transfer
                                var idempotencyKey = $"tanktransfer:{sourceTankId}:{destTankId}:{volume}:{transferDate:yyyyMMdd}:{userId}";
                                var alreadyProcessed = await _redisDb.StringGetAsync(idempotencyKey);
                                if (!alreadyProcessed.IsNullOrEmpty)
                                {
                                    _logger.LogWarning("[AutoComplete] Redis idempotency key found, skipping duplicate TankTransfer for SourceTankId={SourceTankId}, DestinationTankId={DestinationTankId}, Volume={Volume}, Date={Date}, User={UserId}",
                                        sourceTankId, destTankId, volume, transferDate, userId);
                                }
                                else
                                {
                                    // **FIX**: Do NOT call ProcessPumpTransactionAsync for source tank in transfer mode.
                                    // PumpTankTransferService.ProcessPumpTransferAsync already handles BOTH source
                                    // (TransferOut) and destination (TransferIn) tank volume history entries.
                                    // Previously this was creating an extra "AutomatedDispensing" (ChangeReason=7)
                                    // entry on the source tank, causing triple deduction (-6300L instead of -2100L).

                                    // Process tank transfer via PumpTankTransferService (handles both source OUT and destination IN)
                                    if (verifyTransaction.DestinationTankId.HasValue && verifyTransaction.TankId.HasValue
                                        && verifyTransaction.Volume.HasValue && verifyTransaction.Volume.Value > 0)
                                    {
                                        var transferData = new JObject
                                        {
                                            ["DeviceId"] = deviceId,
                                            ["PumpId"] = pump,
                                            ["TransactionId"] = transaction,
                                            ["SourceTankId"] = verifyTransaction.TankId.Value,
                                            ["DestinationTankId"] = verifyTransaction.DestinationTankId.Value,
                                            ["Volume"] = verifyTransaction.Volume.Value,
                                            ["TransferDate"] = verifyTransaction.DateTime,
                                            ["Reason"] = "Pump Transfer",
                                            ["UserId"] = userId,
                                            ["PumpTransactionId"] = verifyTransaction.Id
                                        };

                                        var transferResult = await transferService.ProcessPumpTransferAsync(transferData);

                                        if (transferResult.IsSuccess)
                                        {
                                            _logger.LogInformation(
                                                "✅ TANK TRANSFER SAVED - {SourceTank} → {DestTank}, {Volume}L",
                                                verifyTransaction.TankId.Value,
                                                verifyTransaction.DestinationTankId.Value,
                                                verifyTransaction.Volume.Value);
                                        }
                                    }

                                    // Set Redis idempotency key after successful processing (1 day expiry)
                                    await _redisDb.StringSetAsync(idempotencyKey, "1", TimeSpan.FromDays(1));
                                }
                            }
                            catch (Exception historyEx)
                            {
                                _logger.LogError(historyEx, "[AutoComplete] ❌ ERROR processing transfer ledger for transaction {Transaction}",
                                    transaction);
                            }
                        }
                        else if (verifyTransaction.TankId.HasValue && verifyTransaction.Volume.HasValue && verifyTransaction.Volume.Value > 0)
                        {
                            try
                            {
                                var integrationService = scope.ServiceProvider.GetRequiredService<PumpTransactionIntegrationService>();
                                var historyResult = await integrationService.ProcessPumpTransactionAsync(
                                    verifyTransaction.TankId.Value,
                                    verifyTransaction.Id,
                                    verifyTransaction.DateTime,
                                    verifyTransaction.Volume.Value,
                                    verifyTransaction.UserId?.ToString() ?? "System",
                                    default);

                                if (historyResult.Success)
                                {
                                    _logger.LogInformation("[AutoComplete] **TANK VOLUME HISTORY SAVED** ✅ - Transaction {Transaction} recorded in tank {TankId} ledger with volume {Volume}L",
                                        transaction, verifyTransaction.TankId.Value, verifyTransaction.Volume.Value);

                                    // Mark as processed
                                    verifyTransaction.HasBeenProcessed = true;
                                    await context.SaveChangesAsync();
                                }
                                else
                                {
                                    _logger.LogWarning("[AutoComplete] ⚠️ TANK VOLUME HISTORY FAILED - Transaction {Transaction} saved but ledger entry failed: {Message}",
                                        transaction, historyResult.Message);
                                }
                            }
                            catch (Exception historyEx)
                            {
                                _logger.LogError(historyEx, "[AutoComplete] ❌ ERROR processing TankVolumeHistory for transaction {Transaction}, tank {TankId}",
                                    transaction, verifyTransaction.TankId.Value);
                            }
                        }
                        else
                        {
                            _logger.LogDebug("[AutoComplete] Skipping TankVolumeHistory - TankId: {TankId}, Volume: {Volume}",
                                verifyTransaction.TankId, verifyTransaction.Volume);
                        }
                    }
                    else
                    {
                        _logger.LogError("[AutoComplete] **SAVE VERIFICATION FAILED** - Transaction {Transaction} was not found in database after save",
                            transaction);
                        return false;
                    }

                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "[AutoComplete] **DATABASE ERROR** saving transaction {Transaction} for device {DeviceId} - Exception Type: {ExceptionType}, Message: {Message}, StackTrace: {StackTrace}",
                        transaction, deviceId, dbEx.GetType().Name, dbEx.Message, dbEx.StackTrace);

                    //Cursor: **DETAILED ERROR ANALYSIS**
                    if (dbEx.InnerException != null)
                    {
                        _logger.LogError("[AutoComplete] **INNER EXCEPTION** - Type: {InnerType}, Message: {InnerMessage}",
                            dbEx.InnerException.GetType().Name, dbEx.InnerException.Message);
                    }

                    return false;
                }

                // Step 3: Complete monitoring cleanup (best effort - don't fail transaction save if this fails)
                try
                {
                    var completionResult = await _transactionCompletionService.CompleteTransactionAsync(
                        deviceId, pump, transaction, isManualCompletion: false);

                    if (!completionResult)
                    {
                        _logger.LogWarning("[AutoComplete] Failed to complete monitoring cleanup for {DeviceId}:{Transaction}, but transaction was saved",
                            deviceId, transaction);
                    }
                }
                catch (ObjectDisposedException ex)
                {
                    _logger.LogWarning("[AutoComplete] Service disposed during monitoring cleanup for {DeviceId}:{Transaction} - transaction was saved successfully. Error: {Error}",
                        deviceId, transaction, ex.Message);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AutoComplete] Error during monitoring cleanup for {DeviceId}:{Transaction} - transaction was saved successfully",
                        deviceId, transaction);
                }

                // Step 4: Send close command to device (best effort - don't fail if this fails)
                try
                {
                    await SendCloseCommandToDevice(deviceId, pump, transaction);
                }
                catch (ObjectDisposedException ex)
                {
                    _logger.LogWarning("[AutoComplete] Service disposed during close command for {DeviceId}:{Transaction} - transaction was saved successfully. Error: {Error}",
                        deviceId, transaction, ex.Message);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[AutoComplete] Error sending close command for {DeviceId}:{Transaction} - transaction was saved successfully",
                        deviceId, transaction);
                }

                _logger.LogInformation("[AutoComplete] **COMPLETE SUCCESS** - Transaction {Transaction} saved, monitoring cleaned up, and close command sent for device {DeviceId}",
                    transaction, deviceId);

                return true;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] **CRITICAL ERROR** completing and saving transaction {Transaction} for device {DeviceId} - Exception Type: {ExceptionType}, Message: {Message}",
                    transaction, deviceId, ex.GetType().Name, ex.Message);
                return false;
            }
            finally
            {
                if (lockAcquired)
                {
                    await ReleaseCompletionLockAsync(completionLockKey, completionLockValue);
                }
            }
        }

        private async Task ReleaseCompletionLockAsync(string lockKey, string lockValue)
        {
            const string releaseLockScript =
                "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) " +
                "else return 0 end";

            try
            {
                await _redisDb.ScriptEvaluateAsync(
                    releaseLockScript,
                    new RedisKey[] { lockKey },
                    new RedisValue[] { lockValue });
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[AutoComplete] Failed to release completion lock {LockKey}", lockKey);
            }
        }

        private async Task<JObject> GetCompleteTransactionData(string deviceId, int pump, int transaction, JObject statusData)
        {
            try
            {
                JObject completeData;

                // Try to get complete transaction data from device
                var transactionResult = await _directHttpService.QueryTransactionDirectAsync(deviceId, pump, transaction);

                if (transactionResult.Success && transactionResult.Transaction != null)
                {
                    // Convert Pumptransaction back to JObject for processing
                    completeData = JObject.FromObject(transactionResult.Transaction);
                    _logger.LogDebug("[AutoComplete] Retrieved complete transaction data from device {DeviceId}",
                        deviceId);
                }
                else
                {
                    // Fallback to status data if direct query fails
                    _logger.LogDebug("[AutoComplete] Using status data as transaction data for device {DeviceId}",
                        deviceId);
                    completeData = statusData;
                }

                // **CRITICAL FIX**: Enrich with Redis transaction context (contains Odometer, TankId, VehicleId, Tag, etc.)
                await EnrichWithRedisTransactionContext(completeData, deviceId, transaction);

                return completeData;

            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AutoComplete] Error retrieving complete transaction data, using status data");
                return statusData;
            }
        }

        /// <summary>
        /// Enriches transaction data with values from Redis transaction context stored during authorization.
        /// This includes Odometer, TankId, VehicleId, Tag, UserId, ConfigurationId, and other authorization data.
        /// </summary>
        private async Task EnrichWithRedisTransactionContext(JObject data, string deviceId, int transaction)
        {
            try
            {
                var transactionKey = $"device:{deviceId}:transaction:{transaction}";
                var contextJson = await _redisDb.StringGetAsync(transactionKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogWarning("[AutoComplete] ⚠️ NO REDIS CONTEXT FOUND for enrichment - device: {DeviceId}, transaction: {Transaction}. " +
                        "This means VehicleId, TankId, Odometer, and other authorization data will be NULL in the saved transaction!",
                        deviceId, transaction);
                    return;
                }

                // **DEBUG: Log the raw Redis context**
                _logger.LogInformation("[AutoComplete] 📦 REDIS CONTEXT FOR ENRICHMENT - device: {DeviceId}, transaction: {Transaction}, Raw JSON: {ContextJson}",
                    deviceId, transaction, contextJson.ToString());

                var context = JsonSerializer.Deserialize<JsonElement>(contextJson);

                // **CRITICAL FIX**: For transfer mode, map SourceTankId to TankId
                var isTransferMode = context.TryGetProperty("IsTransferMode", out var transferProp)
                    && transferProp.ValueKind != JsonValueKind.Null
                    && transferProp.GetBoolean();

                if (isTransferMode)
                {
                    // For transfers, TankId = SourceTankId (the tank being pumped FROM)
                    if (context.TryGetProperty("SourceTankId", out var sourceTankProp) &&
                        sourceTankProp.ValueKind != JsonValueKind.Null)
                    {
                        data["TankId"] = sourceTankProp.GetInt32();
                        _logger.LogInformation("[AutoComplete] ✅ TRANSFER MODE: Mapped SourceTankId {SourceTankId} → TankId",
                            sourceTankProp.GetInt32());
                    }
                }
                else
                {
                    // For normal fueling, use TankId directly
                    EnrichPropertyIfMissing(data, context, "TankId");
                }

                // Merge context values into data (only if not already present or null in data)
                EnrichPropertyIfMissing(data, context, "Odometer");
                EnrichPropertyIfMissing(data, context, "VehicleId");
                EnrichPropertyIfMissing(data, context, "DestinationTankId"); //Cursor: Destination tank for transfers
                EnrichPropertyIfMissing(data, context, "IsTransferMode"); //Cursor: Flag for tank transfer vs vehicle fueling
                EnrichPropertyIfMissing(data, context, "EmployeeId"); //Cursor: Employee/Driver who performed the fueling
                EnrichPropertyIfMissing(data, context, "Tag");
                EnrichPropertyIfMissing(data, context, "UserId");
                EnrichPropertyIfMissing(data, context, "ConfigurationId");
                EnrichPropertyIfMissing(data, context, "FuelGradeId");
                EnrichPropertyIfMissing(data, context, "FuelGradeName");
                EnrichPropertyIfMissing(data, context, "Nozzle"); // CRITICAL: Nozzle from authorization
                EnrichPropertyIfMissing(data, context, "PumpId"); // Pump ID from authorization
                EnrichPropertyIfMissing(data, context, "SiteId"); // Site ID for configuration lookup
                EnrichPropertyIfMissing(data, context, "FuelLevelBefore"); // Fuel level before fueling from authorization
                // Mobile location from authorization for fueling location tracking
                EnrichPropertyIfMissingDouble(data, context, "MobileLocationLatitude", "MobileLatitude");
                EnrichPropertyIfMissingDouble(data, context, "MobileLocationLongitude", "MobileLongitude");
                EnrichPropertyIfMissingDouble(data, context, "MobileLocationAccuracy", "MobileAccuracy");

                _logger.LogInformation("[AutoComplete] Enriched transaction data with Redis context - device: {DeviceId}, transaction: {Transaction}, Odometer: {Odometer}, TankId: {TankId}, VehicleId: {VehicleId}, DestinationTankId: {DestinationTankId}, IsTransferMode: {IsTransferMode}, EmployeeId: {EmployeeId}, Tag: {Tag}, Nozzle: {Nozzle}",
                    deviceId, transaction,
                    data.Value<decimal?>("Odometer"),
                    data.Value<int?>("TankId"),
                    data.Value<int?>("VehicleId"),
                    data.Value<int?>("DestinationTankId"),
                    data.Value<bool?>("IsTransferMode"),
                    data.Value<int?>("EmployeeId"),
                    data.Value<string>("Tag"),
                    data.Value<int?>("Nozzle"));

            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[AutoComplete] Error enriching transaction data with Redis context for device {DeviceId}, transaction {Transaction}",
                    deviceId, transaction);
            }
        }

        /// <summary>
        /// Enriches a single property in the JObject from the context if it's missing or null in data.
        /// </summary>
        private void EnrichPropertyIfMissing(JObject data, JsonElement context, string propertyName)
        {
            try
            {
                // Check if property exists in context
                if (!context.TryGetProperty(propertyName, out var contextValue) ||
                    contextValue.ValueKind == System.Text.Json.JsonValueKind.Null)
                {
                    return;
                }

                // Check if property is missing or null in data
                var existingValue = data[propertyName];
                if (existingValue != null && existingValue.Type != JTokenType.Null)
                {
                    return; // Data already has a value, don't overwrite
                }

                // Set the value from context
                switch (contextValue.ValueKind)
                {
                    case System.Text.Json.JsonValueKind.Number:
                        if (contextValue.TryGetInt32(out var intVal))
                        {
                            data[propertyName] = intVal;
                        }
                        else if (contextValue.TryGetDecimal(out var decVal))
                        {
                            data[propertyName] = decVal;
                        }
                        break;
                    case System.Text.Json.JsonValueKind.String:
                        data[propertyName] = contextValue.GetString();
                        break;
                    case System.Text.Json.JsonValueKind.True:
                    case System.Text.Json.JsonValueKind.False:
                        data[propertyName] = contextValue.GetBoolean();
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[AutoComplete] Error enriching property {PropertyName}", propertyName);
            }
        }

        /// <summary>
        /// Enriches a double property from context to a target property name in data (for coordinate mapping).
        /// Used for MobileLocationLatitude -> MobileLatitude mapping.
        /// </summary>
        private void EnrichPropertyIfMissingDouble(JObject data, JsonElement context, string contextPropertyName, string dataPropertyName)
        {
            try
            {
                // Check if property exists in context
                if (!context.TryGetProperty(contextPropertyName, out var contextValue) ||
                    contextValue.ValueKind == System.Text.Json.JsonValueKind.Null)
                {
                    return;
                }

                // Check if property is missing or null in data
                var existingValue = data[dataPropertyName];
                if (existingValue != null && existingValue.Type != JTokenType.Null)
                {
                    return; // Data already has a value, don't overwrite
                }

                // Set the value from context (convert double to decimal for database storage)
                if (contextValue.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    if (contextValue.TryGetDouble(out var doubleVal))
                    {
                        data[dataPropertyName] = (decimal)doubleVal;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "[AutoComplete] Error enriching double property {ContextPropertyName} -> {DataPropertyName}",
                    contextPropertyName, dataPropertyName);
            }
        }

        private Pumptransaction CreatePumpTransactionFromData(string deviceId, int pump, int transaction, JObject data)
        {
            //Cursor: Enhanced to handle enriched context data from Redis correlation
            // CRITICAL FIX: Handle Nozzle properly - extract value even if 0, only null means missing
            int? nozzleValue = null;
            if (data["Nozzle"] != null && data["Nozzle"].Type != JTokenType.Null)
            {
                nozzleValue = data.Value<int>("Nozzle");
                if (nozzleValue == 0)
                {
                    // Nozzle 0 usually means the device didn't report it - keep as null so enrichment can fix it
                    nozzleValue = null;
                }
            }

            return new Pumptransaction
            {
                PtsId = deviceId,
                Pump = pump,
                Transaction = transaction,
                Nozzle = nozzleValue,
                FuelGradeId = data.Value<int?>("FuelGradeId"),
                FuelGradeName = data.Value<string>("FuelGradeName"),
                Volume = data.Value<decimal?>("Volume"),
                Tcvolume = data.Value<decimal?>("TCVolume"),
                Price = data.Value<decimal?>("Price"),
                Amount = data.Value<decimal?>("Amount"),
                DateTime = data.Value<DateTime?>("DateTime") ?? DateTime.UtcNow,
                DateTimeStart = data.Value<DateTime?>("DateTimeStart"),
                Tag = data.Value<string>("Tag"), //Cursor: Now enriched from authorization context
                UserId = data.Value<string?>("UserId"),
                ConfigurationId = data.Value<string>("ConfigurationId"),
                TankId = data.Value<int?>("TankId"), //Cursor: Now enriched from authorization context
                VehicleId = data.Value<int?>("VehicleId"), //Cursor: Now enriched from authorization context
                DestinationTankId = data.Value<int?>("DestinationTankId"), //Cursor: Destination tank for tank-to-tank transfers
                IsTransferMode = data.Value<bool?>("IsTransferMode") ?? false, //Cursor: Flag for tank transfer vs vehicle fueling
                EmployeeId = data.Value<int?>("EmployeeId"), //Cursor: Employee/Driver who performed the fueling
                Odometer = data.Value<decimal?>("Odometer"), //Cursor: Add odometer from authorization context
                FuelLevelBefore = data.Value<decimal?>("FuelLevelBefore"),
                FuelLevelAfter = data.Value<decimal?>("FuelLevelAfter"),
                // Mobile location from authorization for fueling location tracking
                MobileLatitude = data.Value<decimal?>("MobileLatitude"),
                MobileLongitude = data.Value<decimal?>("MobileLongitude"),
                MobileAccuracy = data.Value<decimal?>("MobileAccuracy"),
                HasBeenProcessed = false // Will be set to true after processing
            };
        }

        private void UpdateExistingTransaction(Pumptransaction existing, Pumptransaction updated)
        {
            // Update fields that might have changed at completion
            existing.Volume = updated.Volume ?? existing.Volume;
            existing.Tcvolume = updated.Tcvolume ?? existing.Tcvolume;
            existing.Amount = updated.Amount ?? existing.Amount;
            existing.DateTime = updated.DateTime;
            existing.Price = updated.Price ?? existing.Price;
            existing.FuelGradeName = updated.FuelGradeName ?? existing.FuelGradeName;

            // **CRITICAL FIX**: Also update context fields from authorization (Odometer, TankId, VehicleId, Tag)
            existing.Odometer = updated.Odometer ?? existing.Odometer;
            existing.FuelLevelBefore = updated.FuelLevelBefore ?? existing.FuelLevelBefore;
            existing.FuelLevelAfter = updated.FuelLevelAfter ?? existing.FuelLevelAfter;
            existing.TankId = updated.TankId ?? existing.TankId;
            existing.VehicleId = updated.VehicleId ?? existing.VehicleId;
            existing.DestinationTankId = updated.DestinationTankId ?? existing.DestinationTankId; //Cursor: Update destination tank
            existing.IsTransferMode = updated.IsTransferMode || existing.IsTransferMode; //Cursor: Keep true if ever set
            existing.EmployeeId = updated.EmployeeId ?? existing.EmployeeId; //Cursor: Update employee/driver
            existing.Tag = updated.Tag ?? existing.Tag;
            existing.UserId = updated.UserId ?? existing.UserId;
            existing.ConfigurationId = updated.ConfigurationId ?? existing.ConfigurationId;
            existing.FuelGradeId = updated.FuelGradeId ?? existing.FuelGradeId;
            // Mobile location from authorization
            existing.MobileLatitude = updated.MobileLatitude ?? existing.MobileLatitude;
            existing.MobileLongitude = updated.MobileLongitude ?? existing.MobileLongitude;
            existing.MobileAccuracy = updated.MobileAccuracy ?? existing.MobileAccuracy;

            // **NOZZLE FIX**: Update nozzle if existing is null/0 and updated has valid value
            if ((!existing.Nozzle.HasValue || existing.Nozzle == 0) && updated.Nozzle.HasValue && updated.Nozzle > 0)
            {
                existing.Nozzle = updated.Nozzle;
            }

            // Don't update core identifiers (PtsId, Transaction, Pump)
        }

        /// <summary>
        /// Captures fuel level after fueling from GPS for vehicle refueling transactions.
        /// Applies only when GPS fuel level check is enabled, vehicle is GPS-enabled, and this is not transfer mode.
        /// </summary>
        private async Task TryEnrichFuelLevelAfterAsync(JObject data)
        {
            try
            {
                if (data["FuelLevelAfter"] != null && data["FuelLevelAfter"]!.Type != JTokenType.Null)
                {
                    return;
                }

                var isTransferMode = data.Value<bool?>("IsTransferMode") ?? false;
                var vehicleId = data.Value<int?>("VehicleId");

                if (isTransferMode || !vehicleId.HasValue || vehicleId.Value <= 0)
                {
                    return;
                }

                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
                var systemConfigService = scope.ServiceProvider.GetService<ISystemConfigurationService>();
                var gpsService = scope.ServiceProvider.GetService<IGPSService>();

                if (systemConfigService == null || gpsService == null)
                {
                    return;
                }

                var fuelLevelCheckEnabled = await systemConfigService.GetPtsEnableGPSFuelLevelCheckAsync();
                if (!fuelLevelCheckEnabled)
                {
                    return;
                }

                var hasGpsInstalled = await context.Vehicles
                    .AsNoTracking()
                    .Where(v => v.VehicleId == vehicleId.Value)
                    .Select(v => v.HasGPSInstalled == 1)
                    .FirstOrDefaultAsync();

                if (!hasGpsInstalled)
                {
                    return;
                }

                var fuelLevelResult = await gpsService.GetFuelLevelAsync(vehicleId.Value);
                if (fuelLevelResult.IsSuccess && fuelLevelResult.Data.HasValue)
                {
                    data["FuelLevelAfter"] = fuelLevelResult.Data.Value;
                    _logger.LogDebug("[AutoComplete] Captured FuelLevelAfter={FuelLevel}L for vehicle {VehicleId}",
                        fuelLevelResult.Data.Value,
                        vehicleId.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "[AutoComplete] Failed to capture fuel level after fueling from GPS during auto completion");
            }
        }

        private async Task SendCloseCommandToDevice(string deviceId, int pump, int transaction)
        {
            try
            {
                var retryKey = $"{deviceId}:{pump}:{transaction}";

                // CRITICAL FIX: Verify pump is actually in EOT state before attempting close
                // Tank transfers may still be processing on hardware even after our timeout
                var pumpReady = await VerifyPumpReadyForClose(deviceId, pump, transaction);
                if (!pumpReady)
                {
                    if (ShouldLogWarning($"deferred-close:{retryKey}", WarningThrottleWindow))
                    {
                        _logger.LogWarning("[AutoComplete] Pump {PumpId} on device {DeviceId} not yet ready for close (transaction {Transaction}). " +
                            "This is normal for tank transfers. Close command will be deferred.",
                            pump, deviceId, transaction);
                    }
                    else
                    {
                        _logger.LogDebug("[AutoComplete] Deferred close still pending for pump {PumpId} on device {DeviceId} transaction {Transaction}",
                            pump, deviceId, transaction);
                    }

                    // Schedule one retry loop per device/pump/transaction to prevent warning storms.
                    if (_pendingCloseRetry.TryAdd(retryKey, 0))
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                await Task.Delay(TimeSpan.FromSeconds(CloseRetryDelaySeconds));
                                await SendCloseCommandToDevice(deviceId, pump, transaction);
                            }
                            finally
                            {
                                _pendingCloseRetry.TryRemove(retryKey, out _);
                            }
                        });
                    }
                    return;
                }

                _pendingCloseRetry.TryRemove(retryKey, out _);

                // Determine connection type and send appropriate close command
                var wsConnection = await _connectionTracker.GetWebSocketConnection(deviceId);
                var httpConnection = await _connectionTracker.GetHttpConnection(deviceId);

                if (wsConnection != null)
                {
                    _logger.LogDebug("[AutoComplete] Sending PumpCloseTransaction via Redis for WebSocket device {DeviceId}",
                        deviceId);
                    // This would integrate with existing Redis command system
                }
                else if (httpConnection != null)
                {
                    _logger.LogDebug("[AutoComplete] Sending PumpCloseTransaction via HTTP for device {DeviceId}",
                        deviceId);
                    var closeResult = await _directHttpService.CloseTransactionDirectAsync(deviceId, pump, transaction);
                    if (!closeResult)
                    {
                        _logger.LogWarning("[AutoComplete] Failed to send close command to device {DeviceId}",
                            deviceId);
                    }
                }
                else
                {
                    _logger.LogInformation("[AutoComplete] No active connection found for device {DeviceId} - transaction saved but close command skipped",
                        deviceId);
                }
            }
            catch (ObjectDisposedException ex)
            {
                _logger.LogWarning("[AutoComplete] Service disposed during close command for device {DeviceId} - transaction was saved successfully. Error: {Error}",
                    deviceId, ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error sending close command to device {DeviceId} - transaction was saved successfully",
                    deviceId);
            }
        }


        private async Task<bool> VerifyPumpReadyForClose(string deviceId, int pump, int transaction)
        {
            try
            {
                // Get latest pump status from Redis
                var statusKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(statusKey);

                if (statusJson.IsNullOrEmpty)
                {
                    // ⚠️ No status - wait before assuming ready
                    var noStatusLogKey = $"no-status:{deviceId}:{pump}";
                    if (ShouldLogWarning(noStatusLogKey, WarningThrottleWindow))
                    {
                        _logger.LogWarning(
                            "[AutoComplete] No status available for {DeviceId} pump {PumpId}, waiting 5s before retry",
                            deviceId, pump);
                    }
                    else
                    {
                        _logger.LogDebug(
                            "[AutoComplete] No status still pending for {DeviceId} pump {PumpId}; retry continues",
                            deviceId, pump);
                    }
                    await Task.Delay(5000);
                    return false; // Retry later
                }

                var status = JsonSerializer.Deserialize<JsonElement>(statusJson);

                if (status.TryGetProperty("Pumps", out var pumps))
                {
                    // ✅ Check EndOfTransaction status first
                    if (pumps.TryGetProperty("EndOfTransactionStatus", out var eotStatus) &&
                        eotStatus.TryGetProperty("Ids", out var eotIds) &&
                        eotIds.ValueKind == JsonValueKind.Array)
                    {
                        var eotPumps = eotIds.EnumerateArray()
                            .Where(p => p.TryGetInt32(out var id) && id == pump)
                            .ToList();

                        if (eotPumps.Any())
                        {
                            _logger.LogInformation(
                                "[AutoComplete] ✅ Pump {PumpId} is in EOT state - ready for close", pump);
                            return true;
                        }
                    }

                    // ⚠️ Check if STILL FILLING (definitely not ready)
                    if (pumps.TryGetProperty("FillingStatus", out var fillingStatus) &&
                        fillingStatus.TryGetProperty("Ids", out var fillingIds) &&
                        fillingIds.ValueKind == JsonValueKind.Array)
                    {
                        var stillFilling = fillingIds.EnumerateArray()
                            .Any(p => p.TryGetInt32(out var id) && id == pump);

                        if (stillFilling)
                        {
                            _logger.LogWarning(
                                "[AutoComplete] ⚠️ Pump {PumpId} is STILL FILLING - NOT ready for close", pump);
                            return false;
                        }
                    }

                    // Check Idle status
                    if (pumps.TryGetProperty("IdleStatus", out var idleStatus) &&
                        idleStatus.TryGetProperty("Ids", out var idleIds) &&
                        idleIds.ValueKind == JsonValueKind.Array)
                    {
                        var isIdle = idleIds.EnumerateArray()
                            .Any(p => p.TryGetInt32(out var id) && id == pump);

                        if (isIdle)
                        {
                            // ⚠️ Pump is in Idle but not EOT - needs more time
                            var idleNotEotLogKey = $"idle-not-eot:{deviceId}:{pump}";
                            if (ShouldLogWarning(idleNotEotLogKey, WarningThrottleWindow))
                            {
                                _logger.LogWarning(
                                    "[AutoComplete] ⚠️ Pump {PumpId} is Idle but not EOT - waiting 5s before retry", pump);
                            }
                            else
                            {
                                _logger.LogDebug(
                                    "[AutoComplete] Pump {PumpId} still idle without EOT for device {DeviceId}; retry continues",
                                    pump,
                                    deviceId);
                            }
                            await Task.Delay(5000);
                            return false; // Retry after delay
                        }
                    }
                }

                // Can't determine status - wait
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error verifying pump readiness for {DeviceId}:{PumpId}",
                    deviceId, pump);
                return false; // Err on safe side
            }
        }

        private bool ShouldLogWarning(string key, TimeSpan throttleWindow)
        {
            var now = DateTime.UtcNow;
            if (_lastWarningLogByKey.TryGetValue(key, out var lastLogTime) && (now - lastLogTime) < throttleWindow)
            {
                return false;
            }

            _lastWarningLogByKey[key] = now;
            return true;
        }

    }



}

