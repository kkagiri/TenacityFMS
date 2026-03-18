/**
 * File: VehicleTripManualOverrideResponseDTO.cs
 * Purpose: Defines the response payload for future manual trip override actions.
 * Dependencies: VehicleTripStatus.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripManualOverrideResponseDTO
{
    public int VehicleTripGroupId { get; set; }
    public int? SourceVehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public bool Applied { get; set; }
    public VehicleTripManualOverrideAction Action { get; set; }
    public VehicleTripStatus? ResultingStatus { get; set; }
    public VehicleTripReconciliationStatus? ReconciliationStatus { get; set; }
    public string? AppliedByUserId { get; set; }
    public string? AppliedByName { get; set; }
    public string? Reason { get; set; }
    public bool RequiredSupervisorApproval { get; set; }
    public string Message { get; set; } = string.Empty;
}
