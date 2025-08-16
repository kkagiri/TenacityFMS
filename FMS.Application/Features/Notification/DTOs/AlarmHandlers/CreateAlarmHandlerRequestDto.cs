using System;

namespace FMS.Application.Features.Notification.DTOs.AlarmHandlers {
    /// <summary>
    /// Request DTO for creating an alarm handler (trigger)
    /// </summary>
    public class CreateAlarmHandlerRequestDto {
        public int NotificationPolicyId { get; set; }
        public string AlarmType { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Description { get; set; }
        public object? TriggerConfig { get; set; }
        public bool IsActive { get; set; } = true;
        public string Priority { get; set; } = "Medium";
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public int? DeviceId { get; set; }
        public int CooldownMinutes { get; set; } = 0; // 0 means inherit from policy defaults
        public int MaxNotificationsPerDay { get; set; } = 0; // 0 means inherit from policy defaults
    }
}