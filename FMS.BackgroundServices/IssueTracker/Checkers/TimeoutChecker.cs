using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Checker that auto-closes issues after a configured timeout period.
    /// Uses the issue creation date and configured timeout to determine if issue should be closed.
    /// </summary>
    public class TimeoutChecker : IAutoCloseChecker
    {
        private readonly ILogger<TimeoutChecker> _logger;
        private string _closeReason = string.Empty;

        public string CheckerType => "Timeout";

        public TimeoutChecker(ILogger<TimeoutChecker> logger)
        {
            _logger = logger;
        }

        public Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
        {
            try
            {
                // Get timeout configuration from JSON
                var timeoutHours = GetTimeoutHours(config);

                if (timeoutHours <= 0)
                {
                    _logger.LogDebug("Timeout not configured for issue {IssueId}", issue.Id);
                    return Task.FromResult(false);
                }

                // Check if issue has been open longer than timeout
                var issueCreatedAt = issue.OpenDate ?? issue.LastModfield ?? DateTime.MinValue;

                if (issueCreatedAt == DateTime.MinValue)
                {
                    _logger.LogWarning("Issue {IssueId} has no creation date", issue.Id);
                    return Task.FromResult(false);
                }

                var timeoutExpiry = issueCreatedAt.AddHours(timeoutHours);

                if (DateTime.UtcNow >= timeoutExpiry)
                {
                    _closeReason = $"Issue auto-closed after {timeoutHours} hour timeout (created: {issueCreatedAt:yyyy-MM-dd HH:mm:ss})";
                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking timeout for issue {IssueId}", issue.Id);
                return Task.FromResult(false);
            }
        }

        public string GetCloseReason() => _closeReason;

        private int GetTimeoutHours(Issueautocloseconfig config)
        {
            const int defaultTimeout = 24;

            if (string.IsNullOrEmpty(config.CheckerConfigJson))
                return defaultTimeout;

            try
            {
                var jsonDoc = JsonDocument.Parse(config.CheckerConfigJson);
                if (jsonDoc.RootElement.TryGetProperty("timeoutHours", out var value))
                {
                    return value.GetInt32();
                }
            }
            catch
            {
                // Ignore parse errors
            }

            return defaultTimeout;
        }
    }
}
