using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.FMS {
    /// <summary>
    /// Background service that monitors tank levels and triggers alarms when thresholds are exceeded
    /// This is the MISSING PIECE that connects tank measurements to alarm notifications
    /// </summary>
    public class TankMonitoringService : BackgroundService {
        private readonly ILogger<TankMonitoringService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes (5); // Check every 5 minutes

        public TankMonitoringService (
            ILogger<TankMonitoringService> logger,
            IServiceScopeFactory serviceScopeFactory) {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            _logger.LogInformation ("Tank Monitoring Service starting - this checks fuel levels and triggers alarms");

            while (!stoppingToken.IsCancellationRequested) {
                try {
                    using var scope = _serviceScopeFactory.CreateScope ();
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();
                    var alarmHandlerService = scope.ServiceProvider.GetRequiredService<IAlarmHandlerService> ();
                    var activeAlarmIntegration = scope.ServiceProvider.GetRequiredService<AlarmHandlerActiveAlarmIntegration> ();

                    await CheckAllTankLevelsAsync (context, alarmHandlerService, activeAlarmIntegration, stoppingToken);

                    // Wait before next check
                    await Task.Delay (_monitoringInterval, stoppingToken);
                } catch (OperationCanceledException) {
                    _logger.LogInformation ("Tank Monitoring Service is stopping due to cancellation");
                    break;
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error in Tank Monitoring Service cycle");

                    // Wait before retrying on error
                    try {
                        await Task.Delay (TimeSpan.FromMinutes (1), stoppingToken);
                    } catch (OperationCanceledException) {
                        break;
                    }
                }
            }

            _logger.LogInformation ("Tank Monitoring Service has stopped");
        }

        private async Task CheckAllTankLevelsAsync (
            GpsdataContext context,
            IAlarmHandlerService alarmHandlerService,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            CancellationToken cancellationToken) {
            try {
                _logger.LogDebug ("Checking tank levels for all active tanks");

                // Get all active tanks with their latest measurements
                var tanks = await context.Tanks
                    .Include (t => t.Site)
                    .Where (t => t.Name != null) // Only check tanks that have names (active tanks)
                    .ToListAsync (cancellationToken);

                foreach (var tank in tanks) {
                    await CheckSingleTankAsync (context, alarmHandlerService, activeAlarmIntegration, tank, cancellationToken);
                }

                _logger.LogDebug ("Completed tank level monitoring for {TankCount} tanks", tanks.Count);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking tank levels");
            }
        }

        private async Task CheckSingleTankAsync (
            GpsdataContext context,
            IAlarmHandlerService alarmHandlerService,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            Tank tank,
            CancellationToken cancellationToken) {
            try {
                // Get latest tank measurement from your ATG system
                var latestMeasurement = await context.Tankmeasurements
                    .Where (tm => tm.TankId == tank.Id) // Match by Tank ID
                    .OrderByDescending (tm => tm.DateTime)
                    .FirstOrDefaultAsync (cancellationToken);

                if (latestMeasurement == null) {
                    _logger.LogWarning ("No measurements found for tank {TankId}", tank.Id);
                    return;
                }

                // Check if measurement is recent (within last hour)
                var measurementAge = DateTime.UtcNow - latestMeasurement.DateTime;
                if (measurementAge.TotalHours > 1) {
                    _logger.LogWarning ("Tank {TankId} measurement is {Hours:F1} hours old - may need device check",
                        tank.Id, measurementAge.TotalHours);

                    // Create stale data alarm using ActiveAlarm integration
                    try {
                        await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert (
                            0, // No specific alert record ID
                            "StaleDataAlarm",
                            $"Tank {tank.Name} has stale data - last measurement {measurementAge.TotalHours:F1} hours ago",
                            "Medium",
                            tank.SiteId,
                            tank.Id,
                            tank.PtsId,
                            "TankMonitoring-System",
                            new {
                                LastMeasurementTime = latestMeasurement.DateTime,
                                    HoursOld = measurementAge.TotalHours
                            },
                            cancellationToken);
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Failed to create stale data alarm for tank {TankId}", tank.Id);
                    }
                }

                // Check for low/high volume alarms based on tank capacity
                await CheckVolumeAlarmsAsync (tank, latestMeasurement, activeAlarmIntegration, cancellationToken);

                _logger.LogDebug ("Processed tank {TankId} - Volume: {Volume}L, Capacity: {Capacity}L ({Percentage:F1}%)",
                    tank.Id,
                    latestMeasurement.ProductVolume,
                    tank.TankVolume,
                    tank.TankVolume > 0 ? (double) (latestMeasurement.ProductVolume ?? 0) / (double) tank.TankVolume * 100 : 0);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking tank {TankId}", tank.Id);
            }
        }

        private async Task CheckVolumeAlarmsAsync (
            Tank tank,
            Tankmeasurement measurement,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration,
            CancellationToken cancellationToken) {
            try {
                var currentVolume = measurement.ProductVolume ?? 0;
                var tankCapacity = tank.TankVolume;
                var fillPercentage = tankCapacity > 0 ? (double) currentVolume / (double) tankCapacity * 100 : 0;

                // Check for low volume alarm (below 10%)
                if (fillPercentage < 10) {
                    await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert (
                        0,
                        "LowVolumeAlarm",
                        $"Tank {tank.Name} is running low: {currentVolume:F1}L ({fillPercentage:F1}% full)",
                        "High",
                        tank.SiteId,
                        tank.Id,
                        tank.PtsId,
                        "TankMonitoring-System",
                        new {
                            CurrentVolume = currentVolume,
                                TankCapacity = tankCapacity,
                                FillPercentage = fillPercentage
                        },
                        cancellationToken);
                }

                // Check for high volume alarm (above 90%)
                if (fillPercentage > 90) {
                    await activeAlarmIntegration.CreateActiveAlarmFromPTSAlert (
                        0,
                        "HighVolumeAlarm",
                        $"Tank {tank.Name} is nearly full: {currentVolume:F1}L ({fillPercentage:F1}% full)",
                        "Medium",
                        tank.SiteId,
                        tank.Id,
                        tank.PtsId,
                        "TankMonitoring-System",
                        new {
                            CurrentVolume = currentVolume,
                                TankCapacity = tankCapacity,
                                FillPercentage = fillPercentage
                        },
                        cancellationToken);
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking volume alarms for tank {TankId}", tank.Id);
            }
        }
    }
}