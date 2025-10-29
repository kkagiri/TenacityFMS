using System.Text.Json.Serialization;

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
    }
}
