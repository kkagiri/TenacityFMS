/**
 * File: VehicleTrip.cs
 * Purpose: Stores an individual detected trip leg for a vehicle.
 * Dependencies: Vehicle, Site, VehicleTripGroup.
 * Last Modified: 2026-03-10
 */
using System;

namespace FMS.Domain.Entities;

/// <summary>
/// Persisted trip leg detected for a vehicle.
/// </summary>
public class VehicleTrip
{
    public int VehicleTripId { get; set; }
    public int VehicleTripGroupId { get; set; }
    public int VehicleId { get; set; }
    public int SequenceNo { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public int? OriginSiteId { get; set; }
    public int? DestinationSiteId { get; set; }
    public int? OriginGeofenceId { get; set; }
    public int? DestinationGeofenceId { get; set; }
    public decimal StartLatitude { get; set; }
    public decimal StartLongitude { get; set; }
    public decimal EndLatitude { get; set; }
    public decimal EndLongitude { get; set; }
    public decimal DistanceKm { get; set; }
    public decimal DurationMinutes { get; set; }
    public decimal? MaxSpeedKph { get; set; }
    public VehicleMovementProfile MovementProfile { get; set; } = VehicleMovementProfile.Geofence;
    public string DetectionMode { get; set; } = "Geofence";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public virtual VehicleTripGroup VehicleTripGroup { get; set; } = null!;
    public virtual Vehicle Vehicle { get; set; } = null!;
    public virtual Site? OriginSite { get; set; }
    public virtual Site? DestinationSite { get; set; }
}