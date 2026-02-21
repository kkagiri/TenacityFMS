/**
 * File: IssueMonitoringService.cs
 * Purpose: Runs automated issue monitoring checks and creates issues for offline/suspicious devices.
 * Dependencies: GpsdataContext, ISystemConfigurationService, IGPSService, IIssueActivityService, IEventExpressionEngine
 * Last Modified: 2026-02-18
 *
 * Key Functions:
 * - ExecuteAsync(): Schedules monitoring at configured daily local time.
 * - MonitorDevicesAsync(): Evaluates templates and creates issues.
 */
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.EventEngine.Engine;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SystemConfigurationConstants = global::FMS.Application.Configuration.SystemConfiguration;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Background service for monitoring devices and auto-creating issues.
    /// Periodically checks device status (PTS devices, vehicles)
    /// and creates issues based on configured templates when problems are detected.
    /// </summary>
    public class IssueMonitoringService : BackgroundService
    {
        private sealed class MonitoringSettings
        {
            public bool IsEnabled { get; set; } = true;
            public int VehicleOfflineThresholdMinutes { get; set; } = 60;
            public int PtsOfflineThresholdMinutes { get; set; } = 30;
            public int FuelActivityWindowMinutes { get; set; } = 4320;
            public int DefaultIssueCategoryId { get; set; } = 1;
            public TimeSpan DailyRunTimeLocal { get; set; } = TimeSpan.Zero;
        }

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IssueMonitoringService> _logger;

        public IssueMonitoringService(
            IServiceProvider serviceProvider,
            ILogger<IssueMonitoringService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Issue Monitoring Service started");

            // Initial delay to let other services start
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                _logger.LogInformation("Issue Monitoring Service stopped before initial scheduling");
                return;
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                var schedulingSettings = await GetSchedulingSettingsAsync(stoppingToken);
                var delayUntilNextRun = GetDelayUntilNextDailyRunLocal(schedulingSettings.DailyRunTimeLocal);
                var nextRunLocal = DateTime.Now.Add(delayUntilNextRun);

                _logger.LogInformation(
                    "Next issue monitoring cycle scheduled at {NextRunLocal} (configured daily run time: {ConfiguredRunTime})",
                    nextRunLocal.ToString("yyyy-MM-dd HH:mm:ss"),
                    schedulingSettings.DailyRunTimeLocal.ToString(@"hh\:mm"));

                try
                {
                    await Task.Delay(delayUntilNextRun, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                try
                {
                    await MonitorDevicesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Issue Monitoring processing cycle");
                }
            }

            _logger.LogInformation("Issue Monitoring Service stopped");
        }

        private async Task<MonitoringSettings> GetSchedulingSettingsAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var systemConfig = scope.ServiceProvider.GetService<ISystemConfigurationService>();
                return await GetMonitoringSettingsAsync(systemConfig, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load scheduling settings; falling back to defaults");
                return new MonitoringSettings();
            }
        }

        private static TimeSpan GetDelayUntilNextDailyRunLocal(TimeSpan runTimeLocal)
        {
            var nowLocal = DateTime.Now;
            var nextRunLocal = nowLocal.Date.Add(runTimeLocal);

            if (nextRunLocal < nowLocal)
            {
                nextRunLocal = nextRunLocal.AddDays(1);
            }

            return nextRunLocal - nowLocal;
        }

        private async Task MonitorDevicesAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var systemConfig = scope.ServiceProvider.GetService<ISystemConfigurationService>();
            var monitoringSettings = await GetMonitoringSettingsAsync(systemConfig, cancellationToken);

            if (!monitoringSettings.IsEnabled)
            {
                _logger.LogDebug("Issue monitoring is disabled via system configuration");
                return;
            }

            try
            {
                _logger.LogDebug("Starting device monitoring cycle");

                // Get active issue templates that support auto-creation
                var templates = await context.Issuetemplates
                    .Include(t => t.DeviceType)
                    .Include(t => t.AutoCloseConfig)
                    .Where(t => t.IsActive && t.CanAutoCreate)
                    .ToListAsync(cancellationToken);

                if (!templates.Any())
                {
                    _logger.LogDebug("No auto-create templates found");
                    return;
                }

                var issuesCreated = 0;

                foreach (var template in templates)
                {
                    try
                    {
                        var deviceType = template.DeviceType?.Name?.ToLowerInvariant();

                        switch (deviceType)
                        {
                            case "vehicle":
                            case "gps":
                            case "gps device":
                            case "gps_device":
                                issuesCreated += await MonitorVehicleGpsOfflineAsync(context, template, scope.ServiceProvider, monitoringSettings, cancellationToken);
                                break;

                            case "fuel":
                            case "fuel activity":
                            case "fuel_activity":
                            case "fuelsensor":
                            case "no_fuel":
                                // Check vehicles that have fuel activity (refill/pump tx) but GPS is offline → suspicious
                                issuesCreated += await MonitorVehicleFuelWhileOfflineAsync(context, template, scope.ServiceProvider, monitoringSettings, cancellationToken);
                                break;

                            case "pts":
                            case "pts_terminal":
                            case "tank_monitor":
                            case "tankmonitor":
                            case "atg":
                                // All PTS/ATG/Tank devices use Ptsdevices table
                                issuesCreated += await MonitorPTSDevicesAsync(context, template, scope.ServiceProvider, monitoringSettings, cancellationToken);
                                break;

                            default:
                                _logger.LogDebug("Skipping monitoring for device type: {DeviceType}", deviceType);
                                break;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error monitoring devices for template {TemplateId}", template.Id);
                    }
                }

                if (issuesCreated > 0)
                {
                    _logger.LogInformation("Auto-created {Count} issues in this monitoring cycle", issuesCreated);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in device monitoring");
            }
        }

        /// <summary>
        /// Monitors vehicles with GPS provider mappings and creates issues
        /// when GPS devices are offline beyond the configured threshold.
        /// Uses the IGPSService to check actual GPS online/offline status.
        /// </summary>
        private async Task<int> MonitorVehicleGpsOfflineAsync(
            GpsdataContext context,
            Issuetemplate template,
            IServiceProvider scopedProvider,
            MonitoringSettings settings,
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;
            var createdIssues = new List<Issuetracker>();
            var offlineThresholdMinutes = template.OfflineThresholdMinutes ?? settings.VehicleOfflineThresholdMinutes;

            // Resolve the GPS service - if not available, we can't check GPS status
            var gpsService = scopedProvider.GetService<IGPSService>();
            if (gpsService == null)
            {
                _logger.LogWarning("[GPS Offline Monitor] IGPSService not available, skipping GPS offline monitoring");
                return 0;
            }

            try
            {
                // Get all vehicles that have a GPS provider mapping (i.e. they have GPS installed)
                var gpsVehicles = await context.VehicleProviderMappings
                    .Include(m => m.Vehicle)
                    .Where(m => m.IsActive && m.Vehicle != null && m.Vehicle.IsActive.HasValue && m.Vehicle.IsActive.Value == 1)
                    .ToListAsync(cancellationToken);

                if (!gpsVehicles.Any())
                {
                    _logger.LogDebug("[GPS Offline Monitor] No vehicles with active GPS mappings found");
                    return 0;
                }

                // Filter out vehicles that are ParkedYard or Workshop — no need to alert for those
                var activeGpsVehicles = gpsVehicles
                    .Where(m => m.Vehicle!.VehicleStatusValue == VehicleStatus.Working)
                    .ToList();

                var skippedCount = gpsVehicles.Count - activeGpsVehicles.Count;
                if (skippedCount > 0)
                {
                    _logger.LogDebug("[GPS Offline Monitor] Skipped {Count} vehicles with ParkedYard/Workshop status", skippedCount);
                }

                _logger.LogDebug("[GPS Offline Monitor] Checking {Count} GPS-equipped vehicles for offline status (threshold: {Threshold} min)",
                    activeGpsVehicles.Count, offlineThresholdMinutes);

                // BULK FETCH: Get all vehicle locations in a single GPSGate API call
                // instead of calling GetVehicleLocationAsync per vehicle (N HTTP + 2N DB queries → 1 HTTP + 2 DB queries)
                var allLocationsResponse = await gpsService.GetAllVehicleLocationsAsync(false, true);
                var locationLookup = new Dictionary<int, VehicleLocationDTO>();
                if (allLocationsResponse.IsSuccess && allLocationsResponse.Data != null)
                {
                    foreach (var loc in allLocationsResponse.Data)
                    {
                        locationLookup[loc.VehicleId] = loc;
                    }
                    _logger.LogDebug("[GPS Offline Monitor] Bulk-fetched {Count} vehicle locations", locationLookup.Count);
                }
                else
                {
                    _logger.LogWarning("[GPS Offline Monitor] Failed to bulk-fetch vehicle locations: {Message}. " +
                        "All vehicles without cached data will be treated as offline.", allLocationsResponse.Message);
                }

                foreach (var mapping in activeGpsVehicles)
                {
                    try
                    {
                        var vehicle = mapping.Vehicle!;
                        var vehicleName = vehicle.HyoungNo ?? vehicle.NumberPlate ?? vehicle.VehicleId.ToString();

                        // Skip if there's already an open issue or recently-closed issue (cooldown) for this vehicle+template
                        var existingIssue = await HasOpenIssueForDevice(
                            context, template.Id, vehicle.VehicleId, "vehicle", cancellationToken, template.CooldownMinutes);

                        if (existingIssue)
                            continue;

                        // Check GPS status from pre-fetched bulk data (no per-vehicle API calls)
                        bool isOffline = false;
                        string lastSeenInfo = "unknown";

                        if (locationLookup.TryGetValue(vehicle.VehicleId, out var location))
                        {
                            var minutesSinceLastSeen = (DateTime.UtcNow - location.LastUpdated).TotalMinutes;

                            isOffline = !location.IsOnline || minutesSinceLastSeen >= offlineThresholdMinutes;
                            lastSeenInfo = $"{location.LastUpdated:yyyy-MM-dd HH:mm:ss} UTC ({(int)minutesSinceLastSeen} min ago)";
                        }
                        else
                        {
                            // No location data at all = offline
                            isOffline = true;
                            lastSeenInfo = "no location data available";
                        }

                        if (isOffline)
                        {
                            var resolvedSiteId = await ResolveIssueSiteIdForVehicleAsync(
                                context,
                                vehicle.VehicleId,
                                vehicle.WorkingSiteId,
                                cancellationToken);

                            // Build title/description from template placeholders
                            var title = (template.TitleTemplate ?? "GPS Offline - {vehicleName}")
                                .Replace("{vehicleName}", vehicleName)
                                .Replace("{vehicleStatus}", "Working");

                            var description = (template.DescriptionTemplate ?? "Vehicle {vehicleName} GPS device has been offline. Last seen: {lastSeen}. Vehicle status: {vehicleStatus}.")
                                .Replace("{vehicleName}", vehicleName)
                                .Replace("{vehicleStatus}", "Working")
                                .Replace("{thresholdMinutes}", offlineThresholdMinutes.ToString())
                                .Replace("{lastSeen}", lastSeenInfo);

                            var issue = await CreateIssueFromTemplateAsync(context, template, vehicle.VehicleId, "vehicle",
                                title, description, settings, resolvedSiteId);

                            context.Issuetrackers.Add(issue);
                            createdIssues.Add(issue);
                            issuesCreated++;

                            _logger.LogInformation(
                                "[GPS Offline Monitor] Auto-created issue for vehicle {VehicleNo} (ID: {VehicleId}) - last seen: {LastSeen}",
                                vehicleName, vehicle.VehicleId, lastSeenInfo);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "[GPS Offline Monitor] Error checking GPS status for vehicle {VehicleId}",
                            mapping.VehicleId);
                    }
                }

                if (issuesCreated > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);

                    // Log activity and send notifications for newly created issues
                    await LogAndNotifyCreatedIssuesAsync(context, createdIssues, scopedProvider, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GPS Offline Monitor] Error in GPS offline monitoring");
            }

            return issuesCreated;
        }

        /// <summary>
        /// Monitors ALL GPS-equipped vehicles (Working, ParkedYard, Workshop) that have
        /// fuel activity (refill or pump transaction) within the configured period but
        /// whose GPS device is offline. This is suspicious — the vehicle is being fueled
        /// but the tracker is down, regardless of its declared status.
        ///
        /// Alert scenarios:
        ///   - Working + GPS Offline + Fuel Activity → Alert
        ///   - ParkedYard + GPS Offline + Fuel Activity → Alert (unexpected fueling)
        ///   - Workshop + GPS Offline + Fuel Activity → Alert (unexpected fueling)
        ///   - Any status + GPS Offline + No Fuel Activity → No alert (handled by GPS offline monitor for Working only)
        ///
        /// Vehicle status is NOT changed — it is included in the issue description so
        /// fleet managers can decide the appropriate action.
        /// </summary>
        private async Task<int> MonitorVehicleFuelWhileOfflineAsync(
            GpsdataContext context,
            Issuetemplate template,
            IServiceProvider scopedProvider,
            MonitoringSettings settings,
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;
            var createdIssues = new List<Issuetracker>();
            // OfflineThresholdMinutes: how long GPS must be offline to be considered "offline"
            var offlineThresholdMinutes = template.OfflineThresholdMinutes ?? settings.VehicleOfflineThresholdMinutes;
            // Use a fuel activity window — look for fuel activity in the last 3 days
            var fuelActivityWindowMinutes = settings.FuelActivityWindowMinutes;
            var cutoffDate = DateTime.UtcNow.AddMinutes(-fuelActivityWindowMinutes);
            var thresholdDays = fuelActivityWindowMinutes / 1440.0;

            // Resolve the GPS service
            var gpsService = scopedProvider.GetService<IGPSService>();
            if (gpsService == null)
            {
                _logger.LogWarning("[Fuel+Offline Monitor] IGPSService not available, skipping");
                return 0;
            }

            try
            {
                // Get vehicles with GPS mappings (GPS-equipped vehicles only)
                var gpsVehicles = await context.VehicleProviderMappings
                    .Include(m => m.Vehicle)
                    .Where(m => m.IsActive && m.Vehicle != null
                             && m.Vehicle.IsActive.HasValue && m.Vehicle.IsActive.Value == 1)
                    .Select(m => new { m.Vehicle!.VehicleId, m.Vehicle.HyoungNo, m.Vehicle.NumberPlate, m.Vehicle.WorkingSiteId, m.Vehicle.VehicleStatusValue })
                    .ToListAsync(cancellationToken);

                if (!gpsVehicles.Any())
                {
                    _logger.LogDebug("[Fuel+Offline Monitor] No GPS-equipped active vehicles found");
                    return 0;
                }

                var vehicleIds = gpsVehicles.Select(v => v.VehicleId).ToList();

                // Step 1: Find vehicles that HAVE fuel activity in the period
                var vehiclesWithRefills = await context.FuelRefills
                    .AsNoTracking()
                    .Where(fr => vehicleIds.Contains(fr.VehicleId)
                              && !fr.IsDeleted
                              && ((fr.Date.HasValue && fr.Date.Value >= cutoffDate)
                                  || fr.DateCreated >= cutoffDate))
                    .Select(fr => fr.VehicleId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                var vehiclesWithPumpTx = await context.Pumptransactions
                    .AsNoTracking()
                    .Where(pt => pt.VehicleId.HasValue
                              && vehicleIds.Contains(pt.VehicleId.Value)
                              && !pt.IsTransferMode
                              && pt.DateTime >= cutoffDate)
                    .Select(pt => pt.VehicleId!.Value)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                var vehiclesWithFuel = new HashSet<int>(vehiclesWithRefills);
                vehiclesWithFuel.UnionWith(vehiclesWithPumpTx);

                if (!vehiclesWithFuel.Any())
                {
                    _logger.LogDebug("[Fuel+Offline Monitor] No vehicles have fuel activity in last {Days:F1} days", thresholdDays);
                    return 0;
                }

                // Step 2: Bulk-fetch GPS locations to check which of these fueled vehicles are offline
                var allLocationsResponse = await gpsService.GetAllVehicleLocationsAsync(false, true);
                var locationLookup = new Dictionary<int, VehicleLocationDTO>();
                if (allLocationsResponse.IsSuccess && allLocationsResponse.Data != null)
                {
                    foreach (var loc in allLocationsResponse.Data)
                    {
                        locationLookup[loc.VehicleId] = loc;
                    }
                }
                else
                {
                    _logger.LogWarning("[Fuel+Offline Monitor] Failed to bulk-fetch vehicle locations: {Message}",
                        allLocationsResponse.Message);
                }

                // Step 3: For each fueled vehicle, check if GPS is offline
                var fueledVehicles = gpsVehicles
                    .Where(v => vehiclesWithFuel.Contains(v.VehicleId))
                    .ToList();

                _logger.LogDebug(
                    "[Fuel+Offline Monitor] {Total} GPS vehicles, {WithFuel} fueled in last {Days:F1} days — checking GPS status",
                    gpsVehicles.Count, fueledVehicles.Count, thresholdDays);

                foreach (var vehicle in fueledVehicles)
                {
                    try
                    {
                        // Check GPS status — is this vehicle offline?
                        bool isOffline = false;
                        string lastSeenInfo = "unknown";

                        if (locationLookup.TryGetValue(vehicle.VehicleId, out var location))
                        {
                            var minutesSinceLastSeen = (DateTime.UtcNow - location.LastUpdated).TotalMinutes;
                            isOffline = !location.IsOnline || minutesSinceLastSeen >= offlineThresholdMinutes;
                            lastSeenInfo = $"{location.LastUpdated:yyyy-MM-dd HH:mm:ss} UTC ({(int)minutesSinceLastSeen} min ago)";
                        }
                        else
                        {
                            // No location data = offline
                            isOffline = true;
                            lastSeenInfo = "no GPS data available";
                        }

                        if (!isOffline)
                            continue; // GPS is online, no issue

                        // Skip if there's already an open issue or recently-closed issue (cooldown) for this vehicle+template
                        var existingIssue = await HasOpenIssueForDevice(
                            context, template.Id, vehicle.VehicleId, "vehicle", cancellationToken, template.CooldownMinutes);

                        if (existingIssue)
                            continue;

                        var vehicleName = vehicle.HyoungNo ?? vehicle.NumberPlate ?? vehicle.VehicleId.ToString();
                        var vehicleStatusLabel = vehicle.VehicleStatusValue switch
                        {
                            VehicleStatus.Working => "Working (Active)",
                            VehicleStatus.ParkedYard => "Parked Yard",
                            VehicleStatus.Workshop => "Workshop",
                            _ => "Unknown"
                        };

                        var resolvedSiteId = await ResolveIssueSiteIdForVehicleAsync(
                            context,
                            vehicle.VehicleId,
                            vehicle.WorkingSiteId,
                            cancellationToken);

                        var title = (template.TitleTemplate ?? "Fuel Activity While GPS Offline - {vehicleName}")
                            .Replace("{vehicleName}", vehicleName)
                            .Replace("{vehicleStatus}", vehicleStatusLabel);

                        var description = (template.DescriptionTemplate
                            ?? "Vehicle {vehicleName} (Status: {vehicleStatus}) has fuel activity in the last {thresholdDays} days but the GPS device is offline. Last GPS seen: {lastSeen}. This may indicate GPS tampering or device failure.")
                            .Replace("{vehicleName}", vehicleName)
                            .Replace("{vehicleStatus}", vehicleStatusLabel)
                            .Replace("{thresholdDays}", $"{thresholdDays:F0}")
                            .Replace("{thresholdMinutes}", offlineThresholdMinutes.ToString())
                            .Replace("{lastSeen}", lastSeenInfo);

                        var issue = await CreateIssueFromTemplateAsync(
                            context, template, vehicle.VehicleId, "vehicle",
                            title, description, settings, resolvedSiteId);

                        context.Issuetrackers.Add(issue);
                        createdIssues.Add(issue);
                        issuesCreated++;

                        _logger.LogInformation(
                            "[Fuel+Offline Monitor] Auto-created issue for vehicle {VehicleNo} (ID: {VehicleId}, Status: {Status}) - fueled but GPS offline since {LastSeen}",
                            vehicleName, vehicle.VehicleId, vehicleStatusLabel, lastSeenInfo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "[Fuel+Offline Monitor] Error checking vehicle {VehicleId}",
                            vehicle.VehicleId);
                    }
                }

                if (issuesCreated > 0)
                {
                    await context.SaveChangesAsync(cancellationToken);

                    // Log activity and send notifications for newly created issues
                    await LogAndNotifyCreatedIssuesAsync(context, createdIssues, scopedProvider, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Fuel+Offline Monitor] Error in fuel-while-offline monitoring");
            }

            return issuesCreated;
        }

        private async Task<int> MonitorPTSDevicesAsync(
            GpsdataContext context,
            Issuetemplate template,
            IServiceProvider scopedProvider,
            MonitoringSettings settings,
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;
            var createdIssues = new List<Issuetracker>();
            var offlineThresholdMinutes = template.OfflineThresholdMinutes ?? settings.PtsOfflineThresholdMinutes;
            var cutoffTime = DateTime.UtcNow.AddMinutes(-offlineThresholdMinutes);

            // Find offline PTS devices using LastActivity
            var offlineDevices = await context.Ptsdevices
                .Where(p => p.IsActive == 1 // Active devices that are offline
                    && (!p.LastActivity.HasValue || p.LastActivity.Value < cutoffTime))
                .ToListAsync(cancellationToken);

            foreach (var device in offlineDevices)
            {
                var existingIssue = await HasOpenIssueForDevice(
                    context, template.Id, 0, "pts", cancellationToken, template.CooldownMinutes); // Ptsdevice uses string Ptsid, not int Id

                if (existingIssue)
                    continue;

                var issue = await CreateIssueFromTemplateAsync(context, template, 0, "pts",
                    $"PTS Device {device.PtsName ?? device.Ptsid} - Offline",
                    $"PTS device '{device.PtsName ?? device.Ptsid}' has not reported since " +
                    $"{device.LastActivity?.ToString("yyyy-MM-dd HH:mm:ss") ?? "unknown"}. " +
                    $"Offline threshold: {offlineThresholdMinutes} minutes. Device ID: {device.Ptsid}",
                    settings,
                    device.Site.HasValue && device.Site.Value > 0 ? device.Site.Value : null);

                context.Issuetrackers.Add(issue);
                createdIssues.Add(issue);
                issuesCreated++;

                _logger.LogInformation("Auto-created issue for offline PTS device: {DeviceId}", device.Ptsid);
            }

            if (issuesCreated > 0)
            {
                await context.SaveChangesAsync(cancellationToken);

                // Log activity and send notifications for newly created issues
                await LogAndNotifyCreatedIssuesAsync(context, createdIssues, scopedProvider, cancellationToken);
            }

            return issuesCreated;
        }

        /// <summary>
        /// Checks whether issue creation should be skipped for a device/vehicle+template combo.
        /// Returns true if:
        ///   1. There is already an OPEN issue for this device+template, OR
        ///   2. There is a recently CLOSED issue within the cooldown window (prevents rapid re-triggering).
        /// </summary>
        private async Task<bool> HasOpenIssueForDevice(
            GpsdataContext context,
            int templateId,
            int deviceId,
            string deviceType,
            CancellationToken cancellationToken,
            int? cooldownMinutes = null)
        {
            var closedStatuses = new[] { "Closed", "Resolved", "Auto-Closed", "Cancelled" };

            // 1. Check for any OPEN issue (not closed/resolved)
            var hasOpen = await context.Issuetrackers
                .Where(i => i.IssueTemplateId == templateId
                    && i.RelatedEntityId == deviceId
                    && i.RelatedEntityType == deviceType
                    && i.Status.HasValue)
                .Join(
                    context.Issuestatuses.Where(s => !closedStatuses.Contains(s.Status)),
                    i => i.Status,
                    s => s.Id,
                    (i, s) => i)
                .AnyAsync(cancellationToken);

            if (hasOpen)
                return true;

            // 2. Cooldown check — skip if a closed issue exists within the cooldown window
            if (cooldownMinutes.HasValue && cooldownMinutes.Value > 0)
            {
                var cooldownCutoff = DateTime.UtcNow.AddMinutes(-cooldownMinutes.Value);

                var recentlyClosed = await context.Issuetrackers
                    .Where(i => i.IssueTemplateId == templateId
                        && i.RelatedEntityId == deviceId
                        && i.RelatedEntityType == deviceType
                        && i.IsAutoCreated
                        && i.Status.HasValue
                        && (i.ClosingDate.HasValue && i.ClosingDate.Value >= cooldownCutoff
                            || i.LastModfield.HasValue && i.LastModfield.Value >= cooldownCutoff))
                    .Join(
                        context.Issuestatuses.Where(s => closedStatuses.Contains(s.Status)),
                        i => i.Status,
                        s => s.Id,
                        (i, s) => i)
                    .AnyAsync(cancellationToken);

                if (recentlyClosed)
                    return true;
            }

            // 3. Deadline suppression — skip if any issue for this device has a future DueDate
            //    This respects the assignee's commitment: "I'll handle this by <date>"
            var hasFutureDeadline = await context.Issuetrackers
                .Where(i => i.IssueTemplateId == templateId
                    && i.RelatedEntityId == deviceId
                    && i.RelatedEntityType == deviceType
                    && i.IsAutoCreated
                    && i.DueDate.HasValue && i.DueDate.Value > DateTime.UtcNow)
                .AnyAsync(cancellationToken);

            if (hasFutureDeadline)
                return true;

            return false;
        }

        private async Task<Issuetracker> CreateIssueFromTemplateAsync(
            GpsdataContext context,
            Issuetemplate template,
            int relatedEntityId,
            string relatedEntityType,
            string title,
            string description,
            MonitoringSettings settings,
            int? resolvedSiteId = null,
            CancellationToken cancellationToken = default)
        {
            // Get a default site and category
            var defaultSiteId = resolvedSiteId ?? 0;
            var defaultCategoryId = settings.DefaultIssueCategoryId > 0 ? settings.DefaultIssueCategoryId : 1;

            // Resolve a valid system user ID from the database
            // AssignTo and Openby are FKs to user.Id - must use actual user IDs
            var systemUserId = await ResolveSystemUserIdAsync(context);

            // Resolve DefaultAssignee: supports comma/semicolon-separated IDs or usernames.
            // AssignTo is a FK (single user ID), AssignedTo is a display/filter field limited by DB length.
            var requestedAssignees = (template.DefaultAssignee ?? string.Empty)
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var resolvedAssigneeIds = new List<string>();
            if (requestedAssignees.Count > 0)
            {
                resolvedAssigneeIds = await context.Users
                    .AsNoTracking()
                    .Where(u => requestedAssignees.Contains(u.Id) || requestedAssignees.Contains(u.UserName))
                    .Select(u => u.Id)
                    .Distinct()
                    .ToListAsync(cancellationToken);
            }

            var primaryAssigneeId = resolvedAssigneeIds.FirstOrDefault();
            var assigneeUserId = !string.IsNullOrWhiteSpace(primaryAssigneeId)
                ? primaryAssigneeId
                : systemUserId;

            var assignedToValue = BuildAssignedToValue(resolvedAssigneeIds, assigneeUserId);

            return new Issuetracker
            {
                ProblemTitle = title,
                ProblemDescription = description,
                OpenDate = DateTime.UtcNow,
                LastModfield = DateTime.UtcNow,
                Status = template.DefaultStatusId ?? 1, // Default to first status
                Priority = template.DefaultPriorityId ?? 2, // Default to Medium priority
                IsAutoCreated = true,
                CanAutoClose = template.AutoCloseConfig?.IsEnabled ?? false,
                IssueTemplateId = template.Id,
                DeviceTypeId = template.DeviceTypeId,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = relatedEntityType,
                AssignedTo = assignedToValue,
                ReportedBy = "System", // Display-only field, not an FK
                Openby = systemUserId,
                AssignTo = assigneeUserId,
                SiteId = defaultSiteId,
                IssueCategoryId = defaultCategoryId,
                VehicleId = relatedEntityType == "vehicle" ? relatedEntityId : 0
                // Note: For PTS devices, store the device ID in RelatedEntityType description or use a separate field
            };
        }

        private string BuildAssignedToValue(List<string> resolvedAssigneeIds, string fallbackAssigneeId)
        {
            const int assignedToMaxLength = 500;

            var values = resolvedAssigneeIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (values.Count == 0)
            {
                return fallbackAssigneeId.Length <= assignedToMaxLength
                    ? fallbackAssigneeId
                    : fallbackAssigneeId[..assignedToMaxLength];
            }

            var selectedValues = new List<string>();
            var currentLength = 0;

            foreach (var value in values)
            {
                var separatorLength = selectedValues.Count == 0 ? 0 : 1;
                var nextLength = currentLength + separatorLength + value.Length;
                if (nextLength > assignedToMaxLength)
                {
                    _logger.LogWarning(
                        "Trimming AssignedTo list to fit DB limit ({MaxLength}). Template assignees: {OriginalCount}, persisted assignees: {PersistedCount}",
                        assignedToMaxLength,
                        values.Count,
                        selectedValues.Count);
                    break;
                }

                selectedValues.Add(value);
                currentLength = nextLength;
            }

            if (selectedValues.Count == 0)
            {
                return fallbackAssigneeId.Length <= assignedToMaxLength
                    ? fallbackAssigneeId
                    : fallbackAssigneeId[..assignedToMaxLength];
            }

            return string.Join(',', selectedValues);
        }

        private async Task<int?> ResolveIssueSiteIdForVehicleAsync(
            GpsdataContext context,
            int vehicleId,
            int? workingSiteId,
            CancellationToken cancellationToken)
        {
            if (workingSiteId.HasValue && workingSiteId.Value > 0)
            {
                return workingSiteId.Value;
            }

            var latestFuelRefillSiteId = await context.FuelRefills
                .AsNoTracking()
                .Where(fr => fr.VehicleId == vehicleId && !fr.IsDeleted)
                .OrderByDescending(fr => fr.Date ?? fr.DateCreated)
                .Select(fr => (int?)fr.SiteId)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestFuelRefillSiteId.HasValue && latestFuelRefillSiteId.Value > 0)
            {
                return latestFuelRefillSiteId.Value;
            }

            var latestPumpTransactionSiteId = await (
                from pt in context.Pumptransactions.AsNoTracking()
                join t in context.Tanks.AsNoTracking() on pt.TankId equals t.Id
                where pt.VehicleId.HasValue
                   && pt.VehicleId.Value == vehicleId
                   && !pt.IsTransferMode
                orderby pt.DateTime descending
                select (int?)t.SiteId
            ).FirstOrDefaultAsync(cancellationToken);

            if (latestPumpTransactionSiteId.HasValue && latestPumpTransactionSiteId.Value > 0)
            {
                return latestPumpTransactionSiteId.Value;
            }

            return null;
        }

        private async Task<MonitoringSettings> GetMonitoringSettingsAsync(
            ISystemConfigurationService? systemConfig,
            CancellationToken cancellationToken)
        {
            var settings = new MonitoringSettings();

            if (systemConfig == null)
            {
                return settings;
            }

            try
            {
                settings.IsEnabled = await systemConfig.GetBoolAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_ENABLED_KEY,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_ENABLED,
                    cancellationToken);

                settings.VehicleOfflineThresholdMinutes = await systemConfig.GetIntAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_VEHICLE_OFFLINE_THRESHOLD_MINUTES_KEY,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_VEHICLE_OFFLINE_THRESHOLD_MINUTES,
                    cancellationToken);

                settings.PtsOfflineThresholdMinutes = await systemConfig.GetIntAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_PTS_OFFLINE_THRESHOLD_MINUTES_KEY,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_PTS_OFFLINE_THRESHOLD_MINUTES,
                    cancellationToken);

                settings.FuelActivityWindowMinutes = await systemConfig.GetIntAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_FUEL_ACTIVITY_WINDOW_MINUTES_KEY,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_FUEL_ACTIVITY_WINDOW_MINUTES,
                    cancellationToken);

                settings.DefaultIssueCategoryId = await systemConfig.GetIntAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_DEFAULT_ISSUE_CATEGORY_ID_KEY,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_DEFAULT_ISSUE_CATEGORY_ID,
                    cancellationToken);

                var configuredDailyRunTime = await systemConfig.GetConfigurationValueAsync(
                    SystemConfigurationConstants.DB_CONFIG_ISSUE_MONITORING_DAILY_RUN_TIME_LOCAL_KEY,
                    cancellationToken);

                settings.DailyRunTimeLocal = ParseDailyRunTimeLocal(configuredDailyRunTime);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load issue monitoring system configuration; using defaults");
            }

            return settings;
        }

        private TimeSpan ParseDailyRunTimeLocal(string? configuredDailyRunTime)
        {
            if (!string.IsNullOrWhiteSpace(configuredDailyRunTime)
                && TimeSpan.TryParseExact(
                    configuredDailyRunTime,
                    new[] { @"hh\:mm", @"h\:mm", @"hh\:mm\:ss", @"h\:mm\:ss" },
                    CultureInfo.InvariantCulture,
                    out var parsed)
                && parsed >= TimeSpan.Zero
                && parsed < TimeSpan.FromDays(1))
            {
                return parsed;
            }

            if (!string.IsNullOrWhiteSpace(configuredDailyRunTime))
            {
                _logger.LogWarning(
                    "Invalid issue monitoring daily run time '{RunTime}'. Falling back to default '{DefaultRunTime}'. Expected format: HH:mm",
                    configuredDailyRunTime,
                    SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_DAILY_RUN_TIME_LOCAL);
            }

            if (TimeSpan.TryParseExact(
                SystemConfigurationConstants.DEFAULT_ISSUE_MONITORING_DAILY_RUN_TIME_LOCAL,
                @"hh\:mm",
                CultureInfo.InvariantCulture,
                out var defaultParsed))
            {
                return defaultParsed;
            }

            return TimeSpan.Zero;
        }

        /// <summary>
        /// Resolves a valid system user ID from the database for use in FK fields.
        /// Tries the configured system user first, then falls back to the first available user.
        /// </summary>
        private async Task<string> ResolveSystemUserIdAsync(GpsdataContext context)
        {
            // Try the configured system user ID first
            var systemUser = await context.Users
                .AsNoTracking()
                .Where(u => u.Id == SystemConstants.SystemUser.UserId
                         || u.UserName == SystemConstants.SystemUser.UserName
                         || u.UserName == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(systemUser))
                return systemUser;

            // Fallback: use the first user in the database
            var fallbackUserId = await context.Users
                .AsNoTracking()
                .Select(u => u.Id)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(fallbackUserId))
            {
                _logger.LogError("No users found in database. Cannot create auto-issues.");
                throw new InvalidOperationException("No system user available for auto-issue creation.");
            }

            _logger.LogWarning("System user not found, using fallback user {UserId} for auto-issue creation", fallbackUserId);
            return fallbackUserId;
        }

        /// <summary>
        /// After issues are saved to DB, log activity and emit IssueTrackerEvent through the Event Engine
        /// for each auto-created issue. The Event Engine routes notifications to configured recipients
        /// with cooldown and severity filtering.
        /// </summary>
        private async Task LogAndNotifyCreatedIssuesAsync(
            GpsdataContext context,
            List<Issuetracker> createdIssues,
            IServiceProvider scopedProvider,
            CancellationToken cancellationToken)
        {
            if (!createdIssues.Any()) return;

            var activityService = scopedProvider.GetService<IIssueActivityService>();
            var eventEngine = scopedProvider.GetService<IEventExpressionEngine>();
            var configuration = scopedProvider.GetService<IConfiguration>();

            var systemUserId = await ResolveSystemUserIdAsync(context);

            foreach (var issue in createdIssues)
            {
                try
                {
                    // 1. Log "Created" activity
                    if (activityService != null)
                    {
                        await activityService.LogIssueCreatedAsync(
                            issue.Id, systemUserId, "System", cancellationToken);
                    }

                    // 2. Fire IssueTrackerEvent through the Event Engine (replaces direct INotificationService call)
                    if (eventEngine != null && !string.IsNullOrEmpty(issue.AssignedTo))
                    {
                        await FireIssueCreatedEventAsync(
                            context, issue, eventEngine, configuration, cancellationToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Failed to log activity/send notification for auto-created issue {IssueId}", issue.Id);
                }
            }
        }

        /// <summary>
        /// Fires an IssueTrackerEvent through the Event Engine for an auto-created issue.
        /// The Event Engine handles routing, cooldown, and recipient resolution.
        /// </summary>
        private async Task FireIssueCreatedEventAsync(
            GpsdataContext context,
            Issuetracker issue,
            IEventExpressionEngine eventEngine,
            IConfiguration? configuration,
            CancellationToken cancellationToken)
        {
            try
            {
                // Look up vehicle and site names for the event
                string vehicleName = string.Empty;
                if (issue.VehicleId > 0)
                {
                    vehicleName = await context.Vehicles
                        .Where(v => v.VehicleId == issue.VehicleId)
                        .Select(v => v.HyoungNo ?? v.NumberPlate ?? $"Vehicle #{v.VehicleId}")
                        .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
                }

                string siteName = string.Empty;
                if (issue.SiteId > 0)
                {
                    siteName = await context.Sites
                        .Where(s => s.Id == issue.SiteId)
                        .Select(s => s.Name)
                        .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
                }

                var frontendBaseUrl = GetFrontendBaseUrl(configuration);
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var responseUrl = $"{frontendBaseUrl}/issue-tracker/assignment/{issue.Id}/respond";

                var priorityName = await context.Issuepriorities
                    .AsNoTracking()
                    .Where(p => issue.Priority.HasValue && p.Id == issue.Priority.Value)
                    .Select(p => p.Name)
                    .FirstOrDefaultAsync(cancellationToken) ?? "High";

                var categoryName = await context.Issuecategories
                    .AsNoTracking()
                    .Where(c => c.Id == issue.IssueCategoryId)
                    .Select(c => c.Name)
                    .FirstOrDefaultAsync(cancellationToken)
                    ?? issue.RelatedEntityType
                    ?? "Issue";

                // Look up all assigned user names for display
                var assigneeIds = (issue.AssignedTo ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToList();

                var assignedUserNames = string.Empty;
                if (assigneeIds.Any())
                {
                    var names = await context.Users
                        .AsNoTracking()
                        .Where(u => assigneeIds.Contains(u.Id))
                        .Select(u => u.UserName ?? u.Id)
                        .ToListAsync(cancellationToken);
                    assignedUserNames = string.Join(", ", names);
                }

                // Build rich HTML email body (preserved for the Event Engine to embed in notification data)
                var issueTypeLabel = ResolveIssueTypeLabel(issue.RelatedEntityType, issue.ProblemTitle);
                var emailBodyHtml = BuildAutoCreatedIssueEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    issue.ProblemDescription ?? string.Empty,
                    issueTypeLabel,
                    priorityName,
                    categoryName,
                    string.IsNullOrEmpty(vehicleName) ? null : vehicleName,
                    string.IsNullOrEmpty(siteName) ? null : siteName,
                    assignedUserNames.Split(',').FirstOrDefault()?.Trim() ?? "User",
                    string.Empty,
                    assignedUserNames,
                    issue.OpenDate ?? DateTime.UtcNow,
                    issueUrl,
                    responseUrl);

                var issueEvent = new IssueTrackerEvent
                {
                    SubType = IssueTrackerEvent.SubTypeIssueCreated,
                    IssueId = issue.Id,
                    IssueTitle = issue.ProblemTitle ?? string.Empty,
                    IssueDescription = issue.ProblemDescription ?? string.Empty,
                    IssuePriority = priorityName,
                    IssueCategory = categoryName,
                    RelatedEntityType = issue.RelatedEntityType ?? string.Empty,
                    VehicleName = vehicleName,
                    SiteName = siteName,
                    AssignedTo = assignedUserNames,
                    IssueUrl = issueUrl,
                    ResponseUrl = responseUrl,
                    EmailBodyHtml = emailBodyHtml,
                    OpenedAt = issue.OpenDate,
                    SiteId = issue.SiteId > 0 ? issue.SiteId : null,
                    Severity = "High",
                    Message = $"Auto-Created Issue: {issue.ProblemTitle}",
                    TriggeredBy = "System"
                };

                issueEvent.Data["IssueId"] = issue.Id.ToString();
                issueEvent.Data["IssueUrl"] = issueUrl;
                issueEvent.Data["EmailBodyHtml"] = emailBodyHtml;
                issueEvent.Data["AssignedTo"] = issue.AssignedTo ?? string.Empty;
                issueEvent.Data["IsAutoCreated"] = "true";
                if (issue.VehicleId > 0)
                    issueEvent.Data["VehicleId"] = issue.VehicleId.ToString();

                await eventEngine.ProcessAsync(issueEvent, cancellationToken);

                _logger.LogInformation(
                    "Fired IssueTrackerEvent for auto-created issue {IssueId} (type: {EntityType}, assigned: {Assignees})",
                    issue.Id, issue.RelatedEntityType, assignedUserNames);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notification for auto-created issue {IssueId}", issue.Id);
            }
        }

        private static string BuildAutoCreatedIssueEmailHtml(
            int issueId,
            string issueTitle,
                        string issueDescription,
            string issueTypeLabel,
                        string priorityName,
                        string categoryName,
            string? vehicleName,
            string? siteName,
            string assignedToName,
            string assignedToEmail,
            string allAssigneeNames,
                        DateTime issueTime,
            string issueUrl,
            string? responseUrl = null)
        {
            var safeTitle = System.Net.WebUtility.HtmlEncode(issueTitle);
            var safeDescription = System.Net.WebUtility.HtmlEncode(issueDescription);
            var safeIssueType = System.Net.WebUtility.HtmlEncode(issueTypeLabel);
            var safePriority = System.Net.WebUtility.HtmlEncode(priorityName);
            var safeCategory = System.Net.WebUtility.HtmlEncode(categoryName);
            var safeVehicle = System.Net.WebUtility.HtmlEncode(vehicleName ?? "Not specified");
            var safeSite = System.Net.WebUtility.HtmlEncode(siteName ?? "Not specified");
            var safeAssignee = System.Net.WebUtility.HtmlEncode(assignedToName);
            var safeEmail = System.Net.WebUtility.HtmlEncode(assignedToEmail);
            var safeAllAssignees = System.Net.WebUtility.HtmlEncode(allAssigneeNames);
            var safeIssueTime = System.Net.WebUtility.HtmlEncode(issueTime.ToString("yyyy-MM-dd HH:mm:ss 'UTC'"));
            var safeUrl = System.Net.WebUtility.HtmlEncode(issueUrl);
            var safeResponseUrl = !string.IsNullOrWhiteSpace(responseUrl)
                ? System.Net.WebUtility.HtmlEncode(responseUrl)
                : null;

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
        <meta charset=""UTF-8"">
        <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
        <title>Auto-Created Issue Notification</title>
</head>
<body style=""margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color:#f5f5f5;padding:30px 15px;"">
                <tr>
                        <td align=""center"">
                                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:800px;background-color:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.08);"">
                                        <tr>
                                                <td style=""background-color:#1e293b;padding:24px 32px;"">
                                                        <h1 style=""margin:0;font-size:18px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;"">Hyoung FMS</h1>
                                                        <p style=""margin:4px 0 0 0;font-size:14px;color:#94a3b8;"">Fleet Management Notification</p>
                                                </td>
                                        </tr>
                                        <tr>
                                                <td style=""padding:32px 32px 24px 32px;"">
                                                        <h2 style=""margin:0;font-size:22px;font-weight:600;color:#0f172a;line-height:1.3;"">{safeTitle} | Issue #{issueId}</h2>
                                                </td>
                                        </tr>
                                        <tr>
                                                <td style=""padding:0 32px 24px 32px;"">
                                                        <p style=""margin:0;font-size:14px;line-height:1.6;color:#475569;"">{safeDescription}</p>
                                                </td>
                                        </tr>
                                        <tr>
                                                <td style=""padding:0 32px 32px 32px;"">
                                                        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;border:1px solid #e2e8f0;"">
                                                            <tr>
                                                                <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;width:25%;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Issue Type</span></td>
                                                                <td colspan=""3"" style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeIssueType}</span></td>
                                                            </tr>
                                                                <tr>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;width:25%;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Priority</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;width:25%;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safePriority}</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;width:25%;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Category</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;width:25%;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeCategory}</span></td>
                                                                </tr>
                                                                <tr>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Vehicle</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeVehicle}</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Site</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeSite}</span></td>
                                                                </tr>
                                                                <tr>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Assigned To</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeAssignee}</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">Time</span></td>
                                                                        <td style=""padding:14px 20px;border-bottom:1px solid #e2e8f0;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeIssueTime}</span></td>
                                                                </tr>
                                                                <tr>
                                                                        <td style=""padding:14px 20px;background-color:#f8fafc;""><span style=""font-size:13px;color:#64748b;font-weight:500;"">All Assignees</span></td>
                                                                        <td colspan=""3"" style=""padding:14px 20px;""><span style=""font-size:14px;color:#0f172a;font-weight:600;"">{safeAllAssignees}</span></td>
                                                                </tr>
                                                        </table>
                                                </td>
                                        </tr>
                                        <tr>
                                                <td style=""padding:0 32px 32px 32px;"" align=""center"">
                                                        <a href=""{safeUrl}"" style=""display:inline-block;padding:12px 32px;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;"">View Issue Details</a>
                                                        {(safeResponseUrl != null ? $@"<span style=""display:inline-block;width:12px;""></span>
                                                        <a href=""{safeResponseUrl}"" style=""display:inline-block;padding:12px 32px;background-color:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;"">Respond to Assignment</a>" : "")}
                                                </td>
                                        </tr>
                                        <tr>
                                                <td style=""padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;"">
                                                        <p style=""margin:0;font-size:13px;color:#64748b;line-height:1.5;text-align:center;"">
                                                                This is an automated message from Hyoung FMS. Please do not reply directly to this email.
                                                        </p>
                                                </td>
                                        </tr>
                                </table>
                        </td>
                </tr>
        </table>
</body>
</html>";
        }

        private static string ResolveIssueTypeLabel(string? relatedEntityType, string? problemTitle)
        {
            var normalizedTitle = (problemTitle ?? string.Empty).ToLowerInvariant();
            var normalizedEntityType = (relatedEntityType ?? string.Empty).ToLowerInvariant();

            if (normalizedTitle.Contains("fuel activity") && normalizedTitle.Contains("gps offline"))
            {
                return "Fuel Activity + GPS Offline";
            }

            if (normalizedTitle.Contains("gps offline"))
            {
                return "GPS Offline";
            }

            if (normalizedEntityType is "pts" or "pts_terminal" or "tank_monitor" or "tankmonitor" or "atg")
            {
                return "PTS Offline";
            }

            return "Auto-Created Issue";
        }

        private string GetFrontendBaseUrl(IConfiguration? configuration)
        {
            var configuredBaseUrl = configuration?.GetValue<string>("IssueTracker:FrontendBaseUrl")
                ?? configuration?.GetValue<string>("Frontend:BaseUrl")
                ?? configuration?.GetValue<string>("App:FrontendBaseUrl")
                ?? configuration?.GetValue<string>("FrontendBaseUrl")
                ?? configuration?.GetValue<string>("AppSettings:FrontendBaseUrl");

            if (string.IsNullOrWhiteSpace(configuredBaseUrl))
            {
                throw new InvalidOperationException(
                    "Frontend base URL is not configured. Set 'IssueTracker:FrontendBaseUrl' (or 'Frontend:BaseUrl') in configuration.");
            }

            return configuredBaseUrl.TrimEnd('/');
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Monitoring Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
