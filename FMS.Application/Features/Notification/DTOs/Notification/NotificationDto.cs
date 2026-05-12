using System;

namespace FMS.Application.Features.Notification.DTOs
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public string NotificationId { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string? Data { get; set; }
        public string Category { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? Link { get; set; }
        public string? LinkLabel { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = null!;
        public string? SiteName { get; set; }
        public string? TankName { get; set; }
        public string? VehicleName { get; set; }
        public string? PtsDeviceName { get; set; } //Cursor: Add PTS device name
        public bool IsRead { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
    }
}