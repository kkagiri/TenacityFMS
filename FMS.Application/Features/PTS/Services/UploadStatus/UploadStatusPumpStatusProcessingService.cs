/**
 * File: UploadStatusPumpStatusProcessingService.cs
 * Purpose: Processes UploadStatus pump state changes, auth-state transitions, and IdleStatus completion inference.
 * Dependencies: Redis, AuthorizationStateTracker, AutoTransactionCompletionService, UploadStatusEndOfTransactionService
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - ProcessAsync(): Routes UploadStatus pump states through the internal state machine.
 * - ProcessIdleStatusAsync(): Detects newly completed transactions from IdleStatus deltas.
 * - ProcessOfflineStatusAsync(): Preserves authorization when an active transaction still exists.
 */
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Services;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;
using FMS.Domain.Entities.PTS.PTSStatus.PumpStatus;

namespace FMS.Application.Features.PTS.Services
{
    public interface IUploadStatusPumpStatusProcessingService
    {
        Task ProcessAsync(string deviceId, PumpStatus pumpStatus);
    }

    public class UploadStatusPumpStatusProcessingService : IUploadStatusPumpStatusProcessingService
    {
        private readonly ILogger<UploadStatusPumpStatusProcessingService> _logger;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IDatabase _redisDb;
        private readonly IAutoTransactionCompletionService _autoCompletionService;
        private readonly ITransactionContextService _transactionContextService;
        private readonly IUploadStatusEndOfTransactionService _endOfTransactionService;

        public UploadStatusPumpStatusProcessingService(
            ILogger<UploadStatusPumpStatusProcessingService> logger,
            IAuthorizationStateTracker authTracker,
            IConnectionMultiplexer redisConnection,
            IAutoTransactionCompletionService autoCompletionService,
            ITransactionContextService transactionContextService,
            IUploadStatusEndOfTransactionService endOfTransactionService)
        {
            _logger = logger;
            _authTracker = authTracker;
            _redisDb = redisConnection.GetDatabase();
            _autoCompletionService = autoCompletionService;
            _transactionContextService = transactionContextService;
            _endOfTransactionService = endOfTransactionService;
        }

        public async Task ProcessAsync(string deviceId, PumpStatus pumpStatus)
        {
            _logger.LogTrace("[Internal] Processing Pump Status for {DeviceId}", deviceId);

            if (pumpStatus?.IdleStatus != null)
            {
                await ProcessIdleStatusAsync(deviceId, pumpStatus.IdleStatus);
            }

            if (pumpStatus?.FillingStatus != null)
            {
                await ProcessFillingStatusAsync(deviceId, pumpStatus.FillingStatus);
            }

            if (pumpStatus?.EndOfTransactionStatus != null)
            {
                await ProcessEndOfTransactionStatusAsync(deviceId, pumpStatus.EndOfTransactionStatus);
                await _endOfTransactionService.ProcessAsync(deviceId, pumpStatus.EndOfTransactionStatus);
            }

            if (pumpStatus?.OfflineStatus != null)
            {
                await ProcessOfflineStatusAsync(deviceId, pumpStatus.OfflineStatus);
            }
        }

        private async Task ProcessOfflineStatusAsync(string deviceId, PumpOfflineStatus offlineStatus)
        {
            if (offlineStatus.Ids == null || !offlineStatus.Ids.Any())
            {
                return;
            }

            foreach (var pumpIdNullable in offlineStatus.Ids)
            {
                if (!pumpIdNullable.HasValue)
                {
                    continue;
                }

                var pumpId = pumpIdNullable.Value;

                try
                {
                    var hasActiveTransaction = await CheckForActiveTransactionOnPumpAsync(deviceId, pumpId);
                    if (hasActiveTransaction)
                    {
                        _logger.LogWarning(
                            "[UploadStatus] PRESERVING AUTH - Pump {PumpId} on Device {DeviceId} reported offline but has active transaction. Authorization context is preserved.",
                            pumpId,
                            deviceId);
                        continue;
                    }

                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation(
                        "[Internal] Cleared auth for offline Pump {PumpId} on Device {DeviceId} (no active transaction)",
                        pumpId,
                        deviceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing offline status for Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                }
            }
        }

        private async Task<bool> CheckForActiveTransactionOnPumpAsync(string deviceId, int pumpId)
        {
            try
            {
                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                if (authState != null
                    && !string.IsNullOrEmpty(authState.Status)
                    && (authState.Status == "Authorized" || authState.Status == "InProgress" || authState.Status == "Monitoring"))
                {
                    _logger.LogDebug(
                        "[UploadStatus] Found active auth state for {DeviceId}:{PumpId}: Status={Status}, TransactionId={TransactionId}",
                        deviceId,
                        pumpId,
                        authState.Status,
                        authState.TransactionId);
                    return true;
                }

                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                var keys = server.Keys(pattern: $"device:{deviceId}:transaction:*", pageSize: 10);

                foreach (var key in keys)
                {
                    var contextJson = await _redisDb.StringGetAsync(key);
                    if (contextJson.IsNullOrEmpty)
                    {
                        continue;
                    }

                    try
                    {
                        var context = JsonSerializer.Deserialize<JsonElement>(contextJson!);
                        if (context.TryGetProperty("PumpId", out var pumpProperty) && pumpProperty.GetInt32() == pumpId)
                        {
                            _logger.LogDebug(
                                "[UploadStatus] Found active transaction context for {DeviceId}:{PumpId} in Redis key {Key}",
                                deviceId,
                                pumpId,
                                key);
                            return true;
                        }
                    }
                    catch
                    {
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "[UploadStatus] Error checking for active transaction on {DeviceId}:{PumpId}, assuming active to be safe",
                    deviceId,
                    pumpId);
                return true;
            }
        }

        private async Task ProcessIdleStatusAsync(string deviceId, IdleStatus idleStatus)
        {
            if (idleStatus.Ids == null || !idleStatus.Ids.Any())
            {
                return;
            }

            _logger.LogDebug(
                "[UploadStatus] IDLE ANALYSIS - Processing IdleStatus for device {DeviceId} with {Count} pumps",
                deviceId,
                idleStatus.Ids.Count);

            for (int i = 0; i < idleStatus.Ids.Count; i++)
            {
                var pumpIdNullable = idleStatus.Ids[i];
                if (!pumpIdNullable.HasValue)
                {
                    continue;
                }

                if (idleStatus.LastTransactions?.Count <= i
                    || idleStatus.LastVolumes?.Count <= i
                    || idleStatus.LastAmounts?.Count <= i)
                {
                    continue;
                }

                var transactionId = idleStatus.LastTransactions[i];
                var volume = idleStatus.LastVolumes[i];
                var amount = idleStatus.LastAmounts[i];

                if (transactionId > 0 && (volume > 0 || amount > 0))
                {
                    await CheckIfTransactionJustCompletedAsync(deviceId, pumpIdNullable.Value, transactionId, volume, amount);
                }
            }
        }

        private async Task CheckIfTransactionJustCompletedAsync(string deviceId, int pumpId, int transactionId, decimal volume, decimal amount)
        {
            try
            {
                var lastIdleKey = $"device:{deviceId}:pump:{pumpId}:last_idle";
                var lastIdleJson = await _redisDb.StringGetAsync(lastIdleKey);
                var isNewCompletion = IsNewIdleCompletion(lastIdleJson, transactionId, volume, amount, deviceId, pumpId);

                if (isNewCompletion)
                {
                    var alreadySavedKey = $"autocompletion:saved:{deviceId}:{transactionId}";
                    var alreadySaved = await _redisDb.KeyExistsAsync(alreadySavedKey);

                    if (!alreadySaved)
                    {
                        await ProcessIdleCompletionAsync(deviceId, pumpId, transactionId, volume, amount);
                    }
                    else
                    {
                        _logger.LogInformation(
                            "[UploadStatus] IDLE SKIP SAVED - Transaction already saved. Skipping IdleStatus completion for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}",
                            deviceId,
                            pumpId,
                            transactionId);
                    }
                }

                await CacheLatestIdleSnapshotAsync(lastIdleKey, transactionId, volume, amount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] IDLE ERROR - Error checking transaction completion via IdleStatus for {DeviceId}:{PumpId}", deviceId, pumpId);
            }
        }

        private bool IsNewIdleCompletion(RedisValue lastIdleJson, int transactionId, decimal volume, decimal amount, string deviceId, int pumpId)
        {
            if (lastIdleJson.IsNullOrEmpty)
            {
                return true;
            }

            try
            {
                var lastIdle = JsonSerializer.Deserialize<JsonElement>(lastIdleJson!);
                var lastTransactionId = lastIdle.TryGetProperty("LastTransaction", out var transProp) ? transProp.GetInt32() : 0;
                var lastVolume = lastIdle.TryGetProperty("LastVolume", out var volumeProp) ? volumeProp.GetDecimal() : 0;
                var lastAmount = lastIdle.TryGetProperty("LastAmount", out var amountProp) ? amountProp.GetDecimal() : 0;

                var isNewCompletion = transactionId != lastTransactionId
                    || Math.Abs(volume - lastVolume) > 0.01m
                    || Math.Abs(amount - lastAmount) > 0.01m;

                if (isNewCompletion)
                {
                    _logger.LogInformation(
                        "[UploadStatus] IDLE CHANGE - Transaction completion detected via IdleStatus change for Device {DeviceId}, Pump {PumpId}",
                        deviceId,
                        pumpId);
                }

                return isNewCompletion;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Error parsing last idle status for {DeviceId}:{PumpId}", deviceId, pumpId);
                return true;
            }
        }

        private async Task ProcessIdleCompletionAsync(string deviceId, int pumpId, int transactionId, decimal volume, decimal amount)
        {
            var completionFingerprint = $"{transactionId}:{volume:0.###}:{amount:0.###}";
            var completionDedupeKey = $"device:{deviceId}:pump:{pumpId}:idle:completion:{completionFingerprint}";
            var dedupeRegistered = await _redisDb.StringSetAsync(
                completionDedupeKey,
                DateTime.UtcNow.ToString("o"),
                expiry: TimeSpan.FromMinutes(2),
                when: When.NotExists);

            if (!dedupeRegistered)
            {
                _logger.LogInformation(
                    "[UploadStatus] IDLE DEDUPE - Skipping duplicate IdleStatus completion for Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, Volume {Volume}, Amount {Amount}",
                    deviceId,
                    pumpId,
                    transactionId,
                    volume,
                    amount);
                return;
            }

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

            var transactionContext = await _transactionContextService.GetTransactionContextAsync(deviceId, transactionId);
            if (transactionContext != null)
            {
                if (transactionContext.IsTransferMode)
                {
                    var transferStatusData = new JObject
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
                        ["Nozzle"] = transactionContext.Nozzle,
                        ["FuelGradeId"] = transactionContext.FuelGradeId,
                        ["FuelGradeName"] = transactionContext.FuelGradeName,
                        ["DetectedVia"] = "IdleStatus",
                        ["CompletionSource"] = "LastTransactionData"
                    };

                    _logger.LogInformation(
                        "[UploadStatus] IDLE TRANSFER PAYLOAD - Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, SourceTank {SourceTankId}, DestinationTank {DestinationTankId}, Volume {Volume}, Nozzle {Nozzle}, FuelGradeId {FuelGradeId}, FuelGrade {FuelGradeName}, AutoCloseTransaction {AutoCloseTransaction}, ConnectionType '{ConnectionType}'",
                        deviceId,
                        pumpId,
                        transactionId,
                        transactionContext.SourceTankId,
                        transactionContext.DestinationTankId,
                        volume,
                        transactionContext.Nozzle,
                        transactionContext.FuelGradeId,
                        transactionContext.FuelGradeName,
                        transactionContext.AutoCloseTransaction,
                        transactionContext.ConnectionType);

                    QueueAutoCompletion(deviceId, pumpId, transactionId, transferStatusData);
                    return;
                }

                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                statusData["TankId"] = transactionContext.TankId;
                statusData["VehicleId"] = transactionContext.VehicleId;
                statusData["Tag"] = authState?.TagId ?? transactionContext.Tag;
                statusData["Nozzle"] = authState?.NozzleId ?? transactionContext.Nozzle;
                statusData["ConnectionType"] = transactionContext.ConnectionType;
                statusData["AutoCloseTransaction"] = transactionContext.AutoCloseTransaction;

                await EnrichFuelGradeFromLastStatusAsync(deviceId, statusData);
            }
            else
            {
                _logger.LogWarning(
                    "[UploadStatus] NO CONTEXT - No Redis context found for IdleStatus completion {DeviceId}:{TransactionId} - transaction may be external or context expired",
                    deviceId,
                    transactionId);

                var fallbackAuthState = await _authTracker.GetAuthorizationState(deviceId, pumpId);
                if (fallbackAuthState?.NozzleId is > 0)
                {
                    statusData["Nozzle"] = fallbackAuthState.NozzleId;
                }

                if (!string.IsNullOrWhiteSpace(fallbackAuthState?.TagId))
                {
                    statusData["Tag"] = fallbackAuthState.TagId;
                }

                await EnrichFuelGradeFromLastStatusAsync(deviceId, statusData);
            }

            QueueAutoCompletion(deviceId, pumpId, transactionId, statusData);
        }

        private async Task EnrichFuelGradeFromLastStatusAsync(string deviceId, JObject statusData)
        {
            try
            {
                var lastStatusJson = await _redisDb.StringGetAsync($"device:{deviceId}:status");
                if (lastStatusJson.IsNullOrEmpty)
                {
                    return;
                }

                var lastStatus = JsonSerializer.Deserialize<JsonElement>(lastStatusJson!);
                if (!lastStatus.TryGetProperty("FuelGrades", out var fuelGradesElement)
                    || fuelGradesElement.ValueKind != JsonValueKind.Array)
                {
                    return;
                }

                var fuelGrades = fuelGradesElement.EnumerateArray().ToList();
                if (fuelGrades.Count == 0)
                {
                    return;
                }

                var firstGrade = fuelGrades[0];
                if (statusData["FuelGradeId"] == null && firstGrade.TryGetProperty("Id", out var gradeIdProp))
                {
                    statusData["FuelGradeId"] = gradeIdProp.GetInt32();
                }

                if (statusData["FuelGradeName"] == null && firstGrade.TryGetProperty("Name", out var gradeNameProp))
                {
                    statusData["FuelGradeName"] = gradeNameProp.GetString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not extract fuel grade info for IdleStatus completion on {DeviceId}", deviceId);
            }
        }

        private void QueueAutoCompletion(string deviceId, int pumpId, int transactionId, JObject statusData)
        {
            _logger.LogInformation(
                "[UploadStatus] IDLE AUTO-COMPLETE QUEUED - Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, IsTransferMode {IsTransferMode}, TankId {TankId}, DestinationTankId {DestinationTankId}, VehicleId {VehicleId}, AutoCloseTransaction {AutoCloseTransaction}, ConnectionType '{ConnectionType}', CompletionSource '{CompletionSource}'",
                deviceId,
                pumpId,
                transactionId,
                statusData.Value<bool?>("IsTransferMode") ?? false,
                statusData.Value<int?>("TankId"),
                statusData.Value<int?>("DestinationTankId"),
                statusData.Value<int?>("VehicleId"),
                statusData.Value<bool?>("AutoCloseTransaction") ?? false,
                statusData.Value<string>("ConnectionType") ?? string.Empty,
                statusData.Value<string>("CompletionSource") ?? string.Empty);

            _ = Task.Run(async () =>
            {
                try
                {
                    await _autoCompletionService.ProcessEndOfTransactionAsync(deviceId, pumpId, transactionId, statusData);

                    _logger.LogInformation(
                        "[UploadStatus] IDLE AUTO-COMPLETE INVOCATION FINISHED - Device {DeviceId}, Pump {PumpId}, Transaction {TransactionId}, IsTransferMode {IsTransferMode}",
                        deviceId,
                        pumpId,
                        transactionId,
                        statusData.Value<bool?>("IsTransferMode") ?? false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[UploadStatus] IDLE FAILED - IdleStatus-based completion failed for {DeviceId}:{TransactionId}", deviceId, transactionId);
                }
            });
        }

        private async Task CacheLatestIdleSnapshotAsync(string lastIdleKey, int transactionId, decimal volume, decimal amount)
        {
            var currentIdleData = new
            {
                LastTransaction = transactionId,
                LastVolume = volume,
                LastAmount = amount,
                UpdateTime = DateTime.UtcNow
            };

            await _redisDb.StringSetAsync(lastIdleKey, JsonSerializer.Serialize(currentIdleData), TimeSpan.FromMinutes(30));
        }

        private async Task ProcessFillingStatusAsync(string deviceId, FillingStatus fillingStatus)
        {
            if (fillingStatus.Ids == null)
            {
                return;
            }

            for (int i = 0; i < fillingStatus.Ids.Count; i++)
            {
                var pumpIdNullable = fillingStatus.Ids[i];
                if (!pumpIdNullable.HasValue)
                {
                    continue;
                }

                var pumpId = pumpIdNullable.Value;
                if (pumpId < 1 || pumpId > 50)
                {
                    continue;
                }

                try
                {
                    await _authTracker.UpdateAuthState(deviceId, pumpId, "InProgress");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing filling status for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }

        private async Task ProcessEndOfTransactionStatusAsync(string deviceId, EndOfTransactionStatus eotStatus)
        {
            if (eotStatus.Ids == null)
            {
                return;
            }

            foreach (var pumpIdNullable in eotStatus.Ids)
            {
                if (!pumpIdNullable.HasValue)
                {
                    continue;
                }

                var pumpId = pumpIdNullable.Value;
                try
                {
                    await _authTracker.ClearAuthorization(deviceId, pumpId);
                    _logger.LogInformation("[Internal] Cleared auth for EOT on Pump {PumpId} on Device {DeviceId}", pumpId, deviceId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Internal] Error processing end of transaction for pump {PumpId} on device {DeviceId}", pumpId, deviceId);
                }
            }
        }
    }
}