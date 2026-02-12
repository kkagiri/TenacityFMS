using FMS.Domain.Entities.Features.Notifications;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Tracks each evaluation of an EventExpression against an FMSEvent.
    /// Records whether the expression triggered, was suppressed, and what notification was created.
    /// Replaces AlarmHandlerExecution.
    /// </summary>
    public class EventExpressionExecution
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The expression that was evaluated
        /// </summary>
        [Required]
        public int EventExpressionId { get; set; }

        /// <summary>
        /// The event type that was processed
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = null!;

        /// <summary>
        /// When the evaluation was performed
        /// </summary>
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Whether the expression conditions were met and a notification was triggered
        /// </summary>
        public bool WasTriggered { get; set; } = false;

        /// <summary>
        /// If not triggered, why: Cooldown, DailyCap, ConditionNotMet, Disabled, SeverityTooLow
        /// </summary>
        [MaxLength(100)]
        public string? SuppressedReason { get; set; }

        /// <summary>
        /// Snapshot of the FMSEvent data at evaluation time
        /// </summary>
        [Column(TypeName = "json")]
        public string? EventData { get; set; }

        /// <summary>
        /// FK to the notification that was created (if triggered)
        /// </summary>
        public int? NotificationId { get; set; }

        /// <summary>
        /// FK to the issue tracker entry that was created (if applicable)
        /// </summary>
        public int? IssueTrackerId { get; set; }

        /// <summary>
        /// Whether the execution completed without errors
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// Error message if execution failed
        /// </summary>
        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// How long the evaluation took (milliseconds)
        /// </summary>
        public int ExecutionTimeMs { get; set; } = 0;

        // Navigation Properties
        public virtual EventExpression EventExpression { get; set; } = null!;
        public virtual Notification? Notification { get; set; }
        public virtual Issuetracker? IssueTracker { get; set; }
    }
}
