/**
 * File: VehicleTripOutOfBoundsEvent.cs
 * Purpose: Persists trip boundary-exit and other out-of-bounds events for audit and reporting.
 * Dependencies: Vehicle, Site, VehicleTripGroup, VehicleTrip.
 * Last Modified: 2026-03-12
 */
using System;

namespace FMS.Domain.Entities;

public class VehicleTripOutOfBoundsEvent
{
    public int VehicleTripOutOfBoundsEventId { get; set; }
    public int VehicleId { get; set; }
    public int? VehicleTripGroupId { get; set; }
    public int? VehicleTripId { get; set; }
    public string EventType { get; set; } = "BoundaryExit";
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int? SiteId { get; set; }
    public int? GeofenceId { get; set; }
    public decimal? DistanceFromBoundaryMeters { get; set; }
    public decimal? DurationMinutes { get; set; }
    public string? Reason { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual VehicleTripGroup? VehicleTripGroup { get; set; }
    public virtual VehicleTrip? VehicleTrip { get; set; }
    public virtual Site? Site { get; set; }
}