using FMS.Domain.Entities.Features.Notifications;
using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities {
    /// <summary>
    /// Maps business function trigger sources to notification groups
    /// Allows internal business functions to target specific groups without requiring NotificationPolicy
    /// </summary>
    public class BusinessFunctionNotificationGroup {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Business function trigger source (e.g., "ClosingStock", "AutomatedReconciliation")
        /// </summary>
        [Required]
        [MaxLength (50)]
        public string TriggerSource { get; set; } = null!;

        /// <summary>
        /// Target notification group
        /// </summary>
        public int GroupId { get; set; }

        /// <summary>
        /// Optional site restriction (null = global, specific = site-only)
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Whether this mapping is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Override delivery methods for this trigger source (comma-separated)
        /// If null, uses group's default delivery methods
        /// </summary>
        [MaxLength (100)]
        public string? AllowedDeliveryMethods { get; set; }

        /// <summary>
        /// Minimum severity level to trigger notifications
        /// </summary>
        [MaxLength (20)]
        public string? MinimumSeverity { get; set; }

        /// <summary>
        /// Creation tracking
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        /// <summary>
        /// Update tracking
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        [MaxLength (100)]
        public string? UpdatedBy { get; set; }

        // Navigation Properties
        public virtual NotificationGroup Group { get; set; } = null!;
        public virtual Site? Site { get; set; }
    }
}