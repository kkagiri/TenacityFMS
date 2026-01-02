//Cursor: Service for automatic transaction completion detection and saving
using System;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
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
        private readonly ITransactionCompletionService _transactionCompletionService;
        private readonly ITransactionMonitoringService _transactionMonitoringService;
        private readonly IDirectHttpTransactionService _directHttpService;
        private readonly DeviceConnectionTracker _connectionTracker;
        private readonly IDatabase _redisDb;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AutoTransactionCompletionService> _logger;

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
                    _logger.LogDebug("[AutoComplete] No transaction context found for {DeviceId}:{Transaction}",
                        deviceId, transaction);
                    return false; // Default to manual completion if no context
                }

                var context = JsonSerializer.Deserialize<JsonElement>(contextJson);
                var autoClose = context.TryGetProperty("AutoCloseTransaction", out var autoCloseElement) ?
                    autoCloseElement.GetBoolean() :
                    false;

                // Check connection type - WebSocket and HTTPDirect typically support auto-completion
                var connectionType = context.TryGetProperty("ConnectionType", out var connTypeElement) ?
                    connTypeElement.GetString() :
                    "Unknown";

                bool supportsAutoCompletion = connectionType
                switch
                {
                    "WebSocket" => true, // Real-time communication supports auto-completion
                    "HTTPDirect" => true, // Direct HTTP can auto-complete
                    "HTTPPolling" => false, // Polling typically requires manual completion
                    _ => false
                };

                var shouldAuto = autoClose && supportsAutoCompletion;

                _logger.LogDebug("[AutoComplete] Auto-completion check for {DeviceId}:{Transaction} - AutoClose: {AutoClose}, ConnectionType: {ConnectionType}, Result: {ShouldAuto}",
                    deviceId, transaction, autoClose, connectionType, shouldAuto);

                return shouldAuto;

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error checking auto-completion eligibility for {DeviceId}:{Transaction}",
                    deviceId, transaction);
                return false; // Default to manual completion on error
            }
        }

        public async Task<bool> CompleteAndSaveTransactionAsync(string deviceId, int pump, int transaction, JObject finalData)
        {
            try
            {
                _logger.LogInformation("[AutoComplete] Starting automatic completion and save for {DeviceId}:{Transaction}",
                    deviceId, transaction);

                //Cursor: **ENHANCED LOGGING** - Log the complete final data being processed
                _logger.LogInformation("[AutoComplete] Final transaction data for {DeviceId}:{Transaction}: {FinalData}",
                    deviceId, transaction, finalData.ToString());

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
                    _logger.LogDebug("[AutoComplete] No transaction context found in Redis for enrichment - device: {DeviceId}, transaction: {Transaction}",
                        deviceId, transaction);
                    return;
                }

                var context = JsonSerializer.Deserialize<JsonElement>(contextJson);

                // Merge context values into data (only if not already present or null in data)
                EnrichPropertyIfMissing(data, context, "Odometer");
                EnrichPropertyIfMissing(data, context, "TankId");
                EnrichPropertyIfMissing(data, context, "VehicleId");
                EnrichPropertyIfMissing(data, context, "Tag");
                EnrichPropertyIfMissing(data, context, "UserId");
                EnrichPropertyIfMissing(data, context, "ConfigurationId");
                EnrichPropertyIfMissing(data, context, "FuelGradeId");
                EnrichPropertyIfMissing(data, context, "FuelGradeName");

                _logger.LogInformation("[AutoComplete] Enriched transaction data with Redis context - device: {DeviceId}, transaction: {Transaction}, Odometer: {Odometer}, TankId: {TankId}, VehicleId: {VehicleId}, Tag: {Tag}",
                    deviceId, transaction,
                    data.Value<decimal?>("Odometer"),
                    data.Value<int?>("TankId"),
                    data.Value<int?>("VehicleId"),
                    data.Value<string>("Tag"));

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

        private Pumptransaction CreatePumpTransactionFromData(string deviceId, int pump, int transaction, JObject data)
        {
            //Cursor: Enhanced to handle enriched context data from Redis correlation
            return new Pumptransaction
            {
                PtsId = deviceId,
                Pump = pump,
                Transaction = transaction,
                Nozzle = data.Value<int?>("Nozzle"),
                FuelGradeId = data.Value<int?>("FuelGradeId"),
                FuelGradeName = data.Value<string>("FuelGradeName"),
                Volume = data.Value<decimal?>("Volume"),
                Tcvolume = data.Value<decimal?>("TCVolume"),
                Price = data.Value<decimal?>("Price"),
                Amount = data.Value<decimal?>("Amount"),
                DateTime = data.Value<DateTime?>("DateTime") ?? DateTime.UtcNow,
                DateTimeStart = data.Value<DateTime?>("DateTimeStart"),
                Tag = data.Value<string>("Tag"), //Cursor: Now enriched from authorization context
                UserId = data.Value<int?>("UserId"),
                ConfigurationId = data.Value<string>("ConfigurationId"),
                TankId = data.Value<int?>("TankId"), //Cursor: Now enriched from authorization context
                VehicleId = data.Value<int?>("VehicleId"), //Cursor: Now enriched from authorization context
                Odometer = data.Value<decimal?>("Odometer"), //Cursor: Add odometer from authorization context
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
            existing.TankId = updated.TankId ?? existing.TankId;
            existing.VehicleId = updated.VehicleId ?? existing.VehicleId;
            existing.Tag = updated.Tag ?? existing.Tag;
            existing.UserId = updated.UserId ?? existing.UserId;
            existing.ConfigurationId = updated.ConfigurationId ?? existing.ConfigurationId;
            existing.FuelGradeId = updated.FuelGradeId ?? existing.FuelGradeId;
            // Don't update core identifiers (PtsId, Transaction, Pump)
        }

        private async Task SendCloseCommandToDevice(string deviceId, int pump, int transaction)
        {
            try
            {
                // Determine connection type and send appropriate close command
                var wsConnection = await _connectionTracker.GetWebSocketConnection(deviceId);
                var httpConnection = await _connectionTracker.GetHttpConnection(deviceId);

                if (wsConnection != null)
                {
                    // Send via Redis pub/sub for WebSocket devices
                    _logger.LogDebug("[AutoComplete] Sending PumpCloseTransaction via Redis for WebSocket device {DeviceId}",
                        deviceId);

                    // This would integrate with existing Redis command system
                    // Implementation depends on your Redis command structure

                }
                else if (httpConnection != null)
                {
                    // Send via direct HTTP for HTTP devices
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
                // Don't fail the overall completion process if close command fails due to disposal
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AutoComplete] Error sending close command to device {DeviceId} - transaction was saved successfully",
                    deviceId);
                // Don't fail the overall completion process if close command fails
            }
        }
    }
}