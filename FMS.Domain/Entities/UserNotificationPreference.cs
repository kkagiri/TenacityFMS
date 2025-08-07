using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities {
    /// <summary>
    /// User notification preferences for managing personal notification settings
    /// </summary>
    public class UserNotificationPreference {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The user this preference belongs to
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Notification category this preference applies to
        /// </summary>
        [Required]
        public int NotificationCategoryId { get; set; }

        /// <summary>
        /// Delivery methods enabled for this category (comma-separated: Email,SMS,System)
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string DeliveryMethods { get; set; } = "System";

        /// <summary>
        /// Whether notifications for this category are enabled
        /// </summary>
        public bool IsEnabled { get; set; } = true;

        /// <summary>
        /// Priority level for this category (Low, Medium, High, Critical)
        /// </summary>
        [MaxLength (20)]
        public string? Priority { get; set; }

        /// <summary>
        /// Start time for quiet hours (when notifications should be suppressed)
        /// </summary>
        public TimeSpan? QuietHoursStart { get; set; }

        /// <summary>
        /// End time for quiet hours
        /// </summary>
        public TimeSpan? QuietHoursEnd { get; set; }

        /// <summary>
        /// Maximum notifications per hour for this category (0 = unlimited)
        /// </summary>
        public int MaxNotificationsPerHour { get; set; } = 0;

        /// <summary>
        /// Maximum notifications per day for this category (0 = unlimited)
        /// </summary>
        public int MaxNotificationsPerDay { get; set; } = 0;

        /// <summary>
        /// Whether to require acknowledgment for notifications in this category
        /// </summary>
        public bool RequireAcknowledgment { get; set; } = false;

        /// <summary>
        /// When this preference was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When this preference was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Who created this preference
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        /// <summary>
        /// Who last updated this preference
        /// </summary>
        [MaxLength (100)]
        public string? UpdatedBy { get; set; }

        // Navigation Properties
        public virtual User User { get; set; } = null!;
        public virtual NotificationCategory NotificationCategory { get; set; } = null!;
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? UpdatedByNavigation { get; set; }
    }
}