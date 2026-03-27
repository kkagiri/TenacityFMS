/**
 * File: UploadStatusForcedCompletionService.cs
 * Purpose: Detects stale UploadStatus transactions and triggers synthetic completion when EOT is missing.
 * Dependencies: Redis, AuthorizationStateTracker, AutoTransactionCompletionService, TransactionContextService
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - GetActiveTransactionsAsync(): Enumerates active transaction contexts cached for a device.
 * - CheckForForcedCompletionAsync(): Evaluates timeout conditions before escalating to forced completion.
 * - ForceTransactionCompletionAsync(): Builds a synthetic completion payload and cleans up Redis/auth state.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Application.Services;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Features.PTS.Services
{
    public interface IUploadStatusForcedCompletionService
    {
        Task<List<(int PumpId, int TransactionId)>> GetActiveTransactionsAsync(string deviceId);
        Task CheckForForcedCompletionAsync(string deviceId, int pumpId, int transactionId);
    }

    public class UploadStatusForcedCompletionService : IUploadStatusForcedCompletionService
    {
        private readonly ILogger<UploadStatusForcedCompletionService> _logger;
        private readonly IDatabase _redisDb;
        private readonly IAuthorizationStateTracker _authTracker;
        private readonly IAutoTransactionCompletionService _autoCompletionService;
        private readonly ITransactionContextService _transactionContextService;

        public UploadStatusForcedCompletionService(
            ILogger<UploadStatusForcedCompletionService> logger,
            IConnectionMultiplexer redisConnection,
            IAuthorizationStateTracker authTracker,
            IAutoTransactionCompletionService autoCompletionService,
            ITransactionContextService transactionContextService)
        {
            _logger = logger;
            _redisDb = redisConnection.GetDatabase();
            _authTracker = authTracker;
            _autoCompletionService = autoCompletionService;
            _transactionContextService = transactionContextService;
        }

        public async Task<List<(int PumpId, int TransactionId)>> GetActiveTransactionsAsync(string deviceId)
        {
            var activeTransactions = new List<(int PumpId, int TransactionId)>();

            try
            {
                var server = _redisDb.Multiplexer.GetServer(_redisDb.Multiplexer.GetEndPoints()[0]);
                var keys = server.Keys(pattern: $"device:{deviceId}:transaction:*");

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
                        var pumpId = context.TryGetProperty("PumpId", out var pumpProp) ? pumpProp.GetInt32() : 0;
                        var transactionId = context.TryGetProperty("TransactionId", out var transactionProp) ? transactionProp.GetInt32() : 0;

                        if (pumpId > 0 && transactionId > 0)
                        {
                            activeTransactions.Add((pumpId, transactionId));
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Error parsing transaction context from key {Key}", key);
                    }
                }

                _logger.LogDebug(
                    "[UploadStatus] ACTIVE CHECK - Found {Count} active transactions for device {DeviceId}",
                    activeTransactions.Count,
                    deviceId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] ACTIVE ERROR - Error checking active transactions for device {DeviceId}", deviceId);
            }

            return activeTransactions;
        }

        public async Task CheckForForcedCompletionAsync(string deviceId, int pumpId, int transactionId)
        {
            try
            {
                var transactionContext = await _transactionContextService.GetTransactionContextAsync(deviceId, transactionId);
                if (transactionContext == null)
                {
                    _logger.LogDebug(
                        "[UploadStatus] NO CONTEXT - No transaction context found for {DeviceId}:{TransactionId}, may have been cleaned up",
                        deviceId,
                        transactionId);
                    return;
                }

                var timeoutMinutes = transactionContext.IsTransferMode ? 10.0 : 2.0;
                var elapsed = DateTime.UtcNow - transactionContext.StartTime;

                if (elapsed.TotalMinutes > timeoutMinutes)
                {
                    _logger.LogWarning(
                        "[UploadStatus] TIMEOUT DETECTED - {TransactionType} transaction {TransactionId} on device {DeviceId} running for {Minutes:F1} minutes (threshold: {Threshold}min) - forcing completion",
                        transactionContext.IsTransferMode ? "TRANSFER" : "VEHICLE",
                        transactionId,
                        deviceId,
                        elapsed.TotalMinutes,
                        timeoutMinutes);

                    await ForceTransactionCompletionAsync(
                        deviceId,
                        pumpId,
                        transactionId,
                        $"Timeout-{elapsed.TotalMinutes:F1}min-{(transactionContext.IsTransferMode ? "Transfer" : "Vehicle")}");
                }
                else
                {
                    _logger.LogDebug(
                        "[UploadStatus] PENDING - {TransactionType} transaction {TransactionId} on device {DeviceId} running for {Minutes:F1} minutes (threshold: {Threshold}min)",
                        transactionContext.IsTransferMode ? "TRANSFER" : "VEHICLE",
                        transactionId,
                        deviceId,
                        elapsed.TotalMinutes,
                        timeoutMinutes);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] FORCE ERROR - Error checking forced completion for {DeviceId}:{TransactionId}", deviceId, transactionId);
            }
        }

        private async Task ForceTransactionCompletionAsync(string deviceId, int pumpId, int transactionId, string reason)
        {
            try
            {
                _logger.LogWarning(
                    "[UploadStatus] FORCE COMPLETION - Forcing completion of transaction {TransactionId} on device {DeviceId}, reason: {Reason}",
                    transactionId,
                    deviceId,
                    reason);

                var (lastVolume, lastAmount, nozzleId, fuelGradeId, fuelGradeName) =
                    await GetLastKnownPumpValuesAsync(deviceId, pumpId);

                var transactionContext = await _transactionContextService.GetTransactionContextAsync(deviceId, transactionId);
                var authState = await _authTracker.GetAuthorizationState(deviceId, pumpId);

                var syntheticStatusData = new JObject
                {
                    ["Pump"] = pumpId,
                    ["Transaction"] = transactionId,
                    ["Volume"] = lastVolume ?? 0,
                    ["Amount"] = lastAmount ?? 0,
                    ["Nozzle"] = nozzleId,
                    ["FuelGradeId"] = fuelGradeId,
                    ["FuelGradeName"] = fuelGradeName,
                    ["TankId"] = transactionContext?.TankId,
                    ["VehicleId"] = transactionContext?.VehicleId,
                    ["Tag"] = authState?.TagId,
                    ["ConnectionType"] = transactionContext?.ConnectionType ?? "Unknown",
                    ["DateTime"] = DateTime.UtcNow,
                    ["ForcedCompletion"] = true,
                    ["CompletionReason"] = reason,
                    ["DetectedVia"] = "ForcedTimeout"
                };

                await _autoCompletionService.ProcessEndOfTransactionAsync(deviceId, pumpId, transactionId, syntheticStatusData);

                _logger.LogInformation(
                    "[UploadStatus] FORCE SUCCESS - Forced completion triggered for {DeviceId}:{TransactionId}",
                    deviceId,
                    transactionId);

                await _transactionContextService.RemoveTransactionContextAsync(deviceId, transactionId);
                await _authTracker.ClearAuthorization(deviceId, pumpId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus] FORCE ERROR - Error in forced completion for {DeviceId}:{TransactionId}", deviceId, transactionId);
            }
        }

        private async Task<(decimal? Volume, decimal? Amount, int? NozzleId, int? FuelGradeId, string? FuelGradeName)> GetLastKnownPumpValuesAsync(
            string deviceId,
            int pumpId)
        {
            decimal? lastVolume = null;
            decimal? lastAmount = null;
            int? nozzleId = null;
            int? fuelGradeId = null;
            string? fuelGradeName = null;

            var statusJson = await _redisDb.StringGetAsync($"device:{deviceId}:status");
            if (statusJson.IsNullOrEmpty)
            {
                return (lastVolume, lastAmount, nozzleId, fuelGradeId, fuelGradeName);
            }

            try
            {
                var lastStatus = JsonSerializer.Deserialize<JsonElement>(statusJson!);
                if (!lastStatus.TryGetProperty("Pumps", out var pumpsElement)
                    || !pumpsElement.TryGetProperty("IdleStatus", out var idleElement))
                {
                    return (lastVolume, lastAmount, nozzleId, fuelGradeId, fuelGradeName);
                }

                lastVolume = ReadPumpDecimalArrayValue(idleElement, "LastVolumes", pumpId);
                lastAmount = ReadPumpDecimalArrayValue(idleElement, "LastAmounts", pumpId);
                nozzleId = ReadPumpIntArrayValue(idleElement, "LastNozzles", pumpId);
                fuelGradeId = ReadPumpIntArrayValue(idleElement, "LastFuelGradeIds", pumpId);
                fuelGradeName = ReadPumpStringArrayValue(idleElement, "LastFuelGradeNames", pumpId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[UploadStatus] PARSE ERROR - Error parsing last status for forced completion, using default values");
            }

            return (lastVolume, lastAmount, nozzleId, fuelGradeId, fuelGradeName);
        }

        private static decimal? ReadPumpDecimalArrayValue(JsonElement parent, string propertyName, int pumpId)
        {
            if (!parent.TryGetProperty(propertyName, out var element) || element.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var values = element.EnumerateArray().ToList();
            return values.Count >= pumpId ? values[pumpId - 1].GetDecimal() : null;
        }

        private static int? ReadPumpIntArrayValue(JsonElement parent, string propertyName, int pumpId)
        {
            if (!parent.TryGetProperty(propertyName, out var element) || element.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var values = element.EnumerateArray().ToList();
            return values.Count >= pumpId ? values[pumpId - 1].GetInt32() : null;
        }

        private static string? ReadPumpStringArrayValue(JsonElement parent, string propertyName, int pumpId)
        {
            if (!parent.TryGetProperty(propertyName, out var element) || element.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var values = element.EnumerateArray().ToList();
            return values.Count >= pumpId ? values[pumpId - 1].GetString() : null;
        }
    }
}