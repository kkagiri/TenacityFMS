using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate application template model
    /// </summary>
    public class GPSGateApplicationTemplate
    {
        [JsonPropertyName("created")]
        public string Created { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
