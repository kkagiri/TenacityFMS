using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the UserNotificationPreference entity
    /// </summary>
    public class UserNotificationPreferenceConfiguration : EntityTypeConfiguration<UserNotificationPreference>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<UserNotificationPreference> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("user_notification_preference")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.UserId, "IX_UserNotificationPreference_UserId");
                builder.HasIndex(e => e.NotificationCategoryId, "IX_UserNotificationPreference_Category");
                builder.HasIndex(e => new { e.UserId, e.NotificationCategoryId }, "IX_UserNotificationPreference_UserCategory")
                    .IsUnique();
                builder.HasIndex(e => e.IsEnabled, "IX_UserNotificationPreference_IsEnabled");
                builder.HasIndex(e => e.CreatedAt, "IX_UserNotificationPreference_CreatedAt");

                // Properties
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.UserId)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.NotificationCategoryId)
                    .IsRequired();

                builder.Property(e => e.DeliveryMethods)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasDefaultValue("System");

                builder.Property(e => e.IsEnabled)
                    .HasDefaultValue(true);

                builder.Property(e => e.Priority)
                    .HasMaxLength(20);

                builder.Property(e => e.QuietHoursStart)
                    .HasColumnType("time");

                builder.Property(e => e.QuietHoursEnd)
                    .HasColumnType("time");

                builder.Property(e => e.MaxNotificationsPerHour)
                    .HasDefaultValue(0);

                builder.Property(e => e.MaxNotificationsPerDay)
                    .HasDefaultValue(0);

                builder.Property(e => e.RequireAcknowledgment)
                    .HasDefaultValue(false);

                builder.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.UpdatedBy)
                    .HasMaxLength(100);

                // Foreign key relationships - match existing database constraints
                builder.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_UserNotificationPreference_User");

                // NOTE: The NotificationCategory relationship is configured from NotificationCategoryConfiguration
                // to avoid ambiguity in foreign key mapping and uses constraint name "FK_UserNotificationPreference_Category"

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_UserNotificationPreference_CreatedBy");

                builder.HasOne(d => d.UpdatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.UpdatedBy)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_UserNotificationPreference_UpdatedBy");

                builder.HasQueryFilter(e =>
                    e.User.IsDeleted != true &&
                    e.CreatedByNavigation.IsDeleted != true &&
                    (e.UpdatedByNavigation == null || e.UpdatedByNavigation.IsDeleted != true));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring UserNotificationPreferenceConfiguration: {ex.Message}");
                throw new Exception($"Error configuring UserNotificationPreferenceConfiguration: {ex.Message}", ex);
            }
        }
    }
}