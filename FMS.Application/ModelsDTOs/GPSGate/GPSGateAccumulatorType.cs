using System.Text.Json.Serialization;

namespace FMS.Application.ModelsDTOs.GPSGate
{
    /// <summary>
    /// GPSGate accumulator type definition
    /// </summary>
    public class GPSGateAccumulatorType
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
