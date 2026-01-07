using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

/// <summary>
/// Cached geofence from GPSGate. This is synced periodically and used for fueling validation.
/// Geofences are created and managed in GPSGate - FMS only reads them.
/// </summary>
public class GpsGeofence
{
    public int Id { get; set; }

    /// <summary>
    /// The external geofence ID from GPSGate
    /// </summary>
    public int ExternalGeofenceId { get; set; }

    /// <summary>
    /// Geofence name from GPSGate
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Geofence description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Type of geofence: Polygon, Circle, Route
    /// </summary>
    public GpsGeofenceType GeofenceType { get; set; }

    /// <summary>
    /// GeoJSON format of coordinates for polygon/route geofences
    /// </summary>
    public string? GeometryJson { get; set; }

    /// <summary>
    /// Center latitude for circular geofences
    /// </summary>
    public decimal? CenterLatitude { get; set; }

    /// <summary>
    /// Center longitude for circular geofences
    /// </summary>
    public decimal? CenterLongitude { get; set; }

    /// <summary>
    /// Radius in meters for circular geofences
    /// </summary>
    public int? RadiusMeters { get; set; }

    /// <summary>
    /// Whether the geofence is active in GPSGate
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this geofence was last synced from GPSGate
    /// </summary>
    public DateTime LastSyncedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Group memberships for this geofence
    /// </summary>
    public virtual ICollection<GpsGeofenceGroupMember> GroupMemberships { get; set; } = new List<GpsGeofenceGroupMember>();
}

/// <summary>
/// Type of geofence shape
/// </summary>
public enum GpsGeofenceType
{
    Polygon = 1,
    Circle = 2,
    Route = 3
}
