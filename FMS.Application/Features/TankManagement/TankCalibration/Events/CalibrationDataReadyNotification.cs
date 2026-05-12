/**
 * File: CalibrationDataReadyNotification.cs
 * Purpose: Raises and handles informational readiness notifications when learned-calibration data accumulation crosses the recalculation threshold.
 * Dependencies: MediatR, INotificationService, notification DTOs/enums
 * Last Modified: 2026-03-24
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankCalibration.Events
{
    public sealed record CalibrationDataReadyNotification(
        int TankId,
        int NewPointCount,
        int UnprocessedPointCount,
        double CoveragePercentage,
        DateTime TriggeredAtUtc) : INotification;

    public class CalibrationDataReadyNotificationHandler : INotificationHandler<CalibrationDataReadyNotification>
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<CalibrationDataReadyNotificationHandler> _logger;

        public CalibrationDataReadyNotificationHandler(
            INotificationService notificationService,
            ILogger<CalibrationDataReadyNotificationHandler> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        public async Task Handle(CalibrationDataReadyNotification notification, CancellationToken cancellationToken)
        {
            try
            {
                var request = new CreateNotificationRequest
                {
                    Type = NotificationType.Info,
                    CategoryId = (int)WellKnownCategories.Generic,
                    Priority = NotificationPriority.Low,
                    Title = "Calibration Learning Data Ready",
                    Message = $"Tank {notification.TankId} now has {notification.UnprocessedPointCount} unprocessed learned-calibration data points. Coverage is {notification.CoveragePercentage:F1}% and recalculation is available.",
                    TriggerSource = "CalibrationLearning",
                    TankId = notification.TankId,
                    DisableFallbackAllUsers = true,
                    Data = new
                    {
                        notification.TankId,
                        notification.NewPointCount,
                        notification.UnprocessedPointCount,
                        notification.CoveragePercentage,
                        notification.TriggeredAtUtc,
                    },
                };

                var result = await _notificationService.CreateNotificationAsync(request, cancellationToken);
                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Failed to persist calibration readiness notification for TankId {TankId}: {Message}",
                        notification.TankId,
                        result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling CalibrationDataReadyNotification for TankId {TankId}", notification.TankId);
            }
        }
    }
}