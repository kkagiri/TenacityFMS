using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate track point data
    /// </summary>
    public class GPSGateTrackPoint
    {
        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }

        [JsonPropertyName("uTC")]
        public string? UTC { get; set; }

        [JsonPropertyName("valid")]
        public bool Valid { get; set; }
    }
}
