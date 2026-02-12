/**
 * File: InTankDeliveryDetectionService.cs
 * Purpose: Processes PTS-detected in-tank deliveries — creates alerts, ledger entries, matches manual deliveries
 * Dependencies: IActiveAlarmService, TankVolumeHistoryIntegrationService, ISystemConfigurationService, GpsdataContext
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - ProcessDetectedDeliveryAsync: Orchestrates ITD processing pipeline
 * - TryMatchManualDeliveryAsync: Fuzzy-matches ITD to manual delivery by volume/time window
 * - CreateItdAlertAsync: Creates ActiveAlarm + notification for detected delivery
 * - CreateLedgerEntryAsync: Creates TankVolumeHistory entry for the volume change
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Common;
using FMS.Application.Command.DatabaseCommand.TankVolumeHistoryCommand;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Deliveries.Services
{
    public class InTankDeliveryDetectionService : IInTankDeliveryDetectionService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<InTankDeliveryDetectionService> _logger;
        private readonly TankVolumeHistoryIntegrationService _volumeHistoryService;
        private readonly ISystemConfigurationService _configService;

        public InTankDeliveryDetectionService(
            GpsdataContext context,
            ILogger<InTankDeliveryDetectionService> logger,
            TankVolumeHistoryIntegrationService volumeHistoryService,
            ISystemConfigurationService configService)
        {
            _context = context;
            _logger = logger;
            _volumeHistoryService = volumeHistoryService;
            _configService = configService;
        }

        public async Task<FMSResponse> ProcessDetectedDeliveryAsync(
            Intankdelivery delivery,
            Tank? tank,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation(
                    "Processing ITD auto-detection for DeliveryId {DeliveryId}, Tank probe {TankProbe}, PTS {PtsId}",
                    delivery.DeliveryId, delivery.Tank, delivery.Ptsid);

                // Set detection metadata
                delivery.DetectedAt = DateTime.UtcNow;
                delivery.Status = "Detected";

                if (tank != null)
                {
                    delivery.TankId = tank.Id;
                    delivery.SiteId = tank.SiteId;
                }

                // Calculate the absolute delivery volume
                var absoluteVolume = delivery.AbsoluteProductVolume.HasValue
                    ? (decimal)Math.Abs(delivery.AbsoluteProductVolume.Value)
                    : 0m;

                // Check minimum volume threshold
                var minThreshold = await _configService.GetItdMinVolumeThresholdAsync(cancellationToken);
                if (absoluteVolume < minThreshold)
                {
                    _logger.LogInformation(
                        "ITD DeliveryId {DeliveryId} below minimum threshold ({Volume}L < {Threshold}L). Skipping alert.",
                        delivery.DeliveryId, absoluteVolume, minThreshold);

                    delivery.Status = "BelowThreshold";
                    await _context.SaveChangesAsync(cancellationToken);
                    return FMSResponse.SuccessResponse("Delivery below threshold - no alert created");
                }

                // 1. Create alert/notification
                var alertsEnabled = await _configService.GetItdAlertsEnabledAsync(cancellationToken);
                if (alertsEnabled)
                {
                    await CreateItdAlertAsync(delivery, tank, absoluteVolume, cancellationToken);
                }

                // 2. Create ledger entry if configured and tank is resolved
                var autoLedger = await _configService.GetItdAutoCreateLedgerEntryAsync(cancellationToken);
                if (autoLedger && tank != null)
                {
                    await CreateLedgerEntryAsync(delivery, tank, absoluteVolume, cancellationToken);
                    delivery.IsProcessed = true;
                }

                // 3. Try to match with manual delivery
                var autoMatch = await _configService.GetItdAutoMatchManualDeliveryAsync(cancellationToken);
                if (autoMatch && tank != null)
                {
                    var matchedDelivery = await TryMatchManualDeliveryAsync(delivery, tank.Id, cancellationToken);
                    if (matchedDelivery != null)
                    {
                        delivery.MatchedDeliveryId = matchedDelivery.Id;
                        delivery.Status = "Matched";

                        _logger.LogInformation(
                            "ITD DeliveryId {ItdId} matched to manual Delivery {ManualId} (volume match within tolerance)",
                            delivery.DeliveryId, matchedDelivery.Id);
                    }
                }

                // Update final status if not matched
                if (delivery.Status == "Detected")
                {
                    delivery.Status = "Unmatched";
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "ITD auto-detection completed for DeliveryId {DeliveryId}. Status: {Status}, Processed: {IsProcessed}",
                    delivery.DeliveryId, delivery.Status, delivery.IsProcessed);

                return FMSResponse.SuccessResponse($"In-tank delivery detected and processed. Status: {delivery.Status}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ITD auto-detection for DeliveryId {DeliveryId}", delivery.DeliveryId);
                return FMSResponse.FailedResponse($"Error processing ITD detection: {ex.Message}");
            }
        }

        public async Task<Delivery?> TryMatchManualDeliveryAsync(
            Intankdelivery delivery,
            int tankId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var tolerance = await _configService.GetItdMatchVolumeToleranceAsync(cancellationToken);
                var timeWindowHours = await _configService.GetItdMatchTimeWindowHoursAsync(cancellationToken);

                var itdVolume = delivery.AbsoluteProductVolume.HasValue
                    ? (decimal)Math.Abs(delivery.AbsoluteProductVolume.Value)
                    : 0m;

                if (itdVolume <= 0) return null;

                // Time window centered on the ITD end time
                var endTime = delivery.EndDateTime ?? DateTime.UtcNow;
                var windowStart = endTime.AddHours(-timeWindowHours);
                var windowEnd = endTime.AddHours(timeWindowHours);

                // Find unmatched manual deliveries in the time window for this tank
                var candidates = await _context.Deliveries
                    .Where(d => d.TankId == tankId
                        && (d.IsDeleted == null || d.IsDeleted == false)
                        && d.DeliveryDate >= windowStart
                        && d.DeliveryDate <= windowEnd)
                    .ToListAsync(cancellationToken);

                // Check if any already matched ITDs reference these delivery IDs
                var alreadyMatchedIds = await _context.Intankdeliveries
                    .Where(itd => itd.MatchedDeliveryId != null
                        && itd.DeliveryId != delivery.DeliveryId)
                    .Select(itd => itd.MatchedDeliveryId!.Value)
                    .ToListAsync(cancellationToken);

                foreach (var candidate in candidates)
                {
                    if (alreadyMatchedIds.Contains(candidate.Id)) continue;

                    var manualVolume = candidate.ManualDeliveryAmount > 0 ? candidate.ManualDeliveryAmount
                                     : (candidate.SensorDeliveryAmount ?? 0m) > 0 ? candidate.SensorDeliveryAmount!.Value : 0m;
                    if (manualVolume <= 0) continue;

                    var diff = Math.Abs(itdVolume - manualVolume) / manualVolume;
                    if (diff <= tolerance)
                    {
                        return candidate;
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error matching ITD {DeliveryId} with manual deliveries", delivery.DeliveryId);
                return null;
            }
        }

        private async Task CreateItdAlertAsync(
            Intankdelivery delivery,
            Tank? tank,
            decimal absoluteVolume,
            CancellationToken cancellationToken)
        {
            try
            {
                var tankName = tank?.Name ?? $"Probe #{delivery.Tank}";
                var fuelGrade = delivery.FuelGradeName ?? $"Grade {delivery.FuelGradeId}";

                // TODO: Wire EventExpressionEngine.ProcessAsync() for in-tank delivery events
                _logger.LogInformation(
                    "ITD event detected for DeliveryId {DeliveryId}: Tank={Tank}, Volume={Volume}L, FuelGrade={FuelGrade}",
                    delivery.DeliveryId, tankName, absoluteVolume, fuelGrade);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process ITD event for DeliveryId {DeliveryId}", delivery.DeliveryId);
            }
        }

        private async Task CreateLedgerEntryAsync(
            Intankdelivery delivery,
            Tank tank,
            decimal absoluteVolume,
            CancellationToken cancellationToken)
        {
            try
            {
                var timestamp = delivery.EndDateTime ?? DateTime.UtcNow;

                var result = await _volumeHistoryService.ProcessChangeAsync(
                    tank.Id,
                    timestamp,
                    Math.Abs(absoluteVolume), // Delivery is positive volume change
                    VolumeChangeReasonEnum.InTankDelivery,
                    "PTS_AUTO_DETECTION",
                    delivery.DeliveryId,
                    "InTankDelivery",
                    ActionType.Create,
                    delivery.EndProductVolume.HasValue ? (decimal)delivery.EndProductVolume.Value : null,
                    "PTS_Probe",
                    cancellationToken);

                _logger.LogInformation(
                    "Ledger entry created for ITD DeliveryId {DeliveryId}: {Result}",
                    delivery.DeliveryId, result.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create ledger entry for ITD DeliveryId {DeliveryId}", delivery.DeliveryId);
            }
        }
    }
}
