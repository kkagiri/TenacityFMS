using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging; // Added for List<CreateNotificationRecipientRequest>

namespace FMS.Application.Features.Notification.Examples {
    /// <summary>
    /// Example implementation showing how to use the new dynamic notification system
    /// This replaces the old hardcoded recipient approach with dynamic resolution
    /// </summary>
    public class SensorVarianceNotificationExample {
        private readonly INotificationService _notificationService;
        private readonly ILogger<SensorVarianceNotificationExample> _logger;

        public SensorVarianceNotificationExample (
            INotificationService notificationService,
            ILogger<SensorVarianceNotificationExample> logger) {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// ✅ Ideal implementation - no hardcoded recipients
        /// Recipients are dynamically resolved based on business rules
        /// </summary>
        public async Task<FMSResponse<bool>> ProcessSensorVarianceAsync (
            Tank tank,
            decimal manualVolume,
            decimal sensorVolume,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            try {
                var variance = Math.Abs (manualVolume - sensorVolume);
                var variancePercentage = (variance / manualVolume) * 100;

                // Determine priority based on variance
                var priority = variancePercentage
                switch { >=
                    10 => "Critical", >=
                    5 => "High", >=
                    2 => "Medium",
                    _ => "Low"
                };

                // ✅ Ideal notification - no hardcoded recipients
                var notificationRequest = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "SensorVariance",
                    Priority = priority,
                    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
                    Message = $"Variance: {variance:F2}L ({variancePercentage:F2}%) detected between manual entry ({manualVolume}L) and sensor reading ({sensorVolume}L)",
                    TriggerSource = "ClosingStockSensorVariance",
                    TriggeredBy = recordedBy,
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Data = new {
                    ManualVolume = manualVolume,
                    SensorVolume = sensorVolume,
                    Variance = variance,
                    VariancePercentage = variancePercentage,
                    TankName = tank.Name,
                    SiteName = tank.Site?.Name
                    }
                    // ✅ No Recipients field - will be dynamically resolved
                };

                // The NotificationService will automatically resolve recipients:
                // 1. Site Administrator for tank.SiteId
                // 2. Users subscribed to "SensorVariance" category
                // 3. Policy-based recipients
                // 4. Role-based recipients (InventoryManager, etc.)
                // 5. Escalation recipients if priority is Critical

                var result = await _notificationService.CreateNotificationAsync (
                    notificationRequest, cancellationToken);

                if (result.IsSuccess) {
                    _logger.LogInformation (
                        "Sensor variance notification sent for Tank {TankId}, Variance: {Variance}L",
                        tank.Id, variance);
                }

                return FMSResponse<bool>.Success (true);
            } catch (Exception ex) {
                _logger.LogError (ex,
                    "Error processing sensor variance for Tank {TankId}", tank.Id);
                return FMSResponse<bool>.Failed ($"Error: {ex.Message}");
            }
        }

        /// <summary>
        /// ❌ Old implementation with hardcoded recipients (for comparison)
        /// </summary>
        public async Task<FMSResponse<bool>> ProcessSensorVarianceOldAsync (
            Tank tank,
            decimal manualVolume,
            decimal sensorVolume,
            string recordedBy,
            CancellationToken cancellationToken = default) {
            try {
                var variance = Math.Abs (manualVolume - sensorVolume);
                var variancePercentage = (variance / manualVolume) * 100;

                var priority = variancePercentage
                switch { >=
                    10 => "Critical", >=
                    5 => "High", >=
                    2 => "Medium",
                    _ => "Low"
                };

                // ❌ Old implementation with hardcoded recipients
                var notificationRequest = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "SensorVariance",
                    Priority = priority,
                    Title = $"Sensor vs Manual Closing Stock Variance - Tank {tank.Name}",
                    Message = $"Significant variance detected...",
                    TriggerSource = "ClosingStockSensorVariance",
                    TriggeredBy = recordedBy,
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Recipients = new List<CreateNotificationRecipientRequest> {
                    new CreateNotificationRecipientRequest {
                    UserId = "SiteManager", // ❌ Hardcoded
                    DeliveryMethods = new List<string> { "System", "Email" }
                    },
                    new CreateNotificationRecipientRequest {
                    UserId = "SystemUser", // ❌ Hardcoded
                    DeliveryMethods = new List<string> { "System", "Email" }
                    }
                    }
                };

                var result = await _notificationService.CreateNotificationAsync (
                    notificationRequest, cancellationToken);

                return FMSResponse<bool>.Success (true);
            } catch (Exception ex) {
                _logger.LogError (ex,
                    "Error processing sensor variance for Tank {TankId}", tank.Id);
                return FMSResponse<bool>.Failed ($"Error: {ex.Message}");
            }
        }
    }
}