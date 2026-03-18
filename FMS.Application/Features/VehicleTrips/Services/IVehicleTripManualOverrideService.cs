/**
 * File: IVehicleTripManualOverrideService.cs
 * Purpose: Defines manual override operations for persisted vehicle trip records.
 * Dependencies: Override command contracts and response DTOs.
 * Last Modified: 2026-03-11
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTrips.Commands;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripManualOverrideService
{
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> SplitTripAsync(SplitVehicleTripCommand request, CancellationToken cancellationToken = default);
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> MergeTripsAsync(MergeVehicleTripsCommand request, CancellationToken cancellationToken = default);
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> ReassignSiteAsync(ReassignVehicleTripSiteCommand request, CancellationToken cancellationToken = default);
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> AddTripAsync(AddVehicleTripCommand request, CancellationToken cancellationToken = default);
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> DeleteTripAsync(DeleteVehicleTripCommand request, CancellationToken cancellationToken = default);
    Task<FMSResponse<VehicleTripManualOverrideResponseDTO>> AdjustTripTimesAsync(AdjustVehicleTripTimesCommand request, CancellationToken cancellationToken = default);
}
