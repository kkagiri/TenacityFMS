using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Features.LocationValidation.Services;

/// <summary>
/// Partial class containing geofence validation methods.
/// Separated from main LocationValidationService for better code organization.
/// </summary>
public partial class LocationValidationService
{
    #region Geofence Validation Methods

    /// <inheritdoc />
    /// <remarks>
    /// Updated to use global system configuration settings instead of per-ruleset settings.
    /// </remarks>
    public async Task<GeofenceValidationResult> ValidateGeofenceAsync(
        GeofenceValidationRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Starting geofence validation for RuleSet {RuleSetId}", request.FuelingRuleSetId);

            // Get the fueling rule set configuration (still needed for reference)
            var ruleSetConfig = await _context.FuelingRuleSets
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.FuelingRuleSetId, cancellationToken);

            if (ruleSetConfig == null)
            {
                _logger.LogWarning("Fueling rule set {RuleSetId} not found", request.FuelingRuleSetId);
                return GeofenceValidationResult.Skipped("Fueling rule set not found");
            }

            // Get geofence validation settings from system configuration (global settings)
            var requireTankerStr = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_REQUIRE_TANKER_IN_GEOFENCE, cancellationToken);
            var requireOperatorStr = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_REQUIRE_OPERATOR_IN_GEOFENCE, cancellationToken);
            var requireVehicleStr = await _systemConfigService.GetConfigurationValueAsync(
                CONFIG_KEY_REQUIRE_VEHICLE_IN_GEOFENCE, cancellationToken);

            // Parse settings with defaults: tanker=true, operator=false, vehicle=false
            var requireTankerInGeofence = !bool.TryParse(requireTankerStr, out var tankerSetting) || tankerSetting; // Default true
            var requireOperatorInGeofence = bool.TryParse(requireOperatorStr, out var operatorSetting) && operatorSetting; // Default false
            var requireVehicleInGeofence = bool.TryParse(requireVehicleStr, out var vehicleSetting) && vehicleSetting; // Default false

            // Get all geofence IDs from globally allowed groups (ignores ruleSetId)
            var geofenceIds = await GetRuleSetGeofenceIdsAsync(request.FuelingRuleSetId, cancellationToken);

            if (geofenceIds.Count == 0)
            {
                _logger.LogWarning("No geofences available from globally allowed groups");
                return GeofenceValidationResult.Skipped("No geofences available from globally allowed groups");
            }

            var result = new GeofenceValidationResult
            {
                WasEnabled = true,
                GeofencesChecked = geofenceIds.Count
            };

            bool tankerPassed = true;
            bool operatorPassed = true;
            bool vehiclePassed = true;

            // Check tanker location if required (from global system settings)
            if (requireTankerInGeofence && request.TankerLocation != null)
            {
                var (isInGeofence, geofenceId, geofenceName) = await CheckLocationInGeofencesAsync(
                    request.TankerLocation.Latitude,
                    request.TankerLocation.Longitude,
                    geofenceIds,
                    cancellationToken);

                tankerPassed = isInGeofence;
                result = result with
                {
                    TankerInGeofence = isInGeofence,
                    TankerGeofenceId = geofenceId,
                    TankerGeofenceName = geofenceName
                };
            }
            else if (requireTankerInGeofence && request.TankerLocation == null)
            {
                tankerPassed = false;
                result = result with { TankerInGeofence = false };
            }

            // Check operator location if required (from global system settings)
            if (requireOperatorInGeofence && request.OperatorLocation != null)
            {
                var (isInGeofence, geofenceId, geofenceName) = await CheckLocationInGeofencesAsync(
                    request.OperatorLocation.Latitude,
                    request.OperatorLocation.Longitude,
                    geofenceIds,
                    cancellationToken);

                operatorPassed = isInGeofence;
                result = result with
                {
                    OperatorInGeofence = isInGeofence,
                    OperatorGeofenceId = geofenceId,
                    OperatorGeofenceName = geofenceName
                };
            }
            else if (requireOperatorInGeofence && request.OperatorLocation == null)
            {
                operatorPassed = false;
                result = result with { OperatorInGeofence = false };
            }

            // Check vehicle location if required (from global system settings)
            if (requireVehicleInGeofence && request.VehicleLocation != null)
            {
                var (isInGeofence, geofenceId, geofenceName) = await CheckLocationInGeofencesAsync(
                    request.VehicleLocation.Latitude,
                    request.VehicleLocation.Longitude,
                    geofenceIds,
                    cancellationToken);

                vehiclePassed = isInGeofence;
                result = result with
                {
                    VehicleInGeofence = isInGeofence,
                    VehicleGeofenceId = geofenceId,
                    VehicleGeofenceName = geofenceName
                };
            }
            else if (requireVehicleInGeofence && request.VehicleLocation == null)
            {
                vehiclePassed = false;
                result = result with { VehicleInGeofence = false };
            }

            // Determine overall result
            if (tankerPassed && operatorPassed && vehiclePassed)
            {
                return result with
                {
                    Outcome = ValidationOutcome.Passed,
                    Reason = "All required parties within allowed geofences"
                };
            }
            else
            {
                var failedChecks = new List<string>();
                if (!tankerPassed) failedChecks.Add("tanker");
                if (!operatorPassed) failedChecks.Add("operator");
                if (!vehiclePassed) failedChecks.Add("vehicle");

                return result with
                {
                    Outcome = ValidationOutcome.Failed,
                    Reason = $"The following are not within allowed geofences: {string.Join(", ", failedChecks)}"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during geofence validation for rule set {RuleSetId}", request.FuelingRuleSetId);
            return GeofenceValidationResult.Failed($"Error during geofence validation: {ex.Message}");
        }
    }

    /// <inheritdoc />
    /// <remarks>
    /// Fixed location validation feature has been removed.
    /// Use GPSGate geofences with IsAllowedForFueling groups instead.
    /// </remarks>
    public Task<FixedLocationValidationResult> ValidateFixedVehicleLocationAsync(
        int vehicleId,
        GeoLocation fuelingLocation,
        CancellationToken cancellationToken = default)
    {
        // Fixed location feature has been removed - use geofences instead
        _logger.LogDebug("Fixed location validation skipped for vehicle {VehicleId} - feature removed", vehicleId);
        return Task.FromResult(FixedLocationValidationResult.Skipped("Fixed location validation feature has been removed. Use GPSGate geofences instead."));
    }

    /// <inheritdoc />
    /// <remarks>
    /// Updated to use global policy: gets geofences from groups where IsAllowedForFueling = true
    /// The ruleSetId parameter is now ignored as geofence validation is global.
    /// </remarks>
    public async Task<List<int>> GetRuleSetGeofenceIdsAsync(
        int ruleSetId,
        CancellationToken cancellationToken = default)
    {
        var geofenceIds = new List<int>();

        try
        {
            // NEW APPROACH: Get geofences from groups that are globally allowed for fueling
            // This replaces the per-ruleset assignment approach
            var allowedGroupIds = await _context.GpsGeofenceGroups
                .AsNoTracking()
                .Where(g => g.IsAllowedForFueling && g.IsActive)
                .Select(g => g.Id)
                .ToListAsync(cancellationToken);

            if (allowedGroupIds.Any())
            {
                var groupGeofences = await _context.Set<GpsGeofenceGroupMember>()
                    .AsNoTracking()
                    .Where(gm => allowedGroupIds.Contains(gm.GroupId))
                    .Select(gm => gm.GeofenceId)
                    .ToListAsync(cancellationToken);

                geofenceIds.AddRange(groupGeofences);
            }

            // Return distinct list
            return geofenceIds.Distinct().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting allowed fueling geofence IDs (rule set {RuleSetId} parameter is now ignored)", ruleSetId);
            return geofenceIds;
        }
    }

    /// <inheritdoc />
    public async Task<(bool IsInGeofence, int? MatchingGeofenceId, string? GeofenceName)> CheckLocationInGeofencesAsync(
        decimal latitude,
        decimal longitude,
        List<int> geofenceIds,
        CancellationToken cancellationToken = default)
    {
        if (geofenceIds == null || geofenceIds.Count == 0)
        {
            return (false, null, null);
        }

        try
        {
            // Get the geofences from the database
            var geofences = await _context.Set<GpsGeofence>()
                .AsNoTracking()
                .Where(g => geofenceIds.Contains(g.Id) && g.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var geofence in geofences)
            {
                bool isInside = false;

                switch (geofence.GeofenceType)
                {
                    case GpsGeofenceType.Circle:
                        isInside = IsPointInCircle(
                            latitude,
                            longitude,
                            geofence.CenterLatitude ?? 0,
                            geofence.CenterLongitude ?? 0,
                            geofence.RadiusMeters ?? 0);
                        break;

                    case GpsGeofenceType.Polygon:
                        if (!string.IsNullOrEmpty(geofence.GeometryJson))
                        {
                            isInside = IsPointInPolygon(latitude, longitude, geofence.GeometryJson);
                        }
                        break;

                    case GpsGeofenceType.Route:
                        // Route geofences are treated as buffered polylines
                        // For now, we can treat them similarly to polygons
                        if (!string.IsNullOrEmpty(geofence.GeometryJson))
                        {
                            isInside = IsPointNearRoute(latitude, longitude, geofence.GeometryJson, geofence.RadiusMeters ?? 50);
                        }
                        break;
                }

                if (isInside)
                {
                    _logger.LogDebug(
                        "Location ({Lat}, {Lng}) is inside geofence {GeofenceId} ({GeofenceName})",
                        latitude, longitude, geofence.Id, geofence.Name);
                    return (true, geofence.Id, geofence.Name);
                }
            }

            _logger.LogDebug(
                "Location ({Lat}, {Lng}) is not inside any of the {Count} checked geofences",
                latitude, longitude, geofences.Count);
            return (false, null, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking location in geofences");
            return (false, null, null);
        }
    }

    #endregion

    #region Geometry Helper Methods

    /// <summary>
    /// Checks if a point is inside a circular geofence
    /// </summary>
    private bool IsPointInCircle(decimal lat, decimal lng, decimal centerLat, decimal centerLng, int radiusMeters)
    {
        var point = new GeoLocation { Latitude = lat, Longitude = lng };
        var center = new GeoLocation { Latitude = centerLat, Longitude = centerLng };
        var distance = CalculateDistanceMeters(point, center);
        return distance <= radiusMeters;
    }

    /// <summary>
    /// Checks if a point is inside a polygon geofence using ray casting algorithm
    /// </summary>
    private bool IsPointInPolygon(decimal lat, decimal lng, string geometryJson)
    {
        try
        {
            // Parse the GeoJSON coordinates
            // Expected format: {"coordinates": [[lng1, lat1], [lng2, lat2], ...]}
            var coordinates = ParseGeoJsonCoordinates(geometryJson);
            if (coordinates == null || coordinates.Count < 3)
            {
                return false;
            }

            // Ray casting algorithm
            bool inside = false;
            int j = coordinates.Count - 1;

            for (int i = 0; i < coordinates.Count; i++)
            {
                var (xi, yi) = coordinates[i];
                var (xj, yj) = coordinates[j];

                if (((yi > (double)lng) != (yj > (double)lng)) &&
                    ((double)lat < (xi - xj) * ((double)lng - yi) / (yj - yi) + xi))
                {
                    inside = !inside;
                }

                j = i;
            }

            return inside;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing polygon geometry");
            return false;
        }
    }

    /// <summary>
    /// Checks if a point is near a route (buffered polyline)
    /// </summary>
    private bool IsPointNearRoute(decimal lat, decimal lng, string geometryJson, int bufferMeters)
    {
        try
        {
            var coordinates = ParseGeoJsonCoordinates(geometryJson);
            if (coordinates == null || coordinates.Count < 2)
            {
                return false;
            }

            var point = new GeoLocation { Latitude = lat, Longitude = lng };

            // Check distance to each line segment
            for (int i = 0; i < coordinates.Count - 1; i++)
            {
                var p1 = new GeoLocation { Latitude = (decimal)coordinates[i].Item1, Longitude = (decimal)coordinates[i].Item2 };
                var p2 = new GeoLocation { Latitude = (decimal)coordinates[i + 1].Item1, Longitude = (decimal)coordinates[i + 1].Item2 };

                var distance = DistanceToLineSegment(point, p1, p2);
                if (distance <= bufferMeters)
                {
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing route geometry");
            return false;
        }
    }

    /// <summary>
    /// Parses GeoJSON coordinates into a list of (lat, lng) tuples
    /// </summary>
    private List<(double, double)>? ParseGeoJsonCoordinates(string geometryJson)
    {
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(geometryJson);
            var root = doc.RootElement;

            if (root.TryGetProperty("coordinates", out var coordsElement) && coordsElement.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var result = new List<(double, double)>();

                foreach (var coord in coordsElement.EnumerateArray())
                {
                    if (coord.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        var items = coord.EnumerateArray().ToList();
                        if (items.Count >= 2)
                        {
                            // GeoJSON is [lng, lat] order
                            var lng = items[0].GetDouble();
                            var lat = items[1].GetDouble();
                            result.Add((lat, lng));
                        }
                    }
                }

                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing GeoJSON coordinates");
        }

        return null;
    }

    /// <summary>
    /// Calculates the perpendicular distance from a point to a line segment
    /// </summary>
    private double DistanceToLineSegment(GeoLocation point, GeoLocation lineStart, GeoLocation lineEnd)
    {
        // Calculate distances
        var d1 = CalculateDistanceMeters(point, lineStart);
        var d2 = CalculateDistanceMeters(point, lineEnd);
        var lineLength = CalculateDistanceMeters(lineStart, lineEnd);

        if (lineLength == 0)
        {
            return d1;
        }

        // Use projection to find closest point on line segment
        var t = Math.Max(0, Math.Min(1, DotProduct(point, lineStart, lineEnd) / (lineLength * lineLength)));

        var closestLat = (double)lineStart.Latitude + t * ((double)lineEnd.Latitude - (double)lineStart.Latitude);
        var closestLng = (double)lineStart.Longitude + t * ((double)lineEnd.Longitude - (double)lineStart.Longitude);

        var closestPoint = new GeoLocation { Latitude = (decimal)closestLat, Longitude = (decimal)closestLng };
        return CalculateDistanceMeters(point, closestPoint);
    }

    /// <summary>
    /// Calculates the dot product for projection onto line segment
    /// </summary>
    private double DotProduct(GeoLocation point, GeoLocation lineStart, GeoLocation lineEnd)
    {
        return ((double)point.Latitude - (double)lineStart.Latitude) * ((double)lineEnd.Latitude - (double)lineStart.Latitude) +
               ((double)point.Longitude - (double)lineStart.Longitude) * ((double)lineEnd.Longitude - (double)lineStart.Longitude);
    }

    #endregion
}
