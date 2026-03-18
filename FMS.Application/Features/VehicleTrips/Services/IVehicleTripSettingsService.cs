/**
 * File: IVehicleTripSettingsService.cs
 * Purpose: Defines accessors for VehicleTrips runtime settings backed by SystemConfiguration.
 * Dependencies: VehicleTripSettingsDTO.
 * Last Modified: 2026-03-12
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripSettingsService
{
    Task<bool> IsRealtimeStateMachineExecutionEnabledAsync(CancellationToken cancellationToken = default);
    Task<VehicleTripSettingsDTO> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<bool> IsFuelContextEnrichmentEnabledAsync(CancellationToken cancellationToken = default);
    Task<VehicleTripSettingsDTO> UpdateSettingsAsync(
        VehicleTripSettingsDTO settings,
        string? updatedBy,
        CancellationToken cancellationToken = default);
}