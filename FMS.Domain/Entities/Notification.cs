using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Core notification entity that tracks all notifications sent through the system
    /// </summary>
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Unique identifier for tracking notifications
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string NotificationId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Type of notification (Alert, Info, Warning, Error, System)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = null!;

        /// <summary>
        /// Category for grouping notifications (Tank, Pump, Vehicle, System, User, etc.)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = null!;

        /// <summary>
        /// Priority level (Low, Medium, High, Critical)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// Title/Subject of the notification
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = null!;

        /// <summary>
        /// Main message content
        /// </summary>
        [Required]
        [Column(TypeName = "text")]
        public string Message { get; set; } = null!;

        /// <summary>
        /// Additional data in JSON format
        /// </summary>
        [Column(TypeName = "json")]
        public string? Data { get; set; }

        /// <summary>
        /// How the notification was triggered (Manual, Scheduled, Alarm, System, API)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string TriggerSource { get; set; } = null!;

        /// <summary>
        /// ID of the user who triggered the notification (if applicable)
        /// </summary>
        [MaxLength(100)]
        public string? TriggeredBy { get; set; }

        /// <summary>
        /// When the notification was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the notification should be sent (for scheduled notifications)
        /// </summary>
        public DateTime? ScheduledAt { get; set; }

        /// <summary>
        /// When the notification was actually sent
        /// </summary>
        public DateTime? SentAt { get; set; }

        /// <summary>
        /// Current status (Pending, Sent, Failed, Cancelled)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// Number of send attempts
        /// </summary>
        public int SendAttempts { get; set; } = 0;

        /// <summary>
        /// Error message if sending failed
        /// </summary>
        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Site ID if notification is site-specific
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Device ID if notification is device-specific
        /// </summary>
        public int? DeviceId { get; set; }

        /// <summary>
        /// Tank ID if notification is tank-specific
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Vehicle ID if notification is vehicle-specific
        /// </summary>
        public int? VehicleId { get; set; }

        /// <summary>
        /// Issue tracker ID if related to an issue
        /// </summary>
        public int? IssueTrackerId { get; set; }

        /// <summary>
        /// Alarm ID if triggered by an alarm
        /// </summary>
        public int? AlarmId { get; set; }

        /// <summary>
        /// Notification policy ID that governs this notification
        /// </summary>
        public int? NotificationPolicyId { get; set; }

        /// <summary>
        /// Whether this notification has been read by admin
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// When the notification was marked as read
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Whether this notification is archived
        /// </summary>
        public bool IsArchived { get; set; } = false;

        /// <summary>
        /// When the notification was archived
        /// </summary>
        public DateTime? ArchivedAt { get; set; }

        // Navigation Properties
        public virtual Site? Site { get; set; }
        public virtual Device? Device { get; set; }
        public virtual Tank? Tank { get; set; }
        public virtual Vehicle? Vehicle { get; set; }
        public virtual Issuetracker? IssueTracker { get; set; }
        public virtual Alarm? Alarm { get; set; }
        public virtual NotificationPolicy? NotificationPolicy { get; set; }
        public virtual User? TriggeredByNavigation { get; set; }

        // Recipients collection
        public virtual ICollection<NotificationRecipient> Recipients { get; set; } = new List<NotificationRecipient>();
    }
}