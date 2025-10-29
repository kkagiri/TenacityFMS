using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate geofence model
    /// </summary>
    public class GPSGateGeofence
    {
        [JsonPropertyName("circleShape")]
        public GPSGateCircleShape? CircleShape { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("polygonShape")]
        public GPSGatePolygonShape? PolygonShape { get; set; }

        [JsonPropertyName("routeShape")]
        public GPSGateRouteShape? RouteShape { get; set; }

        [JsonPropertyName("shapeType")]
        public GPSGateShapeType ShapeType { get; set; }
    }
}
