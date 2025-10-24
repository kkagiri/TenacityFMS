using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Entity Framework configuration for ActiveAlarm
    /// Configures ActiveAlarm entity for MySQL 5.6 with proper constraints and indexes
    /// </summary>
    public class ActiveAlarmConfiguration : IEntityTypeConfiguration<ActiveAlarm>
    {
        public void Configure(EntityTypeBuilder<ActiveAlarm> builder)
        {
            builder.ToTable("activealarms");

            // Primary key
            builder.HasKey(e => e.Id);

            // Properties with MySQL 5.6 specific configurations
            builder.Property(e => e.AlarmType)
                .IsRequired()
                .HasMaxLength(50)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.State)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Active")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.TriggerSource)
                .IsRequired()
                .HasMaxLength(20)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.TriggeredAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");

            builder.Property(e => e.AcknowledgedAt)
                .IsRequired(false)
                .HasColumnType("timestamp");

            builder.Property(e => e.ResolvedAt)
                .IsRequired(false)
                .HasColumnType("timestamp");

            builder.Property(e => e.AcknowledgedBy)
                .HasMaxLength(100)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ResolvedBy)
                .HasMaxLength(100)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Severity)
                .IsRequired()
                .HasConversion<int>() // Store enum as int
                .HasDefaultValue(DiscrepancySeverity.Medium);

            builder.Property(e => e.Priority)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Medium")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Message)
                .IsRequired()
                .HasMaxLength(500)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Description)
                .HasMaxLength(1000)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Nullable foreign key fields
            builder.Property(e => e.SiteId)
                .IsRequired(false);

            builder.Property(e => e.TankId)
                .IsRequired(false);

            //builder.Property (e => e.DeviceId)
            //    .IsRequired (false);

            builder.Property(e => e.PtsDeviceId)
                .HasMaxLength(50)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Decimal properties for threshold/actual values
            builder.Property(e => e.ThresholdValue)
                .HasPrecision(18, 4)
                .IsRequired(false);

            builder.Property(e => e.ActualValue)
                .HasPrecision(18, 4)
                .IsRequired(false);

            builder.Property(e => e.Unit)
                .HasMaxLength(20)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Related entity IDs
            builder.Property(e => e.AlarmHandlerId)
                .IsRequired(false);

            builder.Property(e => e.AlertRecordId)
                .IsRequired(false);

            builder.Property(e => e.ReconciliationDiscrepancyId)
                .IsRequired(false);

            // JSON and text properties
            builder.Property(e => e.AdditionalData)
                .HasColumnType("TEXT")
                .IsRequired(false);

            builder.Property(e => e.ResolutionNotes)
                .HasMaxLength(1000)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Boolean properties with default values
            builder.Property(e => e.SuppressNotifications)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(e => e.AutoResolveMinutes)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(e => e.EscalationLevel)
                .IsRequired()
                .HasDefaultValue(0);

            builder.Property(e => e.LastEscalatedAt)
                .IsRequired(false)
                .HasColumnType("timestamp");

            // Foreign key relationships
            builder.HasOne(e => e.Site)
                .WithMany()
                .HasForeignKey(e => e.SiteId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false)
                .HasConstraintName("FK_ActiveAlarms_Sites");

            builder.HasOne(e => e.Tank)
                .WithMany()
                .HasForeignKey(e => e.TankId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false)
                .HasConstraintName("FK_ActiveAlarms_Tanks");

            //builder.HasOne (e => e.Device)
            //    .WithMany ()
            //    .HasForeignKey (e => e.DeviceId)
            //    .OnDelete (DeleteBehavior.SetNull)
            //    .IsRequired (false)
            //    .HasConstraintName ("FK_ActiveAlarms_Devices");

            builder.HasOne(e => e.AlarmHandler)
                .WithMany()
                .HasForeignKey(e => e.AlarmHandlerId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false)
                .HasConstraintName("FK_ActiveAlarms_AlarmHandlers");

            builder.HasOne(e => e.PTSAlertRecord)
                .WithMany()
                .HasForeignKey(e => e.AlertRecordId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false)
                .HasConstraintName("FK_ActiveAlarms_PTSAlertRecords");

            builder.HasOne(e => e.ReconciliationDiscrepancy)
                .WithMany()
                .HasForeignKey(e => e.ReconciliationDiscrepancyId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false)
                .HasConstraintName("FK_ActiveAlarms_ReconciliationDiscrepancies");

            builder.HasMany(e => e.Notifications)
                .WithOne(n => n.ActiveAlarm)
                .HasForeignKey(n => n.ActiveAlarmId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            builder.HasMany(e => e.IssueTrackers)
                .WithOne(i => i.ActiveAlarm)
                .HasForeignKey(i => i.ActiveAlarmId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);

            // Indexes for performance
            builder.HasIndex(e => e.AlarmType)
                .HasDatabaseName("IX_ActiveAlarms_AlarmType");

            builder.HasIndex(e => e.State)
                .HasDatabaseName("IX_ActiveAlarms_State");

            builder.HasIndex(e => e.TriggerSource)
                .HasDatabaseName("IX_ActiveAlarms_TriggerSource");

            builder.HasIndex(e => e.Priority)
                .HasDatabaseName("IX_ActiveAlarms_Priority");

            builder.HasIndex(e => e.Severity)
                .HasDatabaseName("IX_ActiveAlarms_Severity");

            builder.HasIndex(e => e.SiteId)
                .HasDatabaseName("IX_ActiveAlarms_SiteId");

            builder.HasIndex(e => e.TankId)
                .HasDatabaseName("IX_ActiveAlarms_TankId");

            //builder.HasIndex (e => e.DeviceId)
            //    .HasDatabaseName ("IX_ActiveAlarms_DeviceId");

            builder.HasIndex(e => e.PtsDeviceId)
                .HasDatabaseName("IX_ActiveAlarms_PtsDeviceId");

            builder.HasIndex(e => e.TriggeredAt)
                .HasDatabaseName("IX_ActiveAlarms_TriggeredAt");

            builder.HasIndex(e => e.AcknowledgedAt)
                .HasDatabaseName("IX_ActiveAlarms_AcknowledgedAt");

            builder.HasIndex(e => e.ResolvedAt)
                .HasDatabaseName("IX_ActiveAlarms_ResolvedAt");

            // Composite indexes for common queries
            builder.HasIndex(e => new { e.State, e.Priority })
                .HasDatabaseName("IX_ActiveAlarms_State_Priority");

            builder.HasIndex(e => new { e.State, e.TriggeredAt })
                .HasDatabaseName("IX_ActiveAlarms_State_TriggeredAt");

            builder.HasIndex(e => new { e.AlarmType, e.State })
                .HasDatabaseName("IX_ActiveAlarms_AlarmType_State");

            builder.HasIndex(e => new { e.SiteId, e.State })
                .HasDatabaseName("IX_ActiveAlarms_SiteId_State");

            builder.HasIndex(e => new { e.TankId, e.State })
                .HasDatabaseName("IX_ActiveAlarms_TankId_State");

            builder.HasIndex(e => new { e.State, e.AutoResolveMinutes })
                .HasDatabaseName("IX_ActiveAlarms_State_AutoResolveMinutes");

            builder.HasIndex(e => new { e.State, e.EscalationLevel, e.LastEscalatedAt })
                .HasDatabaseName("IX_ActiveAlarms_State_Escalation");

            // Unique constraints for preventing duplicate active alarms
            // Note: MySQL 5.6 may not support filtered indexes, so we use a composite unique index
            //builder.HasIndex (e => new { e.AlarmType, e.TriggerSource, e.SiteId, e.TankId, e.DeviceId, e.State })
            //    .HasDatabaseName ("IX_ActiveAlarms_Unique_Source");
        }
    }
}