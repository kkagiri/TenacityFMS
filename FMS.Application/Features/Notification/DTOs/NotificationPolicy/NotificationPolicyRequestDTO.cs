namespace FMS.Application.Features.Notification.DTOs {
    public class CreateNotificationPolicyRequestDTO {
        public string Name { get; set; } = null!;
        public int NotificationCategoryId { get; set; }
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
        public string CreatedBy { get; set; } = null!;
    }
}