using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate credentials model for authentication
    /// </summary>
    public class GPSGateCredentials
    {
        [JsonPropertyName("password")]
        public string? Password { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }
    }
}
