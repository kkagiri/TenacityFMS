using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskEntity = FMS.Domain.Entities.TaskEntity;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Task entity
    /// </summary>
    public class TaskConfiguration : EntityTypeConfiguration<TaskEntity> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<TaskEntity> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");
                builder.ToTable ("tasks");

                builder.Property (e => e.Id)
                    .HasColumnType ("int(11)")
                    .HasColumnName ("id");

                builder.Property (e => e.Title)
                    .IsRequired ()
                    .HasMaxLength (255)
                    .HasColumnName ("title");

                builder.Property (e => e.Description)
                    .IsRequired ()
                    .HasColumnType ("text")
                    .HasColumnName ("description");

                builder.Property (e => e.Type)
                    .IsRequired ()
                    .HasConversion<string> ()
                    .HasMaxLength (50)
                    .HasColumnName ("type");

                builder.Property (e => e.Priority)
                    .IsRequired ()
                    .HasConversion<string> ()
                    .HasMaxLength (50)
                    .HasColumnName ("priority");

                builder.Property (e => e.Status)
                    .IsRequired ()
                    .HasConversion<string> ()
                    .HasMaxLength (50)
                    .HasColumnName ("status");

                builder.Property (e => e.AssignedTo)
                    .HasMaxLength (450)
                    .HasColumnName ("assigned_to");

                builder.Property (e => e.AssignedBy)
                    .HasMaxLength (450)
                    .HasColumnName ("assigned_by");

                builder.Property (e => e.AssignedOn)
                    .HasColumnType ("datetime")
                    .HasColumnName ("assigned_on");

                builder.Property (e => e.DueDate)
                    .HasColumnType ("datetime")
                    .HasColumnName ("due_date");

                builder.Property (e => e.SourceType)
                    .HasMaxLength (50)
                    .HasColumnName ("source_type");

                builder.Property (e => e.SourceId)
                    .HasColumnName ("source_id");

                builder.Property (e => e.SiteId)
                    .HasColumnName ("site_id");

                builder.Property (e => e.TankId)
                    .HasColumnName ("tank_id");

                builder.Property (e => e.CompletedOn)
                    .HasColumnType ("datetime")
                    .HasColumnName ("completed_on");

                builder.Property (e => e.CompletedBy)
                    .HasMaxLength (450)
                    .HasColumnName ("completed_by");

                builder.Property (e => e.CompletionNotes)
                    .HasColumnType ("text")
                    .HasColumnName ("completion_notes");

                builder.Property (e => e.CreatedBy)
                    .IsRequired ()
                    .HasMaxLength (450)
                    .HasColumnName ("created_by");

                builder.Property (e => e.CreatedOn)
                    .IsRequired ()
                    .HasColumnType ("datetime")
                    .HasColumnName ("created_on");

                builder.Property (e => e.UpdatedBy)
                    .HasMaxLength (450)
                    .HasColumnName ("updated_by");

                builder.Property (e => e.UpdatedOn)
                    .HasColumnType ("datetime")
                    .HasColumnName ("updated_on");

                // Configure foreign key relationships
                builder.HasOne (e => e.AssignedToNavigation)
                    .WithMany ()
                    .HasForeignKey (e => e.AssignedTo)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_assigned_to");

                builder.HasOne (e => e.AssignedByNavigation)
                    .WithMany ()
                    .HasForeignKey (e => e.AssignedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_assigned_by");

                builder.HasOne (e => e.CreatedByNavigation)
                    .WithMany ()
                    .HasForeignKey (e => e.CreatedBy)
                    .OnDelete (DeleteBehavior.Restrict)
                    .HasConstraintName ("FK_task_created_by");

                builder.HasOne (e => e.UpdatedByNavigation)
                    .WithMany ()
                    .HasForeignKey (e => e.UpdatedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_updated_by");

                builder.HasOne (e => e.CompletedByNavigation)
                    .WithMany ()
                    .HasForeignKey (e => e.CompletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_completed_by");

                builder.HasOne (e => e.Site)
                    .WithMany ()
                    .HasForeignKey (e => e.SiteId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_site");

                builder.HasOne (e => e.Tank)
                    .WithMany ()
                    .HasForeignKey (e => e.TankId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_task_tank");

                // Create indexes
                builder.HasIndex (e => e.AssignedTo)
                    .HasDatabaseName ("IX_task_assigned_to");

                builder.HasIndex (e => e.Status)
                    .HasDatabaseName ("IX_task_status");

                builder.HasIndex (e => e.Priority)
                    .HasDatabaseName ("IX_task_priority");

                builder.HasIndex (e => e.DueDate)
                    .HasDatabaseName ("IX_task_due_date");

                builder.HasIndex (e => e.SiteId)
                    .HasDatabaseName ("IX_task_site_id");

                builder.HasIndex (e => e.TankId)
                    .HasDatabaseName ("IX_task_tank_id");

                builder.HasIndex (e => e.SourceType)
                    .HasDatabaseName ("IX_task_source_type");

                builder.HasIndex (e => new { e.SourceType, e.SourceId })
                    .HasDatabaseName ("IX_task_source");

                builder.HasIndex (e => e.CreatedOn)
                    .HasDatabaseName ("IX_task_created_on");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring Task: {ex.Message}");
                throw new Exception ($"Error configuring TaskConfiguration: {ex.Message}", ex);
            }
        }
    }
}