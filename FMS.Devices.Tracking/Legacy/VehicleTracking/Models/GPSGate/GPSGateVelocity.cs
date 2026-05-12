using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate velocity data (speed and heading)
    /// </summary>
    public class GPSGateVelocity
    {
        [JsonPropertyName("groundSpeed")]
        public double? GroundSpeed { get; set; }

        [JsonPropertyName("heading")]
        public double? Heading { get; set; }
    }
}
