/**
 * File: SiteGeofenceDTO.cs
 * Purpose: Carries site identity plus full geofence geometry so the frontend can run containment tests locally.
 * Dependencies: None.
 * Last Modified: 2026-07-06
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class SiteGeofenceDTO
{
    public int SiteId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Classification { get; set; } = "Unknown";
    public int? GpsGeofenceId { get; set; }
    public string GeofenceType { get; set; } = string.Empty;
    public string? GeometryJson { get; set; }
    public decimal? CenterLatitude { get; set; }
    public decimal? CenterLongitude { get; set; }
    public double? RadiusMeters { get; set; }
}
