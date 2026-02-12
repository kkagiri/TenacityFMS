using FMS.Domain.Entities.Features.Notifications;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Defines an event expression (rule) that evaluates incoming FMSEvents
    /// and triggers notifications when conditions are met.
    /// Replaces AlarmHandler with cleaner separation: EventExpression = WHEN to care.
    /// </summary>
    public class EventExpression
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Display name of the expression
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Description of what this expression evaluates
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Whether this expression is active and should be evaluated
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Event type to match against FMSEvent.EventType (e.g., "TankStockDiscrepancy", "DeviceStatus")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = null!;

        /// <summary>
        /// Site scope filter. Null = match all sites.
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank scope filter. Null = match all tanks.
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Device scope filter. Null = match all devices.
        /// </summary>
        public int? DeviceId { get; set; }

        /// <summary>
        /// Minimum severity for the event to trigger this expression.
        /// Null = no severity filter.
        /// </summary>
        [MaxLength(20)]
        public string? MinimumSeverity { get; set; }

        /// <summary>
        /// Type-specific conditions in JSON format.
        /// Evaluated by the IExpressionEvaluator for this EventType.
        /// Example: { "minVariance": 50, "minVariancePercent": 5 }
        /// </summary>
        [Column(TypeName = "json")]
        public string? Conditions { get; set; }

        /// <summary>
        /// FK to the notification policy that defines HOW to deliver.
        /// </summary>
        [Required]
        public int NotificationPolicyId { get; set; }

        /// <summary>
        /// Whether to auto-create issue tracker entries when triggered
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
        /// Who to assign auto-created issues to
        /// </summary>
        [MaxLength(100)]
        public string? AssignIssueTo { get; set; }

        /// <summary>
        /// Minimum time between notifications for the same event (minutes)
        /// </summary>
        public int CooldownMinutes { get; set; } = 30;

        /// <summary>
        /// Maximum notifications per day for this expression. 0 = unlimited.
        /// </summary>
        public int MaxNotificationsPerDay { get; set; } = 0;

        /// <summary>
        /// Whether to escalate if the event persists
        /// </summary>
        public bool EnableEscalation { get; set; } = false;

        /// <summary>
        /// Escalation rules in JSON format
        /// </summary>
        [Column(TypeName = "json")]
        public string? EscalationRules { get; set; }

        /// <summary>
        /// Custom message template override. Null = use policy template.
        /// </summary>
        [Column(TypeName = "text")]
        public string? MessageTemplate { get; set; }

        /// <summary>
        /// Priority level for notifications triggered by this expression
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        /// <summary>
        /// Whether to also create an ActiveEvent record when triggered
        /// </summary>
        public bool CreateActiveEvent { get; set; } = true;

        /// <summary>
        /// User who created this expression
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = null!;

        /// <summary>
        /// When this expression was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// User who last modified this expression
        /// </summary>
        [MaxLength(100)]
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// When this expression was last modified
        /// </summary>
        public DateTime? ModifiedAt { get; set; }

        /// <summary>
        /// Number of times this expression has been triggered
        /// </summary>
        public int TriggerCount { get; set; } = 0;

        /// <summary>
        /// Last time this expression was triggered
        /// </summary>
        public DateTime? LastTriggeredAt { get; set; }

        // Navigation Properties
        public virtual Site? Site { get; set; }
        public virtual Tank? Tank { get; set; }
        public virtual NotificationPolicy NotificationPolicy { get; set; } = null!;
        public virtual Issuecategory? IssueCategoryNavigation { get; set; }
        public virtual Issuepriority? IssuePriorityNavigation { get; set; }
        public virtual User? AssignIssueToNavigation { get; set; }
        public virtual User CreatedByNavigation { get; set; } = null!;
        public virtual User? ModifiedByNavigation { get; set; }

        // Collections
        public virtual ICollection<EventExpressionExecution> Executions { get; set; } = new List<EventExpressionExecution>();
        public virtual ICollection<ActiveEvent> ActiveEvents { get; set; } = new List<ActiveEvent>();
    }
}
