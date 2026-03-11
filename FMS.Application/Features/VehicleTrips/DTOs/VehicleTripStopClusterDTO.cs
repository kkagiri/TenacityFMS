/**
 * File: VehicleTripStopClusterDTO.cs
 * Purpose: Represents a clustered stop centroid used to infer load and dump trip legs.
 * Dependencies: None.
 * Last Modified: 2026-03-10
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripStopClusterDTO
{
    public int ClusterId { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int VisitCount { get; set; }
    public decimal AverageDwellMinutes { get; set; }
    public string ClusterType { get; set; } = "Transit";
    public string Label { get; set; } = string.Empty;
    public int? SiteId { get; set; }
    public int? GeofenceId { get; set; }
}