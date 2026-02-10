using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Background service for monitoring devices and auto-creating issues.
    /// Periodically checks device status (PTS devices, vehicles)
    /// and creates issues based on configured templates when problems are detected.
    /// </summary>
    public class IssueMonitoringService : BackgroundService
    {
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
                                issuesCreated += await MonitorVehicleGpsOfflineAsync(context, template, scope.ServiceProvider, cancellationToken);
                                break;

                            case "pts":
                            case "pts_terminal":
                            case "tank_monitor":
                            case "tankmonitor":
                            case "atg":
                                // All PTS/ATG/Tank devices use Ptsdevices table
                                issuesCreated += await MonitorPTSDevicesAsync(context, template, cancellationToken);
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
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;
            var offlineThresholdMinutes = template.OfflineThresholdMinutes ?? 60;

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

                _logger.LogDebug("[GPS Offline Monitor] Checking {Count} GPS-equipped vehicles for offline status (threshold: {Threshold} min)",
                    gpsVehicles.Count, offlineThresholdMinutes);

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

                foreach (var mapping in gpsVehicles)
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
                            // Build title/description from template placeholders
                            var title = (template.TitleTemplate ?? "GPS Offline - {vehicleName}")
                                .Replace("{vehicleName}", vehicleName);

                            var description = (template.DescriptionTemplate ?? "Vehicle GPS device has been offline. Last seen: {lastSeen}.")
                                .Replace("{vehicleName}", vehicleName)
                                .Replace("{thresholdMinutes}", offlineThresholdMinutes.ToString())
                                .Replace("{lastSeen}", lastSeenInfo);

                            var issue = await CreateIssueFromTemplateAsync(context, template, vehicle.VehicleId, "vehicle",
                                title, description);

                            context.Issuetrackers.Add(issue);
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
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GPS Offline Monitor] Error in GPS offline monitoring");
            }

            return issuesCreated;
        }

        private async Task<int> MonitorPTSDevicesAsync(
            GpsdataContext context,
            Issuetemplate template,
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;
            var offlineThresholdMinutes = template.OfflineThresholdMinutes ?? 30;
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
                    $"Offline threshold: {offlineThresholdMinutes} minutes. Device ID: {device.Ptsid}");

                context.Issuetrackers.Add(issue);
                issuesCreated++;

                _logger.LogInformation("Auto-created issue for offline PTS device: {DeviceId}", device.Ptsid);
            }

            if (issuesCreated > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
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
            string description)
        {
            // Get a default site and category
            var defaultSiteId = 1; // Will need to be configured properly
            var defaultCategoryId = 1; // Will need to be configured properly

            // Resolve a valid system user ID from the database
            // AssignTo and Openby are FKs to user.Id - must use actual user IDs
            var systemUserId = await ResolveSystemUserIdAsync(context);

            // Resolve DefaultAssignee: it might be a username, so look up the actual user ID
            string? assigneeUserId = null;
            if (!string.IsNullOrEmpty(template.DefaultAssignee))
            {
                var assigneeUser = await context.Users
                    .AsNoTracking()
                    .Where(u => u.Id == template.DefaultAssignee || u.UserName == template.DefaultAssignee)
                    .Select(u => u.Id)
                    .FirstOrDefaultAsync();
                assigneeUserId = assigneeUser;
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

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Monitoring Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
