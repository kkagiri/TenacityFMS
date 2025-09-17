using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Features.Notifications {
    public class NotificationGroupMember {
        [Key]
        public int Id { get; set; }

        public int GroupId { get; set; }

        // "User" or "Role"
        [MaxLength (20)]
        public string MemberType { get; set; } = "User";

        // stores User.Id or Role.Id (both are string in Identity)
        [MaxLength (100)]
        public string MemberId { get; set; } = null!;

        // Navigation
        public virtual NotificationGroup Group { get; set; } = null!;
    }
}