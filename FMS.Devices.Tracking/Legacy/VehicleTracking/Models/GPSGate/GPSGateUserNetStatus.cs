using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate user network status enumeration
    /// </summary>
    public enum GPSGateUserNetStatus
    {
        [JsonPropertyName("Sending")]
        Sending,

        [JsonPropertyName("Connected")]
        Connected,

        [JsonPropertyName("Offline")]
        Offline,

        [JsonPropertyName("NeverBeenConnected")]
        NeverBeenConnected
    }
}
