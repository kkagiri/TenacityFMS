/**
 * File: VehicleTripGeofenceDetectionService.cs
 * Purpose: Detects vehicle trips by evaluating GPS track points against cached site geofences.
 * Dependencies: DbContext, IGPSService, site/geofence entities.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripGeofenceDetectionService : IVehicleTripGeofenceDetectionService
{
    private const decimal MinimumTripDistanceKm = 0.50m;
    private const decimal MinimumTripDurationMinutes = 2m;
    private const int MaxTrackPoints = 5000;

    private readonly GpsdataContext _context;
    private readonly IGPSService _gpsService;
    private readonly ILogger<VehicleTripGeofenceDetectionService> _logger;

    public VehicleTripGeofenceDetectionService(
        GpsdataContext context,
        IGPSService gpsService,
        ILogger<VehicleTripGeofenceDetectionService> logger)
    {
        _context = context;
        _gpsService = gpsService;
        _logger = logger;
    }

    public async Task<List<VehicleTripDetectionResultDTO>> DetectTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default)
    {
        var sites = await _context.Sites
            .AsNoTracking()
            .Include(s => s.GpsGeofence)
            .Where(s => s.IsActive && s.GpsGeofenceId != null && s.GpsGeofence != null)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        if (sites.Count == 0)
        {
            return new List<VehicleTripDetectionResultDTO>();
        }

        var trackPointsResponse = await _gpsService.GetTrackPointsAsync(vehicle.VehicleId, fromUtc, toUtc, MaxTrackPoints);
        if (!trackPointsResponse.IsSuccess)
        {
            throw new InvalidOperationException(trackPointsResponse.Message);
        }

        var points = (trackPointsResponse.Data ?? new List<TrackPointDTO>())
            .OrderBy(p => p.Timestamp)
            .ToList();

        if (points.Count < 2)
        {
            return new List<VehicleTripDetectionResultDTO>();
        }

        var detectedTrips = new List<VehicleTripDetectionResultDTO>();
        SiteEntity? currentOriginSite = null;
        TrackPointDTO? lastPointInsideOrigin = null;
        var departureIndex = -1;

        for (var index = 0; index < points.Count; index++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var point = points[index];
            var resolvedSite = ResolveContainingSite(point, sites);

            if (resolvedSite == null)
            {
                continue;
            }

            if (currentOriginSite == null)
            {
                currentOriginSite = resolvedSite;
                lastPointInsideOrigin = point;
                departureIndex = index;
                continue;
            }

            if (resolvedSite.Id == currentOriginSite.Id)
            {
                lastPointInsideOrigin = point;
                departureIndex = index;
                continue;
            }

            if (lastPointInsideOrigin == null || departureIndex < 0 || index <= departureIndex)
            {
                currentOriginSite = resolvedSite;
                lastPointInsideOrigin = point;
                departureIndex = index;
                continue;
            }

            var durationMinutes = Convert.ToDecimal((point.Timestamp - lastPointInsideOrigin.Timestamp).TotalMinutes);
            var distanceKm = CalculateDistanceKm(points, departureIndex, index);

            if (distanceKm >= MinimumTripDistanceKm && durationMinutes >= MinimumTripDurationMinutes)
            {
                detectedTrips.Add(new VehicleTripDetectionResultDTO
                {
                    StartTimeUtc = lastPointInsideOrigin.Timestamp.ToUniversalTime(),
                    EndTimeUtc = point.Timestamp.ToUniversalTime(),
                    OriginSiteId = currentOriginSite.Id,
                    DestinationSiteId = resolvedSite.Id,
                    OriginGeofenceId = currentOriginSite.GpsGeofenceId,
                    DestinationGeofenceId = resolvedSite.GpsGeofenceId,
                    StartLatitude = lastPointInsideOrigin.Latitude,
                    StartLongitude = lastPointInsideOrigin.Longitude,
                    EndLatitude = point.Latitude,
                    EndLongitude = point.Longitude,
                    DistanceKm = Math.Round(distanceKm, 2),
                    DurationMinutes = Math.Round(durationMinutes, 2),
                    MaxSpeedKph = CalculateMaxSpeed(points, departureIndex, index),
                    MovementProfile = vehicle.MovementProfile,
                    DetectionMode = "Geofence",
                });
            }

            currentOriginSite = resolvedSite;
            lastPointInsideOrigin = point;
            departureIndex = index;
        }

        return detectedTrips;
    }

    private SiteEntity? ResolveContainingSite(TrackPointDTO point, IEnumerable<SiteEntity> sites)
    {
        foreach (var site in sites)
        {
            if (site.GpsGeofence == null)
            {
                continue;
            }

            if (IsPointInsideGeofence(point.Latitude, point.Longitude, site.GpsGeofence))
            {
                return site;
            }
        }

        return null;
    }

    private bool IsPointInsideGeofence(decimal latitude, decimal longitude, GpsGeofence geofence)
    {
        return geofence.GeofenceType switch
        {
            GpsGeofenceType.Circle => IsPointInCircle(latitude, longitude, geofence),
            GpsGeofenceType.Polygon => IsPointInPolygon(latitude, longitude, geofence.GeometryJson),
            GpsGeofenceType.Route => IsPointInPolygon(latitude, longitude, geofence.GeometryJson),
            _ => false,
        };
    }

    private static bool IsPointInCircle(decimal latitude, decimal longitude, GpsGeofence geofence)
    {
        if (!geofence.CenterLatitude.HasValue || !geofence.CenterLongitude.HasValue || !geofence.RadiusMeters.HasValue)
        {
            return false;
        }

        var distanceMeters = HaversineDistanceMeters(
            (double)latitude,
            (double)longitude,
            (double)geofence.CenterLatitude.Value,
            (double)geofence.CenterLongitude.Value);

        return distanceMeters <= geofence.RadiusMeters.Value;
    }

    private bool IsPointInPolygon(decimal latitude, decimal longitude, string? geometryJson)
    {
        if (string.IsNullOrWhiteSpace(geometryJson))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(geometryJson);
            var coordinatesElement = document.RootElement;

            if (coordinatesElement.ValueKind == JsonValueKind.Object && coordinatesElement.TryGetProperty("coordinates", out var coordsProperty))
            {
                coordinatesElement = coordsProperty;
            }

            var pairs = new List<(double Longitude, double Latitude)>();
            ExtractCoordinatePairs(coordinatesElement, pairs);

            if (pairs.Count < 3)
            {
                return false;
            }

            return IsPointInPolygon((double)latitude, (double)longitude, pairs);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse geometry JSON for geofence detection");
            return false;
        }
    }

    private static void ExtractCoordinatePairs(JsonElement element, ICollection<(double Longitude, double Latitude)> pairs)
    {
        if (element.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        var items = element.EnumerateArray().ToList();
        if (items.Count >= 2 && items[0].ValueKind == JsonValueKind.Number && items[1].ValueKind == JsonValueKind.Number)
        {
            pairs.Add((items[0].GetDouble(), items[1].GetDouble()));
            return;
        }

        foreach (var item in items)
        {
            ExtractCoordinatePairs(item, pairs);
        }
    }

    private static bool IsPointInPolygon(double latitude, double longitude, IReadOnlyList<(double Longitude, double Latitude)> polygon)
    {
        var inside = false;
        for (int i = 0, j = polygon.Count - 1; i < polygon.Count; j = i++)
        {
            var xi = polygon[i].Longitude;
            var yi = polygon[i].Latitude;
            var xj = polygon[j].Longitude;
            var yj = polygon[j].Latitude;

            var intersects = ((yi > latitude) != (yj > latitude))
                && (longitude < (xj - xi) * (latitude - yi) / ((yj - yi) == 0 ? double.Epsilon : (yj - yi)) + xi);

            if (intersects)
            {
                inside = !inside;
            }
        }

        return inside;
    }

    private static decimal CalculateDistanceKm(IReadOnlyList<TrackPointDTO> points, int startIndex, int endIndex)
    {
        double totalMeters = 0;
        for (var index = startIndex + 1; index <= endIndex; index++)
        {
            totalMeters += HaversineDistanceMeters(
                (double)points[index - 1].Latitude,
                (double)points[index - 1].Longitude,
                (double)points[index].Latitude,
                (double)points[index].Longitude);
        }

        return Convert.ToDecimal(totalMeters / 1000d);
    }

    private static decimal? CalculateMaxSpeed(IReadOnlyList<TrackPointDTO> points, int startIndex, int endIndex)
    {
        var speeds = points
            .Skip(startIndex)
            .Take((endIndex - startIndex) + 1)
            .Where(p => p.Speed.HasValue)
            .Select(p => p.Speed!.Value)
            .ToList();

        return speeds.Count == 0 ? null : Math.Round(speeds.Max(), 2);
    }

    private static double HaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2))
                * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180d;
    }
}
