/**
 * File: RecomputeVehicleTripsCommand.cs
 * Purpose: Command contract for manually rebuilding persisted trips for a vehicle.
 * Dependencies: MediatR, FMSResponse, VehicleTripRecomputeResultDTO.
 * Last Modified: 2026-03-10
 */
using System;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTrips.Commands;

public record RecomputeVehicleTripsCommand : IRequest<FMSResponse<VehicleTripRecomputeResultDTO>>
{
    public int VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
}
