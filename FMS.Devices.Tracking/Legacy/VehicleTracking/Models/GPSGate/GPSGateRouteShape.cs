using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate route shape model for geofences
    /// </summary>
    public class GPSGateRouteShape
    {
        [JsonPropertyName("radius")]
        public double Radius { get; set; }

        [JsonPropertyName("vertices")]
        public List<GPSGatePosition2D>? Vertices { get; set; }

        [JsonIgnore]
        public GPSGateShapeType Type => GPSGateShapeType.Route;

        [JsonIgnore]
        public List<GPSGatePosition2D>? Points => Vertices;
    }
}
