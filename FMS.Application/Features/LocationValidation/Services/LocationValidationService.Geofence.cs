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
            _logger.LogInformation(
                "[GEOFENCE_VALIDATION] ========== STARTING GEOFENCE VALIDATION ==========\n" +
                "  RuleSetId: {RuleSetId}\n" +
                "  PtsId: {PtsId}\n" +
                "  VehicleId: {VehicleId}\n" +
                "  TankerLocation: {TankerLat}, {TankerLng}\n" +
                "  OperatorLocation: {OperatorLat}, {OperatorLng}\n" +
                "  VehicleLocation: {VehicleLat}, {VehicleLng}",
                request.FuelingRuleSetId,
                request.PtsId ?? "N/A",
                request.VehicleId?.ToString() ?? "N/A",
                request.TankerLocation?.Latitude.ToString() ?? "N/A",
                request.TankerLocation?.Longitude.ToString() ?? "N/A",
                request.OperatorLocation?.Latitude.ToString() ?? "N/A",
                request.OperatorLocation?.Longitude.ToString() ?? "N/A",
                request.VehicleLocation?.Latitude.ToString() ?? "N/A",
                request.VehicleLocation?.Longitude.ToString() ?? "N/A");

            // NOTE: RuleSetId=0 means "use global policy" - we don't need a specific rule set
            // The geofence validation uses global groups (IsAllowedForFueling=true) regardless of rule set
            string? ruleSetName = null;
            if (request.FuelingRuleSetId > 0)
            {
                var ruleSetConfig = await _context.FuelingRuleSets
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == request.FuelingRuleSetId, cancellationToken);

                if (ruleSetConfig != null)
                {
                    ruleSetName = ruleSetConfig.Name;
                    _logger.LogInformation("[GEOFENCE_VALIDATION] Found RuleSet: {RuleSetName} (ID: {RuleSetId})",
                        ruleSetConfig.Name ?? "Unnamed", ruleSetConfig.Id);
                }
                else
                {
                    _logger.LogDebug("[GEOFENCE_VALIDATION] RuleSetId {RuleSetId} not found - will use global geofence policy",
                        request.FuelingRuleSetId);
                }
            }
            else
            {
                _logger.LogInformation("[GEOFENCE_VALIDATION] Using GLOBAL GEOFENCE POLICY (RuleSetId=0)");
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

            _logger.LogInformation(
                "[GEOFENCE_VALIDATION] Configuration Settings:\n" +
                "  RequireTankerInGeofence: {RequireTanker} (raw value: '{RawTanker}')\n" +
                "  RequireOperatorInGeofence: {RequireOperator} (raw value: '{RawOperator}')\n" +
                "  RequireVehicleInGeofence: {RequireVehicle} (raw value: '{RawVehicle}')",
                requireTankerInGeofence, requireTankerStr ?? "null",
                requireOperatorInGeofence, requireOperatorStr ?? "null",
                requireVehicleInGeofence, requireVehicleStr ?? "null");

            // Get all geofence IDs from globally allowed groups (ignores ruleSetId)
            var geofenceIds = await GetRuleSetGeofenceIdsAsync(request.FuelingRuleSetId, cancellationToken);

            _logger.LogInformation("[GEOFENCE_VALIDATION] Found {Count} geofences from allowed groups: [{GeofenceIds}]",
                geofenceIds.Count, string.Join(", ", geofenceIds));

            if (geofenceIds.Count == 0)
            {
                _logger.LogWarning("[GEOFENCE_VALIDATION] ⚠️ No geofences available from globally allowed groups - SKIPPING validation. " +
                    "This means NO groups have IsAllowedForFueling=true or groups have no geofences assigned.");
                return GeofenceValidationResult.Skipped("No geofences available from globally allowed groups");
            }

            // Load geofence details for logging
            var geofenceDetails = await _context.Set<GpsGeofence>()
                .AsNoTracking()
                .Where(g => geofenceIds.Contains(g.Id) && g.IsActive)
                .Select(g => new { g.Id, g.Name, g.GeofenceType, g.CenterLatitude, g.CenterLongitude, g.RadiusMeters })
                .ToListAsync(cancellationToken);

            _logger.LogInformation("[GEOFENCE_VALIDATION] Active geofences to check:");
            foreach (var gf in geofenceDetails)
            {
                _logger.LogInformation("  - ID: {Id}, Name: '{Name}', Type: {Type}, Center: ({Lat}, {Lng}), Radius: {Radius}m",
                    gf.Id, gf.Name, gf.GeofenceType, gf.CenterLatitude, gf.CenterLongitude, gf.RadiusMeters);
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
            if (requireTankerInGeofence)
            {
                _logger.LogInformation("[GEOFENCE_VALIDATION] 🚛 TANKER GEOFENCE CHECK REQUIRED");

                if (request.TankerLocation != null)
                {
                    _logger.LogInformation("[GEOFENCE_VALIDATION] Checking tanker at ({Lat}, {Lng}) against {Count} geofences",
                        request.TankerLocation.Latitude, request.TankerLocation.Longitude, geofenceIds.Count);

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

                    if (isInGeofence)
                    {
                        _logger.LogInformation("[GEOFENCE_VALIDATION] ✅ TANKER IS INSIDE geofence '{GeofenceName}' (ID: {GeofenceId})",
                            geofenceName, geofenceId);
                    }
                    else
                    {
                        _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ TANKER IS OUTSIDE all allowed geofences! Location: ({Lat}, {Lng})",
                            request.TankerLocation.Latitude, request.TankerLocation.Longitude);

                        // Log distance to each geofence for debugging
                        foreach (var gf in geofenceDetails.Where(g => g.CenterLatitude.HasValue && g.CenterLongitude.HasValue))
                        {
                            var tankerLoc = new GeoLocation(request.TankerLocation.Latitude, request.TankerLocation.Longitude);
                            var geofenceCenter = new GeoLocation(gf.CenterLatitude!.Value, gf.CenterLongitude!.Value);
                            var distance = CalculateDistanceMeters(tankerLoc, geofenceCenter);
                            _logger.LogWarning("[GEOFENCE_VALIDATION] Distance to geofence '{Name}' (ID: {Id}): {Distance:F0}m (radius: {Radius}m, outside by: {OutsideBy:F0}m)",
                                gf.Name, gf.Id, distance, gf.RadiusMeters ?? 0, distance - (gf.RadiusMeters ?? 0));
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ TANKER LOCATION NOT PROVIDED but RequireTankerInGeofence=true");
                    tankerPassed = false;
                    result = result with { TankerInGeofence = false };
                }
            }
            else
            {
                _logger.LogInformation("[GEOFENCE_VALIDATION] Tanker geofence check NOT required (RequireTankerInGeofence=false)");
            }

            // Check operator location if required (from global system settings)
            if (requireOperatorInGeofence)
            {
                _logger.LogInformation("[GEOFENCE_VALIDATION] 👤 OPERATOR GEOFENCE CHECK REQUIRED");

                if (request.OperatorLocation != null)
                {
                    _logger.LogInformation("[GEOFENCE_VALIDATION] Checking operator at ({Lat}, {Lng}) against {Count} geofences",
                        request.OperatorLocation.Latitude, request.OperatorLocation.Longitude, geofenceIds.Count);

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

                    if (isInGeofence)
                    {
                        _logger.LogInformation("[GEOFENCE_VALIDATION] ✅ OPERATOR IS INSIDE geofence '{GeofenceName}' (ID: {GeofenceId})",
                            geofenceName, geofenceId);
                    }
                    else
                    {
                        _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ OPERATOR IS OUTSIDE all allowed geofences! Location: ({Lat}, {Lng})",
                            request.OperatorLocation.Latitude, request.OperatorLocation.Longitude);
                    }
                }
                else
                {
                    _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ OPERATOR LOCATION NOT PROVIDED but RequireOperatorInGeofence=true");
                    operatorPassed = false;
                    result = result with { OperatorInGeofence = false };
                }
            }
            else
            {
                _logger.LogDebug("[GEOFENCE_VALIDATION] Operator geofence check NOT required (RequireOperatorInGeofence=false)");
            }

            // Check vehicle location if required (from global system settings)
            if (requireVehicleInGeofence)
            {
                _logger.LogInformation("[GEOFENCE_VALIDATION] 🚗 VEHICLE GEOFENCE CHECK REQUIRED");

                if (request.VehicleLocation != null)
                {
                    _logger.LogInformation("[GEOFENCE_VALIDATION] Checking vehicle at ({Lat}, {Lng}) against {Count} geofences",
                        request.VehicleLocation.Latitude, request.VehicleLocation.Longitude, geofenceIds.Count);

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

                    if (isInGeofence)
                    {
                        _logger.LogInformation("[GEOFENCE_VALIDATION] ✅ VEHICLE IS INSIDE geofence '{GeofenceName}' (ID: {GeofenceId})",
                            geofenceName, geofenceId);
                    }
                    else
                    {
                        _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ VEHICLE IS OUTSIDE all allowed geofences! Location: ({Lat}, {Lng})",
                            request.VehicleLocation.Latitude, request.VehicleLocation.Longitude);
                    }
                }
                else
                {
                    _logger.LogWarning("[GEOFENCE_VALIDATION] ❌ VEHICLE LOCATION NOT PROVIDED but RequireVehicleInGeofence=true");
                    vehiclePassed = false;
                    result = result with { VehicleInGeofence = false };
                }
            }
            else
            {
                _logger.LogDebug("[GEOFENCE_VALIDATION] Vehicle geofence check NOT required (RequireVehicleInGeofence=false)");
            }

            // Determine overall result
            if (tankerPassed && operatorPassed && vehiclePassed)
            {
                _logger.LogInformation(
                    "[GEOFENCE_VALIDATION] ✅✅✅ GEOFENCE VALIDATION PASSED ✅✅✅\n" +
                    "  TankerPassed: {TankerPassed}, OperatorPassed: {OperatorPassed}, VehiclePassed: {VehiclePassed}",
                    tankerPassed, operatorPassed, vehiclePassed);

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

                var failureReason = $"The following are not within allowed geofences: {string.Join(", ", failedChecks)}";

                _logger.LogWarning(
                    "[GEOFENCE_VALIDATION] ❌❌❌ GEOFENCE VALIDATION FAILED ❌❌❌\n" +
                    "  Failed Checks: [{FailedChecks}]\n" +
                    "  TankerPassed: {TankerPassed}, OperatorPassed: {OperatorPassed}, VehiclePassed: {VehiclePassed}\n" +
                    "  Reason: {Reason}",
                    string.Join(", ", failedChecks), tankerPassed, operatorPassed, vehiclePassed, failureReason);

                return result with
                {
                    Outcome = ValidationOutcome.Failed,
                    Reason = failureReason
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GEOFENCE_VALIDATION] ❌ EXCEPTION during geofence validation for rule set {RuleSetId}: {Error}",
                request.FuelingRuleSetId, ex.Message);
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

                _logger.LogDebug("[GEOFENCE_CHECK] Checking geofence {Id} '{Name}', Type: {Type}, HasGeometryJson: {HasJson}, GeometryJson length: {Length}",
                    geofence.Id, geofence.Name, geofence.GeofenceType,
                    !string.IsNullOrEmpty(geofence.GeometryJson),
                    geofence.GeometryJson?.Length ?? 0);

                switch (geofence.GeofenceType)
                {
                    case GpsGeofenceType.Circle:
                        isInside = IsPointInCircle(
                            latitude,
                            longitude,
                            geofence.CenterLatitude ?? 0,
                            geofence.CenterLongitude ?? 0,
                            geofence.RadiusMeters ?? DefaultCircleRadiusMeters);
                        _logger.LogDebug("[GEOFENCE_CHECK] Circle check: center=({CenterLat}, {CenterLng}), radius={Radius}m, isInside={IsInside}",
                            geofence.CenterLatitude, geofence.CenterLongitude, geofence.RadiusMeters, isInside);
                        break;

                    case GpsGeofenceType.Polygon:
                        if (!string.IsNullOrEmpty(geofence.GeometryJson))
                        {
                            isInside = IsPointInPolygon(latitude, longitude, geofence.GeometryJson);
                            _logger.LogDebug("[GEOFENCE_CHECK] Polygon check: isInside={IsInside}, GeometryJson preview: {Preview}",
                                isInside, geofence.GeometryJson.Length > 200 ? geofence.GeometryJson.Substring(0, 200) + "..." : geofence.GeometryJson);
                        }
                        else
                        {
                            _logger.LogWarning("[GEOFENCE_CHECK] ⚠️ Polygon geofence {Id} '{Name}' has NO GeometryJson! Cannot check point-in-polygon.",
                                geofence.Id, geofence.Name);
                        }
                        break;

                    case GpsGeofenceType.Route:
                        // Route geofences are treated as buffered polylines
                        // For now, we can treat them similarly to polygons
                        if (!string.IsNullOrEmpty(geofence.GeometryJson))
                        {
                            isInside = IsPointNearRoute(latitude, longitude, geofence.GeometryJson, geofence.RadiusMeters ?? DefaultRouteBufferMeters);
                            _logger.LogDebug("[GEOFENCE_CHECK] Route check: buffer={Buffer}m, isInside={IsInside}",
                                geofence.RadiusMeters ?? DefaultRouteBufferMeters, isInside);
                        }
                        else
                        {
                            _logger.LogWarning("[GEOFENCE_CHECK] ⚠️ Route geofence {Id} '{Name}' has NO GeometryJson! Cannot check point-near-route.",
                                geofence.Id, geofence.Name);
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

    #region Constants

    /// <summary>
    /// Default buffer radius in meters for route geofences when not specified
    /// </summary>
    private const int DefaultRouteBufferMeters = 50;

    /// <summary>
    /// Default radius in meters for circle geofences when not specified
    /// </summary>
    private const int DefaultCircleRadiusMeters = 0;

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
                var (latI, lngI) = coordinates[i];
                var (latJ, lngJ) = coordinates[j];

                // Ray casting algorithm: cast a ray from the point eastward
                // and count how many polygon edges it crosses
                if (((lngI > (double)lng) != (lngJ > (double)lng)) &&
                    ((double)lat < (latI - latJ) * ((double)lng - lngI) / (lngJ - lngI) + latI))
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
    /// Parses GeoJSON coordinates into a list of (lat, lng) tuples.
    /// Handles multiple GeoJSON formats:
    /// - LineString: {"coordinates": [[lng1, lat1], [lng2, lat2], ...]}
    /// - Polygon: {"coordinates": [[[lng1, lat1], [lng2, lat2], ...]]}
    /// - Simple array: [[lng1, lat1], [lng2, lat2], ...]
    /// </summary>
    private List<(double Lat, double Lng)>? ParseGeoJsonCoordinates(string geometryJson)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(geometryJson);
            var root = doc.RootElement;

            // Try to get coordinates property, or use root if it's already an array
            System.Text.Json.JsonElement coordsElement;
            if (root.TryGetProperty("coordinates", out var coords))
            {
                coordsElement = coords;
            }
            else if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                coordsElement = root;
            }
            else
            {
                _logger.LogWarning("GeoJSON has no 'coordinates' property and is not an array");
                return null;
            }

            if (coordsElement.ValueKind != System.Text.Json.JsonValueKind.Array)
            {
                return null;
            }

            var result = new List<(double Lat, double Lng)>();

            // Detect nesting level and extract coordinates accordingly
            var firstElement = coordsElement.EnumerateArray().FirstOrDefault();

            if (firstElement.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var firstInner = firstElement.EnumerateArray().FirstOrDefault();

                if (firstInner.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    // Polygon format: [[[lng, lat], [lng, lat], ...]]
                    // Take the first (outer) ring
                    ExtractCoordinatesFromArray(firstElement, result);
                }
                else if (firstInner.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    // LineString format: [[lng, lat], [lng, lat], ...]
                    ExtractCoordinatesFromArray(coordsElement, result);
                }
            }

            return result.Count > 0 ? result : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing GeoJSON coordinates");
        }

        return null;
    }

    /// <summary>
    /// Extracts coordinate pairs from a JSON array of [lng, lat] arrays
    /// </summary>
    private void ExtractCoordinatesFromArray(System.Text.Json.JsonElement arrayElement, List<(double Lat, double Lng)> result)
    {
        foreach (var coord in arrayElement.EnumerateArray())
        {
            if (coord.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var items = coord.EnumerateArray().ToList();
                if (items.Count >= 2)
                {
                    // GeoJSON uses [lng, lat] order
                    var lng = items[0].GetDouble();
                    var lat = items[1].GetDouble();
                    result.Add((lat, lng));
                }
            }
        }
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
