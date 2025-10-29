using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FMS.Infrastructure.VehicleTracking.Models.GPSGate
{
    /// <summary>
    /// GPSGate event model
    /// </summary>
    public class GPSGateEvent
    {
        [JsonPropertyName("applicationId")]
        public int ApplicationId { get; set; }

        [JsonPropertyName("boundingBox")]
        public GPSGateBoundingBox? BoundingBox { get; set; }

        [JsonPropertyName("closed")]
        public bool Closed { get; set; }

        [JsonPropertyName("closedByUser")]
        public string? ClosedByUser { get; set; }

        [JsonPropertyName("closedTimeStamp")]
        public string ClosedTimeStamp { get; set; } = string.Empty;

        [JsonPropertyName("comment")]
        public string? Comment { get; set; }

        [JsonPropertyName("endPosition")]
        public GPSGatePosition3D? EndPosition { get; set; }

        [JsonPropertyName("eventStage")]
        public int EventStage { get; set; }

        [JsonPropertyName("expressionEvaluatorId")]
        public int ExpressionEvaluatorId { get; set; }

        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("ongoing")]
        public bool Ongoing { get; set; }

        [JsonPropertyName("ruleName")]
        public string? RuleName { get; set; }

        [JsonPropertyName("startPosition")]
        public GPSGatePosition3D? StartPosition { get; set; }

        [JsonPropertyName("supportUi")]
        public bool SupportUi { get; set; }

        [JsonPropertyName("userId")]
        public int UserId { get; set; }
    }
}
