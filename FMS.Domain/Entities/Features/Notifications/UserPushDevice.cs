using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications
{
    /// <summary>
    /// Stores push notification device tokens for users.
    /// Supports multiple devices per user (phone, tablet, etc.)
    /// </summary>
    public class UserPushDevice
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// User ID this device belongs to
        /// </summary>
        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Push notification token from the device (FCM token, APNS token, Expo token)
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string DeviceToken { get; set; } = null!;

        /// <summary>
        /// Platform: ios, android, web
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Platform { get; set; } = null!;

        /// <summary>
        /// Device identifier for deduplication
        /// </summary>
        [MaxLength(100)]
        public string? DeviceId { get; set; }

        /// <summary>
        /// Friendly device name (e.g., "John's iPhone", "Work Tablet")
        /// </summary>
        [MaxLength(100)]
        public string? DeviceName { get; set; }

        /// <summary>
        /// App version on this device
        /// </summary>
        [MaxLength(50)]
        public string? AppVersion { get; set; }

        /// <summary>
        /// Whether push notifications are enabled for this device
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When the device was registered
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time the token was updated/refreshed
        /// </summary>
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Last time a push was successfully sent to this device
        /// </summary>
        public DateTime? LastPushAt { get; set; }

        /// <summary>
        /// Number of failed push attempts (reset on success)
        /// </summary>
        public int FailedAttempts { get; set; } = 0;

        /// <summary>
        /// Last error message if push failed
        /// </summary>
        [MaxLength(500)]
        public string? LastError { get; set; }

        // Navigation
        public virtual User User { get; set; } = null!;
    }
}
