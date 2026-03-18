/**
 * File: IVehicleTripGpsPreProcessor.cs
 * Purpose: Defines GPS point filtering and enrichment behavior for trip detection.
 * Dependencies: TrackPointDTO.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Vehicle.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripGpsPreProcessor
{
    Task<List<TrackPointDTO>> ProcessAsync(int vehicleId, IReadOnlyCollection<TrackPointDTO> rawPoints, CancellationToken cancellationToken = default);
}
