using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
    /// Background service for auto-closing issues based on configured conditions.
    /// Periodically checks issues that have CanAutoClose=true and evaluates their
    /// auto-close conditions using the appropriate checker strategy.
    /// </summary>
    public class IssueAutoCloseService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IssueAutoCloseService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Default check interval

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
                try
                {
                    await ProcessAutoCloseIssues(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Issue Auto-Close processing cycle");
                }

                try
                {
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }

            _logger.LogInformation("Issue Auto-Close Service stopped");
        }

        private async Task ProcessAutoCloseIssues(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();
            var checkerFactory = scope.ServiceProvider.GetRequiredService<IAutoCloseCheckerFactory>();

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
                    return;
                }

                _logger.LogInformation("Found {Count} issues eligible for auto-close check", autoCloseableIssues.Count);

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

                        var shouldClose = await checker.ShouldAutoCloseAsync(issue, config, cancellationToken);

                        if (shouldClose)
                        {
                            await CloseIssue(context, issue, checker.GetCloseReason(), cancellationToken);
                            closedCount++;
                            _logger.LogInformation("Auto-closed issue {IssueId} - {Title} (Reason: {Reason})",
                                issue.Id, issue.ProblemTitle, checker.GetCloseReason());
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

        private async Task CloseIssue(GpsdataContext context, Issuetracker issue, string reason, CancellationToken cancellationToken)
        {
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
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Issue Auto-Close Service is stopping");
            await base.StopAsync(cancellationToken);
        }
    }
}
