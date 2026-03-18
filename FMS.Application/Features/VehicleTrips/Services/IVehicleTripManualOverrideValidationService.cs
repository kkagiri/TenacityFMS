/**
 * File: IVehicleTripManualOverrideValidationService.cs
 * Purpose: Defines loading and validation helpers for manual trip override workflows.
 * Dependencies: Vehicle trip entities and supervisor approval DTO.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTrips.DTOs;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.Services;

public interface IVehicleTripManualOverrideValidationService
{
    List<string> ValidateBaseRequest(string reason, string requestedByUserId);
    Task<VehicleTripGroup?> LoadGroupAsync(int vehicleTripGroupId, CancellationToken cancellationToken = default);
    Task<List<string>> ValidateTripTimelineAsync(int vehicleId, List<VehicleTripMutationState> trips, IReadOnlyCollection<int> excludedGroupIds, CancellationToken cancellationToken = default);
    Task<List<string>> ValidateSupervisorApprovalAsync(int vehicleId, DateTime startTimeUtc, DateTime endTimeUtc, VehicleTripSupervisorApprovalDTO? supervisorApproval, CancellationToken cancellationToken = default);
    Task<bool> PeriodHasFinalizedFuelAuditAsync(int vehicleId, DateTime startTimeUtc, DateTime endTimeUtc, CancellationToken cancellationToken = default);
}
