/**
 * File: VehicleTripGeofenceDetectionOptions.cs
 * Purpose: Configures batch geofence trip detection thresholds.
 * Dependencies: None.
 * Last Modified: 2026-03-12
 */
namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripGeofenceDetectionOptions
{
    public const string SectionName = "VehicleTrips:Geofence:Batch";

    public decimal MinimumTripDistanceKm { get; set; } = 0.50m;
    public decimal MinimumTripDurationMinutes { get; set; } = 2m;
    public int MaxTrackPoints { get; set; } = 5000;
}