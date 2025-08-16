using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.NotificationRecipient {
    /// <summary>
    /// Represents a notification recipient that can be used for both input (manual specification)
    /// and resolved output (from business logic/policies). Unified DTO to eliminate redundancy.
    /// </summary>
    public class NotificationRecipientDto {
        public string UserId { get; set; } = null!;
        public List<string> DeliveryMethods { get; set; } = [];
        public string? PriorityOverride { get; set; }

        /// <summary>
        /// Optional metadata indicating how this recipient was resolved
        /// (e.g., "Manual", "Policy", "SiteAdmin", "Subscription", "Fallback")
        /// </summary>
        public string? ResolvedFrom { get; set; }
    }

}