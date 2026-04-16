using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class NotificationPolicyGroupConfiguration : IEntityTypeConfiguration<NotificationPolicyGroup> {
        public void Configure (EntityTypeBuilder<NotificationPolicyGroup> builder) {
            builder.ToTable ("notification_policy_group")
                .HasCharSet ("utf8mb4")
                .UseCollation ("utf8mb4_general_ci");

            builder.HasKey (e => e.Id).HasName ("PRIMARY");

            builder.Property (e => e.Id).HasColumnType ("int(11)");
            builder.Property (e => e.PolicyId).IsRequired ();
            builder.Property (e => e.GroupId).IsRequired ();
            builder.Property (e => e.AllowedDeliveryMethods).HasMaxLength (100);

            builder.HasIndex (e => new { e.PolicyId, e.GroupId }, "IX_NotificationPolicyGroup_UQ").IsUnique ();

            builder.HasOne (e => e.Policy)
                .WithMany (p => p.PolicyGroups)
                .HasForeignKey (e => e.PolicyId)
                .OnDelete (DeleteBehavior.Cascade)
                .HasConstraintName ("FK_NotificationPolicyGroup_Policy");

            builder.HasOne (e => e.Group)
                .WithMany (g => g.PolicyMappings)
                .HasForeignKey (e => e.GroupId)
                .OnDelete (DeleteBehavior.Cascade)
                .HasConstraintName ("FK_NotificationPolicyGroup_Group");
        }
    }
}