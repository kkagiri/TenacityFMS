using FMS.Domain.Entities.Features.Notifications;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Tracks executions of alarm handlers
    /// </summary>
    public class AlarmHandlerExecution
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The alarm handler that was executed
        /// </summary>
        [Required]
        public int AlarmHandlerId { get; set; }

        /// <summary>
        /// The notification that was created (if any)
        /// </summary>
        public int? NotificationId { get; set; }

        /// <summary>
        /// The issue tracker entry that was created (if any)
        /// </summary>
        public int? IssueTrackerId { get; set; }

        /// <summary>
        /// When the handler was executed
        /// </summary>
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Whether the execution was successful
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// Error message if execution failed
        /// </summary>
        [MaxLength(500)]
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// The alarm data that triggered the execution
        /// </summary>
        [Column(TypeName = "json")]
        public string? TriggerData { get; set; }

        /// <summary>
        /// Execution details and results
        /// </summary>
        [Column(TypeName = "json")]
        public string? ExecutionDetails { get; set; }

        /// <summary>
        /// How long the execution took (milliseconds)
        /// </summary>
        public int ExecutionTimeMs { get; set; } = 0;

        // Navigation Properties
        public virtual AlarmHandler AlarmHandler { get; set; } = null!;
        public virtual Notification? Notification { get; set; }
        public virtual Issuetracker? IssueTracker { get; set; }
    }
}