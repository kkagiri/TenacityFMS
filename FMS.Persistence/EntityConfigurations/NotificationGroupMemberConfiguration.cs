using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class NotificationGroupMemberConfiguration : IEntityTypeConfiguration<NotificationGroupMember> {
        public void Configure (EntityTypeBuilder<NotificationGroupMember> builder) {
            builder.ToTable ("notification_group_member")
                .HasCharSet ("utf8mb4")
                .UseCollation ("utf8mb4_general_ci");

            builder.HasKey (e => e.Id).HasName ("PRIMARY");

            builder.Property (e => e.Id).HasColumnType ("int(11)");
            builder.Property (e => e.GroupId).IsRequired ();
            builder.Property (e => e.MemberType).HasMaxLength (20).IsRequired ();
            builder.Property (e => e.MemberId).HasMaxLength (100).IsRequired ();

            builder.HasIndex (e => new { e.GroupId, e.MemberType, e.MemberId }, "IX_NotificationGroupMember_UQ").IsUnique ();

            builder.HasOne (e => e.Group)
                .WithMany (g => g.Members)
                .HasForeignKey (e => e.GroupId)
                .OnDelete (DeleteBehavior.Cascade)
                .HasConstraintName ("FK_NotificationGroupMember_Group");
        }
    }
}