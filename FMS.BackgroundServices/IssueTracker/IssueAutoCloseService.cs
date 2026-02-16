using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.IssueTracker.Services;
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
    /// Background service for auto-closing issues based on configured conditions.
    /// Periodically checks issues that have CanAutoClose=true and evaluates their
    /// auto-close conditions using the appropriate checker strategy.
    /// Uses the minimum CheckIntervalSeconds from active auto-close configs to
    /// determine the check frequency (falls back to 5 minutes if none configured).
    /// </summary>
    public class IssueAutoCloseService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IssueAutoCloseService> _logger;
        private static readonly TimeSpan DefaultCheckInterval = TimeSpan.FromMinutes(5);

        public IssueAutoCloseService(
            IServiceProvider serviceProvider,
            ILogger<IssueAutoCloseService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Issue Auto-Close Service started");

            // Initial delay to let other services start
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                TimeSpan nextInterval;
                try
                {
                    nextInterval = await ProcessAutoCloseIssues(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Issue Auto-Close processing cycle");
                    nextInterval = DefaultCheckInterval;
                }

                try
                {
                    await Task.Delay(nextInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Issue Auto-Close Service stopped");
        }

        /// <summary>
        /// Resolves the check interval from the minimum CheckIntervalSeconds across all
        /// enabled auto-close configs. Falls back to DefaultCheckInterval (5 min) if
        /// no configs have a value set, or if the resolved value is out of bounds.
        /// </summary>
        private async Task<TimeSpan> ResolveCheckIntervalAsync(GpsdataContext context)
        {
            try
            {
                var intervals = await context.Issueautocloseconfigs
                    .Where(c => c.IsEnabled && c.CheckIntervalSeconds.HasValue && c.CheckIntervalSeconds.Value > 0)
                    .Select(c => c.CheckIntervalSeconds!.Value)
                    .ToListAsync();

                var minIntervalSeconds = intervals.Count > 0 ? intervals.Min() : 0;

                if (minIntervalSeconds > 0)
                {
                    // Clamp between 60 seconds (1 min) and 86400 seconds (24 hours)
                    var clampedSeconds = Math.Clamp(minIntervalSeconds, 60, 86400);
                    var interval = TimeSpan.FromSeconds(clampedSeconds);
                    _logger.LogDebug("[Auto-Close] Using check interval from config: {Seconds}s ({Interval})",
                        clampedSeconds, interval);
                    return interval;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Auto-Close] Failed to resolve check interval from DB, using default");
            }

            return DefaultCheckInterval;
        }

        private async Task<TimeSpan> ProcessAutoCloseIssues(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var checkerFactory = scope.ServiceProvider.GetRequiredService<IAutoCloseCheckerFactory>();

            // Resolve the next check interval from DB configs (done early so we return it even on error)
            var nextInterval = await ResolveCheckIntervalAsync(context);

            try
            {
                _logger.LogDebug("Starting Issue Auto-Close processing cycle");

                // Get all open issues that can be auto-closed
                var openStatusIds = await GetOpenStatusIds(context);

                var autoCloseableIssues = await context.Issuetrackers
                    .Include(i => i.IssueTemplate)
                        .ThenInclude(t => t!.AutoCloseConfig)
                    .Include(i => i.IssueTemplate)
                        .ThenInclude(t => t!.DeviceType)
                    .Where(i => i.CanAutoClose
                        && i.Status.HasValue
                        && openStatusIds.Contains(i.Status.Value)
                        && i.IssueTemplateId.HasValue
                        && i.IssueTemplate != null
                        && i.IssueTemplate.AutoCloseConfig != null
                        && i.IssueTemplate.AutoCloseConfig.IsEnabled)
                    .ToListAsync(cancellationToken);

                if (!autoCloseableIssues.Any())
                {
                    _logger.LogDebug("No auto-closeable issues found");
                    return nextInterval;
                }

                _logger.LogInformation("Found {Count} issues eligible for auto-close check", autoCloseableIssues.Count);

                // Pre-fetch bulk GPS locations for vehicle/GPS issues to avoid per-issue API calls
                Dictionary<int, VehicleLocationDTO>? gpsLocationLookup = null;
                var vehicleDeviceTypes = new[] { "vehicle", "gps", "gps device", "gps_device" };
                var hasVehicleGpsIssues = autoCloseableIssues.Any(i =>
                    i.IssueTemplate?.AutoCloseConfig?.CheckerType?.Equals("Online", StringComparison.OrdinalIgnoreCase) == true &&
                    vehicleDeviceTypes.Contains(i.IssueTemplate?.DeviceType?.Name?.ToLowerInvariant()));

                if (hasVehicleGpsIssues)
                {
                    var gpsService = scope.ServiceProvider.GetService<IGPSService>();
                    if (gpsService != null)
                    {
                        try
                        {
                            var allLocations = await gpsService.GetAllVehicleLocationsAsync(false, true);
                            if (allLocations.IsSuccess && allLocations.Data != null)
                            {
                                gpsLocationLookup = allLocations.Data.ToDictionary(l => l.VehicleId, l => l);
                                _logger.LogDebug("[Auto-Close] Pre-fetched {Count} vehicle GPS locations for online checks", gpsLocationLookup.Count);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "[Auto-Close] Failed to pre-fetch GPS locations, falling back to per-issue calls");
                        }
                    }
                }

                var closedCount = 0;
                foreach (var issue in autoCloseableIssues)
                {
                    try
                    {
                        var config = issue.IssueTemplate!.AutoCloseConfig!;
                        var checker = checkerFactory.CreateChecker(config.CheckerType);

                        if (checker == null)
                        {
                            _logger.LogWarning("Unknown checker type '{CheckerType}' for issue {IssueId}",
                                config.CheckerType, issue.Id);
                            continue;
                        }

                        try
                        {
                            // Pass pre-fetched GPS data to OnlineChecker / FuelActivityChecker to avoid per-issue API calls
                            var innerChecker = checker is ScopedAutoCloseChecker scoped ? scoped.InnerChecker : checker;
                            if (innerChecker is OnlineChecker onlineChecker && gpsLocationLookup != null)
                            {
                                onlineChecker.SetPreFetchedLocations(gpsLocationLookup);
                            }
                            else if (innerChecker is FuelActivityChecker fuelChecker && gpsLocationLookup != null)
                            {
                                fuelChecker.SetPreFetchedLocations(gpsLocationLookup);
                            }

                            var shouldClose = await checker.ShouldAutoCloseAsync(issue, config, cancellationToken);

                            if (shouldClose)
                            {
                                await CloseIssue(context, issue, checker.GetCloseReason(), scope.ServiceProvider, cancellationToken);
                                closedCount++;
                                _logger.LogInformation("Auto-closed issue {IssueId} - {Title} (Reason: {Reason})",
                                    issue.Id, issue.ProblemTitle, checker.GetCloseReason());
                            }
                        }
                        finally
                        {
                            // Dispose the checker to release its DI scope and scoped services
                            (checker as IDisposable)?.Dispose();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error checking auto-close for issue {IssueId}", issue.Id);
                    }
                }

                if (closedCount > 0)
                {
                    _logger.LogInformation("Auto-closed {Count} issues in this cycle", closedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in auto-close processing");
            }

            return nextInterval;
        }

        private async Task<List<int>> GetOpenStatusIds(GpsdataContext context)
        {
            // Get status IDs that represent "open" states (not closed/resolved)
            var closedStatuses = new[] { "Closed", "Resolved", "Auto-Closed", "Cancelled" };

            var openStatuses = await context.Issuestatuses
                .Where(s => !closedStatuses.Contains(s.Status))
                .Select(s => s.Id)
                .ToListAsync();

            return openStatuses;
        }

        private async Task CloseIssue(GpsdataContext context, Issuetracker issue, string reason,
            IServiceProvider scopedProvider, CancellationToken cancellationToken)
        {
            // Capture previous status for activity log
            var previousStatusId = issue.Status;
            string? previousStatusName = null;
            if (previousStatusId.HasValue)
            {
                previousStatusName = await context.Issuestatuses
                    .Where(s => s.Id == previousStatusId.Value)
                    .Select(s => s.Status)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            // Get the "Auto-Closed" status
            var autoClosedStatus = await context.Issuestatuses
                .FirstOrDefaultAsync(s => s.Status == "Auto-Closed", cancellationToken);

            if (autoClosedStatus != null)
            {
                issue.Status = autoClosedStatus.Id;
            }

            issue.ClosingDate = DateTime.UtcNow;
            issue.AutoCloseReason = reason;
            issue.LastModfield = DateTime.UtcNow;

            await context.SaveChangesAsync(cancellationToken);

            // Log activity for the auto-close action
            try
            {
                var activityService = scopedProvider.GetService<IIssueActivityService>();
                if (activityService != null)
                {
                    await activityService.LogStatusChangeAsync(
                        issue.Id,
                        previousStatusName ?? "Open",
                        "Auto-Closed",
                        "system",
                        "System",
                        cancellationToken);

                    await activityService.LogActivityAsync(
                        issue.Id,
                        "AutoClosed",
                        $"Issue auto-closed. Reason: {reason}",
                        "system",
                        "System",
                        cancellationToken: cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to log activity for auto-closed issue {IssueId}", issue.Id);
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Auto-Close Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
