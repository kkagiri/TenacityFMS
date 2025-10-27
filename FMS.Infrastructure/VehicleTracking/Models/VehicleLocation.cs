using System;
using System.Collections.Generic;

namespace FMS.Infrastructure.VehicleTracking.Models
{
    /// <summary>
    /// Represents a vehicle's location data at a specific point in time
    /// </summary>
    public class VehicleLocation
    {
        /// <summary>
        /// Vehicle ID
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Latitude in decimal degrees
        /// </summary>
        public double Latitude { get; set; }

        /// <summary>
        /// Longitude in decimal degrees
        /// </summary>
        public double Longitude { get; set; }

        /// <summary>
        /// Altitude in meters (optional)
        /// </summary>
        public double? Altitude { get; set; }

        /// <summary>
        /// Speed in kilometers per hour
        /// </summary>
        public double? Speed { get; set; }

        /// <summary>
        /// Heading/direction in degrees (0-360, where 0 is North)
        /// </summary>
        public double? Heading { get; set; }

        /// <summary>
        /// Timestamp when the location was recorded
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// GPS accuracy/precision in meters
        /// </summary>
        public double? Accuracy { get; set; }

        /// <summary>
        /// Number of satellites used for the fix
        /// </summary>
        public int? SatelliteCount { get; set; }

        /// <summary>
        /// GPS signal quality (provider-specific)
        /// </summary>
        public string? SignalQuality { get; set; }

        /// <summary>
        /// Whether the vehicle is moving
        /// </summary>
        public bool IsMoving { get; set; }

        /// <summary>
        /// Address or location description (if available)
        /// </summary>
        public string? Address { get; set; }

        /// <summary>
        /// Provider that supplied this location data
        /// </summary>
        public string? ProviderName { get; set; }

        /// <summary>
        /// Additional provider-specific metadata
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; } = new();

        /// <summary>
        /// External device ID in the provider's system
        /// </summary>
        public string? ExternalDeviceId { get; set; }
    }
}
