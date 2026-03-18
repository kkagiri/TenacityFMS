/**
 * File: IVehicleTripConfidenceScoringService.cs
 * Purpose: Assigns confidence and anomaly scaffolding to detected trips and grouped trips.
 * Dependencies: Vehicle trip detection/grouped DTOs.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripConfidenceScoringService
{
    Task ScoreTripsAsync(List<VehicleTripDetectionResultDTO> detectedTrips, CancellationToken cancellationToken = default);
    Task ScoreGroupsAsync(List<VehicleTripGroupedDetectionDTO> groupedTrips, CancellationToken cancellationToken = default);
}
