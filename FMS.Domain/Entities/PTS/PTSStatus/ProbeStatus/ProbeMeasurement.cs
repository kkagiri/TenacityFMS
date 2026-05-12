using System;
using System.Linq;
using Newtonsoft.Json;

namespace FMS.Domain.Entities.PTS.PTSStatus.ProbeStatus
{
    [JsonConverter(typeof(ProbeMeasurementConverter))]
    public class ProbeMeasurement
    {
        public int ProbeNumber { get; set; }
        public float? ProductHeight { get; set; }
        public float? WaterHeight { get; set; }
        public float? Temperature { get; set; }
        public float? ProductVolume { get; set; }
        public float? WaterVolume { get; set; }
        public float? ProductUllage { get; set; }
        public float? ProductTemperatureCompensatedVolume { get; set; }
        public float? ProductDensity { get; set; }
        public float? ProductMass { get; set; }
        public int? TankFillingPercentage { get; set; }

        public ProbeMeasurement()
        {
            // Parameterless constructor for JSON deserialization
        }

        public ProbeMeasurement(float[] measurements)
        {
            if (measurements.Length >= 11)
            {
                ProbeNumber = (int)measurements[0];
                ProductHeight = measurements[1];
                WaterHeight = measurements[2];
                Temperature = measurements[3];
                ProductVolume = measurements[4];
                WaterVolume = measurements[5];
                ProductUllage = measurements[6];
                ProductTemperatureCompensatedVolume = measurements[7];
                ProductDensity = measurements[8];
                ProductMass = measurements[9];
                TankFillingPercentage = (int)measurements[10];
            }
        }
    }

    /// <summary>
    /// Custom JSON converter to deserialize float arrays into ProbeMeasurement objects
    /// </summary>
    public class ProbeMeasurementConverter : JsonConverter<ProbeMeasurement>
    {
        public override ProbeMeasurement ReadJson(JsonReader reader, Type objectType, ProbeMeasurement existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.StartArray)
            {
                // Deserialize as nullable float array to handle null values in the JSON
                var measurements = serializer.Deserialize<float?[]>(reader);
                if (measurements != null)
                {
                    // Convert nullable floats to non-nullable, using 0 as default for nulls
                    var nonNullableMeasurements = measurements.Select(m => m ?? 0f).ToArray();
                    return new ProbeMeasurement(nonNullableMeasurements);
                }
                return new ProbeMeasurement();
            }
            else if (reader.TokenType == JsonToken.StartObject)
            {
                // Support object deserialization as well
                var measurement = new ProbeMeasurement();
                serializer.Populate(reader, measurement);
                return measurement;
            }

            return new ProbeMeasurement();
        }

        public override void WriteJson(JsonWriter writer, ProbeMeasurement value, JsonSerializer serializer)
        {
            // Write as object (property names)
            writer.WriteStartObject();
            writer.WritePropertyName("ProbeNumber");
            writer.WriteValue(value.ProbeNumber);
            writer.WritePropertyName("ProductHeight");
            writer.WriteValue(value.ProductHeight);
            writer.WritePropertyName("WaterHeight");
            writer.WriteValue(value.WaterHeight);
            writer.WritePropertyName("Temperature");
            writer.WriteValue(value.Temperature);
            writer.WritePropertyName("ProductVolume");
            writer.WriteValue(value.ProductVolume);
            writer.WritePropertyName("WaterVolume");
            writer.WriteValue(value.WaterVolume);
            writer.WritePropertyName("ProductUllage");
            writer.WriteValue(value.ProductUllage);
            writer.WritePropertyName("ProductTemperatureCompensatedVolume");
            writer.WriteValue(value.ProductTemperatureCompensatedVolume);
            writer.WritePropertyName("ProductDensity");
            writer.WriteValue(value.ProductDensity);
            writer.WritePropertyName("ProductMass");
            writer.WriteValue(value.ProductMass);
            writer.WritePropertyName("TankFillingPercentage");
            writer.WriteValue(value.TankFillingPercentage);
            writer.WriteEndObject();
        }
    }
}