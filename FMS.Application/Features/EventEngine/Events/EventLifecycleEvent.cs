/**
 * File: EventLifecycleEvent.cs
 * Purpose: Event emitted when an ActiveEvent changes state
 *          (Acknowledged, Resolved, Escalated, AutoResolved).
 *          Enables notifications on lifecycle transitions.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - ActiveEventId: FK to the ActiveEvent being transitioned
 * - ActionType: Acknowledged, Resolved, Escalated, AutoResolved
 * - OriginalEventType: the EventType of the original event
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted when an ActiveEvent transitions state.
    /// Replaces ActiveAlarmService.CreateAlarmNotificationAsync("Acknowledged") etc.
    /// Referenced in TASKLIST B2.12.
    /// </summary>
    public class EventLifecycleEvent : FMSEvent
    {
        public const string EventTypeName = "EventLifecycle";

        /// <summary>
        /// The ID of the ActiveEvent that changed state.
        /// </summary>
        public int ActiveEventId { get; set; }

        /// <summary>
        /// Lifecycle action: "Acknowledged", "Resolved", "Escalated", "AutoResolved".
        /// </summary>
        public string ActionType { get; set; } = string.Empty;

        /// <summary>
        /// The EventType of the original event (e.g., "TankLevel", "DeviceStatus").
        /// </summary>
        public string OriginalEventType { get; set; } = string.Empty;

        /// <summary>
        /// Who performed the action. Same as TriggeredBy but explicit.
        /// </summary>
        public string ActionBy { get; set; } = string.Empty;

        /// <summary>
        /// Optional notes (e.g., resolution notes).
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Current escalation level after the action.
        /// </summary>
        public int EscalationLevel { get; set; }

        public EventLifecycleEvent()
        {
            EventType = EventTypeName;
            EventCategory = "SystemMaintenance";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["ActiveEventId"] = ActiveEventId.ToString();
            vars["ActionType"] = ActionType;
            vars["OriginalEventType"] = OriginalEventType;
            vars["ActionBy"] = ActionBy;
            vars["Notes"] = Notes ?? "";
            vars["EscalationLevel"] = EscalationLevel.ToString();
            return vars;
        }
    }
}
