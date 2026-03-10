/**
 * File: VehicleTripGroup.cs
 * Purpose: Stores persisted route-level trip summaries for a vehicle.
 * Dependencies: Vehicle, Site, VehicleTrip.
 * Last Modified: 2026-03-10
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
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string DetectionMode { get; set; } = "Geofence";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site? OriginSite { get; set; }
    public virtual Site? DestinationSite { get; set; }
    public virtual ICollection<VehicleTrip> Trips { get; set; } = new List<VehicleTrip>();
}