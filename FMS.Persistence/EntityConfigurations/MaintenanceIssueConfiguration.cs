using FMS.Domain.Entities.Features.VehicleManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

/// <summary>
/// Entity Framework configuration for MaintenanceIssue entity
/// </summary>
public class MaintenanceIssueConfiguration : EntityTypeConfiguration<MaintenanceIssue>
{
    public override void Configure(EntityTypeBuilder<MaintenanceIssue> builder)
    {
        try
        {
            // Primary key
            builder.HasKey(e => e.IssueId).HasName("PRIMARY");

            // Table name
            builder.ToTable("maintenance_issue");

            // Indexes
            builder.HasIndex(e => e.MaintenanceId, "idx_issue_maintenance");
            builder.HasIndex(e => e.Status, "idx_issue_status");
            builder.HasIndex(e => e.Severity, "idx_issue_severity");
            builder.HasIndex(e => e.DateReported, "idx_issue_date_reported");

            // Column configurations
            builder.Property(e => e.IssueId)
                .HasColumnType("int(11)")
                .HasColumnName("IssueID");

            builder.Property(e => e.MaintenanceId)
                .HasColumnType("int(11)")
                .HasColumnName("MaintenanceID");

            builder.Property(e => e.IssueType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("IssueType");

            builder.Property(e => e.Severity)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("Severity")
                .HasDefaultValue("Medium");

            builder.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000)
                .HasColumnName("Description");

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("Status")
                .HasDefaultValue("Open");

            builder.Property(e => e.ResponsiblePerson)
                .HasMaxLength(255)
                .HasColumnName("ResponsiblePerson");

            builder.Property(e => e.ReportedBy)
                .HasMaxLength(255)
                .HasColumnName("ReportedBy");

            builder.Property(e => e.DateReported)
                .HasColumnType("datetime")
                .HasColumnName("DateReported")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateResolved)
                .HasColumnType("datetime")
                .HasColumnName("DateResolved");

            builder.Property(e => e.ResolutionNotes)
                .HasMaxLength(2000)
                .HasColumnName("ResolutionNotes");

            builder.Property(e => e.AdditionalCost)
                .HasColumnType("decimal(10,2)")
                .HasColumnName("AdditionalCost");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255)
                .HasColumnName("CreatedBy");

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(255)
                .HasColumnName("ModifiedBy");

            builder.Property(e => e.DateCreated)
                .HasColumnType("datetime")
                .HasColumnName("DateCreated")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateModified)
                .HasColumnType("datetime")
                .HasColumnName("DateModified");

            // Relationships
            builder.HasOne(d => d.Maintenance)
                .WithMany(p => p.Issues)
                .HasForeignKey(d => d.MaintenanceId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_maintenance");

            builder.HasOne(d => d.CreatedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_issue_created_by");

            builder.HasOne(d => d.ModifiedByNavigation)
                .WithMany()
                .HasForeignKey(d => d.ModifiedBy)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_issue_modified_by");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring MaintenanceIssue: {ex.Message}");
        }
    }
}
