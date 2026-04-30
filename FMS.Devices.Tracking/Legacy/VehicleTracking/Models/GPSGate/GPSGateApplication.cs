using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate application model
    /// </summary>
    public class GPSGateApplication
    {
        [JsonPropertyName("created")]
        public string Created { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("expire")]
        public string Expire { get; set; } = string.Empty;

        [JsonPropertyName("expired")]
        public bool Expired { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("licensesUsed")]
        public int LicensesUsed { get; set; }

        [JsonPropertyName("maxUsers")]
        public int MaxUsers { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("userCount")]
        public int UserCount { get; set; }
    }
}
