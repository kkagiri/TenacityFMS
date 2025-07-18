using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Defines notification policies and rules for different types of notifications
    /// </summary>
    public class NotificationPolicy {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Policy name for identification
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Description of the policy
        /// </summary>
        [MaxLength (500)]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this policy is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Category this policy applies to (Tank, Pump, Vehicle, System, etc.)
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string Category { get; set; } = null!;

        /// <summary>
        /// Type of notification this policy applies to (Alert, Warning, Info, etc.)
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string NotificationType { get; set; } = null!;

        /// <summary>
        /// Priority level for notifications under this policy
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// Maximum number of notifications per hour (0 = unlimited)
        /// </summary>
        public int MaxNotificationsPerHour { get; set; } = 0;

        /// <summary>
        /// Maximum number of notifications per day (0 = unlimited)
        /// </summary>
        public int MaxNotificationsPerDay { get; set; } = 0;

        /// <summary>
        /// Cooldown period in minutes between similar notifications
        /// </summary>
        public int CooldownMinutes { get; set; } = 0;

        /// <summary>
        /// Whether to enable email notifications
        /// </summary>
        public bool EnableEmail { get; set; } = true;

        /// <summary>
        /// Whether to enable SMS notifications
        /// </summary>
        public bool EnableSms { get; set; } = false;

        /// <summary>
        /// Whether to enable system notifications (in-app)
        /// </summary>
        public bool EnableSystem { get; set; } = true;

        /// <summary>
        /// Whether to enable sound alerts
        /// </summary>
        public bool EnableSound { get; set; } = false;

        /// <summary>
        /// Sound file or identifier for audio alerts
        /// </summary>
        [MaxLength (255)]
        public string? SoundFile { get; set; }

        /// <summary>
        /// Auto-escalation rules in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? EscalationRules { get; set; }

        /// <summary>
        /// Trigger conditions in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? TriggerConditions { get; set; }

        /// <summary>
        /// Recipient selection rules in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? RecipientRules { get; set; }

        /// <summary>
        /// Schedule configuration for when notifications can be sent
        /// </summary>
        [Column (TypeName = "json")]
        public string? ScheduleConfiguration { get; set; }

        /// <summary>
        /// Site ID if policy is site-specific (null for global)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// PTS Device ID if policy is PTS device-specific (null for global)
        /// </summary>
        public string? PtsDeviceId { get; set; }

        /// <summary>
        /// Template for notification title
        /// </summary>
        [MaxLength (255)]
        public string? TitleTemplate { get; set; }

        /// <summary>
        /// Template for notification message
        /// </summary>
        [Column (TypeName = "text")]
        public string? MessageTemplate { get; set; }

        /// <summary>
        /// Email template for email notifications
        /// </summary>
        [Column (TypeName = "text")]
        public string? EmailTemplate { get; set; }

        /// <summary>
        /// SMS template for SMS notifications
        /// </summary>
        [MaxLength (500)]
        public string? SmsTemplate { get; set; }

        /// <summary>
        /// Whether to require acknowledgment
        /// </summary>
        public bool RequireAcknowledgment { get; set; } = false;

        /// <summary>
        /// Auto-acknowledgment timeout in minutes (0 = no timeout)
        /// </summary>
        public int AcknowledgmentTimeoutMinutes { get; set; } = 0;

        /// <summary>
        /// Whether to create issue tracker entries for critical notifications
        /// </summary>
        public bool CreateIssueTracker { get; set; } = false;

        /// <summary>
        /// Issue category ID for auto-created issues
        /// </summary>
        public int? IssueCategory { get; set; }

        /// <summary>
        /// Issue priority for auto-created issues
        /// </summary>
        public int? IssuePriority { get; set; }

        /// <summary>
        /// User who created this policy
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        /// <summary>
        /// When this policy was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who last modified this policy
        /// </summary>
        [MaxLength (100)]
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// When this policy was last modified
        /// </summary>
        public DateTime? ModifiedAt { get; set; }

        /// <summary>
        /// Number of notifications sent under this policy
        /// </summary>
        public int NotificationCount { get; set; } = 0;

        /// <summary>
        /// Last time a notification was sent under this policy
        /// </summary>
        public DateTime? LastNotificationAt { get; set; }

        // Navigation Properties
        public virtual Site? Site { get; set; }
        public virtual Ptsdevice? PtsDevice { get; set; }
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? ModifiedByNavigation { get; set; }
        public virtual Issuecategory? IssueCategoryNavigation { get; set; }
        public virtual Issuepriority? IssuePriorityNavigation { get; set; }

        // Collections
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification> ();
        public virtual ICollection<NotificationPolicyRecipient> PolicyRecipients { get; set; } = new List<NotificationPolicyRecipient> ();
    }
}