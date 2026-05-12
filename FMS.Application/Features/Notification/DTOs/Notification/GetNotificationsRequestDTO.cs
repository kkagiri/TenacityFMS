using System;

namespace FMS.Application.Features.Notification.DTOs {
    public class GetNotificationsRequest {
        public string UserId { get; set; } = null!;
        public string? Type { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; }
        public bool? IsRead { get; set; }
        public int? SiteId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }
}