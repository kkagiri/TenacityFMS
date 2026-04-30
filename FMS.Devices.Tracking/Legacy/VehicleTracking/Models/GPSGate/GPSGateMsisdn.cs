using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate MSISDN (phone number) data
    /// </summary>
    public class GPSGateMsisdn
    {
        [JsonPropertyName("raw")]
        public string? Raw { get; set; }
    }
}
