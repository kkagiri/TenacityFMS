/**
 * File: EventExpressionDto.cs
 * Purpose: DTO returned by API for EventExpression read operations.
 * Dependencies: None
 * Last Modified: 2026-02-11
 */

using System;

namespace FMS.Application.Features.EventEngine.DTOs
{
    /// <summary>
    /// DTO for EventExpression read responses.
    /// </summary>
    public class EventExpressionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsSystem { get; set; }
        public string EventType { get; set; } = string.Empty;
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public int? DeviceId { get; set; }
        public string? MinimumSeverity { get; set; }
        public string? Conditions { get; set; }
        public int NotificationPolicyId { get; set; }
        public string? PolicyName { get; set; }
        public bool CreateIssueTracker { get; set; }
        public int? IssueCategory { get; set; }
        public int? IssuePriority { get; set; }
        public string? AssignIssueTo { get; set; }
        public int CooldownMinutes { get; set; }
        public int MaxNotificationsPerDay { get; set; }
        public bool EnableEscalation { get; set; }
        public string? EscalationRules { get; set; }
        public string? MessageTemplate { get; set; }
        public string Priority { get; set; } = "Medium";
        public bool CreateActiveEvent { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
        public int TriggerCount { get; set; }
        public DateTime? LastTriggeredAt { get; set; }
    }
}
