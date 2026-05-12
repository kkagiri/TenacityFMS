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
                .ValueGeneratedOnAdd();

            builder.Property(f => f.AuditId)
                .IsRequired();

            builder.Property(f => f.FlagType)
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(f => f.Severity)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Medium");

            builder.Property(f => f.Status)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("Open");

            builder.Property(f => f.Category)
                .HasMaxLength(30)
                .IsRequired()
                .HasDefaultValue("System");

            // Reference
            builder.Property(f => f.ReferenceId);

            builder.Property(f => f.ReferenceType)
                .HasMaxLength(30);

            builder.Property(f => f.ReferenceName)
                .HasMaxLength(100);

            // Flag Details
            builder.Property(f => f.Title)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(f => f.Description);

            builder.Property(f => f.ActualValue)
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ExpectedValue)
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ThresholdValue)
                .HasColumnType("decimal(15,2)");

            builder.Property(f => f.ValueUnit)
                .HasMaxLength(20);

            // Resolution
            builder.Property(f => f.ResolutionNotes);

            builder.Property(f => f.ResolutionType)
                .HasMaxLength(30);

            builder.Property(f => f.ResolvedBy);

            builder.Property(f => f.ResolvedAt);

            // Pattern Detection
            builder.Property(f => f.IsRecurringPattern)
                .HasDefaultValue(false);

            builder.Property(f => f.PatternCount);

            builder.Property(f => f.RelatedFlagIds)
                .HasMaxLength(255);

            // Audit Trail
            builder.Property(f => f.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(f => f.CreatedBy);

            builder.Property(f => f.UpdatedAt);

            builder.Property(f => f.UpdatedBy);

            // Indexes
            builder.HasIndex(f => f.AuditId);
            builder.HasIndex(f => f.FlagType);
            builder.HasIndex(f => f.Status);
            builder.HasIndex(f => f.Severity);
        }
    }
}

