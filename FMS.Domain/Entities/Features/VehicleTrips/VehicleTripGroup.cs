/**
 * File: VehicleTripGroup.cs
 * Purpose: Stores persisted route-level trip summaries for a vehicle.
 * Dependencies: Vehicle, Site, VehicleTrip.
 * Last Modified: 2026-03-11
 */
using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities;

/// <summary>
/// Aggregated route summary of one or more detected vehicle trip legs.
/// </summary>
public class VehicleTripGroup
{
    public int VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public DateTime TripDate { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public int? DestinationSiteId { get; set; }
    public int TripCount { get; set; }
    public decimal TotalDistanceKm { get; set; }
    public decimal TotalDurationMinutes { get; set; }
    public int Status { get; set; } = 2;
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string DetectionMode { get; set; } = "Geofence";
    public decimal? TotalFuelConsumed { get; set; }
    public int GroupingType { get; set; } = 1;
    public decimal ConfidenceScore { get; set; } = 1.00m;
    public string ConfidenceBand { get; set; } = "High";
    public int AnomalyFlags { get; set; }
    public int ReconciliationStatus { get; set; }
    public int? ProjectPlanId { get; set; }
    public int? WorkShiftId { get; set; }
    public int? PlannedHaulRouteId { get; set; }
    public int? PlannedOriginZoneId { get; set; }
    public int? PlannedDestinationZoneId { get; set; }
    public string? PlanningMatchStatus { get; set; }
    public bool? IsOutOfBounds { get; set; }
    public bool? IsProductiveMovement { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site? OriginSite { get; set; }
    public virtual Site? DestinationSite { get; set; }
    public virtual ICollection<VehicleTrip> Trips { get; set; } = new List<VehicleTrip>();
}