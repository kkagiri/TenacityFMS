/**
 * File: IVehicleTripGeofenceDetectionService.cs
 * Purpose: Abstraction for detecting vehicle trips from geofence/site transitions.
 * Dependencies: Vehicle entity, trip detection DTO.
 * Last Modified: 2026-03-10
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripGeofenceDetectionService
{
    Task<List<VehicleTripDetectionResultDTO>> DetectTripsAsync(
    VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);

    Task<GeofenceDetectionPreviewDTO> PreviewDetectionAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        VehicleTripGeofenceDetectionOptions? overrideOptions = null,
        int? geofenceGroupId = null,
        CancellationToken cancellationToken = default);
}
