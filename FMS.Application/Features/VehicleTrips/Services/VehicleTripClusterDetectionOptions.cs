/**
 * File: VehicleTripClusterDetectionOptions.cs
 * Purpose: Configures batch cluster trip detection thresholds.
 * Dependencies: None.
 * Last Modified: 2026-03-12
 */
namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripClusterDetectionOptions
{
    public const string SectionName = "VehicleTrips:Cluster:Batch";

    public decimal StopSpeedThresholdKph { get; set; } = 3m;
    public decimal MinimumStopDurationMinutes { get; set; } = 1.5m;
    public decimal MinimumTripDistanceKm { get; set; } = 0.50m;
    public decimal MinimumTripDurationMinutes { get; set; } = 2m;
    public double ClusterRadiusMeters { get; set; } = 150d;
    public int MaxTrackPoints { get; set; } = 5000;
}