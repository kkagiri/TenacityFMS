/**
 * File: EmployeeDocumentConfiguration.cs
 * Purpose: Configures persistence mapping for employee compliance and HR documents.
 * Dependencies: EF Core, EmployeeDocument entity
 * Last Modified: 2026-03-25
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class EmployeeDocumentConfiguration : IEntityTypeConfiguration<EmployeeDocument>
{
    public void Configure(EntityTypeBuilder<EmployeeDocument> builder)
    {
        builder.ToTable("employee_documents");

        builder.HasKey(document => document.Id);

        builder.Property(document => document.Id)
            .HasColumnType("CHAR(36)")
            .IsRequired();

        builder.Property(document => document.EmployeeId)
            .IsRequired();

        builder.Property(document => document.DocumentType)
            .IsRequired();

        builder.Property(document => document.DocumentNumber)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(document => document.IssueDate)
            .IsRequired();

        builder.Property(document => document.ExpiryDate)
            .IsRequired();

        builder.Property(document => document.AlertLeadDays)
            .HasDefaultValue(30)
            .IsRequired();

        builder.Property(document => document.IssuingAuthority)
            .HasMaxLength(200)
            .IsRequired(false);

        builder.Property(document => document.Notes)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(document => document.DocumentFileName)
            .HasMaxLength(255)
            .IsRequired(false);

        builder.Property(document => document.DocumentFileUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(document => document.Status)
            .IsRequired();

        builder.Property(document => document.CreatedAt)
            .IsRequired();

        builder.Property(document => document.CreatedBy)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(document => document.UpdatedAt)
            .IsRequired(false);

        builder.Property(document => document.UpdatedBy)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.HasIndex(document => document.EmployeeId)
            .HasDatabaseName("IX_employee_documents_EmployeeId");

        builder.HasIndex(document => document.ExpiryDate)
            .HasDatabaseName("IX_employee_documents_ExpiryDate");

        builder.HasIndex(document => document.DocumentType)
            .HasDatabaseName("IX_employee_documents_DocumentType");

        builder.HasIndex(document => document.Status)
            .HasDatabaseName("IX_employee_documents_Status");

        builder.HasIndex(document => new { document.EmployeeId, document.DocumentType, document.DocumentNumber })
            .IsUnique()
            .HasDatabaseName("UK_employee_documents_EmployeeId_DocumentType_DocumentNumber");

        builder.Ignore(document => document.DaysUntilExpiry);
        builder.Ignore(document => document.IsExpired);
        builder.Ignore(document => document.IsExpiringSoon);
    }
}
