using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Vehicle.DTOs
{
    /// <summary>
    /// Represents a geofence group from GPSGate for organizing related geofences
    /// </summary>
    public class GeofenceGroupDTO
    {
        /// <summary>
        /// GPSGate group ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Group name (e.g., "Authorized Fueling Zones")
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Group description
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Display color from GPSGate (hex format)
        /// </summary>
        public string Colour { get; set; } = "#808080";

        /// <summary>
        /// List of geofence IDs in this group
        /// </summary>
        public List<int> GeofenceIds { get; set; } = new();

        /// <summary>
        /// Number of geofences in this group
        /// </summary>
        public int GeofenceCount => GeofenceIds.Count;

        /// <summary>
        /// Whether this group is pinned in GPSGate
        /// </summary>
        public bool IsPinned { get; set; }

        /// <summary>
        /// Whether this group is used for geocoding in GPSGate
        /// </summary>
        public bool UseInGeocoding { get; set; }

        /// <summary>
        /// When this group was last synced from GPSGate
        /// </summary>
        public DateTime LastSyncedAt { get; set; }

        /// <summary>
        /// Whether this group is active for fueling validation
        /// </summary>
        public bool IsActive { get; set; } = true;
    }
}
