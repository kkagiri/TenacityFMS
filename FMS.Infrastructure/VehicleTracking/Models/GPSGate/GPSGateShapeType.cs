using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate geofence shape type enumeration
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum GPSGateShapeType
    {
        Polygon,
        Circle,
        Route,
        // Add unknown type to handle unexpected values from GPSGate
        Unknown
    }
}
