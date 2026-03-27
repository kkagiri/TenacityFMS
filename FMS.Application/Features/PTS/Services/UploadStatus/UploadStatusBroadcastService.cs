/**
 * File: UploadStatusBroadcastService.cs
 * Purpose: Broadcasts UploadStatus packets over SignalR and enriches active pumps with fueling context.
 * Dependencies: SignalR, Redis transaction context, PumpFuelingContext, UploadStatus
 * Last Modified: 2026-03-27
 *
 * Key Functions:
 * - BroadcastAsync(): Sends the full UploadStatus payload plus active fueling context to connected clients.
 * - GetFuelingContextFromRedisAsync(): Resolves active pump business context from cached transaction metadata.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication.SignalR;
using FMS.Domain.Entities.PTS.PTSStatus;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTS.Services
{
    public interface IUploadStatusBroadcastService
    {
        Task BroadcastAsync(string deviceId, UploadStatus status, CancellationToken cancellationToken = default);
    }

    public class UploadStatusBroadcastService : IUploadStatusBroadcastService
    {
        private readonly ILogger<UploadStatusBroadcastService> _logger;
        private readonly IHubContext<PTSHub> _hubContext;
        private readonly ITransactionContextService _transactionContextService;

        public UploadStatusBroadcastService(
            ILogger<UploadStatusBroadcastService> logger,
            IHubContext<PTSHub> hubContext,
            ITransactionContextService transactionContextService)
        {
            _logger = logger;
            _hubContext = hubContext;
            _transactionContextService = transactionContextService;
        }

        public async Task BroadcastAsync(string deviceId, UploadStatus status, CancellationToken cancellationToken = default)
        {
            try
            {
                var fuelingContexts = await GetActivePumpFuelingContextsAsync(deviceId, status, cancellationToken);

                var statusUpdate = new
                {
                    deviceId,
                    timestamp = DateTime.UtcNow,
                    status = new
                    {
                        configurationId = status.ConfigurationId,
                        dateTime = status.DateTime,
                        firmwareDateTime = status.FirmwareDateTime,
                        startupSeconds = status.StartupSeconds,
                        batteryVoltage = status.BatteryVoltage,
                        cpuTemperature = status.CpuTemperature,
                        ptsPowerDownDetected = status.PtsPowerDownDetected,
                        sdMounted = status.SdMounted,
                        pumps = status.Pumps,
                        probes = status.Probes,
                        readers = status.Readers,
                        fuelGrades = status.FuelGrades
                    },
                    fuelingContexts
                };

                await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", statusUpdate, cancellationToken);

                _logger.LogDebug(
                    "[Broadcast] Sent UploadStatusUpdate for {DeviceId} with {ContextCount} fueling contexts",
                    deviceId,
                    fuelingContexts.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting upload status update for device {DeviceId}", deviceId);
            }
        }

        private async Task<List<PumpFuelingContext>> GetActivePumpFuelingContextsAsync(
            string deviceId,
            UploadStatus status,
            CancellationToken cancellationToken)
        {
            var contexts = new List<PumpFuelingContext>();

            try
            {
                if (status?.Pumps == null)
                {
                    return contexts;
                }

                var fillingPumps = CollectPumpTransactions(
                    status.Pumps.FillingStatus?.Ids,
                    status.Pumps.FillingStatus?.Transactions);

                var eotPumps = CollectPumpTransactions(
                    status.Pumps.EndOfTransactionStatus?.Ids,
                    status.Pumps.EndOfTransactionStatus?.Transactions,
                    fillingPumps.Keys);

                var allActivePumps = fillingPumps.Concat(eotPumps).ToList();
                var contextTasks = allActivePumps
                    .Select(pump => GetFuelingContextFromRedisAsync(deviceId, pump.Value, pump.Key, cancellationToken))
                    .ToList();

                var resolvedContexts = await Task.WhenAll(contextTasks);
                contexts.AddRange(resolvedContexts.Where(context => context != null)!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fueling contexts for device {DeviceId}", deviceId);
            }

            return contexts;
        }

        private static Dictionary<int, int> CollectPumpTransactions(
            IList<int?>? pumpIds,
            IList<int>? transactionIds,
            IEnumerable<int>? skipPumpIds = null)
        {
            var result = new Dictionary<int, int>();
            var skipSet = skipPumpIds != null ? new HashSet<int>(skipPumpIds) : null;

            if (pumpIds == null || transactionIds == null)
            {
                return result;
            }

            for (int i = 0; i < pumpIds.Count; i++)
            {
                var pumpId = pumpIds[i];
                var transactionId = transactionIds.Count > i ? transactionIds[i] : 0;
                if (!pumpId.HasValue || transactionId <= 0)
                {
                    continue;
                }

                if (skipSet != null && skipSet.Contains(pumpId.Value))
                {
                    continue;
                }

                result[pumpId.Value] = transactionId;
            }

            return result;
        }

        private async Task<PumpFuelingContext?> GetFuelingContextFromRedisAsync(
            string deviceId,
            int transactionId,
            int pumpId,
            CancellationToken cancellationToken)
        {
            var transactionContext = await _transactionContextService.GetTransactionContextAsync(deviceId, transactionId);
            if (transactionContext == null)
            {
                _logger.LogWarning(
                    "[UploadStatus] NO REDIS CONTEXT found for device {DeviceId}, transaction {TransactionId} - authorization context may have expired",
                    deviceId,
                    transactionId);
                return null;
            }

            cancellationToken.ThrowIfCancellationRequested();

            var isTransferMode = transactionContext.IsTransferMode
                || transactionContext.SourceTankId.HasValue
                || transactionContext.DestinationTankId.HasValue;
            var tankId = transactionContext.TankId ?? transactionContext.SourceTankId;

            var mode = PumpOperationMode.Unknown;
            if (isTransferMode)
            {
                mode = PumpOperationMode.Transfer;
            }
            else if (transactionContext.VehicleId.HasValue && transactionContext.VehicleId > 0)
            {
                mode = PumpOperationMode.Vehicle;
            }
            else if (tankId.HasValue && tankId > 0)
            {
                mode = PumpOperationMode.Transfer;
            }

            var vehicleName = transactionContext.VehicleName;
            if (string.IsNullOrWhiteSpace(vehicleName) && transactionContext.VehicleId.HasValue && transactionContext.VehicleId > 0)
            {
                vehicleName = $"Vehicle {transactionContext.VehicleId}";
            }

            var tankName = transactionContext.TankName;
            if (string.IsNullOrWhiteSpace(tankName) && isTransferMode)
            {
                if (!string.IsNullOrWhiteSpace(transactionContext.SourceTankName)
                    && !string.IsNullOrWhiteSpace(transactionContext.DestinationTankName))
                {
                    tankName = $"{transactionContext.SourceTankName} -> {transactionContext.DestinationTankName}";
                }
                else
                {
                    tankName = transactionContext.SourceTankName ?? transactionContext.DestinationTankName;
                }
            }

            if (string.IsNullOrWhiteSpace(tankName) && tankId.HasValue && tankId > 0)
            {
                tankName = $"Tank {tankId}";
            }

            var userName = !string.IsNullOrWhiteSpace(transactionContext.UserName)
                ? transactionContext.UserName
                : transactionContext.UserId;

            return new PumpFuelingContext
            {
                PumpId = pumpId,
                TransactionId = transactionId,
                Mode = mode,
                VehicleId = transactionContext.VehicleId,
                VehicleName = vehicleName,
                TankId = tankId,
                TankName = tankName,
                FueledByUserId = transactionContext.UserId,
                FueledByUserName = userName,
                Tag = transactionContext.Tag,
                NozzleId = transactionContext.Nozzle,
                ConnectionType = transactionContext.ConnectionType,
                AutoCloseTransaction = transactionContext.AutoCloseTransaction,
                AuthorizedAt = transactionContext.AuthorizedAt,
                Odometer = transactionContext.Odometer
            };
        }
    }
}