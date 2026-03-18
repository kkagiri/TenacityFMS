/**
 * File: VehicleTripGeofenceStateMachine.cs
 * Purpose: Real-time per-vehicle state machine for geofence-based trip detection.
 * Dependencies: TrackPointDTO, VehicleTripState, GpsdataContext, SignalR hub.
 * Last Modified: 2026-03-12
 */
using System;
using System.Collections.Concurrent;
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

public class VehicleTripGeofenceStateMachine : IVehicleTripStateMachine
{
    private readonly ConcurrentDictionary<int, VehicleTripState> _states = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<VehicleTrackingHub> _hubContext;
    private readonly VehicleTripGeofenceStateMachineOptions _options;
    private readonly ILogger<VehicleTripGeofenceStateMachine> _logger;

    public VehicleTripGeofenceStateMachine(
        IServiceScopeFactory scopeFactory,
        IHubContext<VehicleTrackingHub> hubContext,
        IOptions<VehicleTripGeofenceStateMachineOptions> options,
        ILogger<VehicleTripGeofenceStateMachine> logger)
    {
        _scopeFactory = scopeFactory;
        _hubContext = hubContext;
        _options = options.Value;
        _logger = logger;
    }

    public VehicleTripState GetState(int vehicleId)
    {
        return _states.GetOrAdd(vehicleId, id => new VehicleTripState { VehicleId = id });
    }

    public void RestoreState(int vehicleId, VehicleTripState state)
    {
        _states[vehicleId] = state;
    }

    public async Task ProcessPointAsync(int vehicleId, TrackPointDTO point, CancellationToken cancellationToken = default)
    {
        var state = GetState(vehicleId);

        var isAtSite = point.ContainingSiteId.HasValue && point.ContainingSiteId.Value > 0;
        var currentSiteId = point.ContainingSiteId;
        var currentGeofenceId = point.ContainingGeofenceId;
        var currentSiteName = point.ContainingSiteName;

        DetectGpsGap(state, point);

        switch (state.Phase)
        {
            case TripDetectionPhase.AtSite:
                await HandleAtSiteAsync(state, point, isAtSite, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
                break;

            case TripDetectionPhase.Departing:
                await HandleDepartingAsync(state, point, isAtSite, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
                break;

            case TripDetectionPhase.InTransit:
                await HandleInTransitAsync(state, point, isAtSite, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
                break;

            case TripDetectionPhase.Arriving:
                await HandleArrivingAsync(state, point, isAtSite, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
                break;
        }

        UpdateTrackingState(state, point);
    }

    private async Task HandleAtSiteAsync(VehicleTripState state, TrackPointDTO point,
        bool isAtSite, int? currentSiteId, int? currentGeofenceId, string? currentSiteName,
        CancellationToken cancellationToken)
    {
        if (isAtSite)
        {
            state.CurrentSiteId = currentSiteId;
            state.CurrentGeofenceId = currentGeofenceId;
            state.CurrentSiteName = currentSiteName;
            state.ConsecutiveOutOfSitePoints = 0;
        }
        else
        {
            state.ConsecutiveOutOfSitePoints++;

            if (state.ConsecutiveOutOfSitePoints >= _options.DepartureConsecutiveThreshold)
            {
                state.Phase = TripDetectionPhase.Departing;
                state.OriginSiteId = state.CurrentSiteId;
                state.OriginGeofenceId = state.CurrentGeofenceId;
                state.OriginSiteName = state.CurrentSiteName;
                state.OriginLatitude = point.Latitude;
                state.OriginLongitude = point.Longitude;
                state.TripStartTimeUtc = point.Timestamp;
                state.TripStartTrackInfoId = point.TrackInfoId;
                state.FuelAtDeparture = point.FuelLevel;
                state.AccumulatedDistanceKm = 0;
                state.MaxSpeedKph = point.Speed;

                _logger.LogDebug("Vehicle {VehicleId} departing from site {SiteName} at {Time}",
                    state.VehicleId, state.OriginSiteName, point.Timestamp);
            }
        }
    }

    private async Task HandleDepartingAsync(VehicleTripState state, TrackPointDTO point,
        bool isAtSite, int? currentSiteId, int? currentGeofenceId, string? currentSiteName,
        CancellationToken cancellationToken)
    {
        if (isAtSite && currentSiteId == state.OriginSiteId)
        {
            state.Phase = TripDetectionPhase.AtSite;
            state.ConsecutiveOutOfSitePoints = 0;
            _logger.LogDebug("Vehicle {VehicleId} returned to origin site, cancelling departure", state.VehicleId);
            return;
        }

        if (isAtSite && currentSiteId != state.OriginSiteId)
        {
            await CompleteTripAsync(state, point, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
            return;
        }

        state.Phase = TripDetectionPhase.InTransit;
        AccumulateDistance(state, point);

        await PersistInProgressTripAsync(state, cancellationToken);
        await PublishTripStartedAsync(state, cancellationToken);
    }

    private async Task HandleInTransitAsync(VehicleTripState state, TrackPointDTO point,
        bool isAtSite, int? currentSiteId, int? currentGeofenceId, string? currentSiteName,
        CancellationToken cancellationToken)
    {
        AccumulateDistance(state, point);

        if (isAtSite)
        {
            state.ConsecutiveAtSitePoints++;

            if (state.ConsecutiveAtSitePoints >= _options.ArrivalConsecutiveThreshold)
            {
                await CompleteTripAsync(state, point, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
                return;
            }
        }
        else
        {
            state.ConsecutiveAtSitePoints = 0;
        }

        await PublishTripInProgressAsync(state, point, cancellationToken);
    }

    private async Task HandleArrivingAsync(VehicleTripState state, TrackPointDTO point,
        bool isAtSite, int? currentSiteId, int? currentGeofenceId, string? currentSiteName,
        CancellationToken cancellationToken)
    {
        if (isAtSite)
        {
            await CompleteTripAsync(state, point, currentSiteId, currentGeofenceId, currentSiteName, cancellationToken);
        }
        else
        {
            state.Phase = TripDetectionPhase.InTransit;
            state.ConsecutiveAtSitePoints = 0;
        }
    }

    private async Task CompleteTripAsync(VehicleTripState state, TrackPointDTO point,
        int? destinationSiteId, int? destinationGeofenceId, string? destinationSiteName,
        CancellationToken cancellationToken)
    {
        if (!state.TripStartTimeUtc.HasValue)
        {
            state.Reset();
            state.CurrentSiteId = destinationSiteId;
            state.CurrentGeofenceId = destinationGeofenceId;
            state.CurrentSiteName = destinationSiteName;
            return;
        }

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
                existingTrip.DestinationSiteId = destinationSiteId;
                existingTrip.DestinationGeofenceId = destinationGeofenceId;
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

        _logger.LogInformation(
            "Vehicle {VehicleId} completed trip: {Origin} -> {Destination}, {Distance:F2} km, {Duration:F1} min",
            state.VehicleId, state.OriginSiteName, destinationSiteName,
            state.AccumulatedDistanceKm, durationMinutes);

        await PublishTripCompletedAsync(state, point, destinationSiteId, destinationSiteName, fuelConsumed, cancellationToken);

        state.Reset();
        state.CurrentSiteId = destinationSiteId;
        state.CurrentGeofenceId = destinationGeofenceId;
        state.CurrentSiteName = destinationSiteName;
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
                DetectionMode = "Geofence",
                MovementProfile = VehicleMovementProfile.Geofence,
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
                OriginGeofenceId = state.OriginGeofenceId,
                DistanceKm = 0,
                DurationMinutes = 0,
                MaxSpeedKph = 0,
                DetectionMode = "Geofence",
                MovementProfile = VehicleMovementProfile.Geofence,
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
            _logger.LogError(ex, "Failed to persist in-progress trip for vehicle {VehicleId}", state.VehicleId);
        }
    }

    private void DetectGpsGap(VehicleTripState state, TrackPointDTO point)
    {
        if (!state.LastGpsTimestampUtc.HasValue)
        {
            return;
        }

        var gapMinutes = (decimal)(point.Timestamp - state.LastGpsTimestampUtc.Value).TotalMinutes;
        if (gapMinutes > _options.GpsGapThresholdMinutes && state.Phase != TripDetectionPhase.AtSite)
        {
            _logger.LogWarning(
                "GPS gap of {GapMinutes:F1} min detected for vehicle {VehicleId}, marking as low confidence",
                gapMinutes, state.VehicleId);
        }
    }

    private static void AccumulateDistance(VehicleTripState state, TrackPointDTO point)
    {
        if (point.DistanceFromPreviousKm.HasValue)
        {
            state.AccumulatedDistanceKm += point.DistanceFromPreviousKm.Value;
        }

        if (point.Speed.HasValue && (!state.MaxSpeedKph.HasValue || point.Speed.Value > state.MaxSpeedKph.Value))
        {
            state.MaxSpeedKph = point.Speed.Value;
        }
    }

    private void UpdateTrackingState(VehicleTripState state, TrackPointDTO point)
    {
        state.LastGpsTimestampUtc = point.Timestamp;
        state.LastLatitude = point.Latitude;
        state.LastLongitude = point.Longitude;
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
}
