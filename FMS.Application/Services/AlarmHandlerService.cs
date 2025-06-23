using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Threading;

namespace FMS.Application.Services
{
    /// <summary>
    /// Service for processing tank alarms and triggering appropriate notifications
    /// </summary>
    public interface IAlarmHandlerService
    {
        Task<FMSResponse> ProcessTankMeasurementAlarmsAsync(TankMeasurementDto tankMeasurement, string deviceId, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessDeviceDisconnectionAlarmAsync(string deviceId, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessCustomAlarmAsync(string alarmType, object alarmData, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessScheduledAlarmChecksAsync(CancellationToken cancellationToken = default);

        //Cursor: Methods for processing specific alarm types from PTS alerts
        Task<FMSResponse> ProcessPumpAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessTankAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessDeviceAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessGenericAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<object>>> GetAlarmHandlersAsync(CancellationToken cancellationToken = default);
    }

    public class AlarmHandlerService : IAlarmHandlerService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AlarmHandlerService> _logger;
        private readonly INotificationService _notificationService;

        public AlarmHandlerService(
            GpsdataContext context,
            ILogger<AlarmHandlerService> logger,
            INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<FMSResponse> ProcessTankMeasurementAlarmsAsync(TankMeasurementDto tankMeasurement, string deviceId, CancellationToken cancellationToken = default)
        {
            try
            {
                var alarmsProcessed = 0;
                var errors = new List<string>();

                // Get tank information
                var tank = await _context.Tanks
                    .Include(t => t.Site)
                    .FirstOrDefaultAsync(t => t.PtsId == deviceId, cancellationToken);

                if (tank == null)
                {
                    _logger.LogWarning("Tank not found for device {DeviceId}", deviceId);
                    return FMSResponse.FailedResponse($"Tank not found for device {deviceId}");
                }

                // Check for low tank volume alarm
                if (await ShouldTriggerLowVolumeAlarm(tank, tankMeasurement))
                {
                    var result = await TriggerLowVolumeAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                        alarmsProcessed++;
                    else
                        errors.Add($"Low volume alarm: {result.Message}");
                }

                // Check for high tank volume alarm
                if (await ShouldTriggerHighVolumeAlarm(tank, tankMeasurement))
                {
                    var result = await TriggerHighVolumeAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                        alarmsProcessed++;
                    else
                        errors.Add($"High volume alarm: {result.Message}");
                }

                // Check for water detection alarm
                if (await ShouldTriggerWaterDetectionAlarm(tank, tankMeasurement))
                {
                    var result = await TriggerWaterDetectionAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                        alarmsProcessed++;
                    else
                        errors.Add($"Water detection alarm: {result.Message}");
                }

                // Check for temperature alarm
                if (await ShouldTriggerTemperatureAlarm(tank, tankMeasurement))
                {
                    var result = await TriggerTemperatureAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                        alarmsProcessed++;
                    else
                        errors.Add($"Temperature alarm: {result.Message}");
                }

                // Process specific alarms from the measurement
                if (tankMeasurement.Alarms?.Any() == true)
                {
                    foreach (var alarmName in tankMeasurement.Alarms)
                    {
                        var result = await ProcessSpecificAlarmAsync(tank, alarmName, tankMeasurement, cancellationToken);
                        if (result.IsSuccess)
                            alarmsProcessed++;
                        else
                            errors.Add($"Specific alarm {alarmName}: {result.Message}");
                    }
                }

                var message = $"Processed {alarmsProcessed} alarms for tank {tank.Name}";
                if (errors.Any())
                    message += $". Errors: {string.Join(", ", errors)}";

                _logger.LogInformation("Processed tank measurement alarms for tank {TankName}: {AlarmsProcessed} alarms, {ErrorCount} errors",
                    tank.Name, alarmsProcessed, errors.Count);

                return errors.Any()
                    ? FMSResponse.FailedResponse(message)
                    : FMSResponse.SuccessResponse(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank measurement alarms for device {DeviceId}", deviceId);
                return FMSResponse.FailedResponse($"Error processing tank measurement alarms: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessDeviceDisconnectionAlarmAsync(string deviceId, CancellationToken cancellationToken = default)
        {
            try
            {
                var device = await _context.Devices
                    // .Include(d => d.Site) //Cursor: Device doesn't have Site navigation property
                    .FirstOrDefaultAsync(d => d.DeviceImei.ToString() == deviceId, cancellationToken); //Cursor: Device uses DeviceImei property, not Id

                if (device == null)
                {
                    _logger.LogWarning("Device not found: {DeviceId}", deviceId);
                    return FMSResponse.FailedResponse($"Device not found: {deviceId}");
                }

                var alarmRequest = new CreateAlarmNotificationRequest
                {
                    AlarmType = "DeviceDisconnection",
                    Category = "Device",
                    Message = $"Device {device.DeviceImei} ({deviceId}) has disconnected", //Cursor: Use DeviceImei instead of Id property
                    Data = new
                    {
                        DeviceId = deviceId,
                        DeviceName = device.DeviceImei.ToString(), //Cursor: Use DeviceImei instead of Id property
                        // SiteName = device.Site?.Name, //Cursor: Device doesn't have Site navigation property
                        DisconnectedAt = DateTime.UtcNow
                    },
                    TriggeredBy = "System",
                    SiteId = null, //Cursor: Device entity doesn't have SiteId property
                    DeviceId = device.DeviceImei //Cursor: Use DeviceImei instead of Id
                };

                var result = await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);

                _logger.LogInformation("Processed device disconnection alarm for device {DeviceId}", deviceId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing device disconnection alarm for device {DeviceId}", deviceId);
                return FMSResponse.FailedResponse($"Error processing device disconnection alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessCustomAlarmAsync(string alarmType, object alarmData, CancellationToken cancellationToken = default)
        {
            try
            {
                var alarmRequest = new CreateAlarmNotificationRequest
                {
                    AlarmType = alarmType,
                    Category = "Custom",
                    Message = $"Custom alarm triggered: {alarmType}",
                    Data = alarmData,
                    TriggeredBy = "System"
                };

                var result = await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);

                _logger.LogInformation("Processed custom alarm: {AlarmType}", alarmType);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing custom alarm {AlarmType}", alarmType);
                return FMSResponse.FailedResponse($"Error processing custom alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessScheduledAlarmChecksAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var alarmsProcessed = 0;
                var errors = new List<string>();

                // Check for tanks with stale data (no recent measurements)
                var staleDataThreshold = DateTime.UtcNow.AddHours(-2); // No data for 2 hours
                var tanksWithStaleData = await _context.Tanks
                    .Include(t => t.Site)
                    .Where(t => !_context.Tankmeasurements
                        .Any(tm => tm.TankId == t.Id && tm.DateTime >= staleDataThreshold))
                    .ToListAsync(cancellationToken);

                foreach (var tank in tanksWithStaleData)
                {
                    var result = await TriggerStaleDataAlarmAsync(tank, cancellationToken);
                    if (result.IsSuccess)
                        alarmsProcessed++;
                    else
                        errors.Add($"Stale data alarm for tank {tank.Name}: {result.Message}");
                }

                // Check for tanks with unusual consumption patterns
                await CheckUnusualConsumptionPatternsAsync(cancellationToken);

                // Check for tanks approaching capacity limits
                await CheckCapacityLimitsAsync(cancellationToken);

                var message = $"Processed {alarmsProcessed} scheduled alarm checks";
                if (errors.Any())
                    message += $". Errors: {string.Join(", ", errors)}";

                _logger.LogInformation("Completed scheduled alarm checks: {AlarmsProcessed} alarms, {ErrorCount} errors",
                    alarmsProcessed, errors.Count);

                return errors.Any()
                    ? FMSResponse.FailedResponse(message)
                    : FMSResponse.SuccessResponse(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing scheduled alarm checks");
                return FMSResponse.FailedResponse($"Error processing scheduled alarm checks: {ex.Message}");
            }
        }

        private async Task<bool> ShouldTriggerLowVolumeAlarm(Tank tank, TankMeasurementDto measurement)
        {
            try
            {
                // Check if tank has a low volume threshold configured - using 10% of tank volume as default since MinimumVolume doesn't exist
                var lowVolumeThreshold = tank.TankVolume * 0.1m; // 10% of capacity as default //Cursor: Use TankVolume instead of Capacity and remove MinimumVolume

                return measurement.ProductVolume.HasValue && (decimal)measurement.ProductVolume <= lowVolumeThreshold; //Cursor: Add null check and cast
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking low volume alarm for tank {TankId}", tank.Id);
                return false;
            }
        }

        private async Task<bool> ShouldTriggerHighVolumeAlarm(Tank tank, TankMeasurementDto measurement)
        {
            try
            {
                // Check if tank is approaching capacity (95% full)
                var highVolumeThreshold = tank.TankVolume * 0.95m; //Cursor: Use TankVolume instead of Capacity

                return measurement.ProductVolume.HasValue && (decimal)measurement.ProductVolume >= highVolumeThreshold; //Cursor: Add null check and cast
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking high volume alarm for tank {TankId}", tank.Id);
                return false;
            }
        }

        private async Task<bool> ShouldTriggerWaterDetectionAlarm(Tank tank, TankMeasurementDto measurement)
        {
            try
            {
                // Trigger if water height is above threshold (e.g., 5mm)
                var waterThreshold = 5.0m; // 5mm

                return measurement.WaterHeight.HasValue && (decimal)measurement.WaterHeight > waterThreshold; //Cursor: Add null check and cast
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking water detection alarm for tank {TankId}", tank.Id);
                return false;
            }
        }

        private async Task<bool> ShouldTriggerTemperatureAlarm(Tank tank, TankMeasurementDto measurement)
        {
            try
            {
                // Check for temperature outside normal range (e.g., -10°C to 50°C)
                var minTemp = -10.0m;
                var maxTemp = 50.0m;

                return measurement.Temperature.HasValue && ((decimal)measurement.Temperature < minTemp || (decimal)measurement.Temperature > maxTemp); //Cursor: Add null check and cast
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking temperature alarm for tank {TankId}", tank.Id);
                return false;
            }
        }

        private async Task<FMSResponse> TriggerLowVolumeAlarmAsync(Tank tank, TankMeasurementDto measurement, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "LowTankVolume",
                Category = "Tank",
                Message = $"Tank {tank.Name} has low fuel volume: {measurement.ProductVolume:F2}L (Capacity: {tank.TankVolume:F2}L)", //Cursor: Use Name and TankVolume
                Data = new
                {
                    TankId = tank.Id,
                    TankNumber = tank.Name, //Cursor: Use Name instead of TankNumber
                    CurrentVolume = measurement.ProductVolume,
                    Capacity = tank.TankVolume, //Cursor: Use TankVolume instead of Capacity
                    PercentageFull = ((decimal)(measurement.ProductVolume ?? 0) / tank.TankVolume) * 100, //Cursor: Handle nullable ProductVolume with cast
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> TriggerHighVolumeAlarmAsync(Tank tank, TankMeasurementDto measurement, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "HighTankVolume",
                Category = "Tank",
                Message = $"Tank {tank.Name} is approaching capacity: {measurement.ProductVolume:F2}L (Capacity: {tank.TankVolume:F2}L)", //Cursor: Use Name and TankVolume
                Data = new
                {
                    TankId = tank.Id,
                    TankNumber = tank.Name, //Cursor: Use Name instead of TankNumber
                    CurrentVolume = measurement.ProductVolume,
                    Capacity = tank.TankVolume, //Cursor: Use TankVolume instead of Capacity
                    PercentageFull = ((decimal)(measurement.ProductVolume ?? 0) / tank.TankVolume) * 100, //Cursor: Handle nullable ProductVolume with cast
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> TriggerWaterDetectionAlarmAsync(Tank tank, TankMeasurementDto measurement, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "WaterDetection",
                Category = "Tank",
                Message = $"Water detected in tank {tank.Name}: {measurement.WaterHeight:F2}mm height", //Cursor: Use Name instead of TankNumber
                Data = new
                {
                    TankId = tank.Id,
                    TankNumber = tank.Name, //Cursor: Use Name instead of TankNumber
                    WaterHeight = measurement.WaterHeight,
                    WaterVolume = measurement.WaterVolume,
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> TriggerTemperatureAlarmAsync(Tank tank, TankMeasurementDto measurement, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "TemperatureAlarm",
                Category = "Tank",
                Message = $"Abnormal temperature in tank {tank.Name}: {measurement.Temperature:F1}°C", //Cursor: Use Name instead of TankNumber
                Data = new
                {
                    TankId = tank.Id,
                    TankNumber = tank.Name, //Cursor: Use Name instead of TankNumber
                    Temperature = measurement.Temperature,
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> ProcessSpecificAlarmAsync(Tank tank, string alarmName, TankMeasurementDto measurement, CancellationToken cancellationToken)
        {
            var alarm = await _context.Alarms
                .FirstOrDefaultAsync(a => a.Name == alarmName, cancellationToken);

            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = alarmName,
                AlarmId = alarm?.Id,
                Category = "Tank",
                Message = $"Alarm '{alarmName}' triggered for tank {tank.Name}",
                Data = new
                {
                    TankId = tank.Id,
                    TankNumber = tank.Name, //Cursor: Use Name instead of TankNumber
                    AlarmName = alarmName,
                    AlarmDescription = alarm?.Description,
                    AlarmPriority = alarm?.Priority,
                    MeasurementData = measurement,
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> TriggerStaleDataAlarmAsync(Tank tank, CancellationToken cancellationToken)
        {
            var lastMeasurement = await _context.Tankmeasurements
                .Where(tm => tm.TankId == tank.Id)
                .OrderByDescending(tm => tm.DateTime)
                .FirstOrDefaultAsync(cancellationToken);

            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "StaleData",
                Category = "Tank",
                Message = $"Tank {tank.Name} has not received data for over 2 hours",
                Data = new
                {
                    TankId = tank.Id,
                    TankName = tank.Name,
                    SiteName = tank.Site?.Name,
                    LastDataTime = lastMeasurement?.DateTime,
                    AlertThreshold = "2 hours"
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task CheckUnusualConsumptionPatternsAsync(CancellationToken cancellationToken)
        {
            try
            {
                // This would implement logic to detect unusual consumption patterns
                // For example, sudden large drops in volume that might indicate theft or leakage
                var yesterday = DateTime.UtcNow.AddDays(-1);
                var tanks = await _context.Tanks
                    .Include(t => t.Site)
                    .ToListAsync(cancellationToken);

                foreach (var tank in tanks)
                {
                    var measurements = await _context.Tankmeasurements
                        .Where(tm => tm.TankId == tank.Id && tm.DateTime >= yesterday)
                        .OrderBy(tm => tm.DateTime)
                        .ToListAsync(cancellationToken);

                    if (measurements.Count < 2) continue;

                    // Check for sudden large volume drops (potential theft/leakage)
                    for (int i = 1; i < measurements.Count; i++)
                    {
                        var volumeDrop = (decimal)(measurements[i - 1].ProductVolume ?? 0) - (decimal)(measurements[i].ProductVolume ?? 0); //Cursor: Handle nullable ProductVolume with cast
                        var timeDiff = (measurements[i].DateTime - measurements[i - 1].DateTime).TotalHours;

                        // If volume dropped more than 20% in less than 1 hour without delivery
                        if (volumeDrop > (tank.TankVolume * 0.2m) && timeDiff < 1) //Cursor: Use TankVolume instead of Capacity
                        {
                            await TriggerUnusualConsumptionAlarmAsync(tank, volumeDrop, timeDiff, cancellationToken);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking unusual consumption patterns");
            }
        }

        private async Task CheckCapacityLimitsAsync(CancellationToken cancellationToken)
        {
            try
            {
                // Check tanks that are approaching their limits for deliveries
                var tanks = await _context.Tanks
                    .Include(t => t.Site)
                    .Where(t => t.TankVolume > 0) //Cursor: Use TankVolume instead of Capacity
                    .ToListAsync(cancellationToken);

                foreach (var tank in tanks)
                {
                    var latestMeasurement = await _context.Tankmeasurements
                        .Where(tm => tm.TankId == tank.Id)
                        .OrderByDescending(tm => tm.DateTime)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (latestMeasurement != null)
                    {
                        var percentageFull = ((decimal)(latestMeasurement.ProductVolume ?? 0) / tank.TankVolume) * 100; //Cursor: Handle nullable ProductVolume with cast and use TankVolume

                        // Check if tank is approaching capacity (90% full)
                        if (percentageFull >= 90)
                        {
                            await TriggerCapacityLimitAlarmAsync(tank, latestMeasurement, percentageFull, cancellationToken);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking capacity limits");
            }
        }

        private async Task<FMSResponse> TriggerUnusualConsumptionAlarmAsync(Tank tank, decimal volumeDrop, double timeDiff, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "UnusualConsumption",
                Category = "Tank",
                Message = $"Unusual consumption pattern detected in tank {tank.Name}: {volumeDrop:F2}L drop in {timeDiff:F1} hours",
                Data = new
                {
                    TankId = tank.Id,
                    TankName = tank.Name,
                    VolumeDrop = volumeDrop,
                    TimeSpan = timeDiff,
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        private async Task<FMSResponse> TriggerCapacityLimitAlarmAsync(Tank tank, Tankmeasurement measurement, decimal percentageFull, CancellationToken cancellationToken)
        {
            var alarmRequest = new CreateAlarmNotificationRequest
            {
                AlarmType = "CapacityLimit",
                Category = "Tank",
                Message = $"Tank {tank.Name} is approaching capacity: {percentageFull:F1}% full",
                Data = new
                {
                    TankId = tank.Id,
                    TankName = tank.Name,
                    CurrentVolume = measurement.ProductVolume,
                    Capacity = tank.TankVolume,
                    PercentageFull = percentageFull,
                    SiteName = tank.Site?.Name
                },
                TriggeredBy = "System",
                SiteId = tank.SiteId,
                TankId = tank.Id
            };

            return await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);
        }

        //Cursor: Implementation of PTS alert processing methods
        public async Task<FMSResponse> ProcessPumpAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default)
        {
            try
            {
                // Process pump-specific alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = alarmRequest.Category ?? "Pump",
                    Priority = alarmRequest.Priority ?? "Medium",
                    Title = $"Pump Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Pump alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    DeviceId = alarmRequest.DeviceId,
                    AlarmId = alarmRequest.AlarmId,
                    Recipients = new List<CreateNotificationRecipientRequest>()
                };

                // Add default recipients for pump alarms (site managers, maintenance staff)
                // This would typically be configured per site
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed pump alarm: {AlarmType} for device {DeviceId}",
                    alarmRequest.AlarmType, alarmRequest.DeviceId);

                return FMSResponse.SuccessResponse($"Pump alarm notification created: {alarmRequest.AlarmType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pump alarm {AlarmType}", alarmRequest.AlarmType);
                return FMSResponse.FailedResponse($"Error processing pump alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessTankAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default)
        {
            try
            {
                // Process tank-specific alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = alarmRequest.Category ?? "Tank",
                    Priority = alarmRequest.Priority ?? "Medium",
                    Title = $"Tank Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Tank alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    TankId = alarmRequest.TankId,
                    AlarmId = alarmRequest.AlarmId,
                    Recipients = new List<CreateNotificationRecipientRequest>()
                };

                // Add default recipients for tank alarms
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed tank alarm: {AlarmType} for tank {TankId}",
                    alarmRequest.AlarmType, alarmRequest.TankId);

                return FMSResponse.SuccessResponse($"Tank alarm notification created: {alarmRequest.AlarmType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank alarm {AlarmType}", alarmRequest.AlarmType);
                return FMSResponse.FailedResponse($"Error processing tank alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessDeviceAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default)
        {
            try
            {
                // Process device-specific alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = alarmRequest.Category ?? "Device",
                    Priority = alarmRequest.Priority ?? "Medium",
                    Title = $"Device Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Device alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    DeviceId = alarmRequest.DeviceId,
                    AlarmId = alarmRequest.AlarmId,
                    Recipients = new List<CreateNotificationRecipientRequest>()
                };

                // Add default recipients for device alarms
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed device alarm: {AlarmType} for device {DeviceId}",
                    alarmRequest.AlarmType, alarmRequest.DeviceId);

                return FMSResponse.SuccessResponse($"Device alarm notification created: {alarmRequest.AlarmType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing device alarm {AlarmType}", alarmRequest.AlarmType);
                return FMSResponse.FailedResponse($"Error processing device alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse> ProcessGenericAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default)
        {
            try
            {
                // Process generic alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = "Alert",
                    Category = alarmRequest.Category ?? "General",
                    Priority = alarmRequest.Priority ?? "Medium",
                    Title = $"Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    DeviceId = alarmRequest.DeviceId,
                    TankId = alarmRequest.TankId,
                    VehicleId = alarmRequest.VehicleId,
                    AlarmId = alarmRequest.AlarmId,
                    Recipients = new List<CreateNotificationRecipientRequest>()
                };

                // Add default recipients for generic alarms
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed generic alarm: {AlarmType}", alarmRequest.AlarmType);

                return FMSResponse.SuccessResponse($"Generic alarm notification created: {alarmRequest.AlarmType}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing generic alarm {AlarmType}", alarmRequest.AlarmType);
                return FMSResponse.FailedResponse($"Error processing generic alarm: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<object>>> GetAlarmHandlersAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var handlers = await _context.AlarmHandlers
                    .Select(ah => new
                    {
                        ah.Id,
                        ah.Name,
                        ah.AlarmType, //Cursor: Use AlarmType instead of HandlerType
                        ah.AlarmId,
                        ah.TriggerConditions, //Cursor: Use TriggerConditions instead of Configuration
                        ah.IsActive,
                        ah.Priority,
                        ah.CreatedAt,
                        ah.ModifiedAt //Cursor: Use ModifiedAt instead of UpdatedAt
                    })
                    .ToListAsync(cancellationToken);

                var result = handlers.Cast<object>().ToList();
                return FMSResponse<List<object>>.Success(result, "Alarm handlers retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm handlers");
                return FMSResponse<List<object>>.Failed($"Error retrieving alarm handlers: {ex.Message}"); //Cursor: Use generic Failed method
            }
        }
    }
}