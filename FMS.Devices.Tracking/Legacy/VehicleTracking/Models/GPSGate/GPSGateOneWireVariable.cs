using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate OneWire variable model
    /// </summary>
    public class GPSGateOneWireVariable
    {
        [JsonPropertyName("deviceDefinitionID")]
        public int DeviceDefinitionID { get; set; }

        [JsonPropertyName("deviceID")]
        public int DeviceID { get; set; }

        [JsonPropertyName("oneWireID")]
        public string? OneWireID { get; set; }

        [JsonPropertyName("variableName")]
        public string? VariableName { get; set; }
    }
}
