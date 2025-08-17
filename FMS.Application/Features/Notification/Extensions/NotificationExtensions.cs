using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;

namespace FMS.Application.Features.Notification.Extensions {
    /// <summary>
    /// Extension methods for easier notification creation
    /// </summary>
    public static class NotificationExtensions {
        /// <summary>
        /// Creates a notification request for a specific well-known category
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateNotificationForCategoryAsync (
            this INotificationCategoryService categoryService,
            WellKnownCategories category,
            NotificationType type,
            string title,
            string message,
            string triggerSource,
            NotificationPriority? priority = null,
            int? siteId = null,
            int? tankId = null,
            int? vehicleId = null,
            string? ptsDeviceId = null,
            object? data = null,
            CancellationToken cancellationToken = default) {
            var categoryId = await categoryService.GetCategoryIdAsync (category, cancellationToken);

            if (!categoryId.HasValue) {
                return null;
            }

            // Get category details for default priority if not specified
            if (!priority.HasValue) {
                var categoryEntity = await categoryService.GetCategoryByIdAsync (categoryId.Value, cancellationToken);
                if (categoryEntity != null && Enum.TryParse<NotificationPriority> (categoryEntity.DefaultPriority, out var defaultPriority)) {
                    priority = defaultPriority;
                } else {
                    priority = NotificationPriority.Medium;
                }
            }

            return new CreateNotificationRequest {
                Type = type,
                    CategoryId = categoryId.Value,
                    Priority = priority,
                    Title = title,
                    Message = message,
                    TriggerSource = triggerSource,
                    TriggeredBy = "System",
                    SiteId = siteId,
                    TankId = tankId,
                    VehicleId = vehicleId,
                    PtsDeviceId = ptsDeviceId,
                    Data = data
            };
        }

        /// <summary>
        /// Quick method to create a stock reconciliation notification
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateStockReconciliationNotificationAsync (
            this INotificationCategoryService categoryService,
            string title,
            string message,
            int? siteId = null,
            int? tankId = null,
            NotificationPriority priority = NotificationPriority.High,
            CancellationToken cancellationToken = default) {
            return await categoryService.CreateNotificationForCategoryAsync (
                WellKnownCategories.StockReconciliation,
                NotificationType.Alert,
                title,
                message,
                "StockReconciliation",
                priority,
                siteId,
                tankId,
                cancellationToken : cancellationToken
            );
        }

        /// <summary>
        /// Quick method to create a sensor variance notification
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateSensorVarianceNotificationAsync (
            this INotificationCategoryService categoryService,
            string title,
            string message,
            int? siteId = null,
            int? tankId = null,
            decimal? variance = null,
            CancellationToken cancellationToken = default) {
            var priority = variance > 100 ? NotificationPriority.High : NotificationPriority.Medium;
            var data = variance.HasValue ? new { Variance = variance.Value } : null;

            return await categoryService.CreateNotificationForCategoryAsync (
                WellKnownCategories.SensorVariance,
                NotificationType.Warning,
                title,
                message,
                "SensorMonitoring",
                priority,
                siteId,
                tankId,
                data : data,
                cancellationToken : cancellationToken
            );
        }

        /// <summary>
        /// Quick method to create a security alert notification
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateSecurityAlertNotificationAsync (
            this INotificationCategoryService categoryService,
            string title,
            string message,
            int? siteId = null,
            CancellationToken cancellationToken = default) {
            return await categoryService.CreateNotificationForCategoryAsync (
                WellKnownCategories.SecurityAlerts,
                NotificationType.Alert,
                title,
                message,
                "SecurityMonitoring",
                NotificationPriority.Critical,
                siteId,
                cancellationToken : cancellationToken
            );
        }

        /// <summary>
        /// Quick method to create a device alert notification
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateDeviceAlertNotificationAsync (
            this INotificationCategoryService categoryService,
            string title,
            string message,
            string ptsDeviceId,
            int? siteId = null,
            CancellationToken cancellationToken = default) {
            return await categoryService.CreateNotificationForCategoryAsync (
                WellKnownCategories.DeviceAlerts,
                NotificationType.Alert,
                title,
                message,
                "DeviceMonitoring",
                NotificationPriority.High,
                siteId,
                ptsDeviceId : ptsDeviceId,
                cancellationToken : cancellationToken
            );
        }

        /// <summary>
        /// Quick method to create a system error notification
        /// </summary>
        public static async Task<CreateNotificationRequest?> CreateSystemErrorNotificationAsync (
            this INotificationCategoryService categoryService,
            string title,
            string message,
            Exception? exception = null,
            CancellationToken cancellationToken = default) {
            var data = exception != null ?
                new { ErrorType = exception.GetType ().Name, ErrorMessage = exception.Message } :
                null;

            return await categoryService.CreateNotificationForCategoryAsync (
                WellKnownCategories.SystemError,
                NotificationType.Error,
                title,
                message,
                "SystemMonitoring",
                NotificationPriority.Critical,
                data : data,
                cancellationToken : cancellationToken
            );
        }
    }
}