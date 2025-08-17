namespace FMS.Application.Features.Notification.DTOs.AlarmHandlers {
    /// <summary>
    /// Request DTO for updating an alarm handler
    /// </summary>
    public class UpdateAlarmHandlerRequestDto {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
        public object? TriggerConfig { get; set; }
        public string? Priority { get; set; }
        public int? CooldownMinutes { get; set; }
        public int? MaxNotificationsPerDay { get; set; }
    }
}