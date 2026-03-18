/**
 * File: VehicleTripLiveTipperCycleDTO.cs
 * Purpose: Live tipper cycle totals per vehicle for the live trip operations report.
 * Dependencies: None.
 * Last Modified: 2026-03-13
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveTipperCycleDTO
{
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public int TotalCycleCount { get; set; }
    public int CompletedCycleCount { get; set; }
    public int ActiveCycleCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public DateTime? LastCycleStartedAtUtc { get; set; }
}