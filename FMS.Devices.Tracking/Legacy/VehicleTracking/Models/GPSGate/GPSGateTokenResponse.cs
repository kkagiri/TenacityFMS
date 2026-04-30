using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate authentication token response
    /// </summary>
    public class GPSGateTokenResponse
    {
        [JsonPropertyName("token")]
        public string? Token { get; set; }
    }
}
