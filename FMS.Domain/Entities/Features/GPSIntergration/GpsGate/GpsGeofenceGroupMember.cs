using System;

namespace FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

/// <summary>
/// Many-to-many relationship between geofence groups and their member geofences.
/// Represents the membership of a geofence in a group (synced from GPSGate).
/// </summary>
public class GpsGeofenceGroupMember
{
    public int Id { get; set; }

    /// <summary>
    /// The geofence group
    /// </summary>
    public int GroupId { get; set; }

    /// <summary>
    /// The geofence that belongs to this group
    /// </summary>
    public int GeofenceId { get; set; }

    /// <summary>
    /// When this membership was synced
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual GpsGeofenceGroup Group { get; set; } = null!;
    public virtual GpsGeofence Geofence { get; set; } = null!;
}
