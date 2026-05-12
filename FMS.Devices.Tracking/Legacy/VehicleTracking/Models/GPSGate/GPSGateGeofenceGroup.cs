using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate geofence group model
    /// </summary>
    public class GPSGateGeofenceGroup
    {
        [JsonPropertyName("colour")]
        public string? Colour { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("geofenceIds")]
        public List<int>? GeofenceIds { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("pinned")]
        public bool Pinned { get; set; }

        [JsonPropertyName("useInGeocoding")]
        public bool UseInGeocoding { get; set; }
    }
}
