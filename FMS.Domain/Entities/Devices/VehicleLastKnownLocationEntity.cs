using System;

namespace FMS.Domain.Entities.Devices
{
    /// <summary>
    /// Caches the last known GPS position for a vehicle.
    /// Updated every time we successfully fetch a location from the GPS provider.
    /// Used as fallback when live GPS is unavailable (device offline, API error, etc.)
    /// </summary>
    public class VehicleLastKnownLocationEntity
    {
        /// <summary>
        /// The vehicle ID (primary key, one cached location per vehicle)
        /// </summary>
        public int VehicleId { get; set; }

        /// <summary>
        /// Last known latitude
        /// </summary>
        public decimal Latitude { get; set; }

        /// <summary>
        /// Last known longitude
        /// </summary>
        public decimal Longitude { get; set; }

        /// <summary>
        /// Last known altitude (optional)
        /// </summary>
        public decimal? Altitude { get; set; }

        /// <summary>
        /// Last known speed in km/h (optional)
        /// </summary>
        public decimal? Speed { get; set; }

        /// <summary>
        /// Last known heading in degrees (optional)
        /// </summary>
        public decimal? Heading { get; set; }

        /// <summary>
        /// Whether the GPS position was valid when cached
        /// </summary>
        public bool IsGpsValid { get; set; } = true;

        /// <summary>
        /// Device activity time from GPS provider (when the device last reported)
        /// </summary>
        public DateTime? DeviceActivityTime { get; set; }

        /// <summary>
        /// External device ID from the GPS provider (e.g., GPSGate user ID)
        /// </summary>
        public string? ExternalDeviceId { get; set; }

        /// <summary>
        /// When this location was cached in our system
        /// </summary>
        public DateTime CachedAt { get; set; }

        /// <summary>
        /// Source of the location: GPSGate, Mobile, Manual
        /// </summary>
        public string Source { get; set; } = "GPSGate";

        // Navigation property
        public virtual Vehicle? Vehicle { get; set; }
    }
}
