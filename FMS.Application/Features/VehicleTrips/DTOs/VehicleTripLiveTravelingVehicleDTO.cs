/**
 * File: VehicleTripLiveTravelingVehicleDTO.cs
 * Purpose: Represents a vehicle currently travelling for the live trip operations report.
 * Dependencies: Vehicle movement profile enum and trip status enum.
 * Last Modified: 2026-03-13
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveTravelingVehicleDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleTripId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public string DestinationDisplayName { get; set; } = "Unknown";
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.InProgress;
    public decimal ConfidenceScore { get; set; }
    public string ConfidenceBand { get; set; } = "High";
}