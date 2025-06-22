using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the AlarmHandlerExecution entity
    /// </summary>
    public class AlarmHandlerExecutionConfiguration : EntityTypeConfiguration<AlarmHandlerExecution>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<AlarmHandlerExecution> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("alarm_handler_execution")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.AlarmHandlerId, "IX_AlarmHandlerExecution_AlarmHandlerId");
                builder.HasIndex(e => e.ExecutedAt, "IX_AlarmHandlerExecution_ExecutedAt");
                builder.HasIndex(e => e.Success, "IX_AlarmHandlerExecution_Success");

                // Properties
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();

                builder.Property(e => e.AlarmHandlerId)
                    .HasColumnType("int(11)")
                    .IsRequired();

                builder.Property(e => e.NotificationId)
                    .HasColumnType("int(11)");

                builder.Property(e => e.IssueTrackerId)
                    .HasColumnType("int(11)");

                builder.Property(e => e.ExecutedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.Success)
                    .HasDefaultValue(true);

                builder.Property(e => e.ErrorMessage)
                    .HasMaxLength(500);

                builder.Property(e => e.TriggerData)
                    .HasColumnType("json");

                builder.Property(e => e.ExecutionDetails)
                    .HasColumnType("json");

                builder.Property(e => e.ExecutionTimeMs)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0);

                // Relationships
                builder.HasOne(d => d.AlarmHandler)
                    .WithMany(p => p.Executions)
                    .HasForeignKey(d => d.AlarmHandlerId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_AlarmHandlerExecution_AlarmHandler");

                builder.HasOne(d => d.Notification)
                    .WithMany()
                    .HasForeignKey(d => d.NotificationId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_AlarmHandlerExecution_Notification");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring AlarmHandlerExecution: {ex.Message}");
                throw new Exception($"Error configuring AlarmHandlerExecutionConfiguration: {ex.Message}", ex);
            }
        }
    }
}