/**
 * File: VehicleTripLiveIdleOutsideZoneDTO.cs
 * Purpose: Represents a vehicle flagged as idle outside work zones for the live trip operations report.
 * Dependencies: Trip anomaly enum.
 * Last Modified: 2026-03-13
 */
using System;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveIdleOutsideZoneDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleTripId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public string LocationDisplayName { get; set; } = "Unknown";
    public DateTime StartedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public decimal IdleMinutes { get; set; }
    public bool IsOutOfBounds { get; set; }
    public bool OffSiteIdleSuspected { get; set; }
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
}