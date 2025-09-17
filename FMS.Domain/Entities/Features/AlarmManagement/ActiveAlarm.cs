using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.Notifications;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Represents an active alarm condition that requires attention or resolution
    /// </summary>
    public class ActiveAlarm {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Type of alarm (LowTankVolume, DiscrepancyDetected, DeviceDisconnection, etc.)
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string AlarmType { get; set; } = null!;

        /// <summary>
        /// Current state of the alarm
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string State { get; set; } = "Active"; // Active, Acknowledged, Resolved, Suppressed

        /// <summary>
        /// How this alarm was triggered
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string TriggerSource { get; set; } = null!; // Manual, Policy, Hardware, System

        /// <summary>
        /// When the alarm condition was first detected
        /// </summary>
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the alarm was acknowledged by a user
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// When the alarm condition was resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        /// <summary>
        /// Who acknowledged this alarm
        /// </summary>
        [MaxLength (100)]
        public string? AcknowledgedBy { get; set; }

        /// <summary>
        /// Who resolved this alarm
        /// </summary>
        [MaxLength (100)]
        public string? ResolvedBy { get; set; }

        /// <summary>
        /// Severity level of the alarm
        /// </summary>
        public DiscrepancySeverity Severity { get; set; } = DiscrepancySeverity.Medium;

        /// <summary>
        /// Priority level for handling
        /// </summary>
        [Required]
        [MaxLength (20)]
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical

        /// <summary>
        /// Human-readable alarm message
        /// </summary>
        [Required]
        [MaxLength (500)]
        public string Message { get; set; } = null!;

        /// <summary>
        /// Detailed description or context
        /// </summary>
        [MaxLength (1000)]
        public string? Description { get; set; }

        /// <summary>
        /// Site ID if alarm is site-specific
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank ID if alarm is tank-specific
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device ID if alarm is device-specific
        /// </summary>
        //public int? DeviceId { get; set; }

        /// <summary>
        /// PTS Device ID if alarm is PTS device-specific
        /// </summary>
        [MaxLength (50)]
        public string? PtsDeviceId { get; set; }

        /// <summary>
        /// Threshold value that was crossed (if applicable)
        /// </summary>
        public decimal? ThresholdValue { get; set; }

        /// <summary>
        /// Actual value that triggered the alarm
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Unit of measurement for threshold/actual values
        /// </summary>
        [MaxLength (20)]
        public string? Unit { get; set; }

        /// <summary>
        /// Related alarm handler that processed this alarm
        /// </summary>
        public int? AlarmHandlerId { get; set; }

        /// <summary>
        /// Related alert record from PTS hardware (if applicable)
        /// </summary>
        public int? AlertRecordId { get; set; }

        /// <summary>
        /// Related reconciliation discrepancy (if applicable)
        /// </summary>
        public int? ReconciliationDiscrepancyId { get; set; }

        /// <summary>
        /// Additional data in JSON format
        /// </summary>
        [Column (TypeName = "json")]
        public string? AdditionalData { get; set; }

        /// <summary>
        /// Resolution notes or actions taken
        /// </summary>
        [MaxLength (1000)]
        public string? ResolutionNotes { get; set; }

        /// <summary>
        /// Whether this alarm should create notifications
        /// </summary>
        public bool SuppressNotifications { get; set; } = false;

        /// <summary>
        /// Auto-resolve this alarm after specified minutes (0 = manual resolve only)
        /// </summary>
        public int AutoResolveMinutes { get; set; } = 0;

        /// <summary>
        /// Number of times this alarm has been escalated
        /// </summary>
        public int EscalationLevel { get; set; } = 0;

        /// <summary>
        /// Last time this alarm was escalated
        /// </summary>
        public DateTime? LastEscalatedAt { get; set; }

        // Navigation Properties
        public virtual Site? Site { get; set; }
        public virtual Tank? Tank { get; set; }
        //public virtual GPSDevice? Device { get; set; }
        public virtual AlarmHandler? AlarmHandler { get; set; }
        public virtual PTSAlertRecord? PTSAlertRecord { get; set; }
        public virtual ReconciliationDiscrepancy? ReconciliationDiscrepancy { get; set; }

        // Related notifications and issue tracker entries
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification> ();
        public virtual ICollection<Issuetracker> IssueTrackers { get; set; } = new List<Issuetracker> ();
    }
}