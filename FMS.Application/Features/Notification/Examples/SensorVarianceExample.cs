using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Examples {
    /// <summary>
    /// Example showing the ideal notification implementation with dynamic recipient resolution
    /// </summary>
    public class SensorVarianceExample {
        private readonly INotificationService _notificationService;
        private readonly ILogger<SensorVarianceExample> _logger;

        public SensorVarianceExample (INotificationService notificationService, ILogger<SensorVarianceExample> logger) {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// ✅ Ideal implementation - no hardcoded recipients
        /// </summary>
        public async Task<FMSResponse<bool>> ProcessSensorVarianceAsync (
            Tank tank, decimal manualVolume, decimal sensorVolume, string recordedBy, CancellationToken cancellationToken = default) {
            try {
                var variance = Math.Abs (manualVolume - sensorVolume);
                var variancePercentage = (variance / manualVolume) * 100;
                var priority = variancePercentage >= 5 ? "High" : "Medium";

                // ✅ No hardcoded recipients - will be dynamically resolved
                var notificationRequest = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "SensorVariance",
                    Priority = priority,
                    Title = $"Sensor Variance - Tank {tank.Name}",
                    Message = $"Variance: {variance:F2}L ({variancePercentage:F2}%) detected",
                    TriggerSource = "ClosingStockSensorVariance",
                    TriggeredBy = recordedBy,
                    SiteId = tank.SiteId,
                    TankId = tank.Id
                    // Recipients removed - will be dynamically resolved
                };

                var result = await _notificationService.CreateNotificationAsync (notificationRequest, cancellationToken);
                return FMSResponse<bool>.Success (true);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing sensor variance for Tank {TankId}", tank.Id);
                return FMSResponse<bool>.Failed ($"Error: {ex.Message}");
            }
        }
    }
}