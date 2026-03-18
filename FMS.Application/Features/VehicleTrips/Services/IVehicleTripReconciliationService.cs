/**
 * File: IVehicleTripReconciliationService.cs
 * Purpose: Provides reconciliation preview and future reconciliation execution for vehicle trips.
 * Dependencies: FMSResponse, reconciliation result DTO.
 * Last Modified: 2026-03-11
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripReconciliationService
{
    Task<FMSResponse<VehicleTripReconciliationResultDTO>> ReconcileVehicleTripsAsync(
        int vehicleId,
        DateTime? fromUtc,
        DateTime? toUtc,
        bool previewOnly,
        CancellationToken cancellationToken = default);
}
