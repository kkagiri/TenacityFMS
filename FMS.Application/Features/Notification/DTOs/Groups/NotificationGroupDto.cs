using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.Groups {
    public class NotificationGroupDto {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int? SiteId { get; set; }
        public string? AllowedDeliveryMethods { get; set; }
        public bool IsActive { get; set; }
        public string CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int MemberCount { get; set; }
        public List<GroupMemberDto> Members { get; set; } = new ();
    }

    public class GroupMemberDto {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public string MemberType { get; set; } = null!; // User | Role
        public string MemberId { get; set; } = null!; // User.Id or Role.Id
    }
}