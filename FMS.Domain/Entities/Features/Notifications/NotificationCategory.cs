using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications {
    /// <summary>
    /// Represents a notification category that users can configure preferences for
    /// </summary>
    public class NotificationCategory {

        public int Id { get; set; }

        /// <summary>
        /// Display name of the category
        /// </summary>
        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;

        /// <summary>
        /// Description of what this category covers
        /// </summary>
        [MaxLength (500)]
        public string? Description { get; set; }

        /// <summary>
        /// Default priority level for this category
        /// </summary>
        [MaxLength (20)]
        public string DefaultPriority { get; set; } = "Medium";

        /// <summary>
        /// Whether this category is active and available for configuration
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Display order for UI
        /// </summary>
        public int DisplayOrder { get; set; }

        /// <summary>
        /// Icon class for UI display
        /// </summary>
        [MaxLength (50)]
        public string? IconClass { get; set; }

        /// <summary>
        /// Whether this category requires acknowledgment by default
        /// </summary>
        public bool DefaultRequireAcknowledgment { get; set; } = false;

        /// <summary>
        /// Default delivery methods (comma-separated)
        /// </summary>
        [MaxLength (100)]
        public string DefaultDeliveryMethods { get; set; } = "System";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        [MaxLength (100)]
        public string? UpdatedBy { get; set; }

        // Navigation Properties
        /// <summary>
        /// All user preferences for this category
        /// </summary>
        public virtual ICollection<UserNotificationPreference> UserPreferences { get; set; } = new List<UserNotificationPreference> ();

        public virtual ICollection<NotificationPolicy> NotificationPolicies { get; set; } = new List<NotificationPolicy> ();

    }
}