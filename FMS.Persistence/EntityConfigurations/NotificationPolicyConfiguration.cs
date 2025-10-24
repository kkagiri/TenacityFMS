using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the NotificationPolicy entity
    /// </summary>
    public class NotificationPolicyConfiguration : EntityTypeConfiguration<NotificationPolicy>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<NotificationPolicy> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("notification_policy")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.Name, "IX_NotificationPolicy_Name");
                builder.HasIndex(e => e.NotificationCategoryId, "IX_NotificationPolicy_Category");
                builder.HasIndex(e => e.NotificationType, "IX_NotificationPolicy_NotificationType");
                builder.HasIndex(e => e.IsActive, "IX_NotificationPolicy_IsActive");
                builder.HasIndex(e => e.SiteId, "IX_NotificationPolicy_SiteId");
                builder.HasIndex(e => e.PtsDeviceId, "IX_NotificationPolicy_PtsDeviceId");
                builder.HasIndex(e => e.CreatedAt, "IX_NotificationPolicy_CreatedAt");
                builder.HasIndex(e => e.CreatedBy, "IX_NotificationPolicy_CreatedBy");

                // Properties
                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
                builder.Property(e => e.Description).HasMaxLength(500);
                builder.Property(e => e.IsActive).HasDefaultValue(true);
                builder.Property(e => e.NotificationCategoryId).IsRequired().HasColumnType("int(11)");
                builder.Property(e => e.NotificationType).HasMaxLength(50).IsRequired();
                builder.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("Medium");
                builder.Property(e => e.MaxNotificationsPerHour).HasDefaultValue(0);
                builder.Property(e => e.MaxNotificationsPerDay).HasDefaultValue(0);
                builder.Property(e => e.CooldownMinutes).HasDefaultValue(0);
                builder.Property(e => e.EnableEmail).HasDefaultValue(true);
                builder.Property(e => e.EnableSms).HasDefaultValue(false);
                builder.Property(e => e.EnableSystem).HasDefaultValue(true);
                builder.Property(e => e.EnableSound).HasDefaultValue(false);
                builder.Property(e => e.SoundFile).HasMaxLength(255);
                builder.Property(e => e.EscalationRules).HasColumnType("TEXT");
                builder.Property(e => e.TriggerConditions).HasColumnType("TEXT");
                builder.Property(e => e.RecipientRules).HasColumnType("TEXT");
                builder.Property(e => e.ScheduleConfiguration).HasColumnType("TEXT");

                //Cursor: Configure PtsDeviceId to match Ptsdevice.Ptsid exactly
                builder.Property(e => e.PtsDeviceId)
                    .HasMaxLength(100) // Match Ptsdevice.Ptsid length
                    .HasColumnName("PtsDeviceId"); // Explicit column name

                builder.Property(e => e.TitleTemplate).HasMaxLength(255);
                builder.Property(e => e.MessageTemplate).HasColumnType("text");
                builder.Property(e => e.EmailTemplate).HasColumnType("text");
                builder.Property(e => e.SmsTemplate).HasMaxLength(500);
                builder.Property(e => e.RequireAcknowledgment).HasDefaultValue(false);
                builder.Property(e => e.AcknowledgmentTimeoutMinutes).HasDefaultValue(0);
                builder.Property(e => e.CreateIssueTracker).HasDefaultValue(false);
                builder.Property(e => e.CreatedBy).HasMaxLength(100).IsRequired();
                builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                builder.Property(e => e.ModifiedBy).HasMaxLength(100);
                builder.Property(e => e.NotificationCount).HasDefaultValue(0);

                // Foreign key relationships
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_NotificationPolicy_Site");

                //Cursor: Configure PtsDevice relationship to avoid conflicts with Notification
                builder.HasOne(d => d.PtsDevice)
                    .WithMany(p => p.NotificationPolicies)
                    .HasForeignKey(d => d.PtsDeviceId)
                    .HasPrincipalKey(p => p.Ptsid)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_NotificationPolicy_PtsDevice");

                builder.HasOne(d => d.NotificationCategory)
                    .WithMany(c => c.NotificationPolicies)
                    .HasForeignKey(d => d.NotificationCategoryId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_NotificationPolicy_Category");

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_NotificationPolicy_CreatedBy");

                builder.HasOne(d => d.ModifiedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.ModifiedBy)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_NotificationPolicy_ModifiedBy");

                builder.HasOne(d => d.IssueCategoryNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssueCategory)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_NotificationPolicy_IssueCategory");

                builder.HasOne(d => d.IssuePriorityNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssuePriority)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_NotificationPolicy_IssuePriority");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring NotificationPolicyConfiguration: {ex.Message}");
                throw new Exception($"Error configuring NotificationPolicyConfiguration: {ex.Message}", ex);
            }
        }
    }
}