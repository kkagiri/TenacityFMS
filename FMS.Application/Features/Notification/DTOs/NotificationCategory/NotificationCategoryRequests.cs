using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Notification.DTOs {
    /// <summary>
    /// Request for creating a new notification category
    /// </summary>
    public class CreateNotificationCategoryRequest {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }
        public string DefaultPriority { get; set; } = "Medium";
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; }
        public string? IconClass { get; set; }
        public bool DefaultRequireAcknowledgment { get; set; } = false;
        public List<string> DefaultDeliveryMethods { get; set; } = new () { "System" };

        [Required]
        public string CreatedBy { get; set; } = null!;
    }

    /// <summary>
    /// Request for updating an existing notification category
    /// </summary>
    public class UpdateNotificationCategoryRequest {
        [Required]
        public int Id { get; set; }

        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? DefaultPriority { get; set; }
        public bool? IsActive { get; set; }
        public int? DisplayOrder { get; set; }
        public string? IconClass { get; set; }
        public bool? DefaultRequireAcknowledgment { get; set; }
        public List<string> ? DefaultDeliveryMethods { get; set; }

        [Required]
        public string UpdatedBy { get; set; } = null!;
    }
}