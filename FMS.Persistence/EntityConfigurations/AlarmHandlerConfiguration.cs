using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the AlarmHandler entity
    /// </summary>
    public class AlarmHandlerConfiguration : EntityTypeConfiguration<AlarmHandler>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<AlarmHandler> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("alarm_handler")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.AlarmType, "IX_AlarmHandler_AlarmType");
                builder.HasIndex(e => e.IsActive, "IX_AlarmHandler_IsActive");
                builder.HasIndex(e => e.SiteId, "IX_AlarmHandler_SiteId");
                builder.HasIndex(e => e.TankId, "IX_AlarmHandler_TankId");
                //builder.HasIndex(e => e.DeviceId, "IX_AlarmHandler_DeviceId");
                builder.HasIndex(e => e.NotificationPolicyId, "IX_AlarmHandler_NotificationPolicyId");

                // Properties
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.AlarmType)
                    .HasMaxLength(50)
                    .IsRequired();

                builder.Property(e => e.AlarmId)
                    .HasColumnType("int(11)");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)");

                builder.Property(e => e.TankId)
                    .HasColumnType("int(11)");

                //builder.Property(e => e.DeviceId)
                //    .HasColumnType("int(11)");

                builder.Property(e => e.TriggerConditions)
                    .HasColumnType("json");

                builder.Property(e => e.NotificationPolicyId)
                    .HasColumnType("int(11)")
                    .IsRequired();

                builder.Property(e => e.CreateIssueTracker)
                    .HasDefaultValue(false);

                builder.Property(e => e.IssueCategory)
                    .HasColumnType("int(11)");

                builder.Property(e => e.IssuePriority)
                    .HasColumnType("int(11)");

                builder.Property(e => e.AssignIssueTo)
                    .HasMaxLength(100);

                builder.Property(e => e.CooldownMinutes)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(30);

                builder.Property(e => e.MaxNotificationsPerDay)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0);

                builder.Property(e => e.EnableEscalation)
                    .HasDefaultValue(false);

                builder.Property(e => e.EscalationRules)
                    .HasColumnType("json");

                builder.Property(e => e.MessageTemplate)
                    .HasColumnType("text");

                builder.Property(e => e.AdditionalData)
                    .HasColumnType("json");

                builder.Property(e => e.Priority)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("Medium");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.ModifiedAt)
                    .HasColumnType("datetime");

                builder.Property(e => e.TriggerCount)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0);

                builder.Property(e => e.LastTriggeredAt)
                    .HasColumnType("datetime");

                // Relationships
                builder.HasOne(d => d.Alarm)
                    .WithMany()
                    .HasForeignKey(d => d.AlarmId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_Alarm");

                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_Site");

                builder.HasOne(d => d.Tank)
                    .WithMany()
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_Tank");

                //builder.HasOne(d => d.Device)
                //    .WithMany()
                //    .HasForeignKey(d => d.DeviceId)
                //    .OnDelete(DeleteBehavior.SetNull)
                //    .HasConstraintName("FK_AlarmHandler_Device");

                builder.HasOne(d => d.NotificationPolicy)
                    .WithMany()
                    .HasForeignKey(d => d.NotificationPolicyId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_AlarmHandler_NotificationPolicy");

                builder.HasOne(d => d.IssueCategoryNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssueCategory)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_IssueCategory");

                builder.HasOne(d => d.IssuePriorityNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssuePriority)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_IssuePriority");

                builder.HasOne(d => d.AssignIssueToNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.AssignIssueTo)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_AssignIssueTo");

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_AlarmHandler_CreatedBy");

                builder.HasOne(d => d.ModifiedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.ModifiedBy)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandler_ModifiedBy");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring AlarmHandler: {ex.Message}");
                throw new Exception($"Error configuring AlarmHandlerConfiguration: {ex.Message}", ex);
            }
        }
    }
}