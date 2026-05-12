using System;
using System.Collections.Generic;

namespace FMS.Domain.Entities.Features.GPSIntergration.GpsGate;

/// <summary>
/// Cached geofence group from GPSGate. Groups organize related geofences together.
/// Geofences are created and managed in GPSGate - FMS only reads them.
///
/// For fueling validation, mark groups as "allowed for fueling" using IsAllowedForFueling.
/// This is a GLOBAL setting - any tanker/PTS must be inside one of the allowed groups' geofences.
/// </summary>
public class GpsGeofenceGroup
{
    public int Id { get; set; }

    /// <summary>
    /// The external group ID from GPSGate
    /// </summary>
    public int ExternalGroupId { get; set; }

    /// <summary>
    /// Group name from GPSGate (e.g., "Authorized Fueling Zones")
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Group description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Display color from GPSGate (hex format, e.g., "#4CAF50")
    /// </summary>
    public string? Colour { get; set; }

    /// <summary>
    /// Whether the group is pinned in GPSGate
    /// </summary>
    public bool IsPinned { get; set; }

    /// <summary>
    /// Whether the group is active for use (synced from GPSGate)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this group is selected as an allowed fueling zone.
    /// When geofence validation is enabled, fueling is only permitted
    /// within geofences belonging to groups marked as allowed.
    /// This is a GLOBAL setting, not per-ruleset.
    /// </summary>
    public bool IsAllowedForFueling { get; set; } = false;

    /// <summary>
    /// When this group was last synced from GPSGate
    /// </summary>
    public DateTime LastSyncedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Geofences that belong to this group
    /// </summary>
    public virtual ICollection<GpsGeofenceGroupMember> Members { get; set; } = new List<GpsGeofenceGroupMember>();
}
