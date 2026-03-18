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
using FMS.Application.Features.VehicleTrips.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace FMS.Application.Features.VehicleTrips.Commands;

public record RecomputeVehicleTripsCommand : IRequest<FMSResponse<VehicleTripRecomputeResultDTO>>
{
    public int VehicleId { get; init; }
    public DateTime? FromUtc { get; init; }
    public DateTime? ToUtc { get; init; }
}

public class RecomputeVehicleTripsCommandHandler : IRequestHandler<RecomputeVehicleTripsCommand, FMSResponse<VehicleTripRecomputeResultDTO>>
{
    private readonly IVehicleTripOrchestrationService _tripOrchestrationService;

    public RecomputeVehicleTripsCommandHandler(
        IVehicleTripOrchestrationService tripOrchestrationService)
    {
        _tripOrchestrationService = tripOrchestrationService;
    }

    public async Task<FMSResponse<VehicleTripRecomputeResultDTO>> Handle(RecomputeVehicleTripsCommand request, CancellationToken cancellationToken)
    {
        return await _tripOrchestrationService.RecomputeVehicleTripsAsync(
            request.VehicleId,
            request.FromUtc,
            request.ToUtc,
            cancellationToken);
    }
}
