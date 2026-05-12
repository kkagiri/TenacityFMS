using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class NotificationGroupConfiguration : IEntityTypeConfiguration<NotificationGroup> {
        public void Configure (EntityTypeBuilder<NotificationGroup> builder) {
            builder.ToTable ("notification_group");

            builder.HasKey (e => e.Id);

            builder.Property (e => e.Id);
            builder.Property (e => e.Name).IsRequired ().HasMaxLength (100);
            builder.Property (e => e.Description).HasMaxLength (500);
            builder.Property (e => e.SiteId);
            builder.Property (e => e.AllowedDeliveryMethods).HasMaxLength (100);
            builder.Property (e => e.IsActive).HasDefaultValue (true);
            builder.Property (e => e.CreatedBy).IsRequired ().HasMaxLength (100);
            builder.Property (e => e.CreatedAt);
            builder.Property (e => e.UpdatedBy).HasMaxLength (100);
            builder.Property (e => e.UpdatedAt);

            builder.HasIndex (e => new { e.Name, e.SiteId }, "IX_NotificationGroup_Name_SiteId").IsUnique ();

            builder.HasOne (e => e.Site)
                .WithMany ()
                .HasForeignKey (e => e.SiteId)
                .OnDelete (DeleteBehavior.NoAction)
                .HasConstraintName ("FK_NotificationGroup_Site");
        }
    }
}
