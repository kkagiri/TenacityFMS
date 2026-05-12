using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for the EventExpressionExecution entity.
    /// Maps to the event_expression_executions table in MySQL.
    /// </summary>
    public class EventExpressionExecutionConfiguration : EntityTypeConfiguration<EventExpressionExecution>
    {
        public override void Configure(EntityTypeBuilder<EventExpressionExecution> builder)
        {
            try
            {
                builder.ToTable("event_expression_executions");

                builder.HasKey(e => e.Id);

                builder.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.EventExpressionId)
                    .IsRequired();

                builder.Property(e => e.EventType)
                    .IsRequired()
                    .HasMaxLength(50);

                builder.Property(e => e.ExecutedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.WasTriggered)
                    .HasDefaultValue(false);

                builder.Property(e => e.SuppressedReason)
                    .HasMaxLength(100);

                builder.Property(e => e.EventData)
                    .HasColumnType("json");

                builder.Property(e => e.ErrorMessage)
                    .HasMaxLength(500);

                builder.Property(e => e.ExecutionTimeMs)
                    .HasDefaultValue(0);

                builder.Property(e => e.ScopeKey)
                    .HasMaxLength(50)
                    .HasDefaultValue("global");

                // Indexes
                builder.HasIndex(e => new { e.EventExpressionId, e.ExecutedAt })
                    .HasDatabaseName("IX_Executions_ExpressionId_ExecutedAt");

                // Scope-specific cooldown queries: (ExpressionId, ScopeKey, ExecutedAt)
                builder.HasIndex(e => new { e.EventExpressionId, e.ScopeKey, e.ExecutedAt })
                    .HasDatabaseName("IX_Executions_ExpressionId_ScopeKey_ExecutedAt");

                builder.HasIndex(e => new { e.EventType, e.ExecutedAt })
                    .HasDatabaseName("IX_Executions_EventType_ExecutedAt");

                // Relationships
                builder.HasOne(d => d.EventExpression)
                    .WithMany(e => e.Executions)
                    .HasForeignKey(d => d.EventExpressionId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Executions_Expression");

                builder.HasOne(d => d.Notification)
                    .WithMany()
                    .HasForeignKey(d => d.NotificationId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Executions_Notification");

                builder.HasOne(d => d.IssueTracker)
                    .WithMany()
                    .HasForeignKey(d => d.IssueTrackerId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Executions_IssueTracker");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring EventExpressionExecutionConfiguration: {ex.Message}");
                throw;
            }
        }
    }
}


