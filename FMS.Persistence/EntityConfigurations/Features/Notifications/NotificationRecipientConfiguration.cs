using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the NotificationRecipient entity
    /// </summary>
    public class NotificationRecipientConfiguration : EntityTypeConfiguration<NotificationRecipient>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<NotificationRecipient> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("notification_recipient");

                // Indexes
                builder.HasIndex(e => e.NotificationId, "IX_NotificationRecipient_NotificationId");
                builder.HasIndex(e => e.UserId, "IX_NotificationRecipient_UserId");
                builder.HasIndex(e => e.DeliveryMethod, "IX_NotificationRecipient_DeliveryMethod");
                builder.HasIndex(e => e.DeliveryStatus, "IX_NotificationRecipient_DeliveryStatus");
                builder.HasIndex(e => e.SentAt, "IX_NotificationRecipient_SentAt");
                builder.HasIndex(e => e.IsRead, "IX_NotificationRecipient_IsRead");

                // Properties
                builder.Property(e => e.Id);
                builder.Property(e => e.NotificationId).IsRequired();
                builder.Property(e => e.UserId).HasMaxLength(100).IsRequired();
                builder.Property(e => e.DeliveryMethod).HasMaxLength(20).IsRequired();
                builder.Property(e => e.RecipientAddress).HasMaxLength(255).IsRequired();
                builder.Property(e => e.DeliveryStatus).HasMaxLength(20).HasDefaultValue("Pending");
                builder.Property(e => e.DeliveryAttempts).HasDefaultValue(0);
                builder.Property(e => e.DeliveryError).HasMaxLength(500);
                builder.Property(e => e.IsRead).HasDefaultValue(false);
                builder.Property(e => e.IsAcknowledged).HasDefaultValue(false);
                builder.Property(e => e.PriorityOverride).HasMaxLength(20);
                builder.Property(e => e.DeliveryMetadata).HasColumnType("json");

                // Foreign key relationships
                builder.HasOne(d => d.Notification)
                    .WithMany(p => p.Recipients)
                    .HasForeignKey(d => d.NotificationId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NotificationRecipient_Notification");

                builder.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NotificationRecipient_User");

                builder.HasQueryFilter(e => e.User.IsDeleted != true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring NotificationRecipientConfiguration: {ex.Message}");
                throw new Exception($"Error configuring NotificationRecipientConfiguration: {ex.Message}", ex);
            }
        }
    }
}

