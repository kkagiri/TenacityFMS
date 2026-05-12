/**
 * File: UpdateNotificationPolicyRequestDTO.cs
 * Purpose: Defines request payload used to update notification policies.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - UpdateNotificationPolicyRequestDTO: Carries mutable policy settings from API to application layer.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class UpdateNotificationPolicyRequestDTO
    {
        public string Name { get; set; } = null!;
        public int NotificationCategoryId { get; set; }
        /// <summary>
        /// The alert type key from AlertConfigurationConstants (e.g. "TankLowLevel").
        /// Links policy 1:1 with an alert type.
        /// </summary>
        public string? AlertTypeKey { get; set; }
        public string? NotificationType { get; set; }
        public string? Priority { get; set; }
        public bool EnableEmail { get; set; } = true;
        public bool EnableSms { get; set; } = false;
        public bool EnableSystem { get; set; } = true;
        public int? MaxNotificationsPerHour { get; set; }
        public int? MaxNotificationsPerDay { get; set; }
        public int? CooldownMinutes { get; set; }
        public string? TitleTemplate { get; set; }
        public string? MessageTemplate { get; set; }
        public bool RequireAcknowledgment { get; set; } = false;
        /// <summary>
        /// Active alarm filter definition in JSON format.
        /// Stored in NotificationPolicy.TriggerConditions for backward compatibility.
        /// </summary>
        public string? ActiveAlarmFilter { get; set; }
        public bool IsActive { get; set; } = true;
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// Static recipient user IDs. Replaces all existing notification_policy_recipient rows.
        /// Pass null to leave recipients unchanged; pass empty list to clear all recipients.
        /// </summary>
        public List<string>? RecipientUserIds { get; set; }

        /// <summary>
        /// Dynamic recipient routing rules in JSON format.
        /// Pass null to leave unchanged; pass empty string to clear.
        /// </summary>
        public string? RecipientRules { get; set; }
    }
}
