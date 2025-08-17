using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Notification.DTOs {
    /// <summary>
    /// Request to create a new user notification preference
    /// </summary>
    public class CreateUserNotificationPreferenceRequest {
        [Required]
        public string UserId { get; set; } = null!;

        [Required]
        public int NotificationCategoryId { get; set; }

        public List<string> DeliveryMethods { get; set; } = new () { "System" };

        public bool IsEnabled { get; set; } = true;

        public string? Priority { get; set; } = "Medium";

        public string? QuietHoursStart { get; set; }

        public string? QuietHoursEnd { get; set; }

        public int MaxNotificationsPerHour { get; set; } = 0;

        public int MaxNotificationsPerDay { get; set; } = 0;

        public bool RequireAcknowledgment { get; set; } = false;

        [Required]
        public string CreatedBy { get; set; } = null!;
    }

    /// <summary>
    /// Request to update an existing user notification preference
    /// </summary>
    public class UpdateUserNotificationPreferenceRequest {
        [Required]
        public int Id { get; set; }

        public List<string> ? DeliveryMethods { get; set; }

        public bool? IsEnabled { get; set; }

        public string? Priority { get; set; }

        public string? QuietHoursStart { get; set; }

        public string? QuietHoursEnd { get; set; }

        public int? MaxNotificationsPerHour { get; set; }

        public int? MaxNotificationsPerDay { get; set; }

        public bool? RequireAcknowledgment { get; set; }

        [Required]
        public string UpdatedBy { get; set; } = null!;
    }

    /// <summary>
    /// Response DTO for user notification preferences
    /// </summary>
    public class UserNotificationPreferenceDto {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public int NotificationCategoryId { get; set; }
        public List<string> DeliveryMethods { get; set; } = new ();
        public bool IsEnabled { get; set; }
        public string? Priority { get; set; }
        public string? QuietHoursStart { get; set; }
        public string? QuietHoursEnd { get; set; }
        public int MaxNotificationsPerHour { get; set; }
        public int MaxNotificationsPerDay { get; set; }
        public bool RequireAcknowledgment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string CreatedBy { get; set; } = null!;
        public string? UpdatedBy { get; set; }
    }

    /// <summary>
    /// Request to get user notification preferences
    /// </summary>
    public class GetUserNotificationPreferencesRequest {
        [Required]
        public string UserId { get; set; } = null!;

        public int Category { get; set; }

        public bool? IsEnabled { get; set; }
    }

    /// <summary>
    /// Request for bulk updating user notification preferences
    /// </summary>
    public class BulkUpdateUserNotificationPreferencesRequest {
        [Required]
        public string UserId { get; set; } = null!;

        [Required]
        public List<UserNotificationPreferenceDto> Preferences { get; set; } = new ();

        [Required]
        public string UpdatedBy { get; set; } = null!;
    }

    /// <summary>
    /// Notification category DTO
    /// </summary>
    public class NotificationCategoryDto {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DefaultPriority { get; set; } = null!;
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }
        public string? IconClass { get; set; }
        public bool DefaultRequireAcknowledgment { get; set; }
        public List<string> DefaultDeliveryMethods { get; set; } = new ();
    }

    /// <summary>
    /// Request for triggering alarms
    /// </summary>
    public class TriggerAlarmRequest {
        public string AlarmType { get; set; } = null!;
        public string? Category { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
        public int? SiteId { get; set; }
        public int? DeviceId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsDeviceId { get; set; }
    }

    /// <summary>
    /// Request for bulk updating user notification preferences (Controller level)
    /// </summary>
    public class BulkUpdatePreferencesRequest {
        [Required]
        public string UserId { get; set; } = null!;
        public List<BulkUpdatePreferenceDto> ? Preferences { get; set; }
    }

    /// <summary>
    /// DTO for bulk update preference item - simplified for controller input
    /// </summary>
    public class BulkUpdatePreferenceDto {
        public int? Id { get; set; }

        [Required]
        public int NotificationCategoryId { get; set; }

        public List<string> DeliveryMethods { get; set; } = new () { "System" };
        public bool IsEnabled { get; set; } = true;
        public string? Priority { get; set; }
        public string? QuietHoursStart { get; set; }
        public string? QuietHoursEnd { get; set; }
        public int MaxNotificationsPerHour { get; set; } = 0;
        public int MaxNotificationsPerDay { get; set; } = 0;
        public bool RequireAcknowledgment { get; set; } = false;
    }
}