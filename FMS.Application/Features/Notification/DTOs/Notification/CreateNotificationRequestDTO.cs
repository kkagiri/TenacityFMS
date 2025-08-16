using System;
using System.Collections.Generic;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;

namespace FMS.Application.Features.Notification.DTOs {
    public class CreateNotificationRequest {
        public string? NotificationId { get; set; }
        public NotificationType Type { get; set; }
        public int CategoryId { get; set; } // Changed to use category ID
        public NotificationPriority? Priority { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public object? Data { get; set; }
        public string TriggerSource { get; set; } = null!;
        public string? TriggeredBy { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsDeviceId { get; set; } //Cursor: Add PTS device reference
        public int? IssueTrackerId { get; set; }
        public int? AlarmId { get; set; }
        public int? NotificationPolicyId { get; set; }

        public List<NotificationRecipientDto> ? Recipients { get; set; }

        /// <summary>
        /// Suppresses resolver fallback that would broadcast to all active users when no recipients are resolved.
        /// Set true to avoid unintended global notifications.
        /// Default: false (retain legacy fallback).
        /// </summary>
        public bool DisableFallbackAllUsers { get; set; } = false;
    }

}