using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
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
        }

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IssueMonitoringService> _logger;
        private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes(10); // Default monitoring interval

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
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await MonitorDevicesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Issue Monitoring processing cycle");
                }

                try
                {
                    await Task.Delay(_monitoringInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Issue Monitoring Service stopped");
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

                        // Skip if there's already an open issue for this vehicle+template
                        var existingIssue = await HasOpenIssueForDevice(
                            context, template.Id, vehicle.VehicleId, "vehicle", cancellationToken);

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
                                .Replace("{vehicleName}", vehicleName);

                            var description = (template.DescriptionTemplate ?? "Vehicle GPS device has been offline. Last seen: {lastSeen}.")
                                .Replace("{vehicleName}", vehicleName)
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
        /// Monitors vehicles that have fuel activity (refill or pump transaction)
        /// within the configured period but whose GPS device is offline.
        /// This is suspicious — the vehicle is being fueled but the tracker is down.
        /// Default threshold: 3 days (4320 minutes) for fuel activity window,
        /// uses the same offline threshold logic as GPS offline monitoring.
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

                        // If vehicle is ParkedYard or Workshop but has fuel activity, transition to Working
                        if (vehicle.VehicleStatusValue != VehicleStatus.Working)
                        {
                            var vehicleEntity = await context.Vehicles
                                .FirstOrDefaultAsync(v => v.VehicleId == vehicle.VehicleId, cancellationToken);
                            if (vehicleEntity != null)
                            {
                                var previousStatus = vehicleEntity.VehicleStatusValue;
                                vehicleEntity.VehicleStatusValue = VehicleStatus.Working;
                                vehicleEntity.DateModified = DateTime.UtcNow;
                                _logger.LogWarning(
                                    "[Fuel+Offline Monitor] Vehicle {VehicleId} ({VehicleName}) changed from {OldStatus} to Working due to fuel activity while GPS offline",
                                    vehicle.VehicleId, vehicle.HyoungNo ?? vehicle.NumberPlate, previousStatus);
                            }
                        }

                        // Skip if there's already an open issue for this vehicle+template
                        var existingIssue = await HasOpenIssueForDevice(
                            context, template.Id, vehicle.VehicleId, "vehicle", cancellationToken);

                        if (existingIssue)
                            continue;

                        var vehicleName = vehicle.HyoungNo ?? vehicle.NumberPlate ?? vehicle.VehicleId.ToString();
                        var resolvedSiteId = await ResolveIssueSiteIdForVehicleAsync(
                            context,
                            vehicle.VehicleId,
                            vehicle.WorkingSiteId,
                            cancellationToken);

                        var title = (template.TitleTemplate ?? "Fuel Activity While GPS Offline - {vehicleName}")
                            .Replace("{vehicleName}", vehicleName);

                        var description = (template.DescriptionTemplate
                            ?? "Vehicle {vehicleName} has fuel activity (refill or pump transaction) in the last {thresholdDays} days but the GPS device is offline. Last GPS seen: {lastSeen}. This may indicate GPS tampering or device failure.")
                            .Replace("{vehicleName}", vehicleName)
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
                            "[Fuel+Offline Monitor] Auto-created issue for vehicle {VehicleNo} (ID: {VehicleId}) - fueled but GPS offline since {LastSeen}",
                            vehicleName, vehicle.VehicleId, lastSeenInfo);
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
                    context, template.Id, 0, "pts", cancellationToken); // Ptsdevice uses string Ptsid, not int Id

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

        private async Task<bool> HasOpenIssueForDevice(
            GpsdataContext context,
            int templateId,
            int deviceId,
            string deviceType,
            CancellationToken cancellationToken)
        {
            var closedStatuses = new[] { "Closed", "Resolved", "Auto-Closed", "Cancelled" };

            return await context.Issuetrackers
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
        }

        private async Task<Issuetracker> CreateIssueFromTemplateAsync(
            GpsdataContext context,
            Issuetemplate template,
            int relatedEntityId,
            string relatedEntityType,
            string title,
            string description,
            MonitoringSettings settings,
            int? resolvedSiteId = null)
        {
            // Get a default site and category
            var defaultSiteId = resolvedSiteId ?? 0;
            var defaultCategoryId = settings.DefaultIssueCategoryId > 0 ? settings.DefaultIssueCategoryId : 1;

            // Resolve a valid system user ID from the database
            // AssignTo and Openby are FKs to user.Id - must use actual user IDs
            var systemUserId = await ResolveSystemUserIdAsync(context);

            // Resolve DefaultAssignee: supports comma-separated IDs — use first as primary AssignTo FK
            string? assigneeUserId = null;
            if (!string.IsNullOrEmpty(template.DefaultAssignee))
            {
                // Take the first ID from comma-separated list for the FK field
                var firstId = template.DefaultAssignee
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .FirstOrDefault();

                if (!string.IsNullOrEmpty(firstId))
                {
                    var assigneeUser = await context.Users
                        .AsNoTracking()
                        .Where(u => u.Id == firstId || u.UserName == firstId)
                        .Select(u => u.Id)
                        .FirstOrDefaultAsync();
                    assigneeUserId = assigneeUser;
                }
            }

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
                AssignedTo = template.DefaultAssignee,
                ReportedBy = "System", // Display-only field, not an FK
                Openby = systemUserId,
                AssignTo = assigneeUserId ?? systemUserId,
                SiteId = defaultSiteId,
                IssueCategoryId = defaultCategoryId,
                VehicleId = relatedEntityType == "vehicle" ? relatedEntityId : 0
                // Note: For PTS devices, store the device ID in RelatedEntityType description or use a separate field
            };
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
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load issue monitoring system configuration; using defaults");
            }

            return settings;
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
        /// After issues are saved to DB, log activity and send notifications to DefaultAssignee users.
        /// Notifications go to the assigned users (from DefaultAssignee), NOT the system "OpenedBy" user.
        /// </summary>
        private async Task LogAndNotifyCreatedIssuesAsync(
            GpsdataContext context,
            List<Issuetracker> createdIssues,
            IServiceProvider scopedProvider,
            CancellationToken cancellationToken)
        {
            if (!createdIssues.Any()) return;

            var activityService = scopedProvider.GetService<IIssueActivityService>();
            var notificationService = scopedProvider.GetService<INotificationService>();
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

                    // 2. Send notification to the DefaultAssignee users (not to OpenedBy/system)
                    if (notificationService != null && !string.IsNullOrEmpty(issue.AssignedTo))
                    {
                        await SendAutoCreatedIssueNotificationAsync(
                            context, issue, notificationService, configuration, cancellationToken);
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
        /// Sends assignment notification to ALL DefaultAssignee users for auto-created issues.
        /// Email recipients are resolved from the comma-separated AssignedTo field.
        /// </summary>
        private async Task SendAutoCreatedIssueNotificationAsync(
            GpsdataContext context,
            Issuetracker issue,
            INotificationService notificationService,
            IConfiguration? configuration,
            CancellationToken cancellationToken)
        {
            try
            {
                // Resolve all assigned user IDs from comma-separated AssignedTo field
                var assigneeIds = (issue.AssignedTo ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToList();

                if (!assigneeIds.Any()) return;

                // Look up actual users to validate IDs and get usernames
                var assignedUsers = await context.Users
                    .AsNoTracking()
                    .Where(u => assigneeIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.UserName, u.Email })
                    .ToListAsync(cancellationToken);

                if (!assignedUsers.Any())
                {
                    _logger.LogWarning("No valid users found for DefaultAssignee '{Ids}' on issue {IssueId}",
                        issue.AssignedTo, issue.Id);
                    return;
                }

                // Build vehicle name for the notification
                string? vehicleName = null;
                if (issue.VehicleId > 0)
                {
                    vehicleName = await context.Vehicles
                        .Where(v => v.VehicleId == issue.VehicleId)
                        .Select(v => v.HyoungNo ?? v.NumberPlate ?? $"Vehicle #{v.VehicleId}")
                        .FirstOrDefaultAsync(cancellationToken);
                }

                // Build site name
                string? siteName = null;
                if (issue.SiteId > 0)
                {
                    siteName = await context.Sites
                        .Where(s => s.Id == issue.SiteId)
                        .Select(s => s.Name)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                var frontendBaseUrl = configuration?.GetValue<string>("FrontendBaseUrl")
                    ?? configuration?.GetValue<string>("AppSettings:FrontendBaseUrl")
                    ?? "http://localhost:3000";
                var issueUrl = $"{frontendBaseUrl}/issue-tracker/details/{issue.Id}";
                var vehicleLabel = !string.IsNullOrWhiteSpace(vehicleName) ? $"[{vehicleName}] " : "";
                var primaryAssignee = assignedUsers.First();

                // Build rich HTML email with clickable links
                var emailBodyHtml = BuildAutoCreatedIssueEmailHtml(
                    issue.Id,
                    issue.ProblemTitle ?? "Untitled Issue",
                    vehicleName,
                    siteName,
                    primaryAssignee.UserName ?? "User",
                    primaryAssignee.Email ?? "",
                    string.Join(", ", assignedUsers.Select(u => u.UserName)),
                    issueUrl);

                // Build recipients list — one per assigned user
                var recipients = assignedUsers.Select(u => new NotificationRecipientDto
                {
                    UserId = u.Id,
                    DeliveryMethods = new List<string> { "Email", "System" },
                    ResolvedFrom = "IssueAutoCreation"
                }).ToList();

                var notificationRequest = new CreateNotificationRequest
                {
                    Type = NotificationType.Alert,
                    CategoryId = (int)WellKnownCategories.IssueTracker,
                    Priority = NotificationPriority.High,
                    Title = $"Auto-Created Issue: {vehicleLabel}{issue.ProblemTitle}",
                    Message = $"An issue has been automatically created and assigned to you. Click to view details.",
                    Data = new
                    {
                        IssueId = issue.Id,
                        IssueTitle = issue.ProblemTitle,
                        ActionUrl = issueUrl,
                        IssueUrl = issueUrl,
                        AssignedToUserId = primaryAssignee.Id,
                        AssignedToUserName = primaryAssignee.UserName,
                        AssignedToEmail = primaryAssignee.Email,
                        IsAutoCreated = true,
                        EmailBodyHtml = emailBodyHtml
                    },
                    TriggerSource = "IssueAutoCreation",
                    TriggeredBy = "System",
                    SiteId = issue.SiteId,
                    VehicleId = issue.VehicleId,
                    IssueTrackerId = issue.Id,
                    Recipients = recipients,
                    DisableFallbackAllUsers = true
                };

                var result = await notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);
                if (!result.IsSuccess)
                {
                    _logger.LogWarning(
                        "Notification failed for auto-created issue {IssueId}: {Message}",
                        issue.Id, result.Message);
                }
                else
                {
                    _logger.LogInformation(
                        "Sent notification for auto-created issue {IssueId} to {Count} assignees: {Users}",
                        issue.Id, assignedUsers.Count, string.Join(", ", assignedUsers.Select(u => u.UserName)));
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notification for auto-created issue {IssueId}", issue.Id);
            }
        }

        private static string BuildAutoCreatedIssueEmailHtml(
            int issueId,
            string issueTitle,
            string? vehicleName,
            string? siteName,
            string assignedToName,
            string assignedToEmail,
            string allAssigneeNames,
            string issueUrl)
        {
            var safeTitle = System.Net.WebUtility.HtmlEncode(issueTitle);
            var safeVehicle = System.Net.WebUtility.HtmlEncode(vehicleName ?? "Not specified");
            var safeSite = System.Net.WebUtility.HtmlEncode(siteName ?? "Not specified");
            var safeAssignee = System.Net.WebUtility.HtmlEncode(assignedToName);
            var safeEmail = System.Net.WebUtility.HtmlEncode(assignedToEmail);
            var safeAllAssignees = System.Net.WebUtility.HtmlEncode(allAssigneeNames);
            var safeUrl = System.Net.WebUtility.HtmlEncode(issueUrl);

            return $@"
<table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;"">
  <!-- Header -->
  <tr>
    <td style=""padding:24px 24px 16px;background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);border-radius:12px 12px 0 0;"">
      <div style=""font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;"">
        <span style=""display:inline-block;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;"">&#9888; Auto-Created Issue</span>
      </div>
      <div style=""font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;"">Issue #{issueId}: {safeTitle}</div>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style=""background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:0;"">
      <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""border-collapse:collapse;"">
        <tr>
          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">&#128100; Assigned To</div>
            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeAssignee}</div>
            <div style=""font-size:13px;color:#6b7280;"">{safeEmail}</div>
          </td>
          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">&#128101; All Assignees</div>
            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeAllAssignees}</div>
          </td>
        </tr>
        <tr>
          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">&#128663; Vehicle</div>
            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeVehicle}</div>
          </td>
          <td style=""padding:16px 24px;border-bottom:1px solid #f3f4f6;width:50%;"">
            <div style=""font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;"">&#128205; Site/Location</div>
            <div style=""font-size:14px;color:#111827;font-weight:600;"">{safeSite}</div>
          </td>
        </tr>
      </table>
      <!-- Action Button -->
      <div style=""padding:24px;text-align:center;"">
        <a href=""{safeUrl}"" style=""display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(37,99,235,0.25);"">
          View Issue Details &rarr;
        </a>
      </div>
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style=""padding:16px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;"">
      <p style=""margin:0;font-size:12px;color:#6b7280;"">
        This issue was <strong>automatically created</strong> by the <strong>Hyoung FMS Monitoring System</strong>.<br/>
        Please do not reply directly to this email.
      </p>
    </td>
  </tr>
</table>";
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Monitoring Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
