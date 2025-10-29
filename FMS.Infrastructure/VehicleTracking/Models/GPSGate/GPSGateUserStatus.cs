using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate user status response model
    /// </summary>
    public class GPSGateUserStatus
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonPropertyName("uTC")]
        public string? UTC { get; set; }

        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }
    }
}
