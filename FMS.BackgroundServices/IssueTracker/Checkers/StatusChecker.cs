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
    /// Checker that auto-closes issues based on device status matching expected values.
    /// Checks the current status of the related entity against configured expected values.
    /// </summary>
    public class StatusChecker : IAutoCloseChecker
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<StatusChecker> _logger;
        private string _closeReason = string.Empty;

        public string CheckerType => "Status";

        public StatusChecker(GpsdataContext context, ILogger<StatusChecker> logger)
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
                var expectedStatus = GetExpectedStatus(config);

                if (string.IsNullOrEmpty(expectedStatus))
                {
                    _logger.LogWarning("No expected status configured for status checker on issue {IssueId}", issue.Id);
                    return false;
                }

                var deviceType = issue.IssueTemplate?.DeviceType?.Name?.ToLowerInvariant();

                switch (deviceType)
                {
                    case "pts":
                    case "pts_terminal":
                    case "tank_monitor":
                    case "tankmonitor":
                    case "atg":
                        return await CheckPTSStatusAsync(issue, expectedStatus, cancellationToken);

                    case "vehicle":
                    case "gps":
                        return await CheckVehicleStatusAsync(issue, expectedStatus, cancellationToken);

                    default:
                        _logger.LogWarning("Unknown device type {DeviceType} for status check", deviceType);
                        return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking status for issue {IssueId}", issue.Id);
                return false;
            }
        }

        public string GetCloseReason() => _closeReason;

        private string? GetExpectedStatus(Issueautocloseconfig config)
        {
            if (string.IsNullOrEmpty(config.CheckerConfigJson))
                return null;

            try
            {
                var jsonDoc = JsonDocument.Parse(config.CheckerConfigJson);
                if (jsonDoc.RootElement.TryGetProperty("expectedStatus", out var value))
                {
                    return value.GetString();
                }
            }
            catch
            {
                // Ignore parse errors
            }

            return null;
        }

        private async Task<bool> CheckVehicleStatusAsync(
            Issuetracker issue,
            string expectedStatus,
            CancellationToken cancellationToken)
        {
            if (!issue.RelatedEntityId.HasValue)
                return false;

            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == issue.RelatedEntityId.Value)
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle == null)
                return false;

            var expectedStatuses = ParseExpectedStatuses(expectedStatus);
            var currentStatus = vehicle.IsActive.HasValue && vehicle.IsActive.Value == 1 ? "active" : "inactive";

            if (expectedStatuses.Contains(currentStatus))
            {
                _closeReason = $"Vehicle status is now '{currentStatus}'";
                return true;
            }

            return false;
        }

        private async Task<bool> CheckPTSStatusAsync(
            Issuetracker issue,
            string expectedStatus,
            CancellationToken cancellationToken)
        {
            // For PTS devices, extract the device ID from problem description
            string? ptsDeviceId = null;

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
                return false;

            var ptsDevice = await _context.Ptsdevices
                .Where(p => p.Ptsid == ptsDeviceId)
                .FirstOrDefaultAsync(cancellationToken);

            if (ptsDevice == null)
                return false;

            var expectedStatuses = ParseExpectedStatuses(expectedStatus);
            // Use ConnectionStatus property or derive from IsActive
            var currentStatus = !string.IsNullOrEmpty(ptsDevice.ConnectionStatus)
                ? ptsDevice.ConnectionStatus.ToLowerInvariant()
                : (ptsDevice.IsActive == 1 ? "active" : "inactive");

            if (expectedStatuses.Contains(currentStatus))
            {
                _closeReason = $"PTS device status changed to '{currentStatus}'";
                return true;
            }

            return false;
        }

        private string[] ParseExpectedStatuses(string expectedStatus)
        {
            return expectedStatus
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => s.ToLowerInvariant())
                .ToArray();
        }
    }
}
