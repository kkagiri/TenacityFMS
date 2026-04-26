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
            builder.Property(e => e.IssueId);

            builder.Property(e => e.MaintenanceId);

            builder.Property(e => e.IssueType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.Severity)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Medium");

            builder.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(2000);

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Open");

            builder.Property(e => e.ResponsiblePerson)
                .HasMaxLength(255);

            builder.Property(e => e.ReportedBy)
                .HasMaxLength(255);

            builder.Property(e => e.DateReported)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateResolved);

            builder.Property(e => e.ResolutionNotes)
                .HasMaxLength(2000);

            builder.Property(e => e.AdditionalCost)
                .HasColumnType("decimal(10,2)");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(255);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(255);

            builder.Property(e => e.DateCreated)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.DateModified);

            // Relationships
            builder.HasOne(d => d.Maintenance)
                .WithMany(p => p.Issues)
                .HasForeignKey(d => d.MaintenanceId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_maintenance");

            // Note: CreatedBy and ModifiedBy are stored as strings (usernames),
            // not as foreign keys. Navigation properties removed to avoid shadow property issues.
            // If you need User references, create separate CreatedById and ModifiedById FK columns.
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring MaintenanceIssue: {ex.Message}");
        }
    }
}

