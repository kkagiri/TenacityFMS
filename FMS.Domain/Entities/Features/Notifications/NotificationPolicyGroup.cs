using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications {
    public class NotificationPolicyGroup {
        [Key]
        public int Id { get; set; }

        public int PolicyId { get; set; }
        public int GroupId { get; set; }

        // Optional: further restrict delivery methods for this mapping (comma-separated)
        [MaxLength (100)]
        public string? AllowedDeliveryMethods { get; set; }

        // Navigation
        public virtual NotificationPolicy Policy { get; set; } = null!;
        public virtual NotificationGroup Group { get; set; } = null!;
    }
}