using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate 3D position model (latitude, longitude, altitude)
    /// </summary>
    public class GPSGatePosition3D
    {
        [JsonPropertyName("altitude")]
        public double Altitude { get; set; }

        [JsonPropertyName("latitude")]
        public double Latitude { get; set; }

        [JsonPropertyName("longitude")]
        public double Longitude { get; set; }
    }
}
