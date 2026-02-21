/**
 * File: IssueTrackerEvent.cs
 * Purpose: Event emitted when an issue is auto-created, assigned, escalated, or overdue
 *          in the issue tracking system. Replaces direct CreateNotificationAsync calls
 *          in IssueMonitoringService.
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-02-18
 *
 * Key Properties:
 * - SubType: classifies the issue event (IssueCreated, IssueEscalated, etc.)
 * - IssueId: the affected issue
 * - IssuePriority: priority name for routing / display
 * - RelatedEntityType: "vehicle", "pts", etc.
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events
{
    /// <summary>
    /// Emitted by IssueMonitoringService (auto-created issues) and future
    /// issue lifecycle handlers (escalation, overdue, resolution).
    /// Processed by the Event Engine with cooldown, severity routing, and
    /// configurable recipients per EventExpression.
    /// </summary>
    public class IssueTrackerEvent : FMSEvent
    {
        public const string EventTypeName = "IssueTracker";

        // Sub-type constants
        public const string SubTypeIssueCreated = "IssueCreated";
        public const string SubTypeIssueUpdated = "IssueUpdated";
        public const string SubTypeIssueEscalated = "IssueEscalated";
        public const string SubTypeIssueOverdue = "IssueOverdue";

        /// <summary>Further classification of the issue event.</summary>
        public string SubType { get; set; } = string.Empty;

        /// <summary>The issue ID.</summary>
        public int IssueId { get; set; }

        /// <summary>Issue title.</summary>
        public string IssueTitle { get; set; } = string.Empty;

        /// <summary>Issue description.</summary>
        public string IssueDescription { get; set; } = string.Empty;

        /// <summary>Priority label (e.g. "High", "Critical").</summary>
        public string IssuePriority { get; set; } = string.Empty;

        /// <summary>Category label.</summary>
        public string IssueCategory { get; set; } = string.Empty;

        /// <summary>Related entity type: "vehicle", "pts", etc.</summary>
        public string RelatedEntityType { get; set; } = string.Empty;

        /// <summary>Vehicle name (when issue relates to a vehicle).</summary>
        public string VehicleName { get; set; } = string.Empty;

        /// <summary>Site name for display.</summary>
        public string SiteName { get; set; } = string.Empty;

        /// <summary>Comma-separated list of assigned user names.</summary>
        public string AssignedTo { get; set; } = string.Empty;

        /// <summary>Direct URL to view the issue in the frontend.</summary>
        public string IssueUrl { get; set; } = string.Empty;

        /// <summary>Direct URL to respond to the assignment.</summary>
        public string ResponseUrl { get; set; } = string.Empty;

        /// <summary>Pre-built HTML email body (built by IssueMonitoringService).</summary>
        public string EmailBodyHtml { get; set; } = string.Empty;

        /// <summary>When the issue was opened.</summary>
        public DateTime? OpenedAt { get; set; }

        public IssueTrackerEvent()
        {
            EventType = EventTypeName;
            EventCategory = "IssueTracker";
        }

        public override Dictionary<string, string> GetTemplateVariables()
        {
            var vars = base.GetTemplateVariables();
            vars["SubType"] = SubType;
            vars["IssueId"] = IssueId.ToString();
            vars["IssueTitle"] = IssueTitle;
            vars["IssueDescription"] = IssueDescription;
            vars["IssuePriority"] = IssuePriority;
            vars["IssueCategory"] = IssueCategory;
            vars["RelatedEntityType"] = RelatedEntityType;
            vars["VehicleName"] = VehicleName;
            vars["SiteName"] = SiteName;
            vars["AssignedTo"] = AssignedTo;
            vars["IssueUrl"] = IssueUrl;
            vars["ResponseUrl"] = ResponseUrl;
            vars["OpenedAt"] = OpenedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
            return vars;
        }
    }
}
