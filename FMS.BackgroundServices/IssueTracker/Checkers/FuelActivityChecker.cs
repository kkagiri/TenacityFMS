/**
 * File: FuelActivityChecker.cs
 * Purpose: Auto-close checker for "Fuel Activity While GPS Offline" issues.
 *          Resolves the issue when the vehicle's GPS comes back online,
 *          indicating the GPS device is functioning again.
 * Dependencies: GpsdataContext, IGPSService, ILogger
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - ShouldAutoCloseAsync: Checks if the vehicle's GPS is back online
 * - SetPreFetchedLocations: Accepts bulk GPS data to avoid per-vehicle API calls
 * - GetCloseReason: Returns the reason string for the auto-close log
 */
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
    /// Checker that auto-closes "Fuel Activity While GPS Offline" issues
    /// when the associated vehicle's GPS device comes back online.
    /// The issue was created because the vehicle was being fueled while GPS was offline.
    /// Once GPS is back online, the issue is resolved.
    /// </summary>
    public class FuelActivityChecker : IAutoCloseChecker
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<FuelActivityChecker> _logger;
        private readonly IGPSService? _gpsService;
        private Dictionary<int, VehicleLocationDTO>? _preFetchedLocations;
        private string _closeReason = string.Empty;

        public string CheckerType => "FuelActivity";

        public FuelActivityChecker(
            GpsdataContext context,
            ILogger<FuelActivityChecker> logger,
            IGPSService? gpsService = null)
        {
            _context = context;
            _logger = logger;
            _gpsService = gpsService;
        }

        /// <summary>
        /// Sets pre-fetched bulk GPS location data to avoid per-vehicle API calls.
        /// Call this before ShouldAutoCloseAsync to reuse a single bulk fetch for all issues.
        /// </summary>
        public void SetPreFetchedLocations(Dictionary<int, VehicleLocationDTO>? locations)
        {
            _preFetchedLocations = locations;
        }

        public async Task<bool> ShouldAutoCloseAsync(
            Issuetracker issue,
            Issueautocloseconfig config,
            CancellationToken cancellationToken)
        {
            try
            {
                // Only applies to vehicle-related issues
                if (issue.RelatedEntityType != "vehicle" || issue.RelatedEntityId <= 0)
                {
                    _logger.LogDebug("[FuelActivityChecker] Issue {IssueId} is not vehicle-related, skipping", issue.Id);
                    return false;
                }

                var vehicleId = issue.RelatedEntityId.Value;

                // Parse checker config for online threshold (default 15 minutes)
                var onlineThresholdMinutes = GetOnlineThresholdMinutes(config);

                // Check GPS status — is the vehicle back online?
                VehicleLocationDTO? location = null;

                // Try pre-fetched data first
                if (_preFetchedLocations != null)
                {
                    _preFetchedLocations.TryGetValue(vehicleId, out location);
                }
                else if (_gpsService != null)
                {
                    // Fallback: individual fetch
                    var locResponse = await _gpsService.GetVehicleLocationAsync(vehicleId);
                    if (locResponse.IsSuccess)
                    {
                        location = locResponse.Data;
                    }
                }

                if (location == null)
                {
                    _logger.LogDebug("[FuelActivityChecker] No GPS data for vehicle {VehicleId}, issue {IssueId} stays open",
                        vehicleId, issue.Id);
                    return false;
                }

                var minutesSinceLastSeen = (DateTime.UtcNow - location.LastUpdated).TotalMinutes;
                var isOnline = location.IsOnline && minutesSinceLastSeen < onlineThresholdMinutes;

                if (isOnline)
                {
                    _closeReason = $"Vehicle {vehicleId} GPS is back online (last seen {location.LastUpdated:yyyy-MM-dd HH:mm:ss} UTC, {(int)minutesSinceLastSeen} min ago). Issue resolved.";
                    _logger.LogInformation("[FuelActivityChecker] {Reason}", _closeReason);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FuelActivityChecker] Error checking GPS status for issue {IssueId}", issue.Id);
                return false;
            }
        }

        public string GetCloseReason() => _closeReason;

        private int GetOnlineThresholdMinutes(Issueautocloseconfig config)
        {
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
            catch (Exception)
            {
                // Fall through to default
            }

            return defaultThreshold;
        }
    }
}
