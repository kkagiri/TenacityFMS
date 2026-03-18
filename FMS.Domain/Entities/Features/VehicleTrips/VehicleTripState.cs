/**
 * File: VehicleTripState.cs
 * Purpose: Persists per-vehicle/day real-time detector state so trip state machines can recover after restarts.
 * Dependencies: Vehicle, Site, VehicleTripGroup, VehicleTrip.
 * Last Modified: 2026-03-12
 */
using System;

namespace FMS.Domain.Entities;

public class VehicleTripState
{
    public int VehicleTripStateId { get; set; }
    public int VehicleId { get; set; }
    public DateTime StateDate { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string CurrentState { get; set; } = "AT_SITE";
    public int? CurrentSiteId { get; set; }
    public int? CurrentGeofenceId { get; set; }
    public string? CurrentSiteName { get; set; }
    public int? CurrentClusterIndex { get; set; }
    public int? OriginSiteId { get; set; }
    public int? OriginGeofenceId { get; set; }
    public string? OriginSiteName { get; set; }
    public decimal? OriginLatitude { get; set; }
    public decimal? OriginLongitude { get; set; }
    public DateTime? TripStartTimeUtc { get; set; }
    public int? TripStartTrackInfoId { get; set; }
    public decimal? FuelAtDeparture { get; set; }
    public int ConsecutiveOutOfSitePoints { get; set; }
    public int ConsecutiveAtSitePoints { get; set; }
    public decimal AccumulatedDistanceKm { get; set; }
    public decimal? MaxSpeedKph { get; set; }
    public DateTime? LastProcessedPointTimeUtc { get; set; }
    public DateTime? LastGpsTimestampUtc { get; set; }
    public decimal? LastLatitude { get; set; }
    public decimal? LastLongitude { get; set; }
    public int? InProgressTripGroupId { get; set; }
    public int? InProgressTripId { get; set; }
    public string? RecentPointsJson { get; set; }
    public string? KnownClustersJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site? CurrentSite { get; set; }
    public virtual Site? OriginSite { get; set; }
    public virtual VehicleTripGroup? InProgressTripGroup { get; set; }
    public virtual VehicleTrip? InProgressTrip { get; set; }
}