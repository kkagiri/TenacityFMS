using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate geofence model
    /// </summary>
    public class GPSGateGeofence
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }

        [JsonPropertyName("created")]
        public string? Created { get; set; }

        [JsonPropertyName("modified")]
        public string? Modified { get; set; }

        [JsonPropertyName("shapeType")]
        public GPSGateShapeType ShapeType { get; set; }

        [JsonPropertyName("circleShape")]
        public GPSGateCircleShape? CircleShape { get; set; }

        [JsonPropertyName("polygonShape")]
        public GPSGatePolygonShape? PolygonShape { get; set; }

        [JsonPropertyName("routeShape")]
        public GPSGateRouteShape? RouteShape { get; set; }

        /// <summary>
        /// Unified shape property that returns the appropriate shape based on ShapeType
        /// This property allows polymorphic access to the specific shape type
        /// </summary>
        [JsonIgnore]
        public dynamic? Shape
        {
            get
            {
                return ShapeType switch
                {
                    GPSGateShapeType.Circle => CircleShape,
                    GPSGateShapeType.Polygon => PolygonShape,
                    GPSGateShapeType.Route => RouteShape,
                    _ => null
                };
            }
        }
    }
}
