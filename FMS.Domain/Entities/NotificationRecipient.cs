using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FMS.Domain.Entities
{
    /// <summary>
    /// Tracks recipients of notifications and delivery status
    /// </summary>
    public class NotificationRecipient
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The notification this recipient belongs to
        /// </summary>
        [Required]
        public int NotificationId { get; set; }

        /// <summary>
        /// The user receiving the notification
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Delivery method (Email, SMS, System, Push)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string DeliveryMethod { get; set; } = null!;

        /// <summary>
        /// Recipient address (email, phone number, etc.)
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string RecipientAddress { get; set; } = null!;

        /// <summary>
        /// Delivery status (Pending, Sent, Delivered, Failed, Bounced)
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string DeliveryStatus { get; set; } = "Pending";

        /// <summary>
        /// When the notification was sent to this recipient
        /// </summary>
        public DateTime? SentAt { get; set; }

        /// <summary>
        /// When the notification was delivered (if trackable)
        /// </summary>
        public DateTime? DeliveredAt { get; set; }

        /// <summary>
        /// When the recipient read the notification
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Number of delivery attempts
        /// </summary>
        public int DeliveryAttempts { get; set; } = 0;

        /// <summary>
        /// Error message if delivery failed
        /// </summary>
        [MaxLength(500)]
        public string? DeliveryError { get; set; }

        /// <summary>
        /// Whether the recipient has read the notification
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// Whether the recipient has acknowledged the notification
        /// </summary>
        public bool IsAcknowledged { get; set; } = false;

        /// <summary>
        /// When the notification was acknowledged
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// Priority override for this specific recipient
        /// </summary>
        [MaxLength(20)]
        public string? PriorityOverride { get; set; }

        /// <summary>
        /// Additional metadata for delivery tracking
        /// </summary>
        [Column(TypeName = "json")]
        public string? DeliveryMetadata { get; set; }

        // Navigation Properties
        public virtual Notification Notification { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}