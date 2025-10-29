using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate geofence shape type enumeration
    /// </summary>
    public enum GPSGateShapeType
    {
        [JsonPropertyName("Polygon")]
        Polygon,

        [JsonPropertyName("Circle")]
        Circle,

        [JsonPropertyName("Route")]
        Route
    }
}
