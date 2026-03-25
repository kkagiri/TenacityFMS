/**
 * File: CalibrationExtractionTriggerHandler.cs
 * Purpose: Automatically triggers calibration data-point extraction when a pump transaction completes
 *          or an in-tank delivery is detected.  Both handlers are fire-and-forget safe (wrapped in
 *          try/catch) so failures never disrupt the originating pipeline.
 * Dependencies: ICalibrationLearningService, ISystemConfigurationService, GpsdataContext, MediatR
 * Last Modified: 2026-02-10
 *
 * Key Handlers:
 * - TransactionCompletedEvent  → resolves tankId from the transaction, calls ExtractDataPointsFromDispensingAsync
 * - InTankDeliveryCompletedNotification → calls ExtractDataPointsFromDeliveriesAsync
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Events.Pump;
using FMS.Application.Features.TankManagement.TankCalibration.Services;
using FMS.Application.Services.Configuration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Events
{
    /// <summary>
    /// Triggers calibration extraction after a pump transaction is saved.
    /// </summary>
    public class CalibrationDispensingTriggerHandler : INotificationHandler<TransactionCompletedEvent>
    {
        private readonly GpsdataContext _context;
        private readonly ICalibrationLearningService _calibrationService;
        private readonly ISystemConfigurationService _configService;
        private readonly ILogger<CalibrationDispensingTriggerHandler> _logger;

        public CalibrationDispensingTriggerHandler(
            GpsdataContext context,
            ICalibrationLearningService calibrationService,
            ISystemConfigurationService configService,
            ILogger<CalibrationDispensingTriggerHandler> logger)
        {
            _context = context;
            _calibrationService = calibrationService;
            _configService = configService;
            _logger = logger;
        }

        public async Task Handle(TransactionCompletedEvent notification, CancellationToken cancellationToken)
        {
            try
            {
                var enabled = await _configService.GetCalibrationLearningEnabledAsync(cancellationToken);
                if (!enabled) return;

                // Resolve tankId from the persisted transaction
                var transaction = await _context.Pumptransactions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == notification.TrasactionId, cancellationToken);

                if (transaction?.TankId is not int tankId)
                {
                    _logger.LogDebug("Calibration trigger skipped — transaction {Id} has no TankId", notification.TrasactionId);
                    return;
                }

                // Extract data points for a narrow window around the transaction
                var windowStart = transaction.DateTimeStart.HasValue && transaction.DateTimeStart.Value != default
                    ? transaction.DateTimeStart.Value.AddMinutes(-10)
                    : transaction.DateTime.AddMinutes(-30);
                var windowEnd = transaction.DateTime.AddMinutes(10);

                var points = await _calibrationService.ExtractDataPointsFromDispensingAsync(
                    tankId, windowStart, windowEnd, cancellationToken);

                _logger.LogInformation(
                    "Calibration auto-extraction (dispensing): tank {TankId}, transaction {TxId} → {Count} data points",
                    tankId, notification.TrasactionId, points.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Calibration extraction failed for TransactionCompletedEvent (TxId={TxId})",
                    notification.TrasactionId);
            }
        }
    }

    /// <summary>
    /// Triggers calibration extraction after a server-side delivery is detected.
    /// </summary>
    public class CalibrationDeliveryTriggerHandler : INotificationHandler<InTankDeliveryCompletedNotification>
    {
        private readonly GpsdataContext _context;
        private readonly ICalibrationLearningService _calibrationService;
        private readonly ISystemConfigurationService _configService;
        private readonly ILogger<CalibrationDeliveryTriggerHandler> _logger;

        public CalibrationDeliveryTriggerHandler(
            GpsdataContext context,
            ICalibrationLearningService calibrationService,
            ISystemConfigurationService configService,
            ILogger<CalibrationDeliveryTriggerHandler> logger)
        {
            _context = context;
            _calibrationService = calibrationService;
            _configService = configService;
            _logger = logger;
        }

        public async Task Handle(InTankDeliveryCompletedNotification notification, CancellationToken cancellationToken)
        {
            try
            {
                var enabled = await _configService.GetCalibrationLearningEnabledAsync(cancellationToken);
                if (!enabled) return;

                // Use a window around the delivery detection time
                var delivery = await _context.Intankdeliveries
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DeliveryId == notification.DeliveryId, cancellationToken);

                if (delivery == null)
                {
                    _logger.LogDebug("Calibration trigger skipped — delivery {Id} not found", notification.DeliveryId);
                    return;
                }

                var windowStart = (delivery.StartDateTime ?? notification.DetectedAtUtc.AddMinutes(-60)).AddMinutes(-10);
                var windowEnd = (delivery.EndDateTime ?? notification.DetectedAtUtc).AddMinutes(10);

                var points = await _calibrationService.ExtractDataPointsFromDeliveriesAsync(
                    notification.TankId, windowStart, windowEnd, cancellationToken);

                _logger.LogInformation(
                    "Calibration auto-extraction (delivery): tank {TankId}, delivery {DeliveryId} → {Count} data points",
                    notification.TankId, notification.DeliveryId, points.Count);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Calibration extraction failed for InTankDeliveryCompletedNotification (DeliveryId={DeliveryId})",
                    notification.DeliveryId);
            }
        }
    }
}
