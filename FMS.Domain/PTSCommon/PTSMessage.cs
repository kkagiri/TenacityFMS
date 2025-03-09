using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FMS.Domain.PTSCommon;

public class PTSMessage
{
    [JsonPropertyName("Protocol")]
    public string Protocol { get; set; } = "jsonPTS";

    // Optional: If PTS-2 sends PtsId in message
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [JsonPropertyName("PtsId")]
    [Required]
    public string? PtsId { get; set; }

    [JsonPropertyName("Packets")]
    public List<Packet> Packets { get; set; } = new List<Packet>();
}

public class Packet
{
    [JsonPropertyName("Id")]
    public int Id { get; set; }

    [JsonPropertyName("Type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("SetRequestType")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? SetRequestType { get; set; } = string.Empty;

    [JsonPropertyName("Data")]
    public JObject? Data { get; set; }

    [JsonPropertyName("Error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Error { get; set; }

    [JsonPropertyName("Code")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? Code { get; set; } = null;

    [JsonPropertyName("Message")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]

    public string? Message { get; set; } = string.Empty;


}
