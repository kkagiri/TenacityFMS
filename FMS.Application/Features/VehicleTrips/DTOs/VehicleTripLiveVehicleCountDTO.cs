/**
 * File: VehicleTripLiveVehicleCountDTO.cs
 * Purpose: Aggregated trip counts per vehicle for the live trip operations report.
 * Dependencies: None.
 * Last Modified: 2026-03-13
 */
namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveVehicleCountDTO
{
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int TripGroupCount { get; set; }
    public int TripLegCount { get; set; }
    public int ActiveTripCount { get; set; }
    public int LoadCycleCount { get; set; }
    public int RoundTripCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
}