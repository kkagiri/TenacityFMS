using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FMS.Application.Features.Notification.DTOs.Groups {
    public class CreateNotificationGroupRequest {
        [Required]
        [MaxLength (100)]
        public string Name { get; set; } = null!;
        [MaxLength (500)]
        public string? Description { get; set; }
        public int? SiteId { get; set; }

        [MaxLength (100)]
        public string? AllowedDeliveryMethods { get; set; }
        public bool IsActive { get; set; } = true;

        public string? CreatedBy { get; set; }
        public List<GroupMemberCreateRequest> ? Members { get; set; }
    }

    public class UpdateNotificationGroupRequest {
        [Required]
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
        [MaxLength (100)]
        public string UpdatedBy { get; set; } = null!;
    }

    public class GroupMemberCreateRequest {
        public int? GroupId { get; set; }

        [Required]
        [MaxLength (20)]
        public string MemberType { get; set; } = null!; // User | Role
        [Required]
        [MaxLength (100)]
        public string MemberId { get; set; } = null!; // User.Id or Role.Id
    }

    public class MapPolicyGroupRequest {
        [Required]
        public int PolicyId { get; set; }

        [Required]
        public int GroupId { get; set; }

        [MaxLength (100)]
        public string? AllowedDeliveryMethods { get; set; }
    }

    public class AddGroupMembersReceipt {
        public int GroupId { get; set; }
        public int Attempted { get; set; }
        public int Added { get; set; }
        public int Duplicates { get; set; }
        public int Invalid { get; set; }
        public List<string> DuplicateKeys { get; set; } = new List<string> ();
        public List<string> InvalidEntries { get; set; } = new List<string> ();
    }
}