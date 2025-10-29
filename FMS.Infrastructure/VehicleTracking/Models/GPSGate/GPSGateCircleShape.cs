using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate circle shape model for geofences
    /// </summary>
    public class GPSGateCircleShape
    {
        [JsonPropertyName("center")]
        public GPSGatePosition2D? Center { get; set; }

        [JsonPropertyName("radius")]
        public double Radius { get; set; }
    }
}
