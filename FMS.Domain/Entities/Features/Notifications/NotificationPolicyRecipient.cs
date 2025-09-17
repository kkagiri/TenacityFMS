using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications
{
    /// <summary>
    /// Defines recipients for notification policies
    /// </summary>
    public class NotificationPolicyRecipient
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The notification policy this recipient belongs to
        /// </summary>
        [Required]
        public int NotificationPolicyId { get; set; }

        /// <summary>
        /// The user who should receive notifications
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Delivery methods enabled for this recipient (comma-separated: Email,SMS,System)
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string DeliveryMethods { get; set; } = "System";

        /// <summary>
        /// Whether this recipient is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Priority override for this recipient
        /// </summary>
        [MaxLength(20)]
        public string? PriorityOverride { get; set; }

        /// <summary>
        /// When this recipient was added
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Who added this recipient
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CreatedBy { get; set; } = null!;

        // Navigation Properties
        public virtual NotificationPolicy NotificationPolicy { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual User CreatedByNavigation { get; set; } = null!;
    }
}