using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications {
    public class NotificationGroup {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;

        [MaxLength (500)]
        public string? Description { get; set; }

        public int? SiteId { get; set; }

        [MaxLength (100)]
        public string? AllowedDeliveryMethods { get; set; }

        public bool IsActive { get; set; } = true;

        [Required]
        [MaxLength (100)]
        public string CreatedBy { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength (100)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public virtual Site? Site { get; set; }

        public virtual ICollection<NotificationGroupMember> Members { get; set; } = new List<NotificationGroupMember> ();
        public virtual ICollection<NotificationPolicyGroup> PolicyMappings { get; set; } = new List<NotificationPolicyGroup> ();
    }
}