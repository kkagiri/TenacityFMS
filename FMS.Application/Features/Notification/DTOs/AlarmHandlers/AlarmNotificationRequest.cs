namespace FMS.Application.Features.Notification.DTOs {
    public class CreateAlarmNotificationRequest {
        public string AlarmType { get; set; } = null!;
        public int? AlarmId { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; } = "Medium"; //Cursor: Add Priority property
        public string? Message { get; set; }
        public object? Data { get; set; }
        public string? TriggeredBy { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsDeviceId { get; set; } //Cursor: Add PTS device reference
    }
}