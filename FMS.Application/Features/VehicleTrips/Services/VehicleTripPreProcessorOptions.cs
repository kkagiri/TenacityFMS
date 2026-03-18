/**
 * File: VehicleTripPreProcessorOptions.cs
 * Purpose: Configures filtering and enrichment thresholds for the trip GPS pre-processor.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */
namespace FMS.Application.Features.VehicleTrips.Services;

public class VehicleTripPreProcessorOptions
{
    public const string SectionName = "VehicleTrips:PreProcessor";

    public int SlidingWindowSize { get; set; } = 7;
    public int? MinimumSatelliteCount { get; set; } = 1;
    public decimal MaxPositionJumpKm { get; set; } = 3.0m;
    public decimal DuplicateDistanceMeters { get; set; } = 5.0m;
    public int DuplicateTimeWindowSeconds { get; set; } = 10;
    public decimal MaximumImpliedSpeedKph { get; set; } = 180m;
}
