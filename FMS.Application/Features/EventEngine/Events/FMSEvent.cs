/**
 * File: FMSEvent.cs
 * Purpose: Abstract base class for all events in the FMS Event Expression Engine.
 *          Every business operation emits a typed FMSEvent subclass.
 *          The engine matches events against EventExpressions to trigger notifications.
 * Dependencies: None (pure domain concept)
 * Last Modified: 2026-02-11
 *
 * Key Members:
 * - EventType: string key used to match against EventExpression records
 * - EventCategory: grouping label matching notification_categories
 * - GetTemplateVariables(): builds {{placeholder}} dictionary for notification templates
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Abstract base class for all events in the FMS notification system.
    /// Business code creates typed subclasses and passes them to IEventExpressionEngine.ProcessAsync().
    /// </summary>
    public abstract class FMSEvent
    {
        /// <summary>
        /// Unique string key identifying the event type (e.g., "TankStockDiscrepancy", "DeviceOffline").
        /// Must match EventExpression.EventType for the expression to trigger.
        /// </summary>
        public string EventType { get; set; } = string.Empty;

        /// <summary>
        /// Grouping label that maps to the notification_categories table.
        /// Used for user subscription preferences and dashboard filtering.
        /// </summary>
        public string EventCategory { get; set; } = string.Empty;

        /// <summary>
        /// When the event occurred. Defaults to UTC now.
        /// </summary>
        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Event severity: Low, Medium, High, Critical.
        /// EventExpressions can filter by MinimumSeverity.
        /// </summary>
        public string Severity { get; set; } = "Medium";

        /// <summary>
        /// Site scope filter. Null = system-wide event.
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank scope filter. Null = not tank-specific.
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device (ATG/PTS controller) scope filter. Null = not device-specific.
        /// </summary>
        public int? DeviceId { get; set; }

        /// <summary>
        /// PTS device identifier string (for PTS protocol events).
        /// </summary>
        public string? PtsDeviceId { get; set; }

        /// <summary>
        /// Who/what triggered the event. User login name or "System" for automated.
        /// </summary>
        public string TriggeredBy { get; set; } = "System";

        /// <summary>
        /// Human-readable summary of the event for notification messages.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Flexible key-value bag for data that doesn't have a typed property.
        /// Serialized to JSON for storage in EventData columns.
        /// </summary>
        public Dictionary<string, object> Data { get; set; } = new();

        /// <summary>
        /// Build template variables for notification message rendering.
        /// Keys become {{placeholders}} in notification title/message templates.
        /// Override in subclasses to add typed properties.
        /// </summary>
        public virtual Dictionary<string, string> GetTemplateVariables()
        {
            var vars = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["EventType"] = EventType,
                ["EventCategory"] = EventCategory,
                ["Severity"] = Severity,
                ["OccurredAt"] = OccurredAt.ToString("yyyy-MM-dd HH:mm:ss"),
                ["TriggeredBy"] = TriggeredBy,
                ["Message"] = Message,
                ["SiteId"] = SiteId?.ToString() ?? "",
                ["TankId"] = TankId?.ToString() ?? "",
                ["DeviceId"] = DeviceId?.ToString() ?? ""
            };

            // Add any Data dictionary entries as template variables
            foreach (var kvp in Data)
            {
                vars[kvp.Key] = kvp.Value?.ToString() ?? "";
            }

            return vars;
        }
    }
}
