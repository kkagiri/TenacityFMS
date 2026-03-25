using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleComplianceRequirementConfiguration : IEntityTypeConfiguration<VehicleComplianceRequirement>
{
    public void Configure(EntityTypeBuilder<VehicleComplianceRequirement> builder)
    {
        builder.ToTable("vehicle_compliance_requirements");

        builder.HasKey(requirement => requirement.Id);

        builder.Property(requirement => requirement.Id)
            .HasColumnName("Id")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(requirement => requirement.Name)
            .HasColumnName("Name")
            .HasColumnType("VARCHAR(150)")
            .IsRequired();

        builder.Property(requirement => requirement.ComplianceCategory)
            .HasColumnName("ComplianceCategory")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(requirement => requirement.DocumentType)
            .HasColumnName("DocumentType")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(requirement => requirement.TargetType)
            .HasColumnName("TargetType")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(requirement => requirement.SiteId)
            .HasColumnName("SiteId")
            .HasColumnType("INT")
            .IsRequired(false);

        builder.Property(requirement => requirement.VehicleTypeId)
            .HasColumnName("VehicleTypeId")
            .HasColumnType("INT")
            .IsRequired(false);

        builder.Property(requirement => requirement.AlertLeadDays)
            .HasColumnName("AlertLeadDays")
            .HasColumnType("INT")
            .HasDefaultValue(30)
            .IsRequired();

        builder.Property(requirement => requirement.DefaultIssuingAuthority)
            .HasColumnName("DefaultIssuingAuthority")
            .HasColumnType("VARCHAR(200)")
            .IsRequired(false);

        builder.Property(requirement => requirement.Notes)
            .HasColumnName("Notes")
            .HasColumnType("VARCHAR(1000)")
            .IsRequired(false);

        builder.Property(requirement => requirement.IsActive)
            .HasColumnName("IsActive")
            .HasColumnType("BIT(1)")
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(requirement => requirement.CreatedAt)
            .HasColumnName("CreatedAt")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(requirement => requirement.CreatedBy)
            .HasColumnName("CreatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(requirement => requirement.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .HasColumnType("DATETIME")
            .IsRequired(false);

        builder.Property(requirement => requirement.UpdatedBy)
            .HasColumnName("UpdatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired(false);

        builder.HasIndex(requirement => new { requirement.TargetType, requirement.SiteId, requirement.VehicleTypeId, requirement.ComplianceCategory, requirement.IsActive })
            .HasDatabaseName("IX_vehicle_compliance_requirements_TargetScope");

        builder.HasOne(requirement => requirement.Site)
            .WithMany()
            .HasForeignKey(requirement => requirement.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(requirement => requirement.VehicleType)
            .WithMany()
            .HasForeignKey(requirement => requirement.VehicleTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
