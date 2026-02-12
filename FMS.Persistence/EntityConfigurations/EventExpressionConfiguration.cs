using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// EF Core configuration for the EventExpression entity.
    /// Maps to the event_expressions table in MySQL.
    /// </summary>
    public class EventExpressionConfiguration : EntityTypeConfiguration<EventExpression>
    {
        public override void Configure(EntityTypeBuilder<EventExpression> builder)
        {
            try
            {
                builder.ToTable("event_expressions")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.EventType)
                    .IsRequired()
                    .HasMaxLength(50);

                builder.Property(e => e.MinimumSeverity)
                    .HasMaxLength(20);

                builder.Property(e => e.Conditions)
                    .HasColumnType("json");

                builder.Property(e => e.NotificationPolicyId)
                    .HasColumnType("int(11)")
                    .IsRequired();

                builder.Property(e => e.CooldownMinutes)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(30);

                builder.Property(e => e.MaxNotificationsPerDay)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0);

                builder.Property(e => e.EscalationRules)
                    .HasColumnType("json");

                builder.Property(e => e.MessageTemplate)
                    .HasColumnType("text");

                builder.Property(e => e.Priority)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("Medium");

                builder.Property(e => e.CreateActiveEvent)
                    .HasDefaultValue(true);

                builder.Property(e => e.CreatedBy)
                    .IsRequired()
                    .HasMaxLength(100);

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

                builder.Property(e => e.AssignIssueTo)
                    .HasMaxLength(100);

                // Indexes
                builder.HasIndex(e => new { e.EventType, e.IsActive })
                    .HasDatabaseName("IX_EventExpressions_EventType_IsActive");

                builder.HasIndex(e => e.SiteId)
                    .HasDatabaseName("IX_EventExpressions_SiteId");

                builder.HasIndex(e => e.TankId)
                    .HasDatabaseName("IX_EventExpressions_TankId");

                builder.HasIndex(e => e.NotificationPolicyId)
                    .HasDatabaseName("IX_EventExpressions_PolicyId");

                // Relationships
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_Site");

                builder.HasOne(d => d.Tank)
                    .WithMany()
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_Tank");

                builder.HasOne(d => d.NotificationPolicy)
                    .WithMany()
                    .HasForeignKey(d => d.NotificationPolicyId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_EventExpressions_Policy");

                builder.HasOne(d => d.IssueCategoryNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssueCategory)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_IssueCategory");

                builder.HasOne(d => d.IssuePriorityNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.IssuePriority)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_IssuePriority");

                builder.HasOne(d => d.AssignIssueToNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.AssignIssueTo)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_AssignIssueTo");

                builder.HasOne(d => d.CreatedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_EventExpressions_CreatedBy");

                builder.HasOne(d => d.ModifiedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.ModifiedBy)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EventExpressions_ModifiedBy");

                builder.HasMany(e => e.Executions)
                    .WithOne(ex => ex.EventExpression)
                    .HasForeignKey(ex => ex.EventExpressionId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_EventExpressionExecutions_Expression");

                builder.HasMany(e => e.ActiveEvents)
                    .WithOne(ae => ae.EventExpression)
                    .HasForeignKey(ae => ae.EventExpressionId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_ActiveEvents_Expression");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring EventExpressionConfiguration: {ex.Message}");
                throw;
            }
        }
    }
}
