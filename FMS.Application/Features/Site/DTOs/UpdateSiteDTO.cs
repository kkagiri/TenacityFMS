/**
 * File: UpdateSiteDTO.cs
 * Purpose: Request DTO for updating site records.
 * Dependencies: System.ComponentModel.DataAnnotations.
 * Last Modified: 2026-02-26
 */
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Site.DTOs
{
    public class UpdateSiteDTO
    {
        [Required(ErrorMessage = "Site name is required")]
        [MaxLength(255, ErrorMessage = "Site name must not exceed 255 characters")]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Whether the site is active for fuel reporting
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Site Administrator User ID for notification routing
        /// </summary>
        public string? SiteAdministratorId { get; set; }

        /// <summary>
        /// GPSGate Tag ID for this site
        /// </summary>
        public int? GpsGateTagId { get; set; }

        /// <summary>
        /// GPSGate Tag Name for display purposes
        /// </summary>
        public string? GpsGateTagName { get; set; }

        /// <summary>
        /// Whether to automatically update GPSGate tag when vehicles are transferred to this site
        /// </summary>
        public bool AutoUpdateGpsGateTag { get; set; } = true;

        /// <summary>
        /// Selected local GPS geofence ID from cached gps_geofence.
        /// </summary>
        public int? GpsGeofenceId { get; set; }

        /// <summary>
        /// Optional geofence name from client. Server may overwrite from cached geofence.
        /// </summary>
        public string? GpsGeofenceName { get; set; }

        /// <summary>
        /// Optional geofence type from client. Server may overwrite from cached geofence.
        /// </summary>
        public string? GpsGeofenceType { get; set; }

        /// <summary>
        /// Optional geofence latitude from client. Server may overwrite from cached geofence.
        /// </summary>
        public decimal? GpsGeofenceCenterLatitude { get; set; }

        /// <summary>
        /// Optional geofence longitude from client. Server may overwrite from cached geofence.
        /// </summary>
        public decimal? GpsGeofenceCenterLongitude { get; set; }
    }
}
