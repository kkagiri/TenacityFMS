/**
 * File: NotificationPolicyRequestDTO.cs
 * Purpose: Defines request payloads used to create notification policies.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - CreateNotificationPolicyRequestDTO: Carries policy settings from API to application layer.
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs
{
    public class CreateNotificationPolicyRequestDTO
    {
        public string Name { get; set; } = null!;
        public int NotificationCategoryId { get; set; }
        /// <summary>
        /// The alert type key from AlertConfigurationConstants (e.g. "TankLowLevel").
        /// Links policy 1:1 with an alert type. Used to auto-derive the category group.
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
        public string? CreatedBy { get; set; }

        /// <summary>
        /// Static recipient user IDs to save to notification_policy_recipient table.
        /// These users always receive notifications from this policy regardless of site context.
        /// </summary>
        public List<string>? RecipientUserIds { get; set; }

        /// <summary>
        /// Dynamic recipient routing rules in JSON format.
        /// Stored in NotificationPolicy.RecipientRules column.
        /// Example: {"dynamicRules":[{"type":"SiteUsers","enabled":true},{"type":"SiteAdmin","enabled":true}]}
        /// </summary>
        public string? RecipientRules { get; set; }
    }
}
