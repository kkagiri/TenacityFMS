using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the NotificationPolicyRecipient entity
    /// </summary>
    public class NotificationPolicyRecipientConfiguration : EntityTypeConfiguration<NotificationPolicyRecipient>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<NotificationPolicyRecipient> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("notification_policy_recipient")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.NotificationPolicyId, "IX_NotificationPolicyRecipient_NotificationPolicyId");
                builder.HasIndex(e => e.UserId, "IX_NotificationPolicyRecipient_UserId");

                // Properties
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.NotificationPolicyId)
                    .HasColumnType("int(11)")
                    .IsRequired();

                builder.Property(e => e.UserId)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.DeliveryMethods)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasDefaultValue("System");

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.PriorityOverride)
                    .HasMaxLength(20);

                builder.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .IsRequired();

                // Relationships
                builder.HasOne(d => d.NotificationPolicy)
                    .WithMany(p => p.PolicyRecipients)
                    .HasForeignKey(d => d.NotificationPolicyId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NotificationPolicyRecipient_NotificationPolicy");

                builder.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NotificationPolicyRecipient_User");

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_NotificationPolicyRecipient_CreatedBy");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring NotificationPolicyRecipient: {ex.Message}");
                throw new Exception($"Error configuring NotificationPolicyRecipientConfiguration: {ex.Message}", ex);
            }
        }
    }
}