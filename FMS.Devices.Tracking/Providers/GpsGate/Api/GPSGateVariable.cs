using System.Text.Json.Serialization;

namespace FMS.Infrastructure.ExternalServices.GPS.GPSGate
{
    /// <summary>
    /// GPSGate variable model for sensor data
    /// </summary>
    public class GPSGateVariable
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("time")]
        public string? Time { get; set; }

        [JsonPropertyName("value")]
        public string? Value { get; set; }
    }
}

