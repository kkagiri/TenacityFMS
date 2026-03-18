/**
 * File: IVehicleTripFuelContextService.cs
 * Purpose: Defines fuel enrichment behavior for detected trips before persistence or reconciliation.
 * Dependencies: VehicleTripDetectionResultDTO.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripFuelContextService
{
    Task EnrichTripsAsync(int vehicleId, IReadOnlyCollection<VehicleTripDetectionResultDTO> trips, CancellationToken cancellationToken = default);
}
