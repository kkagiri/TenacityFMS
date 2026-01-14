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
    /// Checker that auto-closes issues when the associated device comes back online.
    /// Uses the PTS device or Vehicle last communication time to determine online status.
    /// </summary>
    public class OnlineChecker : IAutoCloseChecker
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<OnlineChecker> _logger;
        private string _closeReason = string.Empty;

        public string CheckerType => "Online";

        public OnlineChecker(GpsdataContext context, ILogger<OnlineChecker> logger)
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
                var deviceType = issue.IssueTemplate?.DeviceType?.Name?.ToLowerInvariant();

                // Parse checker config for threshold
                var thresholdMinutes = GetOnlineThresholdMinutes(config);

                // Check based on device type
                switch (deviceType)
                {
                    case "pts":
                    case "pts_terminal":
                    case "tank_monitor":
                    case "tankmonitor":
                    case "atg":
                        return await CheckPTSOnlineAsync(issue, thresholdMinutes, cancellationToken);

                    case "vehicle":
                    case "gps":
                        return await CheckVehicleOnlineAsync(issue, thresholdMinutes, cancellationToken);

                    default:
                        _logger.LogWarning("Unknown device type {DeviceType} for online check", deviceType);
                        return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking online status for issue {IssueId}", issue.Id);
                return false;
            }
        }

        public string GetCloseReason() => _closeReason;

        private int GetOnlineThresholdMinutes(Issueautocloseconfig config)
        {
            // Default threshold
            const int defaultThreshold = 15;

            if (string.IsNullOrEmpty(config.CheckerConfigJson))
                return defaultThreshold;

            try
            {
                var jsonDoc = JsonDocument.Parse(config.CheckerConfigJson);
                if (jsonDoc.RootElement.TryGetProperty("onlineThresholdMinutes", out var value))
                {
                    return value.GetInt32();
                }
            }
            catch
            {
                // Ignore parse errors
            }

            return defaultThreshold;
        }

        private async Task<bool> CheckVehicleOnlineAsync(
            Issuetracker issue,
            int thresholdMinutes,
            CancellationToken cancellationToken)
        {
            if (!issue.RelatedEntityId.HasValue)
            {
                _logger.LogDebug("Issue {IssueId} has no RelatedEntityId for vehicle check", issue.Id);
                return false;
            }

            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == issue.RelatedEntityId.Value)
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle == null)
            {
                _logger.LogDebug("Vehicle not found for issue {IssueId}", issue.Id);
                return false;
            }

            // Check if the vehicle is active - if it's active, it's "online"
            if (vehicle.IsActive.HasValue && vehicle.IsActive.Value == 1)
            {
                _closeReason = "Vehicle is now marked as active";
                return true;
            }

            return false;
        }

        private async Task<bool> CheckPTSOnlineAsync(
            Issuetracker issue,
            int thresholdMinutes,
            CancellationToken cancellationToken)
        {
            // For PTS devices, RelatedEntityId may not be set since Ptsdevice uses string Ptsid
            // Try to extract the device ID from problem description or use RelatedEntityType as identifier
            string? ptsDeviceId = null;

            // Try to extract PTS device ID from description (format: "Device ID: <id>")
            if (!string.IsNullOrEmpty(issue.ProblemDescription))
            {
                var match = System.Text.RegularExpressions.Regex.Match(
                    issue.ProblemDescription,
                    @"Device ID:\s*(\S+)");
                if (match.Success)
                {
                    ptsDeviceId = match.Groups[1].Value;
                }
            }

            if (string.IsNullOrEmpty(ptsDeviceId))
            {
                _logger.LogDebug("Issue {IssueId} has no PTS device ID for PTS check", issue.Id);
                return false;
            }

            var ptsDevice = await _context.Ptsdevices
                .Where(p => p.Ptsid == ptsDeviceId)
                .FirstOrDefaultAsync(cancellationToken);

            if (ptsDevice == null)
            {
                _logger.LogDebug("PTS device not found for issue {IssueId}", issue.Id);
                return false;
            }

            // Check if last activity is within threshold
            var cutoffTime = DateTime.UtcNow.AddMinutes(-thresholdMinutes);

            if (ptsDevice.LastActivity.HasValue && ptsDevice.LastActivity.Value >= cutoffTime)
            {
                _closeReason = $"PTS device came back online at {ptsDevice.LastActivity.Value:yyyy-MM-dd HH:mm:ss}";
                return true;
            }

            return false;
        }
    }
}
