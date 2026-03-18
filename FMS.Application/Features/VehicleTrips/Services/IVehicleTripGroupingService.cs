/**
 * File: IVehicleTripGroupingService.cs
 * Purpose: Groups detected trip legs into round-trip and load-cycle summaries before persistence.
 * Dependencies: Vehicle trip detection/grouped DTOs.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using FMS.Application.Features.VehicleTrips.DTOs;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripGroupingService
{
    List<VehicleTripGroupedDetectionDTO> GroupTrips(VehicleEntity vehicle, IReadOnlyList<VehicleTripDetectionResultDTO> detectedTrips);
}
