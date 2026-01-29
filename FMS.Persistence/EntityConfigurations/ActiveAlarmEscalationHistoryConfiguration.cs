using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Entity Framework configuration for ActiveAlarmEscalationHistory
    /// Tracks individual escalation events with full audit trail
    /// </summary>
    public class ActiveAlarmEscalationHistoryConfiguration : IEntityTypeConfiguration<ActiveAlarmEscalationHistory>
    {
        public void Configure(EntityTypeBuilder<ActiveAlarmEscalationHistory> builder)
        {
            builder.ToTable("activealarmescalationhistory");

            // Primary key
            builder.HasKey(e => e.Id);

            // Foreign key to ActiveAlarm
            builder.Property(e => e.ActiveAlarmId)
                .IsRequired();

            // Escalation level
            builder.Property(e => e.EscalationLevel)
                .IsRequired();

            // Priority transitions
            builder.Property(e => e.FromPriority)
                .IsRequired()
                .HasMaxLength(20)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ToPriority)
                .IsRequired()
                .HasMaxLength(20)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // User who escalated
            builder.Property(e => e.EscalatedBy)
                .HasMaxLength(100)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Escalation reason
            builder.Property(e => e.EscalationReason)
                .HasMaxLength(50)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Timestamp
            builder.Property(e => e.EscalatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp");

            // Optional notes
            builder.Property(e => e.Notes)
                .HasMaxLength(500)
                .IsRequired(false)
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            // Foreign key relationship
            builder.HasOne(e => e.ActiveAlarm)
                .WithMany(a => a.EscalationHistory)
                .HasForeignKey(e => e.ActiveAlarmId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired()
                .HasConstraintName("FK_ActiveAlarmEscalationHistory_ActiveAlarms");

            // Indexes for performance
            builder.HasIndex(e => e.ActiveAlarmId)
                .HasDatabaseName("IX_ActiveAlarmEscalationHistory_ActiveAlarmId");

            builder.HasIndex(e => e.EscalatedAt)
                .HasDatabaseName("IX_ActiveAlarmEscalationHistory_EscalatedAt");

            builder.HasIndex(e => new { e.ActiveAlarmId, e.EscalationLevel })
                .HasDatabaseName("IX_ActiveAlarmEscalationHistory_AlarmAndLevel");

            builder.HasIndex(e => new { e.ActiveAlarmId, e.EscalatedAt })
                .HasDatabaseName("IX_ActiveAlarmEscalationHistory_AlarmAndTime");
        }
    }
}
