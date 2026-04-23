using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Notification entity
    /// </summary>
    public class NotificationConfiguration : EntityTypeConfiguration<Notification>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Notification> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("notification")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.NotificationId, "IX_Notification_NotificationId").IsUnique();
                builder.HasIndex(e => e.Type, "IX_Notification_Type");
                builder.HasIndex(e => e.NotificationCategoryId, "IX_Notification_Category");
                builder.HasIndex(e => e.Priority, "IX_Notification_Priority");
                builder.HasIndex(e => e.Status, "IX_Notification_Status");
                builder.HasIndex(e => e.CreatedAt, "IX_Notification_CreatedAt");
                builder.HasIndex(e => e.ScheduledAt, "IX_Notification_ScheduledAt");
                builder.HasIndex(e => e.SentAt, "IX_Notification_SentAt");
                builder.HasIndex(e => e.SiteId, "IX_Notification_SiteId");
                builder.HasIndex(e => e.TankId, "IX_Notification_TankId");
                builder.HasIndex(e => e.VehicleId, "IX_Notification_VehicleId");
                builder.HasIndex(e => e.PtsDeviceId, "IX_Notification_PtsDeviceId");
                builder.HasIndex(e => e.NotificationPolicyId, "IX_Notification_NotificationPolicyId");
                builder.HasIndex(e => e.TriggeredBy, "IX_Notification_TriggeredBy");
                builder.HasIndex(e => e.ActiveAlarmId, "IX_Notification_AlarmId");

                // Properties - Configure ALL properties explicitly
                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.NotificationId).HasMaxLength(100).IsRequired();
                builder.Property(e => e.Type).HasMaxLength(50).IsRequired();
                builder.Property(e => e.Category)
                    .HasMaxLength(100)
                    .HasColumnName("category");
                builder.Property(e => e.NotificationCategoryId)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0)
                    .HasColumnName("NotificationCategoryId");
                builder.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("Medium");
                builder.Property(e => e.Title).HasMaxLength(255).IsRequired();
                builder.Property(e => e.Message).HasColumnType("text").IsRequired();
                builder.Property(e => e.Data).HasColumnType("text"); // Changed from json to text to match DB
                builder.Property(e => e.Link)
                    .HasMaxLength(500)
                    .HasColumnName("Link")
                    .IsRequired(false);
                builder.Property(e => e.LinkLabel)
                    .HasMaxLength(100)
                    .HasColumnName("LinkLabel")
                    .IsRequired(false);
                builder.Property(e => e.TriggerSource).HasMaxLength(50).IsRequired();
                builder.Property(e => e.TriggeredBy).HasMaxLength(100);
                builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                builder.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");
                builder.Property(e => e.SendAttempts).HasDefaultValue(0);
                builder.Property(e => e.ErrorMessage).HasMaxLength(500);
                builder.Property(e => e.IsRead).HasDefaultValue(false);
                builder.Property(e => e.IsArchived).HasDefaultValue(false);

                // CRITICAL: Explicitly configure ActiveAlarmId to prevent shadow properties
                builder.Property(e => e.ActiveAlarmId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ActiveAlarmId")
                    .IsRequired(false); // Make it nullable to match DB

                // Configure other nullable FKs explicitly
                builder.Property(e => e.SiteId).HasColumnType("int(11)").IsRequired(false);
                builder.Property(e => e.TankId).HasColumnType("int(11)").IsRequired(false);
                builder.Property(e => e.VehicleId).HasColumnType("int(11)").IsRequired(false);
                builder.Property(e => e.IssueTrackerId).HasColumnType("int(11)").IsRequired(false);
                builder.Property(e => e.NotificationPolicyId).HasColumnType("int(11)").IsRequired(false);

                builder.Property(e => e.PtsDeviceId)
                    .HasMaxLength(100)
                    .HasColumnName("PtsDeviceId")
                    .IsRequired(false);
                // Configure timestamp properties explicitly
                builder.Property(e => e.ScheduledAt).HasColumnType("timestamp").IsRequired(false);
                builder.Property(e => e.SentAt).HasColumnType("timestamp").IsRequired(false);
                builder.Property(e => e.ReadAt).HasColumnType("timestamp").IsRequired(false);
                builder.Property(e => e.ArchivedAt).HasColumnType("timestamp").IsRequired(false);

                // Foreign key relationships - Configure AFTER properties
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_Site");

                builder.HasOne(d => d.Tank)
                    .WithMany()
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_Tank");

                builder.HasOne(d => d.Vehicle)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_Vehicle");

                builder.HasOne(d => d.PtsDevice)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.PtsDeviceId)
                    .HasPrincipalKey(p => p.Ptsid)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_PtsDevice");

                builder.HasOne(d => d.IssueTracker)
                    .WithMany()
                    .HasForeignKey(d => d.IssueTrackerId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_IssueTracker");

                builder.HasOne(d => d.NotificationCategory)
                    .WithMany()
                    .HasForeignKey(d => d.NotificationCategoryId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Notification_NotificationCategories");

                builder.HasOne(d => d.NotificationPolicy)
                    .WithMany(p => p.Notifications)
                    .HasForeignKey(d => d.NotificationPolicyId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_NotificationPolicy");

                builder.HasOne(d => d.TriggeredByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.TriggeredBy)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Notification_TriggeredBy");

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring NotificationConfiguration: {ex.Message}");
                throw new Exception($"Error configuring NotificationConfiguration: {ex.Message}", ex);
            }
        }
    }
}