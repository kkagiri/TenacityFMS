using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
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
        private readonly IGPSService? _gpsService;
        private Dictionary<int, VehicleLocationDTO>? _preFetchedLocations;
        private string _closeReason = string.Empty;

        public string CheckerType => "Online";

        public OnlineChecker(GpsdataContext context, ILogger<OnlineChecker> logger, IGPSService? gpsService = null)
        {
            _context = context;
            _logger = logger;
            _gpsService = gpsService;
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
                    case "gps device":
                    case "gps_device":
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

        /// <summary>
        /// Sets pre-fetched bulk GPS location data to avoid per-vehicle API calls.
        /// Call this before ShouldAutoCloseAsync to reuse a single bulk fetch for all issues.
        /// </summary>
        public void SetPreFetchedLocations(Dictionary<int, VehicleLocationDTO>? locations)
        {
            _preFetchedLocations = locations;
        }

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

            var vehicleId = issue.RelatedEntityId.Value;

            // Check pre-fetched bulk data first (avoids per-vehicle API calls)
            if (_preFetchedLocations != null && _preFetchedLocations.TryGetValue(vehicleId, out var preFetchedLocation))
            {
                var minutesSinceLastSeen = (DateTime.UtcNow - preFetchedLocation.LastUpdated).TotalMinutes;

                if (preFetchedLocation.IsOnline && minutesSinceLastSeen <= thresholdMinutes)
                {
                    _closeReason = $"Vehicle GPS came back online at {preFetchedLocation.LastUpdated:yyyy-MM-dd HH:mm:ss} UTC";
                    _logger.LogInformation(
                        "[OnlineChecker] Vehicle {VehicleId} is back online (last seen {MinutesAgo:F0} min ago, threshold: {Threshold} min) [bulk data]",
                        vehicleId, minutesSinceLastSeen, thresholdMinutes);
                    return true;
                }
                return false;
            }

            // Fallback: Use GPS service for individual check if no pre-fetched data
            if (_gpsService != null)
            {
                try
                {
                    var locationResponse = await _gpsService.GetVehicleLocationAsync(vehicleId);

                    if (locationResponse.IsSuccess && locationResponse.Data != null)
                    {
                        var location = locationResponse.Data;
                        var minutesSinceLastSeen = (DateTime.UtcNow - location.LastUpdated).TotalMinutes;

                        // Vehicle is online if IsOnline flag is true AND was seen within threshold
                        if (location.IsOnline && minutesSinceLastSeen <= thresholdMinutes)
                        {
                            _closeReason = $"Vehicle GPS came back online at {location.LastUpdated:yyyy-MM-dd HH:mm:ss} UTC";
                            _logger.LogInformation(
                                "[OnlineChecker] Vehicle {VehicleId} is back online (last seen {MinutesAgo:F0} min ago, threshold: {Threshold} min)",
                                vehicleId, minutesSinceLastSeen, thresholdMinutes);
                            return true;
                        }
                    }

                    return false;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[OnlineChecker] Error checking GPS status for vehicle {VehicleId}, falling back to IsActive check", vehicleId);
                }
            }

            // Fallback: check if the vehicle is marked as active in DB
            var vehicle = await _context.Vehicles
                .Where(v => v.VehicleId == vehicleId)
                .FirstOrDefaultAsync(cancellationToken);

            if (vehicle == null)
            {
                _logger.LogDebug("Vehicle not found for issue {IssueId}", issue.Id);
                return false;
            }

            if (vehicle.IsActive.HasValue && vehicle.IsActive.Value == 1)
            {
                _closeReason = "Vehicle is now marked as active (GPS service unavailable for live check)";
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
