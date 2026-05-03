/**
 * File: UploadStatusProbeProcessingService.cs
 * Purpose: Handles deferred UploadStatus probe persistence, stock averaging, and alarm/event generation.
 * Dependencies: GpsdataContext, Redis, SystemConfigurationService, ProbeReadingEnrichmentService, EventExpressionEngine
 * Last Modified: 2026-03-26
 *
 * Key Functions:
 * - ProcessAsync(): Executes the full deferred probe-processing pipeline for a device UploadStatus payload.
 * - ProcessLiveProbeStatusInternalLogicAsync(): Persists probe readings and updates physical stock.
 * - ProcessProbeAlarmsFromUploadStatusAsync(): Emits probe alarm and system-level tank events with Redis cooldowns.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Configuration;
using FMS.Application.Features.FMS.Tank;
using FMS.Application.ModelsDTOs.PTS.Common;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.TankManagement.Deliveries.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.PTS;
using FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using SystemConfigurationKeys = FMS.Application.Configuration.SystemConfiguration;

namespace FMS.Application.Features.TankManagement.TankMeasurements.Services
{
    public class UploadStatusProbeProcessingService : IUploadStatusProbeProcessingService
    {
        private readonly ILogger<UploadStatusProbeProcessingService> _logger;
        private readonly GpsdataContext _context;
        private readonly IDatabase _redisDb;
        private readonly ISystemConfigurationService _systemConfigurationService;
        private readonly IProbeReadingEnrichmentService _probeReadingEnrichmentService;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public UploadStatusProbeProcessingService(
            ILogger<UploadStatusProbeProcessingService> logger,
            GpsdataContext context,
            IConnectionMultiplexer redisConnection,
            ISystemConfigurationService systemConfigurationService,
            IProbeReadingEnrichmentService probeReadingEnrichmentService,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _context = context;
            _redisDb = redisConnection.GetDatabase();
            _systemConfigurationService = systemConfigurationService;
            _probeReadingEnrichmentService = probeReadingEnrichmentService;
            _serviceScopeFactory = serviceScopeFactory;
        }

        public async Task ProcessAsync(string deviceId, ProbeStatus probeStatus, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(deviceId) || probeStatus == null)
            {
                return;
            }

            await ProcessLiveProbeStatusInternalLogicAsync(deviceId, probeStatus, cancellationToken);
            await ProcessProbeAlarmsFromUploadStatusAsync(deviceId, probeStatus, cancellationToken);
        }

        private async Task ProcessLiveProbeStatusInternalLogicAsync(string deviceId, ProbeStatus probeStatus, CancellationToken cancellationToken)
        {
            _logger.LogTrace("[UploadStatus][Deferred] Processing Probe Status for {DeviceId}", deviceId);

            if (probeStatus?.OnlineStatus?.Measurements == null)
            {
                return;
            }

            var usePtsProbeReadings = await _systemConfigurationService.GetPtsUsePtsProbeReadingsAsync(cancellationToken);
            if (!usePtsProbeReadings)
            {
                return;
            }

            var measurements = probeStatus.OnlineStatus.Measurements
                .Where(HasUsableProbeMeasurement)
                .ToList();

            if (measurements.Count == 0)
            {
                return;
            }

            var linkedTanks = await _context.Tanks
                .Where(t => t.PtsId == deviceId)
                .ToListAsync(cancellationToken);

            if (linkedTanks.Count == 0)
            {
                return;
            }

            var updateIntervalSeconds = await _systemConfigurationService
                .GetPtsUploadStatusPhysicalStockUpdateIntervalSecondsAsync(cancellationToken);
            if (updateIntervalSeconds <= 0)
            {
                updateIntervalSeconds = SystemConfigurationKeys.DEFAULT_PTS_UPLOADSTATUS_PHYSICAL_STOCK_UPDATE_INTERVAL_SECONDS;
            }

            var updatesApplied = 0;

            foreach (var tank in linkedTanks)
            {
                if (!tank.UsePtsProbeReadings)
                {
                    continue;
                }

                var probeMeasurement = ResolveProbeMeasurementForTank(tank, measurements, linkedTanks.Count);
                if (probeMeasurement == null)
                {
                    continue;
                }

                var resolvedProductVolume = await _probeReadingEnrichmentService
                    .ResolveProductVolumeAsync(
                        tank.Id,
                        tank.ProbeNumber ?? probeMeasurement.ProbeNumber,
                        tank.ProductVolumeSource,
                        tank.CalibrationChartSource,
                        probeMeasurement.ProductVolume,
                        probeMeasurement.ProductHeight,
                        cancellationToken);

                probeMeasurement.ProductVolume = resolvedProductVolume.HasValue
                    ? (float?)resolvedProductVolume.Value
                    : null;

                if (ShouldUpdatePhysicalStockFromUploadStatus(tank))
                {
                    var updated = await TryApplyAveragedPhysicalStockUpdateAsync(tank, probeMeasurement, updateIntervalSeconds);
                    if (updated)
                    {
                        updatesApplied++;
                    }
                }

                var shouldSave = await _probeReadingEnrichmentService
                    .ShouldSaveReadingAsync(deviceId, tank.Id, probeMeasurement.ProductHeight, cancellationToken);

                if (shouldSave)
                {
                    _context.UploadStatusProbeReadings.Add(new UploadStatusProbeReading
                    {
                        DateTime = DateTime.UtcNow,
                        DeviceId = deviceId,
                        ProbeNumber = probeMeasurement.ProbeNumber,
                        ProductHeight = probeMeasurement.ProductHeight,
                        WaterHeight = probeMeasurement.WaterHeight,
                        Temperature = probeMeasurement.Temperature,
                        ProductVolume = probeMeasurement.ProductVolume,
                        WaterVolume = probeMeasurement.WaterVolume,
                        ProductTcvolume = probeMeasurement.ProductTemperatureCompensatedVolume,
                        ProductDensity = probeMeasurement.ProductDensity,
                        ProductMass = probeMeasurement.ProductMass,
                        TankFillingPercentage = probeMeasurement.TankFillingPercentage,
                        ProductUllage = probeMeasurement.ProductUllage,
                        TankId = tank.Id,
                        SiteId = tank.SiteId,
                        FuelGradeId = tank.FuelGradeId,
                        FuelGradeName = tank.FuelGradeName
                    });

                    await _probeReadingEnrichmentService
                        .MarkReadingSavedAsync(deviceId, tank.Id, probeMeasurement.ProductHeight);
                }

                var capturedTankId = tank.Id;
                var capturedProbe = probeMeasurement;
                var capturedDeviceId = deviceId;
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var scope = _serviceScopeFactory.CreateScope();
                        var detector = scope.ServiceProvider.GetRequiredService<IServerSideDeliveryDetectionService>();
                        await detector.ProcessProbeReadingAsync(capturedTankId, capturedProbe, DateTime.UtcNow, capturedDeviceId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[UploadStatus][Deferred] Server-side ITD detection failed for tank {TankId}", capturedTankId);
                    }
                });
            }

            if (updatesApplied > 0 || _context.ChangeTracker.HasChanges())
            {
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation(
                    "[UploadStatus][Deferred] Updated physical stock from probe averages for {UpdatedCount} tank(s) on device {DeviceId}",
                    updatesApplied,
                    deviceId);
            }
        }

        private async Task ProcessProbeAlarmsFromUploadStatusAsync(
            string deviceId,
            ProbeStatus probeStatus,
            CancellationToken cancellationToken)
        {
            try
            {
                if (probeStatus?.OnlineStatus == null)
                {
                    return;
                }

                var onlineStatus = probeStatus.OnlineStatus;
                var device = await _context.Ptsdevices
                    .Include(d => d.SiteNavigation)
                    .FirstOrDefaultAsync(d => d.Ptsid == deviceId, cancellationToken);

                var linkedTanks = await _context.Tanks
                    .Where(t => t.PtsId == deviceId)
                    .ToListAsync(cancellationToken);

                if (onlineStatus.CriticalLowProductAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.CriticalLowProductAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankCriticalLowLevel", "Critical", DiscrepancySeverity.Critical,
                            "Critical low product level detected",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.LowProductAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.LowProductAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankLowLevel", "High", DiscrepancySeverity.High,
                            "Low product level detected",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.CriticalHighProductAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.CriticalHighProductAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankCriticalHighLevel", "Critical", DiscrepancySeverity.Critical,
                            "Critical high product level detected - potential overflow",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.HighProductAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.HighProductAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankHighLevel", "High", DiscrepancySeverity.High,
                            "High product level detected",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.HighWaterAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.HighWaterAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankHighWaterLevel", "High", DiscrepancySeverity.High,
                            "High water level detected in tank",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.TankLeakageAlarms?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.TankLeakageAlarms.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "TankLeakage", "Critical", DiscrepancySeverity.Critical,
                            "Potential tank leakage detected - immediate investigation required",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }

                if (onlineStatus.Errors?.Any() == true)
                {
                    foreach (var probeId in onlineStatus.Errors.Where(p => p.HasValue))
                    {
                        await CreateProbeAlarmIfNotInCooldownAsync(
                            deviceId, device, linkedTanks, probeId!.Value,
                            "ProbeError", "Medium", DiscrepancySeverity.Medium,
                            "Probe error detected",
                            onlineStatus.Measurements, cancellationToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus][Deferred] Error processing probe alarms for device {DeviceId}", deviceId);
            }
        }

        private async Task CreateProbeAlarmIfNotInCooldownAsync(
            string deviceId,
            Ptsdevice? device,
            List<Tank> linkedTanks,
            int probeId,
            string alarmType,
            string priority,
            DiscrepancySeverity severity,
            string message,
            List<ProbeMeasurement>? measurements,
            CancellationToken cancellationToken)
        {
            try
            {
                var cooldownKey = $"probe_alarm_cooldown:{deviceId}:{alarmType}:{probeId}";
                var cooldownExists = await _redisDb.KeyExistsAsync(cooldownKey);

                if (cooldownExists)
                {
                    _logger.LogTrace("[UploadStatus][Deferred] Probe alarm {AlarmType} for device {DeviceId} probe {ProbeId} is in cooldown",
                        alarmType, deviceId, probeId);
                    return;
                }

                await _redisDb.StringSetAsync(cooldownKey, "1", TimeSpan.FromMinutes(5));

                var tank = linkedTanks?.FirstOrDefault(t => t.ProbeNumber == probeId);
                var measurement = measurements?.FirstOrDefault(m => m.ProbeNumber == probeId);

                var probeAlarmEvent = new TankLevelEvent
                {
                    SiteId = tank?.SiteId ?? device?.Site,
                    TankId = tank?.Id,
                    PtsDeviceId = deviceId,
                    Severity = priority,
                    Message = message,
                    TankName = tank?.Name ?? $"Probe #{probeId}",
                    ProductVolume = measurement?.ProductVolume.HasValue == true ? (decimal)measurement.ProductVolume.Value : 0,
                    TankCapacity = tank?.TankVolume ?? 0,
                    PercentageFull = measurement?.TankFillingPercentage ?? 0,
                    CurrentLevel = measurement?.ProductHeight.HasValue == true ? (decimal)measurement.ProductHeight.Value : 0,
                    WaterLevel = measurement?.WaterHeight.HasValue == true ? (decimal)measurement.WaterHeight.Value : 0,
                    Temperature = measurement?.Temperature.HasValue == true ? (decimal)measurement.Temperature.Value : 0,
                    UllageVolume = measurement?.ProductUllage.HasValue == true ? (decimal)measurement.ProductUllage.Value : 0,
                };
                probeAlarmEvent.Data["AlarmType"] = alarmType;
                probeAlarmEvent.Data["ProbeId"] = probeId;

                using var eventEngineScope = _serviceScopeFactory.CreateScope();
                var scopedEventEngine = eventEngineScope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();
                await scopedEventEngine.ProcessAsync(probeAlarmEvent, cancellationToken);

                _logger.LogInformation(
                    "[UploadStatus][Deferred] Probe alarm event {AlarmType} for device {DeviceId} probe {ProbeId}: {Message}",
                    alarmType, deviceId, probeId, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus][Deferred] Error processing probe alarm event {AlarmType} for device {DeviceId} probe {ProbeId}",
                    alarmType, deviceId, probeId);
            }
        }

        private ProbeMeasurement? ResolveProbeMeasurementForTank(
            Tank tank,
            IReadOnlyCollection<ProbeMeasurement> measurements,
            int linkedTankCount)
        {
            if (tank.ProbeNumber.HasValue && tank.ProbeNumber.Value > 0)
            {
                return measurements.FirstOrDefault(m => m.ProbeNumber == tank.ProbeNumber.Value);
            }

            if (linkedTankCount == 1)
            {
                return measurements.OrderBy(m => m.ProbeNumber).FirstOrDefault();
            }

            _logger.LogDebug(
                "[UploadStatus][Deferred] Skipping tank {TankId} on device {DeviceId}: probe binding not configured and multiple tanks are linked.",
                tank.Id,
                tank.PtsId);

            return null;
        }

        private static bool HasUsableProbeMeasurement(ProbeMeasurement? measurement)
        {
            if (measurement == null)
            {
                return false;
            }

            var hasUsableVolume = measurement.ProductVolume.HasValue && measurement.ProductVolume.Value >= 0;
            var hasUsableHeight = measurement.ProductHeight.HasValue && measurement.ProductHeight.Value > 0;

            return hasUsableVolume || hasUsableHeight;
        }

        private static bool ShouldUpdatePhysicalStockFromUploadStatus(Tank tank)
        {
            var normalizedSource = TankProbeConfigurationOptions.NormalizePhysicalStockUpdateSource(tank.ProbePhysicalStockUpdateSource);
            return string.IsNullOrWhiteSpace(normalizedSource)
                || string.Equals(normalizedSource, TankProbeConfigurationOptions.UploadStatus, StringComparison.Ordinal);
        }

        private async Task<bool> TryApplyAveragedPhysicalStockUpdateAsync(Tank tank, ProbeMeasurement probeMeasurement, int updateIntervalSeconds)
        {
            if (!probeMeasurement.ProductVolume.HasValue)
            {
                return false;
            }

            var probeNumber = probeMeasurement.ProbeNumber > 0 ? probeMeasurement.ProbeNumber : 1;
            var redisKey = $"device:{tank.PtsId}:tank:{tank.Id}:probe:{probeNumber}:physical-stock-window";
            var now = DateTime.UtcNow;

            var (sum, count, windowStartedAtUtc) = await GetProbeAccumulatorAsync(redisKey);
            if (count <= 0 || windowStartedAtUtc > now)
            {
                windowStartedAtUtc = now;
            }

            sum += probeMeasurement.ProductVolume.Value;
            count += 1;

            var elapsed = now - windowStartedAtUtc;
            if (elapsed.TotalSeconds < updateIntervalSeconds)
            {
                await SetProbeAccumulatorAsync(redisKey, sum, count, windowStartedAtUtc, now);
                return false;
            }

            var average = sum / count;
            if (double.IsNaN(average) || double.IsInfinity(average))
            {
                await SetProbeAccumulatorAsync(redisKey, 0d, 0, now, now);
                return false;
            }

            tank.PhysicalStockValue = Convert.ToDecimal(Math.Round(average, 3));
            tank.LastPhysicalStockUpdate = now;
            tank.PhysicalStockSource = $"PTS UploadStatus Probe {probeNumber} (avg {count} samples/{updateIntervalSeconds}s)";

            await SetProbeAccumulatorAsync(redisKey, 0d, 0, now, now);

            _logger.LogDebug(
                "[UploadStatus][Deferred] Applied averaged physical stock update for tank {TankId} from probe {ProbeNumber}: {AverageVolume}L ({SampleCount} samples)",
                tank.Id,
                probeNumber,
                average,
                count);

            await CheckSystemLowLevelAlarmAsync(tank, Convert.ToDecimal(average));

            return true;
        }

        private async Task<(double Sum, int Count, DateTime WindowStartedAtUtc)> GetProbeAccumulatorAsync(string redisKey)
        {
            try
            {
                var redisValue = await _redisDb.StringGetAsync(redisKey);
                if (!redisValue.HasValue)
                {
                    return (0d, 0, DateTime.UtcNow);
                }

                using var document = JsonDocument.Parse(redisValue.ToString());
                var root = document.RootElement;

                var sum = root.TryGetProperty("sum", out var sumElement) && sumElement.TryGetDouble(out var parsedSum)
                    ? parsedSum
                    : 0d;
                var count = root.TryGetProperty("count", out var countElement) && countElement.TryGetInt32(out var parsedCount)
                    ? parsedCount
                    : 0;

                DateTime windowStartedAtUtc = DateTime.UtcNow;
                if (root.TryGetProperty("windowStartedAtUtc", out var windowElement))
                {
                    var windowString = windowElement.GetString();
                    if (DateTime.TryParse(windowString, out var parsedWindow))
                    {
                        windowStartedAtUtc = parsedWindow.ToUniversalTime();
                    }
                }

                return (sum, count, windowStartedAtUtc);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[UploadStatus][Deferred] Failed to parse probe accumulator for key {RedisKey}", redisKey);
                return (0d, 0, DateTime.UtcNow);
            }
        }

        private async Task SetProbeAccumulatorAsync(string redisKey, double sum, int count, DateTime windowStartedAtUtc, DateTime lastReadingAtUtc)
        {
            var payload = JsonSerializer.Serialize(new
            {
                sum,
                count,
                windowStartedAtUtc = windowStartedAtUtc.ToUniversalTime().ToString("o"),
                lastReadingAtUtc = lastReadingAtUtc.ToUniversalTime().ToString("o")
            });

            await _redisDb.StringSetAsync(
                redisKey,
                payload,
                expiry: TimeSpan.FromMinutes(30));
        }

        private async Task CheckSystemLowLevelAlarmAsync(Tank tank, decimal currentVolume)
        {
            try
            {
                if (tank.TankVolume <= 0)
                {
                    return;
                }

                var percentageFull = (currentVolume / tank.TankVolume) * 100m;
                var criticalLowThreshold = await _systemConfigurationService.GetDecimalAsync("Tank.CriticalLowLevelPercent", 10m);
                var lowThreshold = await _systemConfigurationService.GetDecimalAsync("Tank.LowLevelPercent", 20m);
                var highThreshold = await _systemConfigurationService.GetDecimalAsync("Tank.HighLevelPercent", 90m);
                var criticalHighThreshold = await _systemConfigurationService.GetDecimalAsync("Tank.CriticalHighLevelPercent", 95m);

                if (percentageFull <= criticalLowThreshold)
                {
                    await CreateSystemLevelAlarmAsync(tank, currentVolume, percentageFull,
                        "SystemCriticalLowLevel", "Critical", DiscrepancySeverity.Critical,
                        $"Tank {tank.Name} is at critical low level ({percentageFull:F1}% - below {criticalLowThreshold}% threshold)");
                }
                else if (percentageFull <= lowThreshold)
                {
                    await CreateSystemLevelAlarmAsync(tank, currentVolume, percentageFull,
                        "SystemLowLevel", "High", DiscrepancySeverity.High,
                        $"Tank {tank.Name} is at low level ({percentageFull:F1}% - below {lowThreshold}% threshold)");
                }
                else if (percentageFull >= criticalHighThreshold)
                {
                    await CreateSystemLevelAlarmAsync(tank, currentVolume, percentageFull,
                        "SystemCriticalHighLevel", "Critical", DiscrepancySeverity.Critical,
                        $"Tank {tank.Name} is at critical high level ({percentageFull:F1}% - above {criticalHighThreshold}% threshold) - overflow risk");
                }
                else if (percentageFull >= highThreshold)
                {
                    await CreateSystemLevelAlarmAsync(tank, currentVolume, percentageFull,
                        "SystemHighLevel", "High", DiscrepancySeverity.High,
                        $"Tank {tank.Name} is at high level ({percentageFull:F1}% - above {highThreshold}% threshold)");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus][Deferred] Error checking system low level alarm for tank {TankId}", tank.Id);
            }
        }

        private async Task CreateSystemLevelAlarmAsync(
            Tank tank,
            decimal currentVolume,
            decimal percentageFull,
            string alarmType,
            string priority,
            DiscrepancySeverity severity,
            string message)
        {
            try
            {
                var cooldownKey = $"system_tank_alarm:{tank.Id}:{alarmType}";
                var cooldownExists = await _redisDb.KeyExistsAsync(cooldownKey);

                if (cooldownExists)
                {
                    _logger.LogTrace("[UploadStatus][Deferred] System alarm {AlarmType} for tank {TankId} is in cooldown", alarmType, tank.Id);
                    return;
                }

                await _redisDb.StringSetAsync(cooldownKey, "1", TimeSpan.FromMinutes(15));

                var levelEvent = new TankLevelEvent
                {
                    SiteId = tank.SiteId,
                    TankId = tank.Id,
                    Severity = priority,
                    Message = message,
                    TankName = tank.Name ?? string.Empty,
                    TankCapacity = tank.TankVolume,
                    PercentageFull = percentageFull,
                    ProductVolume = currentVolume,
                    CurrentLevel = currentVolume,
                };
                levelEvent.Data["AlarmType"] = alarmType;

                using var eventEngineScope = _serviceScopeFactory.CreateScope();
                var scopedEventEngine = eventEngineScope.ServiceProvider.GetRequiredService<IEventExpressionEngine>();
                await scopedEventEngine.ProcessAsync(levelEvent);

                _logger.LogWarning(
                    "[UploadStatus][Deferred] System tank level event {AlarmType} for tank {TankId} ({TankName}): {PercentageFull:F1}% full, {CurrentVolume:N0}L",
                    alarmType, tank.Id, tank.Name, percentageFull, currentVolume);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[UploadStatus][Deferred] Error processing system level event {AlarmType} for tank {TankId}", alarmType, tank.Id);
            }
        }
    }
}