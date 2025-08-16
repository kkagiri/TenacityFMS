using System;

namespace FMS.Application.Features.Notification.DTOs {
    /// <summary>
    /// Lightweight DTO for listing notification policies.
    /// </summary>
    public class NotificationPolicyDto {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int NotificationCategoryId { get; set; }
        public string? CategoryName { get; set; }
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
        public int RecipientCount { get; set; }
        public int GroupCount { get; set; }
        public int NotificationCount { get; set; }
        public DateTime? LastTriggered { get; set; }
    }
}
