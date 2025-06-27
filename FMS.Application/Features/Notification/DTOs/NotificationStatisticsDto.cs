using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs {
    public class NotificationStatisticsDto {
        /// <summary>
        /// Total number of notifications
        /// </summary>
        public int TotalNotifications { get; set; }

        /// <summary>
        /// Number of read notifications
        /// </summary>
        public int ReadNotifications { get; set; }

        /// <summary>
        /// Number of unread notifications
        /// </summary>
        public int UnreadNotifications { get; set; }

        /// <summary>
        /// Breakdown by priority
        /// </summary>
        public Dictionary<string, int> PriorityBreakdown { get; set; } = new Dictionary<string, int> ();

        /// <summary>
        /// Breakdown by category
        /// </summary>
        public Dictionary<string, int> CategoryBreakdown { get; set; } = new Dictionary<string, int> ();

        /// <summary>
        /// Breakdown by type
        /// </summary>
        public Dictionary<string, int> TypeBreakdown { get; set; } = new Dictionary<string, int> ();

        /// <summary>
        /// Daily statistics
        /// </summary>
        public List<DailyNotificationStatDto> DailyStatistics { get; set; } = new List<DailyNotificationStatDto> ();

        /// <summary>
        /// Recent notifications
        /// </summary>
        public List<RecentNotificationDto> RecentNotifications { get; set; } = new List<RecentNotificationDto> ();

        /// <summary>
        /// Date range start
        /// </summary>
        public DateTime FromDate { get; set; }

        /// <summary>
        /// Date range end
        /// </summary>
        public DateTime ToDate { get; set; }

        /// <summary>
        /// When statistics were generated
        /// </summary>
        public DateTime GeneratedAt { get; set; }
    }

    /// <summary>
    /// Daily notification statistics
    /// </summary>
    public class DailyNotificationStatDto {
        /// <summary>
        /// Date
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Formatted date string
        /// </summary>
        public string DateString { get; set; } = string.Empty;

        /// <summary>
        /// Total count for the day
        /// </summary>
        public int Count { get; set; }

        /// <summary>
        /// Read count for the day
        /// </summary>
        public int ReadCount { get; set; }

        /// <summary>
        /// Unread count for the day
        /// </summary>
        public int UnreadCount { get; set; }
    }

    /// <summary>
    /// Recent notification DTO
    /// </summary>
    public class RecentNotificationDto {
        /// <summary>
        /// Notification ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Unique notification identifier
        /// </summary>
        public string NotificationId { get; set; } = string.Empty;

        /// <summary>
        /// Notification type
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Notification category
        /// </summary>
        public string Category { get; set; } = string.Empty;

        /// <summary>
        /// Priority level
        /// </summary>
        public string Priority { get; set; } = string.Empty;

        /// <summary>
        /// Notification title
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Notification message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// When notification was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Notification status
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Associated site name
        /// </summary>
        public string? SiteName { get; set; }

        /// <summary>
        /// Associated tank name
        /// </summary>
        public string? TankName { get; set; }

        /// <summary>
        /// Associated vehicle name
        /// </summary>
        public string? VehicleName { get; set; }

        /// <summary>
        /// Associated PTS device name
        /// </summary>
        public string? PtsDeviceName { get; set; } //Cursor: Add PTS device name

        /// <summary>
        /// Whether notification is read
        /// </summary>
        public bool IsRead { get; set; }
    }

    public class GetNotificationStatisticsRequest {
        /// <summary>
        /// User ID to get statistics for
        /// </summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Start date for statistics (optional, defaults to 30 days ago)
        /// </summary>
        public DateTime? FromDate { get; set; } = DateTime.UtcNow.AddDays (-30);

        /// <summary>
        /// End date for statistics (optional, defaults to now)
        /// </summary>
        public DateTime? ToDate { get; set; }

        /// <summary>
        /// Number of recent notifications to include (optional, defaults to 10)
        /// </summary>
        public int? RecentCount { get; set; }

        /// <summary>
        /// Include daily breakdown
        /// </summary>
        public bool IncludeDailyBreakdown { get; set; } = true;

        /// <summary>
        /// Include recent notifications
        /// </summary>
        public bool IncludeRecentNotifications { get; set; } = true;
    }
}