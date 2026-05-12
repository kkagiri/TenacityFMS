using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate bounding box model for track info
    /// </summary>
    public class GPSGateBoundingBox
    {
        [JsonPropertyName("maxM")]
        public double MaxM { get; set; }

        [JsonPropertyName("maxTime")]
        public string MaxTime { get; set; } = string.Empty;

        [JsonPropertyName("maxX")]
        public double MaxX { get; set; }

        [JsonPropertyName("maxY")]
        public double MaxY { get; set; }

        [JsonPropertyName("maxZ")]
        public double MaxZ { get; set; }

        [JsonPropertyName("minM")]
        public double MinM { get; set; }

        [JsonPropertyName("minTime")]
        public string MinTime { get; set; } = string.Empty;

        [JsonPropertyName("minX")]
        public double MinX { get; set; }

        [JsonPropertyName("minY")]
        public double MinY { get; set; }

        [JsonPropertyName("minZ")]
        public double MinZ { get; set; }
    }
}
