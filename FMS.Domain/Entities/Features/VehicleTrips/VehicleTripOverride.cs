/**
 * File: VehicleTripOverride.cs
 * Purpose: Persists manual trip override audit records independently of the shared user activity log.
 * Dependencies: Vehicle, VehicleTripGroup, VehicleTrip.
 * Last Modified: 2026-03-12
 */
using System;

namespace FMS.Domain.Entities;

public class VehicleTripOverride
{
    public int VehicleTripOverrideId { get; set; }
    public int VehicleId { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public int? SecondaryVehicleTripId { get; set; }
    public int? ResultVehicleTripGroupId { get; set; }
    public string ActionType { get; set; } = "AdjustTimes";
    public string Reason { get; set; } = string.Empty;
    public string RequestedByUserId { get; set; } = string.Empty;
    public string? RequestedByName { get; set; }
    public string? RequestIpAddress { get; set; }
    public DateTime RequestedAtUtc { get; set; } = DateTime.UtcNow;
    public bool RequiredSupervisorApproval { get; set; }
    public string? SupervisorApprovalJson { get; set; }
    public string? OriginalValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual VehicleTripGroup? VehicleTripGroup { get; set; }
    public virtual VehicleTrip? VehicleTrip { get; set; }
    public virtual VehicleTripGroup? ResultVehicleTripGroup { get; set; }
}