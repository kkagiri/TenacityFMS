/**
 * File: IVehicleTripStateMachine.cs
 * Purpose: Contract for real-time per-vehicle trip detection state machines.
 * Dependencies: TrackPointDTO, VehicleTripState.
 * Last Modified: 2026-03-12
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.VehicleTrips.StateMachines;

public interface IVehicleTripStateMachine
{
    Task ProcessPointAsync(int vehicleId, TrackPointDTO point, CancellationToken cancellationToken = default);
    VehicleTripState GetState(int vehicleId);
    void RestoreState(int vehicleId, VehicleTripState state);
}
