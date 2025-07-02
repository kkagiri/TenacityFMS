//Cursor - Create TaskEntityConfiguration
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class TaskEntityConfiguration : IEntityTypeConfiguration<TaskEntity> {
        public void Configure (EntityTypeBuilder<TaskEntity> builder) {
            builder.ToTable ("tasks");

            builder.HasKey (t => t.Id);

            builder.Property (t => t.Id)
                .HasColumnName ("id")
                .ValueGeneratedOnAdd ();

            builder.Property (t => t.Title)
                .HasColumnName ("title")
                .HasMaxLength (255)
                .IsRequired ();

            builder.Property (t => t.Description)
                .HasColumnName ("description")
                .HasColumnType ("text")
                .IsRequired ();

            builder.Property (t => t.Type)
                .HasColumnName ("type")
                .HasConversion<int> ()
                .HasComment ("0=Manual, 1=Maintenance, 2=Discrepancy, 3=Stock, 4=Inspection, 5=Calibration, 6=TransactionCorrection")
                .IsRequired ();

            builder.Property (t => t.Priority)
                .HasColumnName ("priority")
                .HasConversion<int> ()
                .HasComment ("0=Low, 1=Medium, 2=High, 3=Critical")
                .IsRequired ();

            builder.Property (t => t.Status)
                .HasColumnName ("status")
                .HasConversion<int> ()
                .HasComment ("0=Pending, 1=InProgress, 2=Completed, 3=Cancelled, 4=Overdue, 5=NeedsApproval")
                .IsRequired ();

            builder.Property (t => t.AssignedTo)
                .HasColumnName ("assigned_to")
                .HasMaxLength (450);

            builder.Property (t => t.AssignedBy)
                .HasColumnName ("assigned_by")
                .HasMaxLength (450);

            builder.Property (t => t.AssignedOn)
                .HasColumnName ("assigned_on")
                .HasColumnType ("datetime");

            builder.Property (t => t.DueDate)
                .HasColumnName ("due_date")
                .HasColumnType ("datetime");

            builder.Property (t => t.SourceType)
                .HasColumnName ("source_type")
                .HasMaxLength (50)
                .HasComment ("Discrepancy, Issue, Manual, TransactionCorrection");

            builder.Property (t => t.SourceId)
                .HasColumnName ("source_id");

            builder.Property (t => t.SiteId)
                .HasColumnName ("site_id");

            builder.Property (t => t.TankId)
                .HasColumnName ("tank_id");

            builder.Property (t => t.CompletedOn)
                .HasColumnName ("completed_on")
                .HasColumnType ("datetime");

            builder.Property (t => t.CompletionNotes)
                .HasColumnName ("completion_notes")
                .HasColumnType ("text");

            builder.Property (t => t.CreatedBy)
                .HasColumnName ("created_by")
                .HasMaxLength (450)
                .IsRequired ();

            builder.Property (t => t.CreatedOn)
                .HasColumnName ("created_on")
                .HasColumnType ("datetime")
                .HasDefaultValueSql ("CURRENT_TIMESTAMP")
                .IsRequired ();

            builder.Property (t => t.UpdatedBy)
                .HasColumnName ("updated_by")
                .HasMaxLength (450);

            builder.Property (t => t.UpdatedOn)
                .HasColumnName ("updated_on")
                .HasColumnType ("datetime");

            // Indexes
            builder.HasIndex (t => t.AssignedTo)
                .HasDatabaseName ("idx_assigned_to");

            builder.HasIndex (t => new { t.Status, t.Priority })
                .HasDatabaseName ("idx_status_priority");

            builder.HasIndex (t => new { t.SiteId, t.TankId })
                .HasDatabaseName ("idx_site_tank");

            builder.HasIndex (t => new { t.SourceType, t.SourceId })
                .HasDatabaseName ("idx_source");

            builder.HasIndex (t => t.DueDate)
                .HasDatabaseName ("idx_due_date");

            builder.HasIndex (t => t.CreatedOn)
                .HasDatabaseName ("idx_created_on");

            // Foreign Key Relationships
            builder.HasOne (t => t.AssignedToNavigation)
                .WithMany ()
                .HasForeignKey (t => t.AssignedTo)
                .HasConstraintName ("fk_tasks_assigned_to")
                .OnDelete (DeleteBehavior.SetNull);

            builder.HasOne (t => t.AssignedByNavigation)
                .WithMany ()
                .HasForeignKey (t => t.AssignedBy)
                .HasConstraintName ("fk_tasks_assigned_by")
                .OnDelete (DeleteBehavior.SetNull);

            builder.HasOne (t => t.CreatedByNavigation)
                .WithMany ()
                .HasForeignKey (t => t.CreatedBy)
                .HasConstraintName ("fk_tasks_created_by")
                .OnDelete (DeleteBehavior.Restrict);

            builder.HasOne (t => t.UpdatedByNavigation)
                .WithMany ()
                .HasForeignKey (t => t.UpdatedBy)
                .HasConstraintName ("fk_tasks_updated_by")
                .OnDelete (DeleteBehavior.SetNull);

            builder.HasOne (t => t.Site)
                .WithMany ()
                .HasForeignKey (t => t.SiteId)
                .HasConstraintName ("fk_tasks_site")
                .OnDelete (DeleteBehavior.SetNull);

            builder.HasOne (t => t.Tank)
                .WithMany ()
                .HasForeignKey (t => t.TankId)
                .HasConstraintName ("fk_tasks_tank")
                .OnDelete (DeleteBehavior.SetNull);
        }
    }
}