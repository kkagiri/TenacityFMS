/**
 * File: IVehicleTripClusterDetectionService.cs
 * Purpose: Abstraction for detecting cluster-mode vehicle trips from stop behaviour.
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

public interface IVehicleTripClusterDetectionService
{
    Task<List<VehicleTripDetectionResultDTO>> DetectTripsAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);

    Task<ClusterDetectionPreviewDTO> PreviewDetectionAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);

    Task<ClusterDetectionPreviewDTO> PreviewDetectionAsync(
        VehicleEntity vehicle,
        DateTime fromUtc,
        DateTime toUtc,
        VehicleTripClusterDetectionOptions overrideOptions,
        CancellationToken cancellationToken = default);
}