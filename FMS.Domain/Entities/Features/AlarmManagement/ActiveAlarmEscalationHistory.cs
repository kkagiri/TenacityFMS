using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Records individual escalation events for an active alarm
    /// Provides detailed audit trail and historical analysis of escalation patterns
    /// </summary>
    public class ActiveAlarmEscalationHistory
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Reference to the parent ActiveAlarm
        /// </summary>
        [Required]
        public int ActiveAlarmId { get; set; }

        /// <summary>
        /// Sequential escalation level for this event
        /// </summary>
        [Required]
        public int EscalationLevel { get; set; }

        /// <summary>
        /// Previous priority before escalation
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string FromPriority { get; set; } = null!;

        /// <summary>
        /// New priority after escalation
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string ToPriority { get; set; } = null!;

        /// <summary>
        /// Who triggered the escalation
        /// </summary>
        [MaxLength(100)]
        public string? EscalatedBy { get; set; }

        /// <summary>
        /// Reason for escalation (AutoEscalation, Manual, Policy, etc.)
        /// </summary>
        [MaxLength(50)]
        public string? EscalationReason { get; set; }

        /// <summary>
        /// When this escalation occurred
        /// </summary>
        [Required]
        public DateTime EscalatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional notes about the escalation
        /// </summary>
        [MaxLength(500)]
        public string? Notes { get; set; }

        // Navigation Properties
        public virtual ActiveAlarm? ActiveAlarm { get; set; }
    }
}
