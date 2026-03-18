/**
 * File: GeofenceDetectionPreviewDTO.cs
 * Purpose: Returns track points and site geofence geometry for frontend geofence detection playground.
 * Dependencies: PreviewTrackPointDTO, SiteGeofenceDTO.
 * Last Modified: 2026-07-06
 */
using System;
using System.Collections.Generic;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class GeofenceDetectionPreviewDTO
{
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public DateTime FromUtc { get; set; }
    public DateTime ToUtc { get; set; }
    public int TotalTrackPoints { get; set; }
    public List<PreviewTrackPointDTO> TrackPoints { get; set; } = new();
    public List<SiteGeofenceDTO> SiteGeofences { get; set; } = new();

    // Settings that were actually used for this preview run
    public decimal SettingsMinimumTripDistanceKm { get; set; }
    public decimal SettingsMinimumTripDurationMinutes { get; set; }
    public int SettingsMaxTrackPoints { get; set; }
}
