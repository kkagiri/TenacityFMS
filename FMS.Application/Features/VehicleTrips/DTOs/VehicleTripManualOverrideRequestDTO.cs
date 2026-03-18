/**
 * File: VehicleTripManualOverrideRequestDTO.cs
 * Purpose: Defines the request payload for future manual trip override actions.
 * Dependencies: VehicleTripStatus.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripManualOverrideRequestDTO
{
    public int VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public int? OverrideOriginSiteId { get; set; }
    public int? OverrideDestinationSiteId { get; set; }
    public VehicleTripStatus? OverrideStatus { get; set; }
    public string Action { get; set; } = "Adjust";
    public string? Notes { get; set; }
    public string? RequestedBy { get; set; }
}
