/**
 * File: GetVehicleTripHistoryQuery.cs
 * Purpose: Query contract for reading persisted trip history for a vehicle.
 * Dependencies: MediatR, FMSResponse, VehicleTripGroupDTO.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;
using MediatR;

namespace FMS.Application.Features.VehicleTrips.Queries;

public record GetVehicleTripHistoryQuery : IRequest<FMSResponse<List<VehicleTripGroupDTO>>>
{
    public int VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
}
