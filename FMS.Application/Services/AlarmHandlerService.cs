/**
 * File: AlarmHandlerService.cs
 * Purpose: Evaluates tank/device alarm conditions and triggers notifications/active alarms.
 * Dependencies: GpsdataContext, INotificationService, AlarmHandlerActiveAlarmIntegration, ILogger
 * Last Modified: 2026-02-06
 *
 * Key Functions:
 * - ProcessTankMeasurementAlarmsAsync(): Handles alarms from incoming measurements.
 * - ProcessScheduledAlarmChecksAsync(): Periodic checks (stale data, capacity, patterns).
 * - ProcessTankAlarmAsync(): Creates notifications for tank alarms.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.ATG;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.AlarmHandlers;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Notification.Services.Integration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.Application.Services
{
    /// <summary>
    /// Service for processing tank alarms and triggering appropriate notifications
    /// </summary>
    ///

    [Obsolete("Use ActiveAlarmService instead")]
    public interface IAlarmHandlerService
    {
        Task<FMSResponse> ProcessTankMeasurementAlarmsAsync(TankMeasurementDto tankMeasurement, string deviceId, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessDeviceDisconnectionAlarmAsync(string deviceId, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessCustomAlarmAsync(string alarmType, object alarmData, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessScheduledAlarmChecksAsync(CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessPumpAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessTankAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessDeviceAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse> ProcessGenericAlarmAsync(CreateAlarmNotificationRequest alarmRequest, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<object>>> GetAlarmHandlersAsync(int? policyId = null, CancellationToken cancellationToken = default);
        Task<FMSResponse<int>> CreateAlarmHandlerAsync(CreateAlarmHandlerRequestDto request, string createdBy, CancellationToken cancellationToken = default);
        Task<FMSResponse> UpdateAlarmHandlerAsync(int id, UpdateAlarmHandlerRequestDto request, string modifiedBy, CancellationToken cancellationToken = default);
        Task<FMSResponse> DeleteAlarmHandlerAsync(int id, CancellationToken cancellationToken = default);
        Task<FMSResponse<List<AlarmHandlerTypeMetadataDto>>> GetAlarmHandlerTypesAsync(int? categoryId = null, CancellationToken cancellationToken = default);
        /// <summary>
        /// Evaluate active alarm handlers against an incoming generic event (telemetry / alarm output) and create notifications for matches.
        /// </summary>
        Task<FMSResponse<int>> EvaluateHandlersAsync(AlarmEvaluationEvent evt, CancellationToken cancellationToken = default);
    }

    [Obsolete("Use ActiveAlarmService instead")]

    public class AlarmHandlerService : IAlarmHandlerService
    {
        private const string MissingFuelFillAlarmType = "TankNoFuelFillPosted";
        private readonly GpsdataContext _context;
        private readonly ILogger<AlarmHandlerService> _logger;
        private readonly INotificationService _notificationService;
        private readonly AlarmHandlerActiveAlarmIntegration _activeAlarmIntegration;

        public AlarmHandlerService(
            GpsdataContext context,
            ILogger<AlarmHandlerService> logger,
            INotificationService notificationService,
            AlarmHandlerActiveAlarmIntegration activeAlarmIntegration)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
            _activeAlarmIntegration = activeAlarmIntegration;
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

                // Determine if dynamic alarm handlers exist for specific types; if so, prefer evaluation engine over legacy direct triggers
                bool hasDynamicLowLevel = await _context.AlarmHandlers.AnyAsync(h => h.IsActive && h.AlarmType == "TankLevelBelowThreshold", cancellationToken);
                bool hasDynamicWaterDetected = await _context.AlarmHandlers.AnyAsync(h => h.IsActive && h.AlarmType == "WaterDetected", cancellationToken);

                // Check for low tank volume alarm (legacy path only if no dynamic handler configured)
                if (!hasDynamicLowLevel && await ShouldTriggerLowVolumeAlarm(tank, tankMeasurement))
                {
                    FMSResponse result = await TriggerLowVolumeAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                    {
                        alarmsProcessed++;
                    }
                    else
                    {
                        errors.Add($"Low volume alarm: {result.Message}");
                    }
                }

                // High volume alarm still uses legacy path (no dynamic handler type yet)
                if (await ShouldTriggerHighVolumeAlarm(tank, tankMeasurement))
                {
                    FMSResponse result = await TriggerHighVolumeAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                    {
                        alarmsProcessed++;
                    }
                    else
                    {
                        errors.Add($"High volume alarm: {result.Message}");
                    }
                }

                // Water detection (legacy path only if no dynamic handler)
                if (!hasDynamicWaterDetected && await ShouldTriggerWaterDetectionAlarm(tank, tankMeasurement))
                {
                    FMSResponse result = await TriggerWaterDetectionAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                    {
                        alarmsProcessed++;
                    }
                    else
                    {
                        errors.Add($"Water detection alarm: {result.Message}");
                    }
                }

                // Check for temperature alarm
                if (await ShouldTriggerTemperatureAlarm(tank, tankMeasurement))
                {
                    FMSResponse result = await TriggerTemperatureAlarmAsync(tank, tankMeasurement, cancellationToken);
                    if (result.IsSuccess)
                    {
                        alarmsProcessed++;
                    }
                    else
                    {
                        errors.Add($"Temperature alarm: {result.Message}");
                    }
                }

                // Process specific alarms from the measurement
                if (tankMeasurement.Alarms?.Any() == true)
                {
                    foreach (string alarmName in tankMeasurement.Alarms)
                    {
                        FMSResponse result = await ProcessSpecificAlarmAsync(tank, alarmName, tankMeasurement, cancellationToken);
                        if (result.IsSuccess)
                        {
                            alarmsProcessed++;
                        }
                        else
                        {
                            errors.Add($"Specific alarm {alarmName}: {result.Message}");
                        }
                    }
                }

                // Emit evaluation events for dynamic handlers (percentageFull, waterHeight etc.)
                decimal? pctFull = null;
                if (tankMeasurement.ProductVolume.HasValue && tank.TankVolume > 0)
                {
                    try { pctFull = (decimal)tankMeasurement.ProductVolume / tank.TankVolume * 100m; } catch { }
                }
                if (hasDynamicLowLevel && pctFull.HasValue)
                {
                    var evt = new AlarmEvaluationEvent
                    {
                        AlarmType = "TankLevelBelowThreshold",
                        SiteId = tank.SiteId,
                        TankId = tank.Id,
                        PtsDeviceId = deviceId,
                        OccurredAtUtc = DateTime.UtcNow,
                        Data = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["percentageFull"] = pctFull.Value,
                            ["productVolume"] = tankMeasurement.ProductVolume,
                            ["tankVolume"] = tank.TankVolume
                        }
                    };
                    var evalResult = await EvaluateHandlersAsync(evt, cancellationToken);
                    if (evalResult.IsSuccess)
                    {
                        alarmsProcessed += evalResult.Data;
                    }
                    else
                    {
                        errors.Add($"Dynamic low level evaluation: {evalResult.Message}");
                    }
                }
                if (hasDynamicWaterDetected && tankMeasurement.WaterHeight.HasValue)
                {
                    var evt = new AlarmEvaluationEvent
                    {
                        AlarmType = "WaterDetected",
                        SiteId = tank.SiteId,
                        TankId = tank.Id,
                        PtsDeviceId = deviceId,
                        OccurredAtUtc = DateTime.UtcNow,
                        Data = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["waterHeight"] = tankMeasurement.WaterHeight,
                            ["waterVolume"] = tankMeasurement.WaterVolume
                        }
                    };
                    var evalResult = await EvaluateHandlersAsync(evt, cancellationToken);
                    if (evalResult.IsSuccess)
                    {
                        alarmsProcessed += evalResult.Data;
                    }
                    else
                    {
                        errors.Add($"Dynamic water evaluation: {evalResult.Message}");
                    }
                }

                var message = $"Processed {alarmsProcessed} alarms for tank {tank.Name}";
                if (errors.Any())
                {
                    message += $". Errors: {string.Join(", ", errors)}";
                }

                _logger.LogInformation("Processed tank measurement alarms for tank {TankName}: {AlarmsProcessed} alarms, {ErrorCount} errors",
                    tank.Name, alarmsProcessed, errors.Count);

                return errors.Any() ?
                    FMSResponse.FailedResponse(message) :
                    FMSResponse.SuccessResponse(message);
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
                //Cursor: Use Ptsdevice instead of Device for PTS operations
                var device = await _context.Ptsdevices
                    .Include(d => d.SiteNavigation)
                    .FirstOrDefaultAsync(d => d.Ptsid == deviceId, cancellationToken);

                if (device == null)
                {
                    _logger.LogWarning("PTS Device not found: {DeviceId}", deviceId);
                    return FMSResponse.FailedResponse($"PTS Device not found: {deviceId}");
                }

                var alarmRequest = new CreateAlarmNotificationRequest
                {
                    AlarmType = "DeviceDisconnection",
                    Category = "Device",
                    Message = $"PTS Device {device.Ptsid} has disconnected",
                    Data = new
                    {
                        Ptsdevice = device.Ptsid,
                        SiteName = device.SiteNavigation?.Name,
                        DisconnectedAt = DateTime.UtcNow,
                        LastActivity = device.LastActivity
                    },
                    TriggeredBy = SystemConstants.SystemAdministrator.DisplayName,
                    SiteId = device.Site,
                    PtsDeviceId = device.Ptsid //Cursor: Add PTS device reference
                };

                var result = await _notificationService.CreateAlarmNotificationAsync(alarmRequest, cancellationToken);

                // Also dispatch dynamic evaluation for DeviceOffline handlers if they exist
                bool hasDeviceOfflineHandlers = await _context.AlarmHandlers.AnyAsync(h => h.IsActive && h.AlarmType == "DeviceOffline", cancellationToken);
                if (hasDeviceOfflineHandlers)
                {
                    double offlineMinutes = device.LastActivity.HasValue ? (DateTime.UtcNow - device.LastActivity.Value).TotalMinutes : 0;
                    var evt = new AlarmEvaluationEvent
                    {
                        AlarmType = "DeviceOffline",
                        SiteId = device.Site,
                        PtsDeviceId = device.Ptsid,
                        OccurredAtUtc = DateTime.UtcNow,
                        Data = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["offlineMinutes"] = offlineMinutes,
                            ["lastActivityUtc"] = device.LastActivity
                        }
                    };
                    await EvaluateHandlersAsync(evt, cancellationToken);
                }

                _logger.LogInformation("Processed device disconnection alarm for PTS device {DeviceId}", deviceId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing device disconnection alarm for PTS device {DeviceId}", deviceId);
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

                // Dynamic trigger: missing fuel fill records for tanks
                bool hasMissingFuelFillHandlers = await _context.AlarmHandlers
                    .AnyAsync(h => h.IsActive && h.AlarmType == MissingFuelFillAlarmType, cancellationToken);
                if (hasMissingFuelFillHandlers)
                {
                    alarmsProcessed += await CheckMissingFuelFillRecordsAsync(cancellationToken);
                }

                var message = $"Processed {alarmsProcessed} scheduled alarm checks";
                if (errors.Any())
                {
                    message += $". Errors: {string.Join(", ", errors)}";
                }

                if (alarmsProcessed > 0 || errors.Count > 0)
                {
                    _logger.LogInformation("Completed scheduled alarm checks: {AlarmsProcessed} alarms, {ErrorCount} errors",
                        alarmsProcessed, errors.Count);
                }
                else
                {
                    _logger.LogDebug("Completed scheduled alarm checks: {AlarmsProcessed} alarms, {ErrorCount} errors",
                        alarmsProcessed, errors.Count);
                }

                return errors.Any() ?
                    FMSResponse.FailedResponse(message) :
                    FMSResponse.SuccessResponse(message);
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
                    PercentageFull = (decimal)(measurement.ProductVolume ?? 0) / tank.TankVolume * 100, //Cursor: Handle nullable ProductVolume with cast
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
                    PercentageFull = (decimal)(measurement.ProductVolume ?? 0) / tank.TankVolume * 100, //Cursor: Handle nullable ProductVolume with cast
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
                TriggeredBy = SystemConstants.SystemAdministrator.DisplayName,
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
                        var percentageFull = (decimal)(latestMeasurement.ProductVolume ?? 0) / tank.TankVolume * 100; //Cursor: Handle nullable ProductVolume with cast and use TankVolume

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

        private async Task<int> CheckMissingFuelFillRecordsAsync(CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;
                var tanks = await _context.Tanks
                    .Include(t => t.Site)
                    .ToListAsync(cancellationToken);

                if (tanks.Count == 0)
                {
                    return 0;
                }

                var tankIds = tanks.Select(t => t.Id).ToList();
                var lastFuelFillByTank = await _context.FuelRefills
                    .Where(fr => fr.TankId.HasValue &&
                                 tankIds.Contains(fr.TankId.Value) &&
                                 fr.IsDeleted != true)
                    .GroupBy(fr => fr.TankId!.Value)
                    .Select(g => new
                    {
                        TankId = g.Key,
                        LastFuelFillAt = g.Max(fr => fr.Date ?? fr.DateCreated)
                    })
                    .ToDictionaryAsync(x => x.TankId, x => x.LastFuelFillAt, cancellationToken);

                var created = 0;
                foreach (var tank in tanks)
                {
                    lastFuelFillByTank.TryGetValue(tank.Id, out var lastFuelFillAt);
                    var hasFuelFillRecord = lastFuelFillAt != default;
                    var hoursSinceLastFuelFill = hasFuelFillRecord
                        ? Math.Max(0, (now - lastFuelFillAt).TotalHours)
                        : (double?)null;

                    var evt = new AlarmEvaluationEvent
                    {
                        AlarmType = MissingFuelFillAlarmType,
                        SiteId = tank.SiteId,
                        TankId = tank.Id,
                        OccurredAtUtc = now,
                        Data = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
                        {
                            ["hasFuelFillRecord"] = hasFuelFillRecord,
                            ["hoursSinceLastFuelFill"] = hoursSinceLastFuelFill,
                            ["daysSinceLastFuelFill"] = hoursSinceLastFuelFill.HasValue ? hoursSinceLastFuelFill.Value / 24d : (double?)null,
                            ["lastFuelFillAt"] = hasFuelFillRecord ? lastFuelFillAt : null,
                            ["tankName"] = tank.Name,
                            ["siteName"] = tank.Site?.Name
                        }
                    };

                    var evaluationResult = await EvaluateHandlersAsync(evt, cancellationToken);
                    created += evaluationResult.Data;

                    if (!evaluationResult.IsSuccess)
                    {
                        _logger.LogWarning(
                            "Failed to evaluate missing fuel fill trigger for Tank {TankId}: {Message}",
                            tank.Id,
                            evaluationResult.Message);
                    }
                }

                return created;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking missing fuel fill records");
                return 0;
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
                // Create ActiveAlarm record first
                var activeAlarm = await _activeAlarmIntegration.CreateActiveAlarmFromAlarmHandler(
                    alarmRequest,
                    alarmRequest.AlarmId ?? 0,
                    cancellationToken);

                // Process pump-specific alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = Features.Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Features.Notification.Enums.WellKnownCategories.PtsDeviceAlarm,
                    Priority = Features.Notification.Enums.NotificationPriority.Medium,
                    Title = $"Pump Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Pump alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    //  DeviceId = alarmRequest.DeviceId,
                    AlarmId = alarmRequest.AlarmId,
                };

                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed pump alarm: {AlarmType}, ActiveAlarm ID: {ActiveAlarmId}",
                    alarmRequest.AlarmType, activeAlarm?.Id);

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
                // Create ActiveAlarm record first
                var activeAlarm = await _activeAlarmIntegration.CreateActiveAlarmFromAlarmHandler(
                    alarmRequest,
                    alarmRequest.AlarmId ?? 0,
                    cancellationToken);

                // Process tank-specific alarm logic
                var createRequest = new CreateNotificationRequest
                {
                    Type = Features.Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Features.Notification.Enums.WellKnownCategories.PtsTankAlarm,
                    Priority = Features.Notification.Enums.NotificationPriority.Medium,
                    Title = $"Tank Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Tank alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    TankId = alarmRequest.TankId,
                    AlarmId = alarmRequest.AlarmId,
                };

                // Add default recipients for tank alarms
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed tank alarm: {AlarmType} for tank {TankId}, ActiveAlarm ID: {ActiveAlarmId}",
                    alarmRequest.AlarmType, alarmRequest.TankId, activeAlarm?.Id);

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
                    Type = Features.Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Features.Notification.Enums.WellKnownCategories.PtsDeviceAlarm,
                    Priority = Features.Notification.Enums.NotificationPriority.Medium,
                    Title = $"Device Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Device alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    PtsDeviceId = alarmRequest.PtsDeviceId,
                    AlarmId = alarmRequest.AlarmId,

                };

                // Add default recipients for device alarms
                var result = await _notificationService.CreateNotificationAsync(createRequest, cancellationToken);

                _logger.LogInformation("Processed device alarm: {AlarmType}",
                    alarmRequest.AlarmType);

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
                    Type = Features.Notification.Enums.NotificationType.Alert,
                    CategoryId = (int)Features.Notification.Enums.WellKnownCategories.PtsDeviceAlarm,
                    Priority = Features.Notification.Enums.NotificationPriority.Medium,
                    Title = $"Alarm: {alarmRequest.AlarmType}",
                    Message = alarmRequest.Message ?? $"Alarm triggered: {alarmRequest.AlarmType}",
                    Data = alarmRequest.Data,
                    TriggerSource = "PTS",
                    TriggeredBy = alarmRequest.TriggeredBy ?? "System",
                    SiteId = alarmRequest.SiteId,
                    //DeviceId = alarmRequest.DeviceId,
                    TankId = alarmRequest.TankId,
                    VehicleId = alarmRequest.VehicleId,
                    AlarmId = alarmRequest.AlarmId

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

        public async Task<FMSResponse<List<object>>> GetAlarmHandlersAsync(int? policyId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var query = _context.AlarmHandlers.AsQueryable();
                if (policyId.HasValue)
                {
                    query = query.Where(h => h.NotificationPolicyId == policyId.Value);
                }
                var handlers = await query.Select(ah => new
                {
                    id = ah.Id,
                    name = ah.Name,
                    type = ah.AlarmType,
                    alarmId = ah.AlarmId,
                    config = ah.TriggerConditions,
                    isActive = ah.IsActive,
                    priority = ah.Priority,
                    cooldownMinutes = ah.CooldownMinutes,
                    maxNotificationsPerDay = ah.MaxNotificationsPerDay,
                    policyId = ah.NotificationPolicyId,
                    createdAt = ah.CreatedAt,
                    modifiedAt = ah.ModifiedAt
                }).ToListAsync(cancellationToken);
                return FMSResponse<List<object>>.Success(handlers.Cast<object>().ToList(), "Alarm handlers retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alarm handlers");
                return FMSResponse<List<object>>.Failed($"Error retrieving alarm handlers: {ex.Message}");
            }
        }

        public async Task<FMSResponse<int>> CreateAlarmHandlerAsync(CreateAlarmHandlerRequestDto request, string createdBy, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AlarmType))
                {
                    return FMSResponse<int>.Failed("AlarmType is required");
                }
                var policy = await _context.NotificationPolicies.FirstOrDefaultAsync(p => p.Id == request.NotificationPolicyId, cancellationToken);
                if (policy == null)
                {
                    return FMSResponse<int>.Failed("Notification policy not found");
                }
                var entity = new AlarmHandler
                {
                    NotificationPolicyId = request.NotificationPolicyId,
                    AlarmType = request.AlarmType,
                    Name = string.IsNullOrWhiteSpace(request.Name) ? request.AlarmType : request.Name!,
                    Description = request.Description,
                    TriggerConditions = request.TriggerConfig != null ? JsonConvert.SerializeObject(request.TriggerConfig) : null,
                    IsActive = request.IsActive,
                    Priority = string.IsNullOrWhiteSpace(request.Priority) ? policy.Priority : request.Priority!,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    //DeviceId = request.DeviceId,
                    CooldownMinutes = request.CooldownMinutes,
                    MaxNotificationsPerDay = request.MaxNotificationsPerDay,
                    CreatedBy = createdBy
                };
                _context.AlarmHandlers.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Alarm handler created {Id} for policy {PolicyId}", entity.Id, entity.NotificationPolicyId);
                return FMSResponse<int>.Success(entity.Id, "Alarm handler created");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating alarm handler");
                return FMSResponse<int>.Failed($"Error creating alarm handler: {ex.Message}");
            }
        }

        public async Task<FMSResponse> UpdateAlarmHandlerAsync(int id, UpdateAlarmHandlerRequestDto request, string modifiedBy, CancellationToken cancellationToken = default)
        {
            try
            {
                var entity = await _context.AlarmHandlers.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
                if (entity == null)
                {
                    return FMSResponse.FailedResponse("Alarm handler not found");
                }
                if (request.Name != null) { entity.Name = request.Name; }
                if (request.Description != null) { entity.Description = request.Description; }
                if (request.IsActive.HasValue) { entity.IsActive = request.IsActive.Value; }
                if (request.TriggerConfig != null) { entity.TriggerConditions = JsonConvert.SerializeObject(request.TriggerConfig); }
                if (request.Priority != null) { entity.Priority = request.Priority; }
                if (request.CooldownMinutes.HasValue) { entity.CooldownMinutes = request.CooldownMinutes.Value; }
                if (request.MaxNotificationsPerDay.HasValue) { entity.MaxNotificationsPerDay = request.MaxNotificationsPerDay.Value; }
                entity.ModifiedBy = modifiedBy;
                entity.ModifiedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Alarm handler {Id} updated", id);
                return FMSResponse.SuccessResponse("Alarm handler updated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating alarm handler {Id}", id);
                return FMSResponse.FailedResponse($"Error updating alarm handler: {ex.Message}");
            }
        }

        public async Task<FMSResponse> DeleteAlarmHandlerAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var entity = await _context.AlarmHandlers.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
                if (entity == null)
                {
                    return FMSResponse.FailedResponse("Alarm handler not found");
                }
                _context.AlarmHandlers.Remove(entity);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Alarm handler {Id} deleted", id);
                return FMSResponse.SuccessResponse("Alarm handler deleted");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting alarm handler {Id}", id);
                return FMSResponse.FailedResponse($"Error deleting alarm handler: {ex.Message}");
            }
        }

        public Task<FMSResponse<List<AlarmHandlerTypeMetadataDto>>> GetAlarmHandlerTypesAsync(int? categoryId = null, CancellationToken cancellationToken = default)
        {
            _ = categoryId;
            _ = cancellationToken;

            static string ToLabel(string type)
            {
                if (string.IsNullOrWhiteSpace(type))
                {
                    return type;
                }

                var chars = new List<char>(type.Length + 8);
                for (var i = 0; i < type.Length; i++)
                {
                    var current = type[i];
                    if (i > 0 && char.IsUpper(current) && (char.IsLower(type[i - 1]) || char.IsDigit(type[i - 1])))
                    {
                        chars.Add(' ');
                    }
                    chars.Add(current);
                }

                return new string(chars.ToArray());
            }

            static AlarmHandlerTypeMetadataDto SimpleType(string type, string description)
            {
                return new AlarmHandlerTypeMetadataDto
                {
                    Type = type,
                    Label = ToLabel(type),
                    Description = description,
                    Fields = new List<AlarmHandlerFieldMetadataDto>()
                };
            }

            var list = new List<AlarmHandlerTypeMetadataDto>
            {
                new()
                {
                    Type = "TankLevelBelowThreshold",
                    Label = "Tank Level Below Threshold",
                    Description = "Triggers when tank percentage full falls below the configured threshold.",
                    Fields = new List<AlarmHandlerFieldMetadataDto>
                    {
                        new() { Name = "threshold", Label = "Threshold", FieldType = "number", Unit = "%", Required = true, DefaultValue = 10 },
                        new() { Name = "hysteresis", Label = "Hysteresis", FieldType = "number", Unit = "%", Required = false, DefaultValue = 1 }
                    }
                },
                new()
                {
                    Type = "DeviceOffline",
                    Label = "Device Offline",
                    Description = "Triggers when a device remains offline for at least the configured duration.",
                    Fields = new List<AlarmHandlerFieldMetadataDto>
                    {
                        new() { Name = "offlineDurationMinutes", Label = "Offline Duration (min)", FieldType = "number", Required = true, DefaultValue = 30 }
                    }
                },
                new()
                {
                    Type = "WaterDetected",
                    Label = "Water Detected",
                    Description = "Triggers when water is present in tank readings.",
                    Fields = new List<AlarmHandlerFieldMetadataDto>
                    {
                        new() { Name = "sustainedForMinutes", Label = "Sustained For (min)", FieldType = "number", Required = false, DefaultValue = 5 }
                    }
                },
                new()
                {
                    Type = MissingFuelFillAlarmType,
                    Label = "Fuel Fill Not Posted",
                    Description = "Triggers when a fuel fill record is missing for a configured period.",
                    Fields = new List<AlarmHandlerFieldMetadataDto>
                    {
                        new() { Name = "missingForDays", Label = "Missing For (days)", FieldType = "number", Unit = "days", Required = true, DefaultValue = 1 },
                        new() { Name = "includeNeverPosted", Label = "Include Tanks With No History", FieldType = "boolean", Required = false, DefaultValue = true }
                    }
                },
                SimpleType("DeviceDisconnection", "Device disconnected alarm generated by connectivity monitoring."),
                SimpleType("StaleData", "No recent telemetry from the device or tank."),
                SimpleType("DiscrepancyDetected", "Reconciliation discrepancy alarm."),
                SimpleType("UnusualConsumption", "Consumption pattern outside expected bounds."),
                SimpleType("CapacityLimit", "Tank capacity threshold reached."),
                SimpleType("LowTankVolume", "Tank volume is below configured threshold."),
                SimpleType("HighTankVolume", "Tank volume is above configured threshold."),
                SimpleType("WaterDetection", "Alias alarm type for water detection events."),
                SimpleType("TemperatureAlarm", "Tank temperature is outside expected range."),
                SimpleType("TankSensorVariance", "Sensor variance detected for tank measurements."),
                SimpleType("TankCriticalLowLevel", "Critical low product level alarm from probe status."),
                SimpleType("TankLowLevel", "Low product level alarm from probe status."),
                SimpleType("TankCriticalHighLevel", "Critical high product level alarm from probe status."),
                SimpleType("TankHighLevel", "High product level alarm from probe status."),
                SimpleType("TankHighWaterLevel", "High water level alarm from probe status."),
                SimpleType("TankLeakage", "Tank leakage alarm from probe status."),
                SimpleType("ProbeError", "Probe error alarm."),
                SimpleType("ProbeOffline", "Probe offline alarm."),
                SimpleType("PTSLowBattery", "PTS controller low battery alarm (code 1)."),
                SimpleType("PTSHighTemperature", "PTS controller high temperature alarm (code 2)."),
                SimpleType("PTSPowerDown", "PTS controller power down alarm (code 3)."),
                SimpleType("PTSRestart", "PTS controller restart alarm (code 4)."),
                SimpleType("PumpOffline", "Pump offline alarm (code 1)."),
                SimpleType("PumpOverfilling", "Pump overfilling alarm (generic code 20)."),
                SimpleType("PumpOfflineMode", "Pump offline mode filling alarm (generic code 30)."),
                SimpleType("ReaderOffline", "Reader offline alarm (code 1)."),
                SimpleType("ReaderError", "Reader error alarm (code 2)."),
                SimpleType("PriceBoardOffline", "Price board offline alarm (code 1)."),
                SimpleType("PriceBoardError", "Price board error alarm (code 2).")
            };

            for (var nozzle = 1; nozzle <= 6; nozzle++)
            {
                list.Add(SimpleType($"PumpOverfillingNozzle{nozzle}", $"Pump overfilling alarm for nozzle {nozzle}."));
                list.Add(SimpleType($"PumpOfflineModeNozzle{nozzle}", $"Pump offline mode filling alarm for nozzle {nozzle}."));
            }

            return Task.FromResult(FMSResponse<List<AlarmHandlerTypeMetadataDto>>.Success(list, "Alarm handler types retrieved"));
        }

        /// <summary>
        /// Core evaluation engine: finds applicable handlers, evaluates trigger conditions, enforces cooldown & daily caps, and emits notifications.
        /// Trigger conditions JSON is expected to be a flat object of simple comparisons, e.g. {"threshold":10,"operator":"lt","field":"percentageFull"} OR
        /// more generic multi-field form: {"rules":[{"field":"temperature","op":">","value":50}]} . Minimal implementation – extend as needed.
        /// </summary>
        public async Task<FMSResponse<int>> EvaluateHandlersAsync(AlarmEvaluationEvent evt, CancellationToken cancellationToken = default)
        {
            try
            {
                var now = DateTime.UtcNow;
                // Load active handlers filtered by type + context scoping (site/tank/device) + active policy
                var handlersQuery = _context.AlarmHandlers
                    .Include(h => h.NotificationPolicy)
                    .Where(h => h.IsActive && h.NotificationPolicy.IsActive && h.AlarmType == evt.AlarmType);
                if (evt.SiteId.HasValue) { handlersQuery = handlersQuery.Where(h => h.SiteId == null || h.SiteId == evt.SiteId); }
                if (evt.TankId.HasValue) { handlersQuery = handlersQuery.Where(h => h.TankId == null || h.TankId == evt.TankId); }
                //if (evt.DeviceId.HasValue) { handlersQuery = handlersQuery.Where (h => h.DeviceId == null || h.DeviceId == evt.DeviceId); }

                var handlers = await handlersQuery.ToListAsync(cancellationToken);
                if (handlers.Count == 0) { return FMSResponse<int>.Success(0, "No matching handlers"); }

                int created = 0;
                var errors = new List<string>();
                foreach (var h in handlers)
                {
                    try
                    {
                        if (!PassesCooldown(h, now)) { continue; }
                        if (!PassesDailyCap(h, now)) { continue; }
                        if (!EvaluateTriggerConditions(h.TriggerConditions, evt)) { continue; }

                        // Build notification from policy + handler context
                        var policy = h.NotificationPolicy;
                        var title = h.MessageTemplate ?? policy.TitleTemplate;
                        var message = policy.MessageTemplate ?? h.Description;

                        if (string.IsNullOrWhiteSpace(title))
                        {
                            title = evt.AlarmType == MissingFuelFillAlarmType
                                ? "Fuel Fill Record Missing"
                                : $"{evt.AlarmType} triggered";
                        }

                        if (string.IsNullOrWhiteSpace(message))
                        {
                            message = evt.AlarmType == MissingFuelFillAlarmType
                                ? BuildMissingFuelFillMessage(evt)
                                : $"Alarm {evt.AlarmType} matched conditions";
                        }
                        var request = new CreateNotificationRequest
                        {
                            Type = Enum.TryParse<Features.Notification.Enums.NotificationType>(policy.NotificationType, true, out var nt) ? nt : Features.Notification.Enums.NotificationType.Alert,
                            CategoryId = policy.NotificationCategoryId,
                            Priority = Enum.TryParse<Features.Notification.Enums.NotificationPriority>(h.Priority, true, out var pr) ? pr : Features.Notification.Enums.NotificationPriority.Medium,
                            Title = title,
                            Message = message,
                            TriggerSource = "AlarmHandler",
                            TriggeredBy = "System",
                            SiteId = evt.SiteId ?? h.SiteId,
                            TankId = evt.TankId ?? h.TankId,
                            PtsDeviceId = evt.PtsDeviceId,
                            VehicleId = null,
                            Data = new
                            {
                                handlerId = h.Id,
                                evt.AlarmType,
                                evt.OccurredAtUtc,
                                telemetry = evt.Data,
                                handlerTrigger = h.TriggerConditions
                            }
                        };
                        var result = await _notificationService.CreateNotificationAsync(request, cancellationToken);
                        // Track execution record
                        _context.AlarmHandlerExecutions.Add(new AlarmHandlerExecution
                        {
                            AlarmHandlerId = h.Id,
                            NotificationId = result.IsSuccess ? result.Data : null,
                            Success = result.IsSuccess,
                            ErrorMessage = result.IsSuccess ? null : result.Message,
                            TriggerData = JsonConvert.SerializeObject(evt),
                            ExecutionDetails = result.Message,
                            ExecutedAt = now
                        });
                        if (result.IsSuccess)
                        {
                            h.TriggerCount += 1;
                            h.LastTriggeredAt = now;
                            created++;
                        }
                        else
                        {
                            errors.Add($"Handler {h.Id}: {result.Message}");
                        }
                    }
                    catch (Exception exEval)
                    {
                        errors.Add($"Handler {h.Id} exception: {exEval.Message}");
                        _context.AlarmHandlerExecutions.Add(new AlarmHandlerExecution
                        {
                            AlarmHandlerId = h.Id,
                            Success = false,
                            ErrorMessage = exEval.Message,
                            TriggerData = JsonConvert.SerializeObject(evt),
                            ExecutedAt = now
                        });
                    }
                }
                await _context.SaveChangesAsync(cancellationToken);
                var msg = $"Created {created} notifications for {evt.AlarmType}" + (errors.Count > 0 ? $"; errors: {string.Join("; ", errors)}" : string.Empty);
                if (errors.Count == 0)
                {
                    return FMSResponse<int>.Success(created, msg);
                }
                return new FMSResponse<int>(false, msg, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating alarm handlers for {AlarmType}", evt.AlarmType);
                return FMSResponse<int>.Failed($"Evaluation failed: {ex.Message}");
            }
        }

        private bool PassesCooldown(AlarmHandler handler, DateTime now)
        {
            if (handler.CooldownMinutes <= 0 || handler.LastTriggeredAt == null)
            {
                return true;
            }
            return (now - handler.LastTriggeredAt.Value).TotalMinutes >= handler.CooldownMinutes;
        }

        private bool PassesDailyCap(AlarmHandler handler, DateTime now)
        {
            if (handler.MaxNotificationsPerDay <= 0)
            {
                return true;
            }
            // Approximation: count executions today. Could optimize with cached counter.
            DateTime today = now.Date;
            int countToday = _context.AlarmHandlerExecutions.Count(e => e.AlarmHandlerId == handler.Id && e.ExecutedAt >= today);
            return countToday < handler.MaxNotificationsPerDay;
        }

        private bool EvaluateTriggerConditions(string? json, Features.Notification.DTOs.AlarmHandlers.AlarmEvaluationEvent evt)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return true; // no condition = always match
            }
            try
            {
                Newtonsoft.Json.Linq.JToken node = JsonConvert.DeserializeObject<Newtonsoft.Json.Linq.JToken>(json);
                if (node == null)
                {
                    return true;
                }
                // Specialized fast-paths based on AlarmType & known config schemas
                if (evt.AlarmType == "TankLevelBelowThreshold" && node.Type == Newtonsoft.Json.Linq.JTokenType.Object)
                {
                    var thresholdToken = ((Newtonsoft.Json.Linq.JObject)node)["threshold"];
                    if (thresholdToken != null && evt.Data.TryGetValue("percentageFull", out object pctObj) && TryAsDecimal(pctObj, out var pct) && TryAsDecimal(thresholdToken, out var thresholdVal))
                    {
                        // optional hysteresis: only fire when below threshold (threshold) and not above threshold + hysteresis
                        decimal hysteresis = 0;
                        var hysteresisToken = ((Newtonsoft.Json.Linq.JObject)node)["hysteresis"];
                        if (hysteresisToken != null && TryAsDecimal(hysteresisToken, out var hVal)) { hysteresis = hVal; }
                        return pct <= thresholdVal; // hysteresis handling on reset handled by cooldown logic for simplicity
                    }
                }
                if (evt.AlarmType == "WaterDetected" && node.Type == Newtonsoft.Json.Linq.JTokenType.Object)
                {
                    // Any waterHeight > 0 qualifies; sustainedForMinutes not implemented yet
                    if (evt.Data.TryGetValue("waterHeight", out object waterObj) && TryAsDecimal(waterObj, out var wh))
                    {
                        return wh > 0;
                    }
                }
                if (evt.AlarmType == "DeviceOffline" && node.Type == Newtonsoft.Json.Linq.JTokenType.Object)
                {
                    var offlineDurToken = ((Newtonsoft.Json.Linq.JObject)node)["offlineDurationMinutes"];
                    if (offlineDurToken != null && evt.Data.TryGetValue("offlineMinutes", out object offlineObj) && TryAsDecimal(offlineObj, out var offlineMins) && TryAsDecimal(offlineDurToken, out var cfgMins))
                    {
                        return offlineMins >= cfgMins;
                    }
                }
                if (evt.AlarmType == MissingFuelFillAlarmType && node.Type == Newtonsoft.Json.Linq.JTokenType.Object)
                {
                    var config = (Newtonsoft.Json.Linq.JObject)node;
                    var missingForDaysToken = config["missingForDays"] ?? config["thresholdDays"];
                    var missingForHoursToken = config["missingForHours"] ?? config["thresholdHours"]; // backward compatibility
                    var includeNeverPostedToken = config["includeNeverPosted"];

                    var includeNeverPosted = true;
                    if (includeNeverPostedToken != null && TryAsBoolean(includeNeverPostedToken, out var includeNeverPostedValue))
                    {
                        includeNeverPosted = includeNeverPostedValue;
                    }

                    if (evt.Data.TryGetValue("hasFuelFillRecord", out object hasRecordObj) &&
                        TryAsBoolean(hasRecordObj, out var hasRecord) &&
                        !hasRecord)
                    {
                        return includeNeverPosted;
                    }

                    if (missingForDaysToken != null &&
                        evt.Data.TryGetValue("daysSinceLastFuelFill", out object daysObj) &&
                        TryAsDecimal(daysObj, out var daysSinceLastFuelFill) &&
                        TryAsDecimal(missingForDaysToken, out var missingForDays))
                    {
                        return daysSinceLastFuelFill >= missingForDays;
                    }

                    if (missingForHoursToken != null &&
                        evt.Data.TryGetValue("hoursSinceLastFuelFill", out object hoursObj) &&
                        TryAsDecimal(hoursObj, out var hoursSinceLastFuelFill) &&
                        TryAsDecimal(missingForHoursToken, out var missingForHours))
                    {
                        return hoursSinceLastFuelFill >= missingForHours;
                    }

                    return false;
                }
                // Support simplified schema: {"field":"temperature","operator":"gt","value":50}
                if (node.Type == Newtonsoft.Json.Linq.JTokenType.Object)
                {
                    Newtonsoft.Json.Linq.JObject obj = (Newtonsoft.Json.Linq.JObject)node;
                    if (obj.TryGetValue("rules", out Newtonsoft.Json.Linq.JToken rulesToken) && rulesToken is Newtonsoft.Json.Linq.JArray arr)
                    {
                        foreach (Newtonsoft.Json.Linq.JToken r in arr)
                        {
                            if (!EvaluateSingleRule(r as Newtonsoft.Json.Linq.JObject, evt))
                            {
                                return false; // AND semantics
                            }
                        }
                        return true;
                    }
                    return EvaluateSingleRule(obj, evt);
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse trigger conditions; defaulting to match");
                return true; // fail open to avoid missing alerts
            }
        }

        private bool EvaluateSingleRule(Newtonsoft.Json.Linq.JObject? rule, Features.Notification.DTOs.AlarmHandlers.AlarmEvaluationEvent evt)
        {
            if (rule == null) { return true; }
            var field = rule.Value<string>("field") ?? rule.Value<string>("Field") ?? rule.Properties().FirstOrDefault(p => p.Name.Equals("threshold", StringComparison.OrdinalIgnoreCase))?.Name;
            if (string.IsNullOrWhiteSpace(field))
            {
                return true;
            }
            if (!evt.Data.TryGetValue(field, out object raw))
            {
                return false;
            }
            string op = rule.Value<string>("operator") ?? rule.Value<string>("op") ?? "eq";
            Newtonsoft.Json.Linq.JToken valueToken = rule["value"] ?? rule[field];
            object expected = valueToken?.ToObject<object>();
            // numeric comparison if both numeric
            if (TryAsDecimal(raw, out decimal actualNum) && TryAsDecimal(expected, out decimal expectedNum))
            {
                return op.ToLowerInvariant() switch
                {
                    ">"
                    or "gt" => actualNum > expectedNum,
                    ">="
                or "gte" => actualNum >= expectedNum,
                    "<"
                or "lt" => actualNum < expectedNum,
                    "<="
                or "lte" => actualNum <= expectedNum,
                    "!="
                or "ne" => actualNum != expectedNum,
                    _ => actualNum == expectedNum
                };
            }
            // string equality fallback
            string actualStr = raw?.ToString();
            string expectedStr = expected?.ToString();
            return op.ToLowerInvariant() switch
            {
                "!="
                or "ne" => !string.Equals(actualStr, expectedStr, StringComparison.OrdinalIgnoreCase),
                _ => string.Equals(actualStr, expectedStr, StringComparison.OrdinalIgnoreCase)
            };
        }

        private bool TryAsDecimal(object? v, out decimal d)
        {
            if (v is Newtonsoft.Json.Linq.JToken token)
            {
                if (token.Type == Newtonsoft.Json.Linq.JTokenType.Integer || token.Type == Newtonsoft.Json.Linq.JTokenType.Float)
                {
                    var numeric = token.ToObject<decimal?>();
                    if (numeric.HasValue)
                    {
                        d = numeric.Value;
                        return true;
                    }
                }
                if (token.Type == Newtonsoft.Json.Linq.JTokenType.String)
                {
                    var tokenString = token.ToObject<string>();
                    if (!string.IsNullOrWhiteSpace(tokenString) && decimal.TryParse(tokenString, out var tokenParsed))
                    {
                        d = tokenParsed;
                        return true;
                    }
                }
            }
            if (v is decimal dec) { d = dec; return true; }
            if (v is double db) { d = (decimal)db; return true; }
            if (v is float fl) { d = (decimal)fl; return true; }
            if (v is int i) { d = i; return true; }
            if (v is long l) { d = l; return true; }
            if (v is string s && decimal.TryParse(s, out var parsed)) { d = parsed; return true; }
            d = 0;
            return false;
        }

        private string BuildMissingFuelFillMessage(AlarmEvaluationEvent evt)
        {
            var tankName = evt.Data.TryGetValue("tankName", out var tankObj) ? tankObj?.ToString() : null;
            var siteName = evt.Data.TryGetValue("siteName", out var siteObj) ? siteObj?.ToString() : null;
            var tankLabel = string.IsNullOrWhiteSpace(tankName) ? $"Tank {evt.TankId?.ToString() ?? "N/A"}" : tankName;
            var siteLabel = string.IsNullOrWhiteSpace(siteName) ? $"Site {evt.SiteId?.ToString() ?? "N/A"}" : siteName;

            if (evt.Data.TryGetValue("hasFuelFillRecord", out var hasRecordObj) &&
                TryAsBoolean(hasRecordObj, out var hasRecord) &&
                !hasRecord)
            {
                return $"No fuel fill record has been posted yet for {tankLabel} at {siteLabel}. Please verify operations and post the required fuel fill entry.";
            }

            if (evt.Data.TryGetValue("daysSinceLastFuelFill", out var daysObj) &&
                TryAsDecimal(daysObj, out var daysSinceLastFuelFill))
            {
                return $"No fuel fill record has been posted for {tankLabel} at {siteLabel} for {Math.Round(daysSinceLastFuelFill, 1):0.0} day(s). Please verify operations and post pending fuel fill entries.";
            }

            return $"Fuel fill record is missing for {tankLabel} at {siteLabel}. Please verify operations and post the required fuel fill entry.";
        }

        private bool TryAsBoolean(object? v, out bool value)
        {
            if (v is bool b)
            {
                value = b;
                return true;
            }

            if (v is string s && bool.TryParse(s, out var parsed))
            {
                value = parsed;
                return true;
            }

            if (v is Newtonsoft.Json.Linq.JToken token)
            {
                if (token.Type == Newtonsoft.Json.Linq.JTokenType.Boolean)
                {
                    var tokenBool = token.ToObject<bool?>();
                    if (tokenBool.HasValue)
                    {
                        value = tokenBool.Value;
                        return true;
                    }
                }

                if (token.Type == Newtonsoft.Json.Linq.JTokenType.String)
                {
                    var tokenString = token.ToObject<string>();
                    if (!string.IsNullOrWhiteSpace(tokenString) && bool.TryParse(tokenString, out var tokenParsed))
                    {
                        value = tokenParsed;
                        return true;
                    }
                }
            }

            value = false;
            return false;
        }
    }
}
