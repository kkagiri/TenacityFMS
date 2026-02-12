/**
 * File: UpdateEventExpressionRequest.cs
 * Purpose: DTO for updating an existing EventExpression via API.
 * Dependencies: None
 * Last Modified: 2026-02-11
 */

namespace FMS.Application.Features.EventEngine.DTOs
{
    /// <summary>
    /// Request body for updating an existing EventExpression.
    /// </summary>
    public class UpdateEventExpressionRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string EventType { get; set; } = string.Empty;
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public int? DeviceId { get; set; }
        public string? MinimumSeverity { get; set; }
        public string? Conditions { get; set; }
        public int NotificationPolicyId { get; set; }
        public bool CreateIssueTracker { get; set; } = false;
        public int? IssueCategory { get; set; }
        public int? IssuePriority { get; set; }
        public string? AssignIssueTo { get; set; }
        public int CooldownMinutes { get; set; } = 30;
        public int MaxNotificationsPerDay { get; set; } = 0;
        public bool EnableEscalation { get; set; } = false;
        public string? EscalationRules { get; set; }
        public string? MessageTemplate { get; set; }
        public string Priority { get; set; } = "Medium";
        public bool CreateActiveEvent { get; set; } = true;
    }
}
