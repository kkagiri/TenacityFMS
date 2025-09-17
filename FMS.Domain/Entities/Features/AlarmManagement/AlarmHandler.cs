using FMS.Domain.Entities.Features.Notifications;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Defines how different types of alarms should trigger notifications
    /// </summary>
    public class AlarmHandler {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Name of the alarm handler
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Description of what this handler does
        /// </summary>
        [MaxLength (500)]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this handler is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Type of alarm this handler processes (LowTankVolume, HighTankVolume, DeviceDisconnection, etc.)
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string AlarmType { get; set; } = null!;

        /// <summary>
        /// Alarm ID if specific to one alarm, null for alarm type-based handling
        /// </summary>
        public int? AlarmId { get; set; }

        /// <summary>
        /// Site ID if handler is site-specific
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank ID if handler is tank-specific
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device ID if handler is device-specific
        /// </summary>
      //  public int? DeviceId { get; set; }

        /// <summary>
        /// Trigger conditions in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? TriggerConditions { get; set; }

        /// <summary>
        /// Notification policy to use when alarm is triggered
        /// </summary>
        [Required]
        public int NotificationPolicyId { get; set; }

        /// <summary>
        /// Whether to auto-create issue tracker entries
        /// </summary>
        public bool CreateIssueTracker { get; set; } = false;

        /// <summary>
        /// Issue category for auto-created issues
        /// </summary>
        public int? IssueCategory { get; set; }

        /// <summary>
        /// Issue priority for auto-created issues
        /// </summary>
        public int? IssuePriority { get; set; }

        /// <summary>
        /// Who to assign the issue to
        /// </summary>
        [MaxLength (100)]
        public string? AssignIssueTo { get; set; }

        /// <summary>
        /// Minimum time between notifications for the same alarm condition (minutes)
        /// </summary>
        public int CooldownMinutes { get; set; } = 30;

        /// <summary>
        /// Maximum number of notifications per day for this alarm type
        /// </summary>
        public int MaxNotificationsPerDay { get; set; } = 0; // 0 = unlimited

        /// <summary>
        /// Whether to escalate if alarm persists
        /// </summary>
        public bool EnableEscalation { get; set; } = false;

        /// <summary>
        /// Escalation rules in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? EscalationRules { get; set; }

        /// <summary>
        /// Custom message template for notifications
        /// </summary>
        [Column (TypeName = "text")]
        public string? MessageTemplate { get; set; }

        /// <summary>
        /// Additional data to include in notifications
        /// </summary>
        [Column (TypeName = "json")]
        public string? AdditionalData { get; set; }

        /// <summary>
        /// Priority level for notifications triggered by this handler
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// User who created this handler
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        /// <summary>
        /// When this handler was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who last modified this handler
        /// </summary>
        [MaxLength (100)]
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// When this handler was last modified
        /// </summary>
        public DateTime? ModifiedAt { get; set; }

        /// <summary>
        /// Number of times this handler has been triggered
        /// </summary>
        public int TriggerCount { get; set; } = 0;

        /// <summary>
        /// Last time this handler was triggered
        /// </summary>
        public DateTime? LastTriggeredAt { get; set; }

        // Navigation Properties
        public virtual Alarm? Alarm { get; set; }
        public virtual Site? Site { get; set; }
        public virtual Tank? Tank { get; set; }
        //public virtual GPSDevice? Device { get; set; }
        public virtual NotificationPolicy NotificationPolicy { get; set; } = null!;
        public virtual Issuecategory? IssueCategoryNavigation { get; set; }
        public virtual Issuepriority? IssuePriorityNavigation { get; set; }
        public virtual User? AssignIssueToNavigation { get; set; }
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? ModifiedByNavigation { get; set; }

        // Collections
        public virtual ICollection<AlarmHandlerExecution> Executions { get; set; } = new List<AlarmHandlerExecution> ();
    }
}