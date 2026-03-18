/**
 * File: VehicleTripLiveOperationsSummaryDTO.cs
 * Purpose: Summary metrics for the live trip operations report.
 * Dependencies: None.
 * Last Modified: 2026-03-13
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveOperationsSummaryDTO
{
    public int VehiclesCurrentlyTravelingCount { get; set; }
    public int ActiveTripsInProgressCount { get; set; }
    public int VehiclesWithTripCountsCount { get; set; }
    public int LiveTipperCycleVehicleCount { get; set; }
    public int VehiclesIdleOutsideWorkZonesCount { get; set; }
    public int TotalTripGroups { get; set; }
    public int TotalTripLegs { get; set; }
    public decimal TotalActiveDistanceKm { get; set; }
    public decimal TotalActiveDurationMinutes { get; set; }
}