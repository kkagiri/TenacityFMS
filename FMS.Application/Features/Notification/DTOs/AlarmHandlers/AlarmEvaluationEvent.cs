using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.AlarmHandlers {
    /// <summary>
    /// Generic event passed to the alarm handler evaluation engine.
    /// Provide the contextual identifiers plus a flexible data bag for condition evaluation.
    /// </summary>
    public class AlarmEvaluationEvent {
        public string AlarmType { get; set; } = string.Empty;
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public int? DeviceId { get; set; }
        public string? PtsDeviceId { get; set; }
        public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
        /// <summary>
        /// Arbitrary telemetry / attributes (numbers, strings, bools) used by trigger condition evaluation.
        /// </summary>
        public Dictionary<string, object?> Data { get; set; } = new (StringComparer.OrdinalIgnoreCase);
    }
}