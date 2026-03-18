/**
 * File: IVehicleTripOverrideAuditService.cs
 * Purpose: Defines audit persistence and retrieval operations for vehicle trip manual overrides.
 * Dependencies: Override audit DTOs.
 * Last Modified: 2026-03-11
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripOverrideAuditService
{
    Task RecordAsync(VehicleTripOverrideAuditPayloadDTO payload, CancellationToken cancellationToken = default);
    Task<List<VehicleTripOverrideHistoryItemDTO>> GetHistoryAsync(int vehicleTripGroupId, int? vehicleTripId, CancellationToken cancellationToken = default);
}
