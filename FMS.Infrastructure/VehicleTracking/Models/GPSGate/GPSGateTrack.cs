using System.Collections.Generic;
using System.Text.Json.Serialization;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate track point from history
    /// </summary>
    public class GPSGateTrack
    {
        [JsonPropertyName("uTC")]
        public string? UTC { get; set; }

        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }

        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("serverUtc")]
        public string? ServerUtc { get; set; }

        [JsonPropertyName("trackInfoId")]
        public int TrackInfoId { get; set; }

        /// <summary>
        /// Variables array containing sensor data (fuel level, ignition, etc.)
        /// Added for Fuel Audit GPS Service
        /// </summary>
        [JsonPropertyName("variables")]
        public List<GPSGateVariable>? Variables { get; set; }
    }
}
