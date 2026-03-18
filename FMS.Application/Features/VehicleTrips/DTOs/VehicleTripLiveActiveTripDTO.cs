/**
 * File: VehicleTripLiveActiveTripDTO.cs
 * Purpose: Represents an active trip-in-progress row for the live trip operations report.
 * Dependencies: Vehicle movement profile enum, trip status enum, trip anomaly enum.
 * Last Modified: 2026-03-13
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripLiveActiveTripDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleTripId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public DateTime TripDate { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public string DestinationDisplayName { get; set; } = "Unknown";
    public decimal CurrentLatitude { get; set; }
    public decimal CurrentLongitude { get; set; }
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal? FuelConsumed { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.InProgress;
    public decimal ConfidenceScore { get; set; }
    public string ConfidenceBand { get; set; } = "High";
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public bool? IsOutOfBounds { get; set; }
}