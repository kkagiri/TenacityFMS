/**
 * File: VehicleTripClusterDetectionService.cs
 * Purpose: Detects shuttle and tipper trips by extracting stops, clustering them, and converting cluster transitions into trip legs.
 * Dependencies: DbContext, IGPSService, trip stop DTOs, site geofences.
 * Last Modified: 2026-03-11
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
using Microsoft.Extensions.Options;
using SiteEntity = FMS.Domain.Entities.Site;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripClusterDetectionService : IVehicleTripClusterDetectionService
{
    private readonly GpsdataContext _context;
    private readonly IGPSService _gpsService;
    private readonly IVehicleTripGpsPreProcessor _gpsPreProcessor;
    private readonly VehicleTripClusterDetectionOptions _options;
    private readonly ILogger<VehicleTripClusterDetectionService> _logger;

    public VehicleTripClusterDetectionService(
        GpsdataContext context,
        IGPSService gpsService,
        IVehicleTripGpsPreProcessor gpsPreProcessor,
        IOptions<VehicleTripClusterDetectionOptions> options,
        ILogger<VehicleTripClusterDetectionService> logger)
    {
        _context = context;
        _gpsService = gpsService;
        _gpsPreProcessor = gpsPreProcessor;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<List<VehicleTripDetectionResultDTO>> DetectTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default)
    {
        var trackPointsResponse = await _gpsService.GetTrackPointsAsync(vehicle.VehicleId, fromUtc, toUtc, _options.MaxTrackPoints);
        if (!trackPointsResponse.IsSuccess)
        {
            throw new InvalidOperationException(trackPointsResponse.Message);
        }

        var points = await _gpsPreProcessor.ProcessAsync(
            vehicle.VehicleId,
            trackPointsResponse.Data ?? new List<TrackPointDTO>(),
            cancellationToken);

        points = points
            .OrderBy(point => point.Timestamp)
            .ToList();

        if (points.Count < 2)
        {
            return new List<VehicleTripDetectionResultDTO>();
        }

        var stops = ExtractStops(points, _options);
        if (stops.Count < 2)
        {
            return new List<VehicleTripDetectionResultDTO>();
        }

        var sites = await _context.Sites
            .AsNoTracking()
            .Include(site => site.GpsGeofence)
            .Where(site => site.IsActive && site.GpsGeofenceId != null && site.GpsGeofence != null)
            .OrderBy(site => site.Name)
            .ToListAsync(cancellationToken);

        var clusters = BuildClusters(stops, sites, _options);
        if (clusters.Count < 2)
        {
            return new List<VehicleTripDetectionResultDTO>();
        }

        ApplyClusterClassification(clusters, stops);

        var detectedTrips = new List<VehicleTripDetectionResultDTO>();
        for (var index = 0; index < stops.Count - 1; index++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var originStop = stops[index];
            var destinationStop = stops[index + 1];
            if (!originStop.ClusterId.HasValue || !destinationStop.ClusterId.HasValue)
            {
                continue;
            }

            if (originStop.ClusterId == destinationStop.ClusterId)
            {
                continue;
            }

            var startTrackIndex = Math.Max(0, originStop.EndTrackIndex);
            var endTrackIndex = Math.Min(points.Count - 1, destinationStop.StartTrackIndex);
            if (endTrackIndex <= startTrackIndex)
            {
                continue;
            }

            var durationMinutes = Convert.ToDecimal((destinationStop.StartTimeUtc - originStop.EndTimeUtc).TotalMinutes);
            var distanceKm = CalculateDistanceKm(points, startTrackIndex, endTrackIndex);
            if (durationMinutes < _options.MinimumTripDurationMinutes || distanceKm < _options.MinimumTripDistanceKm)
            {
                continue;
            }

            detectedTrips.Add(new VehicleTripDetectionResultDTO
            {
                StartTimeUtc = originStop.EndTimeUtc.ToUniversalTime(),
                EndTimeUtc = destinationStop.StartTimeUtc.ToUniversalTime(),
                OriginSiteId = originStop.SiteId,
                DestinationSiteId = destinationStop.SiteId,
                OriginGeofenceId = originStop.GeofenceId,
                DestinationGeofenceId = destinationStop.GeofenceId,
                StartLatitude = originStop.Latitude,
                StartLongitude = originStop.Longitude,
                EndLatitude = destinationStop.Latitude,
                EndLongitude = destinationStop.Longitude,
                DistanceKm = Math.Round(distanceKm, 2),
                DurationMinutes = Math.Round(durationMinutes, 2),
                MaxSpeedKph = CalculateMaxSpeed(points, startTrackIndex, endTrackIndex),
                Status = VehicleTripStatus.Completed,
                MovementProfile = vehicle.MovementProfile,
                DetectionMode = "Cluster",
                StartTrackInfoId = points[startTrackIndex].TrackInfoId,
                EndTrackInfoId = points[endTrackIndex].TrackInfoId,
                FuelAtDeparture = points[startTrackIndex].FuelLevel,
                FuelAtArrival = points[endTrackIndex].FuelLevel,
                FuelConsumed = points[startTrackIndex].FuelLevel.HasValue && points[endTrackIndex].FuelLevel.HasValue
                        ? Math.Round(Math.Max(0m, points[startTrackIndex].FuelLevel.Value - points[endTrackIndex].FuelLevel.Value), 2)
                        : null,
            });
        }

        var lastStop = stops.LastOrDefault();
        var lastPoint = points[^1];
        if (lastStop != null
            && lastStop.ClusterId.HasValue
            && lastStop.EndTrackIndex < points.Count - 1)
        {
            var startTrackIndex = Math.Max(0, lastStop.EndTrackIndex);
            var endTrackIndex = points.Count - 1;
            var durationMinutes = Convert.ToDecimal((lastPoint.Timestamp - lastStop.EndTimeUtc).TotalMinutes);
            var distanceKm = CalculateDistanceKm(points, startTrackIndex, endTrackIndex);

            if (durationMinutes >= _options.MinimumTripDurationMinutes && distanceKm >= _options.MinimumTripDistanceKm)
            {
                detectedTrips.Add(new VehicleTripDetectionResultDTO
                {
                    StartTimeUtc = lastStop.EndTimeUtc.ToUniversalTime(),
                    EndTimeUtc = lastPoint.Timestamp.ToUniversalTime(),
                    OriginSiteId = lastStop.SiteId,
                    DestinationSiteId = null,
                    OriginGeofenceId = lastStop.GeofenceId,
                    DestinationGeofenceId = null,
                    StartLatitude = lastStop.Latitude,
                    StartLongitude = lastStop.Longitude,
                    EndLatitude = lastPoint.Latitude,
                    EndLongitude = lastPoint.Longitude,
                    DistanceKm = Math.Round(distanceKm, 2),
                    DurationMinutes = Math.Round(durationMinutes, 2),
                    MaxSpeedKph = CalculateMaxSpeed(points, startTrackIndex, endTrackIndex),
                    Status = VehicleTripStatus.InProgress,
                    MovementProfile = vehicle.MovementProfile,
                    DetectionMode = "Cluster",
                    StartTrackInfoId = points[startTrackIndex].TrackInfoId,
                    EndTrackInfoId = lastPoint.TrackInfoId,
                    FuelAtDeparture = points[startTrackIndex].FuelLevel,
                    FuelAtArrival = lastPoint.FuelLevel,
                    FuelConsumed = points[startTrackIndex].FuelLevel.HasValue && lastPoint.FuelLevel.HasValue
                        ? Math.Round(Math.Max(0m, points[startTrackIndex].FuelLevel.Value - lastPoint.FuelLevel.Value), 2)
                        : null,
                    GroupingType = VehicleTripGroupingType.SingleLeg,
                });
            }
        }

        return detectedTrips;
    }

    private List<VehicleTripDetectedStopDTO> ExtractStops(IReadOnlyList<TrackPointDTO> points, VehicleTripClusterDetectionOptions opts)
    {
        var stops = new List<VehicleTripDetectedStopDTO>();
        VehicleTripDetectedStopDTO? currentStop = null;
        decimal latitudeSum = 0;
        decimal longitudeSum = 0;
        var pointCount = 0;

        for (var index = 0; index < points.Count; index++)
        {
            var point = points[index];
            var speed = point.Speed ?? 0m;
            if (speed <= opts.StopSpeedThresholdKph)
            {
                if (currentStop == null)
                {
                    currentStop = new VehicleTripDetectedStopDTO
                    {
                        SequenceNo = stops.Count + 1,
                        StartTrackIndex = index,
                        EndTrackIndex = index,
                        StartTimeUtc = point.Timestamp.ToUniversalTime(),
                        EndTimeUtc = point.Timestamp.ToUniversalTime(),
                        Address = point.Address,
                    };
                    latitudeSum = 0;
                    longitudeSum = 0;
                    pointCount = 0;
                }

                currentStop.EndTrackIndex = index;
                currentStop.EndTimeUtc = point.Timestamp.ToUniversalTime();
                currentStop.Address ??= point.Address;
                latitudeSum += point.Latitude;
                longitudeSum += point.Longitude;
                pointCount++;
                continue;
            }

            FinalizeStopIfEligible(stops, currentStop, latitudeSum, longitudeSum, pointCount, opts);
            currentStop = null;
        }

        FinalizeStopIfEligible(stops, currentStop, latitudeSum, longitudeSum, pointCount, opts);
        return stops;
    }

    private static void FinalizeStopIfEligible(
        ICollection<VehicleTripDetectedStopDTO> stops,
        VehicleTripDetectedStopDTO? currentStop,
        decimal latitudeSum,
        decimal longitudeSum,
        int pointCount,
        VehicleTripClusterDetectionOptions opts)
    {
        if (currentStop == null || pointCount <= 0)
        {
            return;
        }

        currentStop.DurationMinutes = Convert.ToDecimal((currentStop.EndTimeUtc - currentStop.StartTimeUtc).TotalMinutes);
        if (currentStop.DurationMinutes < opts.MinimumStopDurationMinutes)
        {
            return;
        }

        currentStop.Latitude = Math.Round(latitudeSum / pointCount, 8);
        currentStop.Longitude = Math.Round(longitudeSum / pointCount, 8);
        stops.Add(currentStop);
    }

    private List<VehicleTripStopClusterDTO> BuildClusters(IReadOnlyList<VehicleTripDetectedStopDTO> stops, IReadOnlyList<SiteEntity> sites, VehicleTripClusterDetectionOptions opts)
    {
        var clusters = new List<VehicleTripStopClusterDTO>();

        foreach (var stop in stops)
        {
            var matchedCluster = clusters
                .Select(cluster => new
                {
                    Cluster = cluster,
                    DistanceMeters = HaversineDistanceMeters(
                        (double)stop.Latitude,
                        (double)stop.Longitude,
                        (double)cluster.Latitude,
                        (double)cluster.Longitude)
                })
                .Where(result => result.DistanceMeters <= opts.ClusterRadiusMeters)
                .OrderBy(result => result.DistanceMeters)
                .FirstOrDefault();

            if (matchedCluster == null)
            {
                var newCluster = new VehicleTripStopClusterDTO
                {
                    ClusterId = clusters.Count + 1,
                    Latitude = stop.Latitude,
                    Longitude = stop.Longitude,
                    VisitCount = 1,
                    AverageDwellMinutes = stop.DurationMinutes,
                };

                var site = ResolveContainingSite(newCluster.Latitude, newCluster.Longitude, sites);
                if (site != null)
                {
                    newCluster.SiteId = site.Id;
                    newCluster.GeofenceId = site.GpsGeofenceId;
                    newCluster.Label = site.Name;
                }

                clusters.Add(newCluster);
                stop.ClusterId = newCluster.ClusterId;
                continue;
            }

            var cluster = matchedCluster.Cluster;
            cluster.Latitude = Math.Round(((cluster.Latitude * cluster.VisitCount) + stop.Latitude) / (cluster.VisitCount + 1), 8);
            cluster.Longitude = Math.Round(((cluster.Longitude * cluster.VisitCount) + stop.Longitude) / (cluster.VisitCount + 1), 8);
            cluster.AverageDwellMinutes = Math.Round(((cluster.AverageDwellMinutes * cluster.VisitCount) + stop.DurationMinutes) / (cluster.VisitCount + 1), 2);
            cluster.VisitCount += 1;

            if (!cluster.SiteId.HasValue)
            {
                var site = ResolveContainingSite(cluster.Latitude, cluster.Longitude, sites);
                if (site != null)
                {
                    cluster.SiteId = site.Id;
                    cluster.GeofenceId = site.GpsGeofenceId;
                    cluster.Label = site.Name;
                }
            }

            stop.ClusterId = cluster.ClusterId;
        }

        return clusters;
    }

    private static void ApplyClusterClassification(
        IReadOnlyList<VehicleTripStopClusterDTO> clusters,
        IEnumerable<VehicleTripDetectedStopDTO> stops)
    {
        if (clusters.Count == 0) return;

        var stopsList = stops as IList<VehicleTripDetectedStopDTO> ?? stops.ToList();

        // Step 1: Parking = cluster with the highest average dwell (overnight / between shifts).
        var parkingCluster = clusters
            .OrderByDescending(c => c.AverageDwellMinutes)
            .ThenByDescending(c => c.VisitCount)
            .First();
        parkingCluster.ClusterType = "Parking";

        if (clusters.Count >= 2)
        {
            // Step 2: Shuttle pattern  Parking → [Load → Dump] ×N → Parking.
            // Use temporal order: first non-parking cluster visited = Load,
            // second distinct non-parking cluster visited = Dump.
            var firstNonParking = stopsList
                .Where(s => s.ClusterId.HasValue && s.ClusterId.Value != parkingCluster.ClusterId)
                .OrderBy(s => s.StartTimeUtc)
                .FirstOrDefault();

            int? loadClusterId = firstNonParking?.ClusterId;
            int? dumpClusterId = null;

            if (loadClusterId.HasValue)
            {
                var secondDistinct = stopsList
                    .Where(s => s.ClusterId.HasValue
                        && s.ClusterId.Value != parkingCluster.ClusterId
                        && s.ClusterId.Value != loadClusterId.Value)
                    .OrderBy(s => s.StartTimeUtc)
                    .FirstOrDefault();
                dumpClusterId = secondDistinct?.ClusterId;
            }

            foreach (var cluster in clusters)
            {
                if (cluster.ClusterId == parkingCluster.ClusterId) continue;

                if (cluster.ClusterId == loadClusterId)
                    cluster.ClusterType = "Load";
                else if (cluster.ClusterId == dumpClusterId)
                    cluster.ClusterType = "Dump";
                else
                    cluster.ClusterType = "Transit";
            }
        }

        // Step 3: Assign default labels where missing.
        foreach (var cluster in clusters)
        {
            if (string.IsNullOrWhiteSpace(cluster.Label))
            {
                cluster.Label = cluster.ClusterType switch
                {
                    "Parking" => "Parking / Depot",
                    "Load" => "Load cluster",
                    "Dump" => "Dump cluster",
                    _ => $"Transit cluster {cluster.ClusterId}",
                };
            }
        }

        // Step 4: Propagate cluster info to stops.
        var clusterMap = clusters.ToDictionary(c => c.ClusterId);
        foreach (var stop in stopsList)
        {
            if (!stop.ClusterId.HasValue || !clusterMap.TryGetValue(stop.ClusterId.Value, out var cluster))
            {
                continue;
            }

            stop.ClusterLabel = cluster.Label;
            stop.ClusterType = cluster.ClusterType;
            stop.SiteId = cluster.SiteId;
            stop.GeofenceId = cluster.GeofenceId;
        }
    }

    private SiteEntity? ResolveContainingSite(decimal latitude, decimal longitude, IEnumerable<SiteEntity> sites)
    {
        foreach (var site in sites)
        {
            if (site.GpsGeofence == null)
            {
                continue;
            }

            if (IsPointInsideGeofence(latitude, longitude, site.GpsGeofence))
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
            _logger.LogWarning(ex, "Failed to parse geometry JSON for cluster site resolution.");
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
            .Where(point => point.Speed.HasValue)
            .Select(point => point.Speed!.Value)
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