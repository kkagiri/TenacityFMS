using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.Extensions.Logging;

namespace FMS.BackgroundServices.IssueTracker
{
    /// <summary>
    /// Checker that auto-closes issues when the linked ActiveAlarm is cleared.
    /// Checks the ActiveAlarm.IsActive status or if the alarm was acknowledged.
    /// </summary>
    public class AlarmClearedChecker : IAutoCloseChecker
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AlarmClearedChecker> _logger;
        private string _closeReason = string.Empty;

        public string CheckerType => "AlarmCleared";

        public AlarmClearedChecker(GpsdataContext context, ILogger<AlarmClearedChecker> logger)
        {
            _context = context;
            _logger = logger;
        }

        public Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
        {
            // TODO: Wire to EventExpressionEngine ActiveEvents table
            // Old implementation queried the deleted ActiveAlarms DbSet.
            // Rework to query ActiveEvents once EventExpressionEngine is fully integrated.
            if (issue.ActiveAlarmId.HasValue)
            {
                _logger.LogDebug(
                    "Issue {IssueId} linked to ActiveAlarmId {AlarmId} - alarm cleared check skipped (pending EventEngine migration)",
                    issue.Id, issue.ActiveAlarmId.Value);
            }

            return Task.FromResult(false);
        }

        public string GetCloseReason() => _closeReason;

        private bool GetConfigBool(Issueautocloseconfig config, string propertyName, bool defaultValue)
        {
            if (string.IsNullOrEmpty(config.CheckerConfigJson))
                return defaultValue;

            try
            {
                var jsonDoc = JsonDocument.Parse(config.CheckerConfigJson);
                if (jsonDoc.RootElement.TryGetProperty(propertyName, out var value))
                {
                    return value.GetBoolean();
                }
            }
            catch
            {
                // Ignore parse errors
            }

            return defaultValue;
        }
    }
}
