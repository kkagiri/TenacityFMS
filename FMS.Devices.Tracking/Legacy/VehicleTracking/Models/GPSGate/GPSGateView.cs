using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate view model
    /// </summary>
    public class GPSGateView
    {
        [JsonPropertyName("applicationID")]
        public int ApplicationID { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("matchAllTags")]
        public bool MatchAllTags { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("statusFilter")]
        public GPSGateUserNetStatus StatusFilter { get; set; }

        [JsonPropertyName("tagIDs")]
        public List<int>? TagIDs { get; set; }
    }
}
