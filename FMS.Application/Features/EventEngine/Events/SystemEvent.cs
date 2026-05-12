/**
 * File: SystemEvent.cs
 * Purpose: Catch-all event for system-level occurrences that don't have a
 *          dedicated subclass (issue tracker, maintenance, security, generic alerts).
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-11
 *
 * Key Properties:
 * - SubType: further classification within system events
 * - SourceComponent: which system component raised the event
 * - Payload: free-form typed data is carried in base Data dictionary
 */

using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Generic event for system-level notifications: issue tracker updates,
    /// maintenance due, security alerts, scheduled report delivery, etc.
    /// Use typed subclasses when the event warrants specific evaluator logic.
    /// </summary>
    public class SystemEvent : FMSEvent
    {
        public const string EventTypeName = "System";

        /// <summary>
        /// Further classification: "IssueCreated", "MaintenanceDue", "SecurityBreach",
        /// "ScheduledReport", "BackupComplete", etc.
        /// </summary>
        public string SubType { get; set; } = string.Empty;

        /// <summary>
        /// Which component raised this event (e.g., "IssueTracker", "Scheduler", "SecurityModule").
        /// </summary>
        public string SourceComponent { get; set; } = string.Empty;

        /// <summary>
        /// Optional reference ID linking to the source record (issue ID, report ID, etc.)
        /// </summary>
        public int? ReferenceId { get; set; }

        /// <summary>
        /// Optional reference type for the linked record.
        /// </summary>
        public string? ReferenceType { get; set; }

        public SystemEvent()
        {
            EventType = EventTypeName;
            EventCategory = "SystemMaintenance";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["SubType"] = SubType;
            vars["SourceComponent"] = SourceComponent;
            vars["ReferenceId"] = ReferenceId?.ToString() ?? "";
            vars["ReferenceType"] = ReferenceType ?? "";
            return vars;
        }
    }
}
