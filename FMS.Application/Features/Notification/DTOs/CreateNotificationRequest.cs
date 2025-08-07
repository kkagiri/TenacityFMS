using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs {
    public class CreateNotificationRequest {
        public string? NotificationId { get; set; }
        public string Type { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? Priority { get; set; }
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

        // ✅ Optional - will be dynamically resolved if not provided
        public List<CreateNotificationRecipientRequest> ? Recipients { get; set; }
    }

    public class CreateNotificationRecipientRequest {
        public string UserId { get; set; } = null!;
        public List<string> DeliveryMethods { get; set; } = new ();
        public string? PriorityOverride { get; set; }
    }
}