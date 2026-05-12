using FMS.Domain.Entities.Features.Notifications;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Represents an active event condition that requires attention or resolution.
    /// Replaces ActiveAlarm with additional EventExpressionId FK and EventData JSON.
    /// State lifecycle: Active → Acknowledged → Resolved (or AutoResolved/Suppressed).
    /// </summary>
    public class ActiveEvent
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Event type that created this active event (e.g., "TankStockDiscrepancy", "DeviceStatus")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = null!;

        /// <summary>
        /// Current state: Active, Acknowledged, Resolved, Suppressed
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string State { get; set; } = "Active";

        /// <summary>
        /// How this event was triggered: Manual, Expression, Hardware, System
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string TriggerSource { get; set; } = "Expression";

        /// <summary>
        /// Severity level: 1=Low, 2=Medium, 3=High, 4=Critical
        /// </summary>
        public int Severity { get; set; } = 2;

        /// <summary>
        /// Priority level for handling: Low, Medium, High, Critical
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// Human-readable event message
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = null!;

        /// <summary>
        /// Detailed description or context
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }

        /// <summary>
        /// Site scope. Null = system-wide event.
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank scope. Null = not tank-specific.
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device scope. Null = not device-specific.
        /// </summary>
        public int? DeviceId { get; set; }

        /// <summary>
        /// PTS device identifier (for PTS protocol events)
        /// </summary>
        [MaxLength(50)]
        public string? PtsDeviceId { get; set; }

        /// <summary>
        /// FK to the EventExpression that triggered this event. Null if manually created.
        /// </summary>
        public int? EventExpressionId { get; set; }

        /// <summary>
        /// When the event condition was first detected
        /// </summary>
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the event was acknowledged by a user
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// When the event was resolved
        /// </summary>
        public DateTime? ResolvedAt { get; set; }

        /// <summary>
        /// Who acknowledged this event
        /// </summary>
        [MaxLength(100)]
        public string? AcknowledgedBy { get; set; }

        /// <summary>
        /// Who resolved this event
        /// </summary>
        [MaxLength(100)]
        public string? ResolvedBy { get; set; }

        /// <summary>
        /// Who/what triggered this event
        /// </summary>
        [MaxLength(100)]
        public string? TriggeredBy { get; set; }

        /// <summary>
        /// Threshold value that was crossed (if applicable)
        /// </summary>
        public decimal? ThresholdValue { get; set; }

        /// <summary>
        /// Actual value that triggered the event
        /// </summary>
        public decimal? ActualValue { get; set; }

        /// <summary>
        /// Unit of measurement for threshold/actual values
        /// </summary>
        [MaxLength(20)]
        public string? Unit { get; set; }

        /// <summary>
        /// Current escalation level (0 = not escalated)
        /// </summary>
        public int EscalationLevel { get; set; } = 0;

        /// <summary>
        /// Last time this event was escalated
        /// </summary>
        public DateTime? LastEscalatedAt { get; set; }

        /// <summary>
        /// Auto-resolve after specified minutes (0 = manual resolve only)
        /// </summary>
        public int AutoResolveMinutes { get; set; } = 0;

        /// <summary>
        /// Resolution notes or actions taken
        /// </summary>
        public string? ResolutionNotes { get; set; }

        /// <summary>
        /// Full FMSEvent snapshot in JSON format
        /// </summary>
        [Column(TypeName = "json")]
        public string? EventData { get; set; }

        /// <summary>
        /// Whether notifications should be suppressed for this event
        /// </summary>
        public bool SuppressNotifications { get; set; } = false;

        /// <summary>
        /// Record timestamps
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public virtual Site? Site { get; set; }
        public virtual Tank? Tank { get; set; }
        public virtual EventExpression? EventExpression { get; set; }

        // Related notifications and issue tracker entries
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<Issuetracker> IssueTrackers { get; set; } = new List<Issuetracker>();
    }
}
