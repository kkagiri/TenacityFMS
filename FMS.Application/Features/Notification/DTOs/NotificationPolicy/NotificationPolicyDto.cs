/**
 * File: NotificationPolicyDto.cs
 * Purpose: Defines DTO fields returned for notification policy views and details.
 * Dependencies: System
 * Last Modified: 2026-02-04
 *
 * Key Classes:
 * - NotificationPolicyDto: Lightweight model for notification policy responses.
 */
using System;

namespace FMS.Application.Features.Notification.DTOs
{
    /// <summary>
    /// Lightweight DTO for listing notification policies.
    /// </summary>
    public class NotificationPolicyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int NotificationCategoryId { get; set; }
        public string? CategoryName { get; set; }
        /// <summary>
        /// The alert type key (e.g. "TankLowLevel") — 1:1 link to AlertConfigurationConstants
        /// </summary>
        public string? AlertTypeKey { get; set; }
        /// <summary>
        /// The alert group derived from AlertTypeKey (e.g. "Tank Operations")
        /// </summary>
        public string? AlertGroup { get; set; }
        /// <summary>
        /// Human-readable display name of the alert type
        /// </summary>
        public string? AlertDisplayName { get; set; }
        public string NotificationType { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public bool EnableEmail { get; set; }
        public bool EnableSms { get; set; }
        public bool EnableSystem { get; set; }
        public int MaxNotificationsPerHour { get; set; }
        public int MaxNotificationsPerDay { get; set; }
        public int CooldownMinutes { get; set; }
        public bool RequireAcknowledgment { get; set; }
        public bool IsActive { get; set; }
        /// <summary>
        /// Active alarm filter definition in JSON format.
        /// Mapped from NotificationPolicy.TriggerConditions.
        /// </summary>
        public string? ActiveAlarmFilter { get; set; }
        public DateTime CreatedAt { get; set; }
        /// <summary>
        /// Creator display name (username). Backend now maps navigation UserName instead of raw id.
        /// </summary>
        public string? CreatedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
        /// <summary>
        /// Last modifier display name (username). Added to support showing name without extra frontend calls.
        /// </summary>
        public string? ModifiedBy { get; set; }
        /// <summary>
        /// Title/subject template with {{placeholders}}.
        /// </summary>
        public string? TitleTemplate { get; set; }

        /// <summary>
        /// Message body template with {{placeholders}}.
        /// </summary>
        public string? MessageTemplate { get; set; }

        public int RecipientCount { get; set; }
        public int GroupCount { get; set; }
        public int NotificationCount { get; set; }
        public DateTime? LastTriggered { get; set; }

        /// <summary>
        /// Dynamic recipient routing rules JSON (from NotificationPolicy.RecipientRules)
        /// </summary>
        public string? RecipientRules { get; set; }

        /// <summary>
        /// Static policy recipients (user IDs) loaded from notification_policy_recipient table.
        /// Used by the EventExpression form to populate the recipient picker on edit.
        /// </summary>
        public System.Collections.Generic.List<PolicyRecipientItemDto>? Recipients { get; set; }
    }

    /// <summary>
    /// Lightweight DTO for an individual policy recipient.
    /// </summary>
    public class PolicyRecipientItemDto
    {
        public string UserId { get; set; } = null!;
        public string? DeliveryMethods { get; set; }
        public bool IsActive { get; set; }
    }
}
