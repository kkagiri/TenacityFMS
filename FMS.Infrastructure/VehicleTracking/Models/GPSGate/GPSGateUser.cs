using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate user/device response model
    /// </summary>
    public class GPSGateUser
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("surname")]
        public string? Surname { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("trackPoint")]
        public GPSGateTrackPoint? TrackPoint { get; set; }

        [JsonPropertyName("calculatedSpeed")]
        public double CalculatedSpeed { get; set; }

        [JsonPropertyName("deviceActivity")]
        public string? DeviceActivity { get; set; }

        [JsonPropertyName("devices")]
        public List<GPSGateDeviceInfo>? Devices { get; set; }

        [JsonPropertyName("userTemplateID")]
        public int UserTemplateID { get; set; }
    }
}
