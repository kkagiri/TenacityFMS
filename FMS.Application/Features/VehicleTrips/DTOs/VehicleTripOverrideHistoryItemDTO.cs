/**
 * File: VehicleTripOverrideHistoryItemDTO.cs
 * Purpose: Returns persisted manual trip override audit history for a trip or trip group.
 * Dependencies: Vehicle trip detail and supervisor approval DTOs.
 * Last Modified: 2026-03-11
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripOverrideHistoryItemDTO
{
    public int AuditId { get; set; }
    public VehicleTripManualOverrideAction Action { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string RequestedByUserId { get; set; } = string.Empty;
    public string? RequestedByName { get; set; }
    public string? RequestIpAddress { get; set; }
    public DateTime RequestedAtUtc { get; set; }
    public int VehicleId { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public int? SecondaryVehicleTripId { get; set; }
    public int? ResultVehicleTripGroupId { get; set; }
    public bool RequiredSupervisorApproval { get; set; }
    public VehicleTripSupervisorApprovalDTO? SupervisorApproval { get; set; }
    public VehicleTripDetailDTO? OriginalValues { get; set; }
    public VehicleTripDetailDTO? NewValues { get; set; }
}
