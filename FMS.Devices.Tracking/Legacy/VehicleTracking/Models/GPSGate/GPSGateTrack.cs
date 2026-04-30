using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate track point from history
    /// </summary>
    public class GPSGateTrack
    {
        [JsonPropertyName("uTC")]
        public string? UTC { get; set; }

        [JsonPropertyName("position")]
        public GPSGatePosition? Position { get; set; }

        [JsonPropertyName("velocity")]
        public GPSGateVelocity? Velocity { get; set; }

        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("serverUtc")]
        public string? ServerUtc { get; set; }

        [JsonPropertyName("trackInfoId")]
        public int TrackInfoId { get; set; }

        /// <summary>
        /// Variables array containing sensor data - can be strings or objects depending on API version
        /// Using JsonElement to handle both formats flexibly
        /// </summary>
        [JsonPropertyName("variables")]
        [JsonConverter(typeof(GPSGateVariablesConverter))]
        public List<GPSGateVariable>? Variables { get; set; }
    }

    /// <summary>
    /// Custom converter to handle variables that can be:
    /// 1. Object/Dictionary: {"fuel level": 0.0, "ignition": false, ...}
    /// 2. Array of strings: ["Fuel level=123", ...]
    /// 3. Array of objects: [{"name": "...", "value": "..."}, ...]
    /// </summary>
    public class GPSGateVariablesConverter : JsonConverter<List<GPSGateVariable>?>
    {
        public override List<GPSGateVariable>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            var result = new List<GPSGateVariable>();

            // Handle OBJECT format: {"fuel level": 0.0, "ignition": false, ...}
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndObject)
                        break;

                    if (reader.TokenType == JsonTokenType.PropertyName)
                    {
                        var propertyName = reader.GetString();
                        reader.Read(); // Move to value

                        string? valueStr = reader.TokenType switch
                        {
                            JsonTokenType.String => reader.GetString(),
                            JsonTokenType.Number => reader.GetDecimal().ToString(System.Globalization.CultureInfo.InvariantCulture),
                            JsonTokenType.True => "true",
                            JsonTokenType.False => "false",
                            JsonTokenType.Null => null,
                            _ => null
                        };

                        result.Add(new GPSGateVariable
                        {
                            Name = propertyName,
                            Value = valueStr
                        });
                    }
                }
                return result.Count > 0 ? result : null;
            }

            // Handle ARRAY format
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndArray)
                        break;

                    if (reader.TokenType == JsonTokenType.String)
                    {
                        // Format: "VariableName=Value" or just "VariableName"
                        var str = reader.GetString();
                        if (!string.IsNullOrEmpty(str))
                        {
                            var parts = str.Split('=', 2);
                            result.Add(new GPSGateVariable
                            {
                                Name = parts[0].Trim(),
                                Value = parts.Length > 1 ? parts[1].Trim() : null
                            });
                        }
                    }
                    else if (reader.TokenType == JsonTokenType.StartObject)
                    {
                        // Format: { "name": "...", "value": "...", ... }
                        var variable = JsonSerializer.Deserialize<GPSGateVariable>(ref reader, options);
                        if (variable != null)
                            result.Add(variable);
                    }
                }
                return result.Count > 0 ? result : null;
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, List<GPSGateVariable>? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStartArray();
            foreach (var variable in value)
            {
                JsonSerializer.Serialize(writer, variable, options);
            }
            writer.WriteEndArray();
        }
    }
}
