/**
 * File: SiteDTO.cs
 * Purpose: DTO used by Site APIs for list/detail payloads.
 * Dependencies: None.
 * Last Modified: 2026-02-26
 */
namespace FMS.Application.Features.Site.DTOs;

public class SiteDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public string? SiteAdministratorId { get; set; }
    public string? SiteAdministratorName { get; set; }

    // GPSGate Tag Configuration
    public int? GpsGateTagId { get; set; }
    public string? GpsGateTagName { get; set; }
    public string? GpsGateTagColor { get; set; }
    public bool AutoUpdateGpsGateTag { get; set; } = true;

    // GPSGate Geofence Configuration
    public int? GpsGeofenceId { get; set; }
    public string? GpsGeofenceName { get; set; }
    public string? GpsGeofenceType { get; set; }
    public decimal? GpsGeofenceCenterLatitude { get; set; }
    public decimal? GpsGeofenceCenterLongitude { get; set; }
}
