using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Checker that never auto-closes issues - for manual close only templates.
    /// This checker always returns false, indicating the issue must be manually closed.
    /// </summary>
    public class ManualOnlyChecker : IAutoCloseChecker
    {
        private readonly ILogger<ManualOnlyChecker> _logger;

        public string CheckerType => "ManualOnly";

        public ManualOnlyChecker(ILogger<ManualOnlyChecker> logger)
        {
            _logger = logger;
        }

        public Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
        {
            // Manual-only checker never auto-closes
            _logger.LogDebug("Issue {IssueId} uses manual-only template - will not auto-close", issue.Id);
            return Task.FromResult(false);
        }

        public string GetCloseReason() => "Manual close only";
    }
}
