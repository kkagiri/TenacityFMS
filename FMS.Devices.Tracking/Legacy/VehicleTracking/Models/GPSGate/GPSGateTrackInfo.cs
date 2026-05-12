using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate track info model
    /// </summary>
    public class GPSGateTrackInfo
    {
        [JsonPropertyName("boundingBox")]
        public GPSGateBoundingBox? BoundingBox { get; set; }

        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("endPosition")]
        public GPSGatePosition3D? EndPosition { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("startPosition")]
        public GPSGatePosition3D? StartPosition { get; set; }

        [JsonPropertyName("totalDistance")]
        public double TotalDistance { get; set; }

        [JsonPropertyName("updated")]
        public string Updated { get; set; } = string.Empty;

        [JsonPropertyName("userId")]
        public int UserId { get; set; }
    }
}
