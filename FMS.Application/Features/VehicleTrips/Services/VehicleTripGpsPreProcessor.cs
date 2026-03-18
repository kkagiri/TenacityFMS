/**
 * File: VehicleTripGpsPreProcessor.cs
 * Purpose: Filters invalid GPS points, enriches accepted points, and maintains a per-vehicle sliding window for trip detection.
 * Dependencies: DbContext, TrackPointDTO, trip pre-processor options, site geofences.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities.Features.GPSIntergration.GpsGate;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SiteEntity = FMS.Domain.Entities.Site;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripGpsPreProcessor : IVehicleTripGpsPreProcessor
{
    private readonly GpsdataContext _context;
    private readonly VehicleTripPreProcessorOptions _options;
    private readonly ILogger<VehicleTripGpsPreProcessor> _logger;

    public VehicleTripGpsPreProcessor(
        GpsdataContext context,
        IOptions<VehicleTripPreProcessorOptions> options,
        ILogger<VehicleTripGpsPreProcessor> logger)
    {
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<List<TrackPointDTO>> ProcessAsync(int vehicleId, IReadOnlyCollection<TrackPointDTO> rawPoints, CancellationToken cancellationToken = default)
    {
        if (rawPoints.Count == 0)
        {
            return new List<TrackPointDTO>();
        }

        var sites = await _context.Sites
            .AsNoTracking()
            .Include(site => site.GpsGeofence)
            .Where(site => site.IsActive && site.GpsGeofenceId != null && site.GpsGeofence != null)
            .ToListAsync(cancellationToken);

        var processed = new List<TrackPointDTO>();
        var slidingWindow = new Queue<TrackPointDTO>();
        TrackPointDTO? previousAcceptedPoint = null;
        var droppedCount = 0;

        foreach (var rawPoint in rawPoints.OrderBy(point => point.Timestamp))
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!IsBasePointValid(rawPoint))
            {
                droppedCount++;
                continue;
            }

            var enrichedPoint = Clone(rawPoint);
            if (previousAcceptedPoint != null)
            {
                enrichedPoint.DistanceFromPreviousKm = Math.Round(CalculateDistanceKm(previousAcceptedPoint, enrichedPoint), 4);
                enrichedPoint.TimeDeltaSeconds = Math.Max(0, (int)(enrichedPoint.Timestamp - previousAcceptedPoint.Timestamp).TotalSeconds);

                if (IsDuplicate(previousAcceptedPoint, enrichedPoint) || IsImpossibleJump(previousAcceptedPoint, enrichedPoint))
                {
                    droppedCount++;
                    continue;
                }
            }

            var containingSite = ResolveContainingSite(enrichedPoint, sites);
            if (containingSite != null)
            {
                enrichedPoint.ContainingSiteId = containingSite.Id;
                enrichedPoint.ContainingGeofenceId = containingSite.GpsGeofenceId;
                enrichedPoint.ContainingSiteName = containingSite.Name;
            }

            processed.Add(enrichedPoint);
            previousAcceptedPoint = enrichedPoint;
            slidingWindow.Enqueue(enrichedPoint);
            while (slidingWindow.Count > Math.Max(1, _options.SlidingWindowSize))
            {
                slidingWindow.Dequeue();
            }
        }

        if (droppedCount > 0)
        {
            _logger.LogDebug("Trip GPS pre-processor dropped {DroppedCount} raw point(s) for vehicle {VehicleId}.", droppedCount, vehicleId);
        }

        return processed;
    }

    private bool IsBasePointValid(TrackPointDTO point)
    {
        if (!point.IsValid)
        {
            return false;
        }

        if (point.Latitude == 0m && point.Longitude == 0m)
        {
            return false;
        }

        if (point.SatelliteCount.HasValue && point.SatelliteCount.Value <= 0)
        {
            return false;
        }

        if (_options.MinimumSatelliteCount.HasValue && point.SatelliteCount.HasValue && point.SatelliteCount.Value < _options.MinimumSatelliteCount.Value)
        {
            return false;
        }

        return true;
    }

    private bool IsDuplicate(TrackPointDTO previousPoint, TrackPointDTO currentPoint)
    {
        var distanceMeters = CalculateDistanceKm(previousPoint, currentPoint) * 1000m;
        var timeDeltaSeconds = Math.Abs((currentPoint.Timestamp - previousPoint.Timestamp).TotalSeconds);

        return distanceMeters <= _options.DuplicateDistanceMeters
            && timeDeltaSeconds <= _options.DuplicateTimeWindowSeconds;
    }

    private bool IsImpossibleJump(TrackPointDTO previousPoint, TrackPointDTO currentPoint)
    {
        var distanceKm = CalculateDistanceKm(previousPoint, currentPoint);
        if (distanceKm <= _options.MaxPositionJumpKm)
        {
            return false;
        }

        var hours = Math.Abs((decimal)(currentPoint.Timestamp - previousPoint.Timestamp).TotalHours);
        if (hours <= 0)
        {
            return true;
        }

        var impliedSpeed = distanceKm / hours;
        return impliedSpeed > _options.MaximumImpliedSpeedKph;
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

        return HaversineDistanceMeters(
            (double)latitude,
            (double)longitude,
            (double)geofence.CenterLatitude.Value,
            (double)geofence.CenterLongitude.Value) <= geofence.RadiusMeters.Value;
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
            if (coordinatesElement.ValueKind == JsonValueKind.Object && coordinatesElement.TryGetProperty("coordinates", out var coordinatesProperty))
            {
                coordinatesElement = coordinatesProperty;
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
            _logger.LogWarning(ex, "Failed to parse geofence geometry while preprocessing trip GPS points.");
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

    private static TrackPointDTO Clone(TrackPointDTO point)
    {
        return new TrackPointDTO
        {
            Latitude = point.Latitude,
            Longitude = point.Longitude,
            Altitude = point.Altitude,
            Speed = point.Speed,
            Heading = point.Heading,
            Timestamp = point.Timestamp,
            Address = point.Address,
            Odometer = point.Odometer,
            IsValid = point.IsValid,
            SatelliteCount = point.SatelliteCount,
            TrackInfoId = point.TrackInfoId,
            FuelLevel = point.FuelLevel,
            IgnitionStatus = point.IgnitionStatus,
        };
    }

    private static decimal CalculateDistanceKm(TrackPointDTO firstPoint, TrackPointDTO secondPoint)
    {
        return Convert.ToDecimal(HaversineDistanceMeters(
            (double)firstPoint.Latitude,
            (double)firstPoint.Longitude,
            (double)secondPoint.Latitude,
            (double)secondPoint.Longitude) / 1000d);
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
