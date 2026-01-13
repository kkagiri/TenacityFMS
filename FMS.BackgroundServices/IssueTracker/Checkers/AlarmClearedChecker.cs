using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
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

        public async Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
        {
            try
            {
                // Check if issue is linked to an ActiveAlarm via ActiveAlarmId field
                if (!issue.ActiveAlarmId.HasValue)
                {
                    _logger.LogDebug("Issue {IssueId} is not linked to an ActiveAlarm", issue.Id);
                    return false;
                }

                var alarm = await _context.ActiveAlarms
                    .Where(a => a.Id == issue.ActiveAlarmId.Value)
                    .FirstOrDefaultAsync(cancellationToken);

                // Parse config for additional options
                var closeIfDeleted = GetConfigBool(config, "closeIfAlarmDeleted", false);
                var closeOnAcknowledge = GetConfigBool(config, "closeOnAlarmAcknowledge", false);

                if (alarm == null)
                {
                    // Alarm was deleted - could mean it was cleared
                    _closeReason = "Linked ActiveAlarm was removed from the system";
                    return closeIfDeleted;
                }

                // Check if alarm is no longer active (State is "Resolved" or similar)
                var resolvedStates = new[] { "Resolved", "Cleared", "Closed" };
                if (resolvedStates.Contains(alarm.State, StringComparer.OrdinalIgnoreCase))
                {
                    _closeReason = $"Linked ActiveAlarm was resolved at {alarm.ResolvedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "unknown time"}";
                    return true;
                }

                // Check if alarm was acknowledged and config allows closing on acknowledgment
                if (closeOnAcknowledge)
                {
                    if (alarm.AcknowledgedAt.HasValue)
                    {
                        _closeReason = $"Linked ActiveAlarm was acknowledged at {alarm.AcknowledgedAt.Value.ToString("yyyy-MM-dd HH:mm:ss")}";
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking alarm cleared status for issue {IssueId}", issue.Id);
                return false;
            }
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
