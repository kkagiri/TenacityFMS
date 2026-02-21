/**
 * File: TagMonitoringEvent.cs
 * Purpose: Event emitted by GPSGateTagMonitoringService when vehicle tag updates
 *          succeed or fail. Replaces direct CreateNotificationAsync calls.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-18
 *
 * Key Properties:
 * - SubType: "TagUpdateSuccess" or "TagUpdateError"
 * - VehicleId/VehicleName: which vehicle was affected
 * - TagName: the tag that was being assigned
 * - Location: the GPS location that triggered the tag change
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by GPSGateTagMonitoringService when a vehicle tag update
    /// succeeds or fails. Processed by the Event Expression Engine with
    /// cooldown and severity routing.
    /// </summary>
    public class TagMonitoringEvent : FMSEvent
    {
        public const string EventTypeName = "TagMonitoring";

        public const string SubTypeTagUpdateSuccess = "TagUpdateSuccess";
        public const string SubTypeTagUpdateError = "TagUpdateError";

        /// <summary>Further classification of the tag monitoring event.</summary>
        public string SubType { get; set; } = string.Empty;

        /// <summary>Vehicle ID.</summary>
        public int VehicleId { get; set; }

        /// <summary>Vehicle number/name for display.</summary>
        public string VehicleName { get; set; } = string.Empty;

        /// <summary>The tag that was assigned or attempted.</summary>
        public string TagName { get; set; } = string.Empty;

        /// <summary>GPS location name that triggered the tag change.</summary>
        public string Location { get; set; } = string.Empty;

        /// <summary>Error message (for error events).</summary>
        public string ErrorMessage { get; set; } = string.Empty;

        public TagMonitoringEvent()
        {
            EventType = EventTypeName;
            EventCategory = "VehicleMonitoring";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["SubType"] = SubType;
            vars["VehicleId"] = VehicleId.ToString();
            vars["VehicleName"] = VehicleName;
            vars["TagName"] = TagName;
            vars["Location"] = Location;
            vars["ErrorMessage"] = ErrorMessage;
            return vars;
        }
    }
}
