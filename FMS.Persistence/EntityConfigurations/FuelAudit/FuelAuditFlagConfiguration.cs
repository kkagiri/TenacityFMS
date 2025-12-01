using FMS.Domain.Entities.FuelAudit;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.FuelAudit
{
    /// <summary>
    /// Entity configuration for FuelAuditFlag
    /// </summary>
    public class FuelAuditFlagConfiguration : IEntityTypeConfiguration<FuelAuditFlag>
    {
        public void Configure(EntityTypeBuilder<FuelAuditFlag> builder)
        {
            builder.ToTable("fuel_audit_flags");

            builder.HasKey(f => f.Id);

            builder.Property(f => f.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(f => f.AuditId)
                .HasColumnName("audit_id")
                .IsRequired();

            builder.Property(f => f.FlagType)
                .HasColumnName("flag_type")
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(f => f.Severity)
                .HasColumnName("severity")
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Medium");

            builder.Property(f => f.Status)
                .HasColumnName("status")
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Open");

            builder.Property(f => f.Category)
                .HasColumnName("category")
                .HasMaxLength(30)
                .IsRequired()
                .HasDefaultValue("System");

            // Reference
            builder.Property(f => f.ReferenceId)
                .HasColumnName("reference_id");

            builder.Property(f => f.ReferenceType)
                .HasColumnName("reference_type")
                .HasMaxLength(30);

            builder.Property(f => f.ReferenceName)
                .HasColumnName("reference_name")
                .HasMaxLength(100);

            // Flag Details
            builder.Property(f => f.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(f => f.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            builder.Property(f => f.ActualValue)
                .HasColumnName("actual_value")
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ExpectedValue)
                .HasColumnName("expected_value")
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ThresholdValue)
                .HasColumnName("threshold_value")
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ValueUnit)
                .HasColumnName("value_unit")
                .HasMaxLength(20);

            // Resolution
            builder.Property(f => f.ResolutionNotes)
                .HasColumnName("resolution_notes")
                .HasColumnType("text");

            builder.Property(f => f.ResolutionType)
                .HasColumnName("resolution_type")
                .HasMaxLength(30);

            builder.Property(f => f.ResolvedBy)
                .HasColumnName("resolved_by");

            builder.Property(f => f.ResolvedAt)
                .HasColumnName("resolved_at")
                .HasColumnType("datetime");

            // Pattern Detection
            builder.Property(f => f.IsRecurringPattern)
                .HasColumnName("is_recurring_pattern")
                .HasColumnType("bit(1)")
                .HasDefaultValue(false);

            builder.Property(f => f.PatternCount)
                .HasColumnName("pattern_count");

            builder.Property(f => f.RelatedFlagIds)
                .HasColumnName("related_flag_ids")
                .HasMaxLength(255);

            // Audit Trail
            builder.Property(f => f.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(f => f.CreatedBy)
                .HasColumnName("created_by");

            builder.Property(f => f.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.Property(f => f.UpdatedBy)
                .HasColumnName("updated_by");

            // Indexes
            builder.HasIndex(f => f.AuditId);
            builder.HasIndex(f => f.FlagType);
            builder.HasIndex(f => f.Status);
            builder.HasIndex(f => f.Severity);
        }
    }
}
