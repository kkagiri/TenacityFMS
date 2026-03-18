/**
 * File: IVehicleTripOrchestrationService.cs
 * Purpose: Coordinates vehicle trip detection, grouping, and persistence for backend workflows.
 * Dependencies: FMSResponse, trip recompute DTO.
 * Last Modified: 2026-03-11
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripOrchestrationService
{
    Task<FMSResponse<VehicleTripRecomputeResultDTO>> RecomputeVehicleTripsAsync(
        int vehicleId,
        DateTime? fromUtc,
        DateTime? toUtc,
        CancellationToken cancellationToken = default);
}
