/**
 * File: VehicleTripClusterStateMachine.cs
 * Purpose: Real-time per-vehicle state machine for cluster-based (shuttle/tipper) trip detection.
 * Dependencies: TrackPointDTO, VehicleTripState, GpsdataContext, SignalR hub.
 * Last Modified: 2026-03-12
 */
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Events;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FMS.Application.Features.VehicleTrips.StateMachines;

public class ClusterInfo
{
    public int ClusterIndex { get; set; }
    public decimal CentroidLatitude { get; set; }
    public decimal CentroidLongitude { get; set; }
    public string Label { get; set; } = string.Empty;
    public int VisitCount { get; set; }
    public int? MatchedSiteId { get; set; }
    public string? MatchedSiteName { get; set; }
    public string Classification { get; set; } = "Unknown";
}

public class VehicleClusterState
{
    public VehicleTripState TripState { get; set; } = new();
    public List<ClusterInfo> DiscoveredClusters { get; set; } = new();
    public int? CurrentClusterIndex { get; set; }
    public int CompletedCycleCount { get; set; }
    public bool IsStationary { get; set; }
    public int ConsecutiveStationaryPoints { get; set; }
    public int ConsecutiveMovingPoints { get; set; }
}

public class VehicleTripClusterStateMachine : IVehicleTripStateMachine
{
    private readonly ConcurrentDictionary<int, VehicleClusterState> _clusterStates = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<VehicleTrackingHub> _hubContext;
    private readonly VehicleTripClusterStateMachineOptions _options;
    private readonly ILogger<VehicleTripClusterStateMachine> _logger;

    public VehicleTripClusterStateMachine(
        IServiceScopeFactory scopeFactory,
        IHubContext<VehicleTrackingHub> hubContext,
        IOptions<VehicleTripClusterStateMachineOptions> options,
        ILogger<VehicleTripClusterStateMachine> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _options = options.Value;
        _logger = logger;
    }

    public VehicleTripState GetState(int vehicleId)
    {
        return GetClusterState(vehicleId).TripState;
    }

    public void RestoreState(int vehicleId, VehicleTripState state)
    {
        var clusterState = GetClusterState(vehicleId);
        clusterState.TripState = state;
    }

    private VehicleClusterState GetClusterState(int vehicleId)
    {
        return _clusterStates.GetOrAdd(vehicleId, id => new VehicleClusterState
        {
            TripState = new VehicleTripState { VehicleId = id }
        });
    }

    public async Task ProcessPointAsync(int vehicleId, TrackPointDTO point, CancellationToken cancellationToken = default)
    {
        var clusterState = GetClusterState(vehicleId);
        var state = clusterState.TripState;
        state.VehicleId = vehicleId;

        var isStationary = !point.Speed.HasValue || point.Speed.Value < _options.StopSpeedThresholdKph;

        if (isStationary)
        {
            clusterState.ConsecutiveStationaryPoints++;
            clusterState.ConsecutiveMovingPoints = 0;
        }
        else
        {
            clusterState.ConsecutiveMovingPoints++;
            clusterState.ConsecutiveStationaryPoints = 0;
        }

        switch (state.Phase)
        {
            case TripDetectionPhase.AtSite:
                await HandleAtClusterAsync(clusterState, point, isStationary, cancellationToken);
                break;

            case TripDetectionPhase.InTransit:
                await HandleInTransitAsync(clusterState, point, isStationary, cancellationToken);
                break;

            default:
                await HandleInTransitAsync(clusterState, point, isStationary, cancellationToken);
                break;
        }

        state.LastGpsTimestampUtc = point.Timestamp;
        state.LastLatitude = point.Latitude;
        state.LastLongitude = point.Longitude;
    }

    private async Task HandleAtClusterAsync(VehicleClusterState clusterState, TrackPointDTO point,
        bool isStationary, CancellationToken cancellationToken)
    {
        var state = clusterState.TripState;

        if (!isStationary && clusterState.ConsecutiveMovingPoints >= _options.MovingDurationPoints)
        {
            state.Phase = TripDetectionPhase.InTransit;
            state.OriginSiteId = clusterState.CurrentClusterIndex.HasValue
                ? clusterState.DiscoveredClusters.ElementAtOrDefault(clusterState.CurrentClusterIndex.Value)?.MatchedSiteId
                : null;
            state.OriginSiteName = clusterState.CurrentClusterIndex.HasValue
                ? GetClusterDisplayName(clusterState, clusterState.CurrentClusterIndex.Value)
                : null;
            state.OriginLatitude = point.Latitude;
            state.OriginLongitude = point.Longitude;
            state.TripStartTimeUtc = point.Timestamp;
            state.TripStartTrackInfoId = point.TrackInfoId;
            state.FuelAtDeparture = point.FuelLevel;
            state.AccumulatedDistanceKm = 0;
            state.MaxSpeedKph = point.Speed;

            await PersistInProgressTripAsync(state, cancellationToken);
            await PublishTripStartedAsync(state, cancellationToken);

            _logger.LogDebug("Vehicle {VehicleId} departed from cluster {ClusterName} at {Time}",
                state.VehicleId, state.OriginSiteName, point.Timestamp);
        }
    }

    private async Task HandleInTransitAsync(VehicleClusterState clusterState, TrackPointDTO point,
        bool isStationary, CancellationToken cancellationToken)
    {
        var state = clusterState.TripState;

        if (point.DistanceFromPreviousKm.HasValue)
        {
            state.AccumulatedDistanceKm += point.DistanceFromPreviousKm.Value;
        }

        if (point.Speed.HasValue && (!state.MaxSpeedKph.HasValue || point.Speed.Value > state.MaxSpeedKph.Value))
        {
            state.MaxSpeedKph = point.Speed.Value;
        }

        if (isStationary && clusterState.ConsecutiveStationaryPoints >= _options.StopDurationPoints)
        {
            var clusterIndex = FindOrCreateCluster(clusterState, point);
            clusterState.CurrentClusterIndex = clusterIndex;

            await CompleteTripAsync(clusterState, point, clusterIndex, cancellationToken);

            state.Phase = TripDetectionPhase.AtSite;
            clusterState.ConsecutiveMovingPoints = 0;
        }
        else
        {
            await PublishTripInProgressAsync(state, point, cancellationToken);
        }
    }

    private int FindOrCreateCluster(VehicleClusterState clusterState, TrackPointDTO point)
    {
        for (int i = 0; i < clusterState.DiscoveredClusters.Count; i++)
        {
            var cluster = clusterState.DiscoveredClusters[i];
            var distance = HaversineDistanceKm(
                point.Latitude, point.Longitude,
                cluster.CentroidLatitude, cluster.CentroidLongitude);

            if (distance <= _options.ClusterMatchRadiusKm)
            {
                cluster.VisitCount++;

                if (point.ContainingSiteId.HasValue && !cluster.MatchedSiteId.HasValue)
                {
                    cluster.MatchedSiteId = point.ContainingSiteId;
                    cluster.MatchedSiteName = point.ContainingSiteName;
                    cluster.Label = point.ContainingSiteName ?? cluster.Label;
                }

                RefineClusterClassification(cluster);
                return i;
            }
        }

        var newCluster = new ClusterInfo
        {
            ClusterIndex = clusterState.DiscoveredClusters.Count,
            CentroidLatitude = point.Latitude,
            CentroidLongitude = point.Longitude,
            Label = point.ContainingSiteName ?? $"Cluster {(char)('A' + clusterState.DiscoveredClusters.Count)}",
            VisitCount = 1,
            MatchedSiteId = point.ContainingSiteId,
            MatchedSiteName = point.ContainingSiteName,
            Classification = clusterState.DiscoveredClusters.Count == 0 ? "Load" : "Dump",
        };

        clusterState.DiscoveredClusters.Add(newCluster);
        return newCluster.ClusterIndex;
    }

    private static void RefineClusterClassification(ClusterInfo cluster)
    {
        if (cluster.VisitCount >= 3 && cluster.Classification == "Unknown")
        {
            cluster.Classification = cluster.ClusterIndex == 0 ? "Load" : "Dump";
        }
    }

    private async Task CompleteTripAsync(VehicleClusterState clusterState, TrackPointDTO point,
        int destinationClusterIndex, CancellationToken cancellationToken)
    {
        var state = clusterState.TripState;

        if (!state.TripStartTimeUtc.HasValue)
        {
            state.Reset();
            return;
        }

        var cluster = clusterState.DiscoveredClusters.ElementAtOrDefault(destinationClusterIndex);
        var destinationName = GetClusterDisplayName(clusterState, destinationClusterIndex);
        var durationMinutes = (decimal)(point.Timestamp - state.TripStartTimeUtc.Value).TotalMinutes;
        var fuelConsumed = (state.FuelAtDeparture.HasValue && point.FuelLevel.HasValue)
            ? state.FuelAtDeparture.Value - point.FuelLevel.Value
            : (decimal?)null;

        if (state.InProgressTripId.HasValue)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

            var existingTrip = await context.VehicleTrips.FindAsync(
                new object[] { state.InProgressTripId.Value }, cancellationToken);

            if (existingTrip != null)
            {
                existingTrip.EndTimeUtc = point.Timestamp;
                existingTrip.EndLatitude = point.Latitude;
                existingTrip.EndLongitude = point.Longitude;
                existingTrip.DestinationSiteId = cluster?.MatchedSiteId;
                existingTrip.DistanceKm = state.AccumulatedDistanceKm;
                existingTrip.DurationMinutes = durationMinutes;
                existingTrip.MaxSpeedKph = state.MaxSpeedKph ?? 0;
                existingTrip.Status = (int)VehicleTripStatus.Completed;
                existingTrip.FuelAtArrival = point.FuelLevel;
                existingTrip.FuelConsumed = fuelConsumed;
                existingTrip.EndTrackInfoId = point.TrackInfoId;

                await context.SaveChangesAsync(cancellationToken);
            }
        }

        clusterState.CompletedCycleCount++;

        _logger.LogInformation(
            "Vehicle {VehicleId} completed cluster trip: {Origin} -> {Destination}, {Distance:F2} km, cycle #{Cycle}",
            state.VehicleId, state.OriginSiteName, destinationName,
            state.AccumulatedDistanceKm, clusterState.CompletedCycleCount);

        await PublishTripCompletedAsync(state, point, cluster?.MatchedSiteId, destinationName, fuelConsumed, cancellationToken);

        state.Reset();
    }

    private static string GetClusterDisplayName(VehicleClusterState clusterState, int clusterIndex)
    {
        var cluster = clusterState.DiscoveredClusters.ElementAtOrDefault(clusterIndex);
        if (cluster == null)
        {
            return "Unknown";
        }

        return cluster.MatchedSiteName ?? cluster.Label;
    }

    private async Task PersistInProgressTripAsync(VehicleTripState state, CancellationToken cancellationToken)
    {
        if (state.InProgressTripId.HasValue || !state.TripStartTimeUtc.HasValue)
        {
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

            var tripGroup = new VehicleTripGroup
            {
                VehicleId = state.VehicleId,
                TripDate = state.TripStartTimeUtc.Value.Date,
                StartTimeUtc = state.TripStartTimeUtc.Value,
                EndTimeUtc = state.TripStartTimeUtc.Value,
                OriginSiteId = state.OriginSiteId,
                TripCount = 1,
                TotalDistanceKm = 0,
                TotalDurationMinutes = 0,
                DetectionMode = "Cluster",
                MovementProfile = VehicleMovementProfile.Cluster,
                GroupingType = (int)VehicleTripGroupingType.SingleLeg,
                Status = (int)VehicleTripStatus.InProgress,
                ConfidenceScore = 1.0m,
                ConfidenceBand = "High",
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow,
            };

            context.VehicleTripGroups.Add(tripGroup);
            await context.SaveChangesAsync(cancellationToken);

            var trip = new VehicleTrip
            {
                VehicleTripGroupId = tripGroup.VehicleTripGroupId,
                VehicleId = state.VehicleId,
                SequenceNo = 1,
                StartTimeUtc = state.TripStartTimeUtc.Value,
                EndTimeUtc = state.TripStartTimeUtc.Value,
                StartLatitude = state.OriginLatitude ?? 0,
                StartLongitude = state.OriginLongitude ?? 0,
                EndLatitude = state.OriginLatitude ?? 0,
                EndLongitude = state.OriginLongitude ?? 0,
                OriginSiteId = state.OriginSiteId,
                DistanceKm = 0,
                DurationMinutes = 0,
                MaxSpeedKph = 0,
                DetectionMode = "Cluster",
                MovementProfile = VehicleMovementProfile.Cluster,
                Status = (int)VehicleTripStatus.InProgress,
                FuelAtDeparture = state.FuelAtDeparture,
                ConfidenceScore = 1.0m,
                ConfidenceBand = "High",
                StartTrackInfoId = state.TripStartTrackInfoId,
                CreatedAtUtc = DateTime.UtcNow,
            };

            context.VehicleTrips.Add(trip);
            await context.SaveChangesAsync(cancellationToken);

            state.InProgressTripGroupId = tripGroup.VehicleTripGroupId;
            state.InProgressTripId = trip.VehicleTripId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist in-progress cluster trip for vehicle {VehicleId}", state.VehicleId);
        }
    }

    private async Task PublishTripStartedAsync(VehicleTripState state, CancellationToken cancellationToken)
    {
        try
        {
            var dto = new VehicleTripStartedEventDTO
            {
                VehicleId = state.VehicleId,
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleTripId = state.InProgressTripId,
                StartedAtUtc = state.TripStartTimeUtc ?? DateTime.UtcNow,
                OriginSiteId = state.OriginSiteId,
                OriginSiteName = state.OriginSiteName,
                StartLatitude = state.OriginLatitude ?? 0,
                StartLongitude = state.OriginLongitude ?? 0,
                Status = VehicleTripStatus.InProgress,
            };

            await _hubContext.Clients.Groups("all-vehicles", $"vehicle-{state.VehicleId}")
                .SendAsync("TripStarted", dto, cancellationToken);

            // Publish domain event for cross-cutting concerns
            using var scope = _scopeFactory.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            await mediator.Publish(new VehicleTripStartedEvent
            {
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleId = state.VehicleId,
                OriginSiteId = state.OriginSiteId,
                OriginSiteName = state.OriginSiteName,
                StartTimeUtc = state.TripStartTimeUtc ?? DateTime.UtcNow,
                StartLatitude = state.OriginLatitude ?? 0,
                StartLongitude = state.OriginLongitude ?? 0,
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish TripStarted for vehicle {VehicleId}", state.VehicleId);
        }
    }

    private async Task PublishTripInProgressAsync(VehicleTripState state, TrackPointDTO point, CancellationToken cancellationToken)
    {
        try
        {
            var durationMinutes = state.TripStartTimeUtc.HasValue
                ? (decimal)(point.Timestamp - state.TripStartTimeUtc.Value).TotalMinutes
                : 0;

            var dto = new VehicleTripInProgressEventDTO
            {
                VehicleId = state.VehicleId,
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleTripId = state.InProgressTripId,
                EventTimeUtc = point.Timestamp,
                OriginSiteId = state.OriginSiteId,
                OriginSiteName = state.OriginSiteName,
                CurrentLatitude = point.Latitude,
                CurrentLongitude = point.Longitude,
                DistanceKm = state.AccumulatedDistanceKm,
                DurationMinutes = durationMinutes,
                Status = VehicleTripStatus.InProgress,
            };

            await _hubContext.Clients.Groups("all-vehicles", $"vehicle-{state.VehicleId}")
                .SendAsync("TripInProgress", dto, cancellationToken);

            // Publish domain event for cross-cutting concerns
            using var scope = _scopeFactory.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            await mediator.Publish(new VehicleTripInProgressEvent
            {
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleId = state.VehicleId,
                CurrentLatitude = point.Latitude,
                CurrentLongitude = point.Longitude,
                DistanceSoFarKm = state.AccumulatedDistanceKm,
                CurrentSpeedKph = point.Speed ?? 0,
                TimestampUtc = point.Timestamp,
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish TripInProgress for vehicle {VehicleId}", state.VehicleId);
        }
    }

    private async Task PublishTripCompletedAsync(VehicleTripState state, TrackPointDTO point,
        int? destinationSiteId, string? destinationSiteName, decimal? fuelConsumed,
        CancellationToken cancellationToken)
    {
        try
        {
            var durationMinutes = state.TripStartTimeUtc.HasValue
                ? (decimal)(point.Timestamp - state.TripStartTimeUtc.Value).TotalMinutes
                : 0;

            var dto = new VehicleTripCompletedEventDTO
            {
                VehicleId = state.VehicleId,
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleTripId = state.InProgressTripId,
                CompletedAtUtc = point.Timestamp,
                DestinationSiteId = destinationSiteId,
                DestinationSiteName = destinationSiteName,
                EndLatitude = point.Latitude,
                EndLongitude = point.Longitude,
                DistanceKm = state.AccumulatedDistanceKm,
                DurationMinutes = durationMinutes,
                FuelConsumed = fuelConsumed,
                Status = VehicleTripStatus.Completed,
            };

            await _hubContext.Clients.Groups("all-vehicles", $"vehicle-{state.VehicleId}")
                .SendAsync("TripCompleted", dto, cancellationToken);

            // Publish domain event for cross-cutting concerns
            using var scope = _scopeFactory.CreateScope();
            var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
            await mediator.Publish(new VehicleTripCompletedEvent
            {
                VehicleTripGroupId = state.InProgressTripGroupId,
                VehicleId = state.VehicleId,
                OriginSiteId = state.OriginSiteId,
                DestinationSiteId = destinationSiteId,
                OriginSiteName = state.OriginSiteName,
                DestinationSiteName = destinationSiteName,
                StartTimeUtc = state.TripStartTimeUtc ?? DateTime.UtcNow,
                EndTimeUtc = point.Timestamp,
                DistanceKm = state.AccumulatedDistanceKm,
                MaxSpeedKph = state.MaxSpeedKph,
                Duration = state.TripStartTimeUtc.HasValue
                    ? point.Timestamp - state.TripStartTimeUtc.Value
                    : TimeSpan.Zero,
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish TripCompleted for vehicle {VehicleId}", state.VehicleId);
        }
    }

    private static decimal HaversineDistanceKm(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
    {
        const double R = 6371.0;
        var dLat = ToRadians((double)(lat2 - lat1));
        var dLon = ToRadians((double)(lon2 - lon1));
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (decimal)(R * c);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
