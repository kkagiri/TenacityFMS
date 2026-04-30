using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate polygon shape model for geofences
    /// </summary>
    public class GPSGatePolygonShape
    {
        [JsonPropertyName("vertices")]
        public List<GPSGatePosition2D>? Vertices { get; set; }

        [JsonIgnore]
        public GPSGateShapeType Type => GPSGateShapeType.Polygon;

        [JsonIgnore]
        public List<GPSGatePosition2D>? Points => Vertices;
    }
}
