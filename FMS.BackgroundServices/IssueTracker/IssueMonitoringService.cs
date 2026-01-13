using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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
                                issuesCreated += await MonitorVehiclesAsync(context, template, cancellationToken);
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

        private async Task<int> MonitorVehiclesAsync(
            GpsdataContext context,
            Issuetemplate template,
            CancellationToken cancellationToken)
        {
            var issuesCreated = 0;

            // Find inactive vehicles (Vehicle doesn't have LastCommTime, so we check IsActive status)
            var inactiveVehicles = await context.Vehicles
                .Where(v => v.IsActive.HasValue && v.IsActive.Value == 0) // Inactive vehicles
                .Take(100) // Limit for performance
                .ToListAsync(cancellationToken);

            foreach (var vehicle in inactiveVehicles)
            {
                var existingIssue = await HasOpenIssueForDevice(
                    context, template.Id, vehicle.VehicleId, "vehicle", cancellationToken);

                if (existingIssue)
                    continue;

                var issue = CreateIssueFromTemplate(context, template, vehicle.VehicleId, "vehicle",
                    $"Vehicle {vehicle.HyoungNo ?? vehicle.NumberPlate} - Inactive",
                    $"Vehicle '{vehicle.HyoungNo ?? vehicle.NumberPlate}' has been marked as inactive. " +
                    $"Please investigate and resolve.");

                context.Issuetrackers.Add(issue);
                issuesCreated++;

                _logger.LogInformation("Auto-created issue for inactive vehicle: {VehicleId}", vehicle.HyoungNo);
            }

            if (issuesCreated > 0)
            {
                await context.SaveChangesAsync(cancellationToken);
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

                var issue = CreateIssueFromTemplate(context, template, 0, "pts",
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

        private Issuetracker CreateIssueFromTemplate(
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
                ReportedBy = "System", // Auto-created by system
                Openby = "System",
                AssignTo = template.DefaultAssignee ?? "Unassigned",
                SiteId = defaultSiteId,
                IssueCategoryId = defaultCategoryId,
                VehicleId = relatedEntityType == "vehicle" ? relatedEntityId : 0
                // Note: For PTS devices, store the device ID in RelatedEntityType description or use a separate field
            };
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Monitoring Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
