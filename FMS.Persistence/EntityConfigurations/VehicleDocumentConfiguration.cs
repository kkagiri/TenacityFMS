using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.VehicleDocumentManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class VehicleDocumentConfiguration : IEntityTypeConfiguration<VehicleDocument>
{
    public void Configure(EntityTypeBuilder<VehicleDocument> builder)
    {
        builder.ToTable("vehicle_documents");

        builder.HasKey(vd => vd.Id);

        builder.Property(vd => vd.Id)
            .HasColumnName("Id")
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(vd => vd.VehicleId)
            .HasColumnName("VehicleId")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(vd => vd.DocumentType)
            .HasColumnName("DocumentType")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(vd => vd.ComplianceCategory)
            .HasColumnName("ComplianceCategory")
            .HasColumnType("INT")
            .HasDefaultValue((int)VehicleComplianceCategory.Other)
            .IsRequired();

        builder.Property(vd => vd.DocumentNumber)
            .HasColumnName("DocumentNumber")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(vd => vd.IssueDate)
            .HasColumnName("IssueDate")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.ExpiryDate)
            .HasColumnName("ExpiryDate")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.AlertLeadDays)
            .HasColumnName("AlertLeadDays")
            .HasColumnType("INT")
            .HasDefaultValue(30)
            .IsRequired();

        builder.Property(vd => vd.IssuingAuthority)
            .HasColumnName("IssuingAuthority")
            .HasColumnType("VARCHAR(200)")
            .IsRequired(false);

        builder.Property(vd => vd.Notes)
            .HasColumnName("Notes")
            .HasColumnType("VARCHAR(1000)")
            .IsRequired(false);

        builder.Property(vd => vd.DocumentFileName)
            .HasColumnName("DocumentFileName")
            .HasColumnType("VARCHAR(255)")
            .IsRequired(false);

        builder.Property(vd => vd.DocumentFileUrl)
            .HasColumnName("DocumentFileUrl")
            .HasColumnType("VARCHAR(500)")
            .IsRequired(false);

        builder.Property(vd => vd.Status)
            .HasColumnName("Status")
            .HasColumnType("INT")
            .IsRequired();

        builder.Property(vd => vd.CreatedAt)
            .HasColumnName("CreatedAt")
            .HasColumnType("DATETIME")
            .IsRequired();

        builder.Property(vd => vd.CreatedBy)
            .HasColumnName("CreatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired();

        builder.Property(vd => vd.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .HasColumnType("DATETIME")
            .IsRequired(false);

        builder.Property(vd => vd.UpdatedBy)
            .HasColumnName("UpdatedBy")
            .HasColumnType("VARCHAR(100)")
            .IsRequired(false);

        // Indexes
        builder.HasIndex(vd => vd.VehicleId)
            .HasDatabaseName("IX_vehicle_documents_VehicleId");

        builder.HasIndex(vd => vd.ExpiryDate)
            .HasDatabaseName("IX_vehicle_documents_ExpiryDate");

        builder.HasIndex(vd => vd.DocumentType)
            .HasDatabaseName("IX_vehicle_documents_DocumentType");

        builder.HasIndex(vd => vd.ComplianceCategory)
            .HasDatabaseName("IX_vehicle_documents_ComplianceCategory");

        builder.HasIndex(vd => vd.Status)
            .HasDatabaseName("IX_vehicle_documents_Status");

        // Unique constraint
        builder.HasIndex(vd => new { vd.VehicleId, vd.DocumentType, vd.DocumentNumber })
            .IsUnique()
            .HasDatabaseName("UK_vehicle_documents_VehicleId_DocumentType_DocumentNumber");

        // Relationships
        // builder.HasOne(vd => vd.Vehicle)
        //     .WithMany()
        //     .HasForeignKey(vd => vd.VehicleId)
        //     .OnDelete(DeleteBehavior.Cascade);

        // Ignore computed properties
        builder.Ignore(vd => vd.DaysUntilExpiry);
        builder.Ignore(vd => vd.IsExpired);
        builder.Ignore(vd => vd.IsExpiringSoon);
    }
}
