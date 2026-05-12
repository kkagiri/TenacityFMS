/**
 * File:          SiteStatsDTO.cs
 * Purpose:       DTO for site quick stats and project overview context
 * Dependencies:  None
 * Last Modified: 2026-02-26
 *
 * Key Properties:
 * - TankCount:      Number of tanks at the site
 * - VehicleCount:   Number of vehicles assigned to the site
 * - EmployeeCount:  Number of employees at the site
 * - PtsDeviceCount: Number of PTS devices at the site
 * - UserCount:      Number of users assigned to the site
 * - IssueCount:     Total issues linked to the site
 * - OpenIssueCount: Issues currently open (not closed)
 * - Geofence*:      GPSGate geofence linkage summary
 */
namespace FMS.Application.Features.Site.DTOs;

public class SiteStatsDTO
{
    public int TankCount { get; set; }
    public int VehicleCount { get; set; }
    public int EmployeeCount { get; set; }
    public int PtsDeviceCount { get; set; }
    public int UserCount { get; set; }
    public int IssueCount { get; set; }
    public int OpenIssueCount { get; set; }
    public int GeofenceGroupCount { get; set; }
    public int GeofenceCount { get; set; }
    public string? PrimaryGeofenceName { get; set; }
    public decimal? PrimaryGeofenceLatitude { get; set; }
    public decimal? PrimaryGeofenceLongitude { get; set; }
}
