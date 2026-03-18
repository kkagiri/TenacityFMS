/**
 * File: VehicleTripRealtimeDispatcher.cs
 * Purpose: Routes incoming GPS points to the appropriate state machine based on vehicle movement profile.
 * Dependencies: IVehicleTripGpsPreProcessor, state machines, vehicle cache.
 * Last Modified: 2026-03-12
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.VehicleTrips.Services;
using FMS.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.VehicleTrips.StateMachines;

public interface IVehicleTripRealtimeDispatcher
{
    Task ProcessGpsPointAsync(int vehicleId, VehicleMovementProfile movementProfile, TrackPointDTO point, CancellationToken cancellationToken = default);
}

public class VehicleTripRealtimeDispatcher : IVehicleTripRealtimeDispatcher
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly VehicleTripGeofenceStateMachine _geofenceStateMachine;
    private readonly VehicleTripClusterStateMachine _clusterStateMachine;
    private readonly ILogger<VehicleTripRealtimeDispatcher> _logger;

    public VehicleTripRealtimeDispatcher(
        IServiceScopeFactory scopeFactory,
        VehicleTripGeofenceStateMachine geofenceStateMachine,
        VehicleTripClusterStateMachine clusterStateMachine,
        ILogger<VehicleTripRealtimeDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _geofenceStateMachine = geofenceStateMachine;
        _clusterStateMachine = clusterStateMachine;
        _logger = logger;
    }

    public async Task ProcessGpsPointAsync(int vehicleId, VehicleMovementProfile movementProfile, TrackPointDTO point, CancellationToken cancellationToken = default)
    {
        if (movementProfile == VehicleMovementProfile.Undefined)
        {
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var settingsService = scope.ServiceProvider.GetRequiredService<IVehicleTripSettingsService>();
            var realtimeStateMachineExecutionEnabled = await settingsService.IsRealtimeStateMachineExecutionEnabledAsync(cancellationToken);

            if (!realtimeStateMachineExecutionEnabled)
            {
                _logger.LogDebug(
                    "Realtime vehicle trip state machine execution disabled. Skipping GPS point for vehicle {VehicleId}",
                    vehicleId);
                return;
            }

            var preProcessor = scope.ServiceProvider.GetRequiredService<IVehicleTripGpsPreProcessor>();

            var preprocessed = await preProcessor.ProcessAsync(
                vehicleId,
                new List<TrackPointDTO> { point },
                cancellationToken);

            if (preprocessed == null || preprocessed.Count == 0)
            {
                return;
            }

            var enrichedPoint = preprocessed[0];

            switch (movementProfile)
            {
                case VehicleMovementProfile.Geofence:
                    await _geofenceStateMachine.ProcessPointAsync(vehicleId, enrichedPoint, cancellationToken);
                    break;

                case VehicleMovementProfile.Cluster:
                    await _clusterStateMachine.ProcessPointAsync(vehicleId, enrichedPoint, cancellationToken);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing GPS point for vehicle {VehicleId} with profile {Profile}",
                vehicleId, movementProfile);
        }
    }
}
