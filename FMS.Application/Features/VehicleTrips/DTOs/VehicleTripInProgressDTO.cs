/**
 * File: VehicleTripInProgressDTO.cs
 * Purpose: Read model for active in-progress vehicle trips used by trip monitoring screens.
 * Dependencies: Vehicle movement profile enum, trip anomaly and reconciliation enums.
 * Last Modified: 2026-03-11
 */
using System;
using FMS.Domain.Entities;

namespace FMS.Application.Features.VehicleTrips.DTOs;

public class VehicleTripInProgressDTO
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleTripId { get; set; }
    public int VehicleId { get; set; }
    public string VehicleLabel { get; set; } = string.Empty;
    public string? NumberPlate { get; set; }
    public DateTime TripDate { get; set; }
    public DateTime StartedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public string? OriginSiteName { get; set; }
    public string OriginDisplayName { get; set; } = "Unknown";
    public int? EstimatedDestinationSiteId { get; set; }
    public string? EstimatedDestinationSiteName { get; set; }
    public decimal CurrentLatitude { get; set; }
    public decimal CurrentLongitude { get; set; }
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal? MaxSpeedKph { get; set; }
    public decimal? FuelAtDeparture { get; set; }
    public decimal? FuelAtArrival { get; set; }
    public decimal? FuelConsumed { get; set; }
    public VehicleTripStatus Status { get; set; } = VehicleTripStatus.InProgress;
    public VehicleMovementProfile MovementProfile { get; set; }
    public string DetectionMode { get; set; } = "Geofence";
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public string ConfidenceBand { get; set; } = "High";
    public VehicleTripAnomalyType AnomalyFlags { get; set; } = VehicleTripAnomalyType.None;
    public VehicleTripReconciliationStatus ReconciliationStatus { get; set; } = VehicleTripReconciliationStatus.Pending;
    public bool? IsOutOfBounds { get; set; }
    public bool? IsProductiveMovement { get; set; }
    public string? PlanningMatchStatus { get; set; }
}
