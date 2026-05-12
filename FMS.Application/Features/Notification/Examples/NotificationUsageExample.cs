using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Examples {
    /// <summary>
    /// Example service demonstrating how to use the new notification category architecture
    /// </summary>
    public class NotificationUsageExample {
        private readonly GpsdataContext _context;
        private readonly INotificationCategoryService _notificationCategoryService;
        private readonly ILogger<NotificationUsageExample> _logger;

        public NotificationUsageExample (
            GpsdataContext context,
            INotificationCategoryService notificationCategoryService,
            ILogger<NotificationUsageExample> logger) {
            _context = context;
            _notificationCategoryService = notificationCategoryService;
            _logger = logger;
        }

        /// <summary>
        /// Example of sending a reconciliation failed notification using the new architecture
        /// </summary>
        public async Task SendReconciliationFailedNotificationAsync (int tankId, string errorMessage, CancellationToken cancellationToken = default) {
            try {
                var tank = await _context.Tanks.FindAsync (new object[] { tankId }, cancellationToken);

                // Get the category ID from the database
                var categoryId = await _notificationCategoryService.GetCategoryIdAsync (
                    WellKnownCategories.StockReconciliation,
                    cancellationToken
                );

                if (!categoryId.HasValue) {
                    _logger.LogWarning ("StockReconciliation category not found in database");
                    return;
                }

                var request = new CreateNotificationRequest {
                    Type = NotificationType.Alert,
                    CategoryId = categoryId.Value,
                    Priority = NotificationPriority.Medium,
                    Title = "Reconciliation Failed",
                    Message = $"Tank {tank?.Name} reconciliation failed: {errorMessage}",
                    TriggerSource = "AutomatedReconciliation",
                    TriggeredBy = "System", // You might have a SystemConstants.Defaults.SystemTriggeredBy
                    SiteId = tank?.SiteId,
                    TankId = tankId
                };

                // Here you would call your notification service
                // await _notificationService.CreateNotificationAsync(request, cancellationToken);

                _logger.LogInformation ("Reconciliation failed notification created for tank {TankId}", tankId);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send reconciliation failed notification for tank {TankId}", tankId);
            }
        }

        /// <summary>
        /// Example of sending a sensor variance notification
        /// </summary>
        public async Task SendSensorVarianceNotificationAsync (int tankId, decimal variance, CancellationToken cancellationToken = default) {
            try {
                var tank = await _context.Tanks.FindAsync (new object[] { tankId }, cancellationToken);

                var categoryId = await _notificationCategoryService.GetCategoryIdAsync (
                    WellKnownCategories.SensorVariance,
                    cancellationToken
                );

                if (!categoryId.HasValue) {
                    _logger.LogWarning ("SensorVariance category not found in database");
                    return;
                }

                var priority = variance > 100 ? NotificationPriority.High : NotificationPriority.Medium;

                var request = new CreateNotificationRequest {
                    Type = NotificationType.Warning,
                    CategoryId = categoryId.Value,
                    Priority = priority,
                    Title = "Sensor Variance Detected",
                    Message = $"Tank {tank?.Name} has a sensor variance of {variance:F2} liters",
                    TriggerSource = "SensorMonitoring",
                    TriggeredBy = "System",
                    SiteId = tank?.SiteId,
                    TankId = tankId,
                    Data = new { Variance = variance, Threshold = 50 }
                };

                // Here you would call your notification service
                // await _notificationService.CreateNotificationAsync(request, cancellationToken);

                _logger.LogInformation ("Sensor variance notification created for tank {TankId} with variance {Variance}", tankId, variance);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send sensor variance notification for tank {TankId}", tankId);
            }
        }

        /// <summary>
        /// Example of sending a critical security alert
        /// </summary>
        public async Task SendSecurityAlertAsync (string alertMessage, int? siteId = null, CancellationToken cancellationToken = default) {
            try {
                var categoryId = await _notificationCategoryService.GetCategoryIdAsync (
                    WellKnownCategories.SecurityAlerts,
                    cancellationToken
                );

                if (!categoryId.HasValue) {
                    _logger.LogWarning ("SecurityAlerts category not found in database");
                    return;
                }

                var request = new CreateNotificationRequest {
                    Type = NotificationType.Alert,
                    CategoryId = categoryId.Value,
                    Priority = NotificationPriority.Critical,
                    Title = "Security Alert",
                    Message = alertMessage,
                    TriggerSource = "SecurityMonitoring",
                    TriggeredBy = "System",
                    SiteId = siteId
                };

                // Here you would call your notification service
                // await _notificationService.CreateNotificationAsync(request, cancellationToken);

                _logger.LogInformation ("Security alert notification created: {Message}", alertMessage);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send security alert notification: {Message}", alertMessage);
            }
        }
    }
}