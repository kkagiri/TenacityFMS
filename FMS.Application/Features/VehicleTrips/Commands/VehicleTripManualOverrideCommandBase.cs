/**
 * File: VehicleTripManualOverrideCommandBase.cs
 * Purpose: Provides shared request metadata for manual trip override commands.
 * Dependencies: Supervisor approval DTO.
 * Last Modified: 2026-03-11
 */
using FMS.Application.Features.VehicleTrips.DTOs;

namespace FMS.Application.Features.VehicleTrips.Commands;

public abstract class VehicleTripManualOverrideCommandBase
{
    public string Reason { get; init; } = string.Empty;
    public string RequestedByUserId { get; set; } = string.Empty;
    public string? RequestedByName { get; set; }
    public string? RequestIpAddress { get; set; }
    public VehicleTripSupervisorApprovalDTO? SupervisorApproval { get; init; }
}
