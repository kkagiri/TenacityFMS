/**
 * File: UploadStatusEndOfTransactionService.cs
 * Purpose: Handles UploadStatus end-of-transaction payloads, correlation, and completion triggering.
 * Dependencies: Redis, PumpService, AutoTransactionCompletionService, TransactionCompletionService, TransactionContextService
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - ProcessAsync(): Processes EndOfTransactionStatus packets and triggers transaction completion flows.
 * - BuildStatusDataAsync(): Correlates EOT data with cached authorization/device context.
 * - TryBuildFromDeviceQueryAsync(): Falls back to querying the PTS device when Redis context is unavailable.
 */
using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.PTSServices.PumpService;
using FMS.Application.Services;
using FMS.Domain.Entities.PTS.PTSStatus.PumpStatus;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    public interface IUploadStatusEndOfTransactionService
    {
        Task ProcessAsync(string deviceId, EndOfTransactionStatus eotStatus);
    }

    public class UploadStatusEndOfTransactionService : IUploadStatusEndOfTransactionService
    {
        private readonly ILogger<UploadStatusEndOfTransactionService> _logger;
        private readonly IDatabase _redisDb;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IPumpService _pumpService;
        private readonly IAutoTransactionCompletionService _autoCompletionService;
        private readonly ITransactionCompletionService _transactionCompletionService;
        private readonly IUploadStatusForcedCompletionService _forcedCompletionService;
        private readonly ITransactionContextService _transactionContextService;

        public UploadStatusEndOfTransactionService(
            ILogger<UploadStatusEndOfTransactionService> logger,
            IConnectionMultiplexer redisConnection,
            IAuthorizationStateTracker authTracker,
            IPumpService pumpService,
            IAutoTransactionCompletionService autoCompletionService,
            ITransactionCompletionService transactionCompletionService,
            IUploadStatusForcedCompletionService forcedCompletionService,
            ITransactionContextService transactionContextService)
        {
            _logger = logger;
            _redisDb = redisConnection.GetDatabase();
            _authTracker = authTracker;
            _pumpService = pumpService;
            _autoCompletionService = autoCompletionService;
            _transactionCompletionService = transactionCompletionService;
            _forcedCompletionService = forcedCompletionService;
            _transactionContextService = transactionContextService;
        }

        public async Task ProcessAsync(string deviceId, EndOfTransactionStatus eotStatus)
        {
            try
            {
                LogIncomingData(deviceId, eotStatus);
                await ProcessMissingEotCandidatesAsync(deviceId, eotStatus);

                if (eotStatus?.Ids == null || !eotStatus.Ids.Any())
                {
                    _logger.LogDebug("[UploadStatus] NO EOT DATA - EndOfTransactionStatus has no pump IDs for device {DeviceId}", deviceId);
                    return;
                }

                _logger.LogInformation(
                    "[UploadStatus] EOT PROCESSING - Processing EndOfTransaction for device {DeviceId} with {Count} pumps",
                    deviceId,
                    eotStatus.Ids.Count);

                for (int i = 0; i < eotStatus.Ids.Count; i++)
                {
                    var pumpIdNullable = eotStatus.Ids[i];
                    if (!pumpIdNullable.HasValue)
                    {
                        continue;
                    }

                    await ProcessPumpAsync(deviceId, eotStatus, i, pumpIdNullable.Value);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] EOT ERROR - Error processing EndOfTransaction for device {DeviceId}", deviceId);
            }
        }

        private void LogIncomingData(string deviceId, EndOfTransactionStatus eotStatus)
        {
            if (eotStatus?.Ids?.Any() != true)
            {
                return;
            }

            for (int index = 0; index < eotStatus.Ids.Count; index++)
            {
                var pumpId = eotStatus.Ids[index];
                var transaction = eotStatus.Transactions?.Count > index ? eotStatus.Transactions[index] : (int?)null;
                var volume = eotStatus.Volumes?.Count > index ? eotStatus.Volumes[index] : (decimal?)null;
                var amount = eotStatus.Amounts?.Count > index ? eotStatus.Amounts[index] : (decimal?)null;
                var nozzle = eotStatus.Nozzles?.Count > index ? eotStatus.Nozzles[index] : (int?)null;
                var fuelGradeId = eotStatus.FuelGradeIds?.Count > index ? eotStatus.FuelGradeIds[index] : (int?)null;
                var fuelGradeName = eotStatus.FuelGradeNames?.Count > index ? eotStatus.FuelGradeNames[index] : null;

                _logger.LogInformation(
                    "[UploadStatus] EOT DATA[{Index}] - Pump: {PumpId}, Transaction: {TransactionId}, Volume: {Volume}L, Amount: ${Amount}, Nozzle: {Nozzle}, FuelGrade: {FuelGradeId} ({FuelGradeName})",
                    index,
                    pumpId,
                    transaction,
                    volume,
                    amount,
                    nozzle,
                    fuelGradeId,
                    fuelGradeName);
            }
        }

        private async Task ProcessMissingEotCandidatesAsync(string deviceId, EndOfTransactionStatus eotStatus)
        {
            var activeTransactions = await _forcedCompletionService.GetActiveTransactionsAsync(deviceId);
            if (!activeTransactions.Any())
            {
                return;
            }

            _logger.LogWarning(
                "[UploadStatus] MISSING EOT - Device {DeviceId} has {Count} active transactions but EndOfTransactionStatus may be incomplete",
                deviceId,
                activeTransactions.Count);

            foreach (var (pumpId, transactionId) in activeTransactions)
            {
                var expectedMatch = eotStatus?.Ids?.Any() == true
                    && eotStatus.Transactions?.Any() == true
                    && eotStatus.Transactions.Contains(transactionId);

                _logger.LogWarning(
                    "[UploadStatus] CORRELATION - Expected Transaction {TransactionId}, Found in EOT: {Found}",
                    transactionId,
                    expectedMatch);

                await _forcedCompletionService.CheckForForcedCompletionAsync(deviceId, pumpId, transactionId);
            }
        }

        private async Task ProcessPumpAsync(string deviceId, EndOfTransactionStatus eotStatus, int index, int pumpId)
        {
            var detectedTransactionId = eotStatus.Transactions?.Count > index && eotStatus.Transactions[index] > 0
                ? eotStatus.Transactions[index]
                : (int?)null;
            var volume = eotStatus.Volumes?.Count > index ? (decimal?)eotStatus.Volumes[index] : null;
            var amount = eotStatus.Amounts?.Count > index ? (decimal?)eotStatus.Amounts[index] : null;

            _logger.LogInformation(
                "[UploadStatus] EOT DETECTED - Device {DeviceId}, Pump {PumpId}, Transaction: {TransactionId}, Volume: {Volume}L, Amount: ${Amount}",
                deviceId,
                pumpId,
                detectedTransactionId,
                volume,
                amount);

            if (!detectedTransactionId.HasValue)
            {
                _logger.LogWarning(
                    "[UploadStatus] NO TRANSACTION ID - EndOfTransaction detected for Device {DeviceId}, Pump {PumpId} but no transaction ID available",
                    deviceId,
                    pumpId);
                await _transactionCompletionService.HandleEndOfTransactionAsync(deviceId, pumpId, null);
                return;
            }

            if (!await TryRegisterEotProcessingAsync(deviceId, detectedTransactionId.Value))
            {
                return;
            }

            var statusData = await BuildStatusDataAsync(deviceId, pumpId, eotStatus, index, detectedTransactionId.Value, volume, amount);
            if (statusData != null)
            {
                QueueAutoCompletion(deviceId, pumpId, detectedTransactionId.Value, statusData);
            }

            await _transactionCompletionService.HandleEndOfTransactionAsync(deviceId, pumpId, detectedTransactionId);
        }

        private async Task<bool> TryRegisterEotProcessingAsync(string deviceId, int transactionId)
        {
            var eotProcessedKey = $"device:{deviceId}:eot:transaction:{transactionId}:processed";
            var processedAt = DateTime.UtcNow.ToString("o");

            var isFirstProcessing = await _redisDb.StringSetAsync(
                eotProcessedKey,
                processedAt,
                expiry: TimeSpan.FromMinutes(10),
                when: When.NotExists);

            if (!isFirstProcessing)
            {
                var alreadyProcessed = await _redisDb.StringGetAsync(eotProcessedKey);
                _logger.LogInformation(
                    "[UploadStatus] DUPLICATE PREVENTION - EndOfTransaction {TransactionId} for Device {DeviceId} was already processed at {ProcessedTime}, skipping",
                    transactionId,
                    deviceId,
                    alreadyProcessed);
            }

            return isFirstProcessing;
        }

        private async Task<JObject?> BuildStatusDataAsync(
            string deviceId,
            int pumpId,
            EndOfTransactionStatus eotStatus,
            int index,
            int transactionId,
            decimal? volume,
            decimal? amount)
        {
            var transactionContext = await _transactionContextService.GetTransactionContextAsync(deviceId, transactionId);
            if (transactionContext != null)
            {
                _logger.LogInformation(
                    "[UploadStatus] MATCH FOUND - EndOfTransaction {TransactionId} matches our authorized context for Device {DeviceId}",
                    transactionId,
                    deviceId);

                return transactionContext.IsTransferMode
                    ? BuildTransferStatusData(eotStatus, index, pumpId, transactionId, volume, amount, transactionContext)
                    : await BuildVehicleStatusDataAsync(deviceId, pumpId, eotStatus, index, transactionId, volume, amount, transactionContext);
            }

            _logger.LogWarning(
                "[UploadStatus] NO MATCH - EndOfTransaction {TransactionId} for Device {DeviceId} has no corresponding authorization context - attempting device query",
                transactionId,
                deviceId);

            return await TryBuildFromDeviceQueryAsync(deviceId, pumpId, transactionId, volume, amount)
                ?? BuildBasicStatusData(eotStatus, index, pumpId, transactionId, volume, amount);
        }

        private JObject BuildTransferStatusData(
            EndOfTransactionStatus eotStatus,
            int index,
            int pumpId,
            int transactionId,
            decimal? volume,
            decimal? amount,
            TransactionContext transactionContext)
        {
            _logger.LogInformation(
                "[UploadStatus] TRANSFER MODE DETECTED in EOT - Source Tank {SourceTank} -> Dest Tank {DestTank}, Volume: {Volume} L, Transaction: {TxId}",
                transactionContext.SourceTankId,
                transactionContext.DestinationTankId,
                volume,
                transactionId);

            return new JObject
            {
                ["Pump"] = pumpId,
                ["Transaction"] = transactionId,
                ["Volume"] = volume,
                ["Amount"] = amount,
                ["DateTime"] = DateTime.UtcNow,
                ["TankId"] = transactionContext.SourceTankId,
                ["DestinationTankId"] = transactionContext.DestinationTankId,
                ["IsTransferMode"] = true,
                ["VehicleId"] = (int?)null,
                ["Tag"] = (string?)null,
                ["UserId"] = transactionContext.UserId ?? "System",
                ["Nozzle"] = transactionContext.Nozzle ?? GetIndexedValue(eotStatus.Nozzles, index),
                ["FuelGradeId"] = transactionContext.FuelGradeId ?? GetIndexedValue(eotStatus.FuelGradeIds, index),
                ["FuelGradeName"] = transactionContext.FuelGradeName ?? GetIndexedValue(eotStatus.FuelGradeNames, index)
            };
        }

        private async Task<JObject> BuildVehicleStatusDataAsync(
            string deviceId,
            int pumpId,
            EndOfTransactionStatus eotStatus,
            int index,
            int transactionId,
            decimal? volume,
            decimal? amount,
            TransactionContext transactionContext)
        {
            _logger.LogInformation(
                "[UploadStatus] CONTEXT DETAILS - Transaction {TransactionId}: AuthorizedPump={AuthPump}, ReceivedPump={RecvPump}, TankId={TankId}, VehicleId={VehicleId}, AutoClose={AutoClose}",
                transactionId,
                transactionContext.PumpId,
                pumpId,
                transactionContext.TankId,
                transactionContext.VehicleId,
                transactionContext.AutoCloseTransaction);

            var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
            var statusData = new JObject
            {
                ["Pump"] = pumpId,
                ["Transaction"] = transactionId,
                ["Volume"] = volume,
                ["Amount"] = amount,
                ["DateTime"] = DateTime.UtcNow,
                ["TankId"] = transactionContext.TankId,
                ["VehicleId"] = transactionContext.VehicleId,
                ["Tag"] = authState?.TagId ?? transactionContext.Tag,
                ["ConnectionType"] = transactionContext.ConnectionType,
                ["AutoCloseTransaction"] = transactionContext.AutoCloseTransaction
            };

            SetIfPresent(statusData, "Nozzle", transactionContext.Nozzle ?? GetIndexedValue(eotStatus.Nozzles, index));
            SetIfPresent(statusData, "FuelGradeId", transactionContext.FuelGradeId ?? GetIndexedValue(eotStatus.FuelGradeIds, index));
            SetIfPresent(statusData, "FuelGradeName", transactionContext.FuelGradeName ?? GetIndexedValue(eotStatus.FuelGradeNames, index));
            SetIfPresent(statusData, "Price", GetIndexedValue(eotStatus.Prices, index));

            return statusData;
        }

        private async Task<JObject?> TryBuildFromDeviceQueryAsync(
            string deviceId,
            int pumpId,
            int transactionId,
            decimal? fallbackVolume,
            decimal? fallbackAmount)
        {
            try
            {
                _logger.LogInformation(
                    "[UploadStatus] DEVICE QUERY - Querying PumpTransactionInformation from device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                    deviceId,
                    pumpId,
                    transactionId);

                var transactionInfo = await _pumpService.GetPumpTransactionInfoAsync(deviceId, pumpId, transactionId);
                if (transactionInfo == null)
                {
                    _logger.LogWarning(
                        "[UploadStatus] DEVICE QUERY EMPTY - Device returned null transaction info for {DeviceId}:{TransactionId}",
                        deviceId,
                        transactionId);
                    return null;
                }

                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);

                return new JObject
                {
                    ["Pump"] = pumpId,
                    ["Transaction"] = transactionId,
                    ["Volume"] = transactionInfo.Volume ?? fallbackVolume,
                    ["Amount"] = transactionInfo.Amount ?? fallbackAmount,
                    ["Nozzle"] = transactionInfo.Nozzle,
                    ["FuelGradeId"] = transactionInfo.FuelGradeId,
                    ["FuelGradeName"] = transactionInfo.FuelGradeName,
                    ["Price"] = transactionInfo.Price,
                    ["DateTime"] = transactionInfo.DateTime,
                    ["DateTimeStart"] = transactionInfo.DateTimeStart,
                    ["Tag"] = transactionInfo.Tag ?? authState?.TagId,
                    ["UserId"] = transactionInfo.UserId,
                    ["ConfigurationId"] = transactionInfo.ConfigurationId,
                    ["TankId"] = authState?.TankId,
                    ["VehicleId"] = authState?.VehicleId,
                    ["DataSource"] = "DeviceQuery"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "[UploadStatus] DEVICE QUERY FAILED - Error querying transaction info from device {DeviceId}:{TransactionId}",
                    deviceId,
                    transactionId);
                return null;
            }
        }

        private JObject BuildBasicStatusData(
            EndOfTransactionStatus eotStatus,
            int index,
            int pumpId,
            int transactionId,
            decimal? volume,
            decimal? amount)
        {
            _logger.LogWarning(
                "[UploadStatus] FALLBACK TO BASIC - Using basic transaction data (may be missing VehicleId/TankId) for Transaction {TransactionId}",
                transactionId);

            var statusData = new JObject
            {
                ["Pump"] = pumpId,
                ["Transaction"] = transactionId,
                ["Volume"] = volume,
                ["Amount"] = amount,
                ["DateTime"] = DateTime.UtcNow,
                ["DataSource"] = "BasicEOT"
            };

            SetIfPresent(statusData, "Nozzle", GetIndexedValue(eotStatus.Nozzles, index));
            SetIfPresent(statusData, "FuelGradeId", GetIndexedValue(eotStatus.FuelGradeIds, index));
            SetIfPresent(statusData, "FuelGradeName", GetIndexedValue(eotStatus.FuelGradeNames, index));
            SetIfPresent(statusData, "Price", GetIndexedValue(eotStatus.Prices, index));

            return statusData;
        }

        private void QueueAutoCompletion(string deviceId, int pumpId, int transactionId, JObject statusData)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _autoCompletionService.ProcessEndOfTransactionAsync(deviceId, pumpId, transactionId, statusData);
                    _logger.LogInformation(
                        "[AutoComplete] SUCCESS - Background auto-completion completed for transaction {DeviceId}:{Transaction}",
                        deviceId,
                        transactionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "[AutoComplete] ERROR - Background auto-completion failed for transaction {DeviceId}:{Transaction}",
                        deviceId,
                        transactionId);
                }
            });
        }

        private static T? GetIndexedValue<T>(System.Collections.Generic.IList<T>? values, int index)
        {
            return values != null && values.Count > index ? values[index] : default;
        }

        private static void SetIfPresent(JObject target, string propertyName, object? value)
        {
            if (value != null)
            {
                target[propertyName] = JToken.FromObject(value);
            }
        }
    }
}