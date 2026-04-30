using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for the ActiveEvent entity.
    /// Maps to the active_events table in MySQL.
    /// </summary>
    public class ActiveEventConfiguration : IEntityTypeConfiguration<ActiveEvent>
    {
        public void Configure(EntityTypeBuilder<ActiveEvent> builder)
        {
            builder.ToTable("active_events");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.EventType)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(e => e.State)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Active");

            builder.Property(e => e.TriggerSource)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(e => e.Severity)
                .HasDefaultValue(2);

            builder.Property(e => e.Priority)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Medium");

            builder.Property(e => e.Message)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(e => e.Description)
                .HasMaxLength(1000);

            builder.Property(e => e.PtsDeviceId)
                .HasMaxLength(50);

            builder.Property(e => e.TriggeredAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.AcknowledgedAt);
            builder.Property(e => e.ResolvedAt);
            builder.Property(e => e.LastEscalatedAt);

            builder.Property(e => e.AcknowledgedBy).HasMaxLength(100);
            builder.Property(e => e.ResolvedBy).HasMaxLength(100);
            builder.Property(e => e.TriggeredBy).HasMaxLength(100);

            builder.Property(e => e.ThresholdValue).HasPrecision(18, 4);
            builder.Property(e => e.ActualValue).HasPrecision(18, 4);
            builder.Property(e => e.Unit).HasMaxLength(20);

            builder.Property(e => e.EscalationLevel)
                .HasDefaultValue(0);

            builder.Property(e => e.AutoResolveMinutes)
                .HasDefaultValue(0);

            builder.Property(e => e.EventData)
                .HasColumnType("json");

            builder.Property(e => e.SuppressNotifications)
                .HasDefaultValue(false);

            // CreatedAt and UpdatedAt columns do not exist in the active_events table yet.
            // Ignore them to prevent EF from generating SELECT a.CreatedAt which fails.
            // TODO: run ALTER TABLE active_events ADD COLUMN CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP, ADD COLUMN UpdatedAt DATETIME NULL;
            builder.Ignore(e => e.CreatedAt);
            builder.Ignore(e => e.UpdatedAt);

            // Indexes
            builder.HasIndex(e => new { e.State, e.TriggeredAt })
                .HasDatabaseName("IX_ActiveEvents_State_TriggeredAt");

            builder.HasIndex(e => new { e.EventType, e.State })
                .HasDatabaseName("IX_ActiveEvents_EventType_State");

            builder.HasIndex(e => new { e.SiteId, e.State })
                .HasDatabaseName("IX_ActiveEvents_SiteId_State");

            builder.HasIndex(e => e.EventExpressionId)
                .HasDatabaseName("IX_ActiveEvents_ExpressionId");

            // Relationships
            builder.HasOne(d => d.Site)
                .WithMany()
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ActiveEvents_Site");

            builder.HasOne(d => d.Tank)
                .WithMany()
                .HasForeignKey(d => d.TankId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ActiveEvents_Tank");

            builder.HasOne(d => d.EventExpression)
                .WithMany(e => e.ActiveEvents)
                .HasForeignKey(d => d.EventExpressionId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_ActiveEvents_Expression");

            // Ignore IssueTrackers navigation for now — the issuetracker table
            // does not yet have an ActiveEventId FK column. This prevents EF from
            // creating a shadow property that fails at query time.
            builder.Ignore(e => e.IssueTrackers);

            // Ignore Notifications navigation for now — the notification table
            // does not yet have an ActiveEventId FK column in current deployments.
            // Without this, EF creates a shadow FK and generates INSERTs that fail.
            builder.Ignore(e => e.Notifications);
        }
    }
}


