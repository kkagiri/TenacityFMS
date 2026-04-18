/**
 * File: WarningLetterConfiguration.cs
 * Purpose: Maps WarningLetter fields and relationships to the MySQL schema.
 * Dependencies: EF Core, WarningLetter, Employee, Vehicle, Site, User
 * Last Modified: 2026-04-11
 */
using System;
using FMS.Domain.Entities.Features.WarningLetterManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations;

public class WarningLetterConfiguration : EntityTypeConfiguration<WarningLetter>
{
    public override void Configure(EntityTypeBuilder<WarningLetter> builder)
    {
        try
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("warning_letter");

            builder.HasIndex(e => e.EmployeeId, "IX_WarningLetter_EmployeeId");
            builder.HasIndex(e => e.VehicleId, "IX_WarningLetter_VehicleId");
            builder.HasIndex(e => new { e.SiteId, e.LetterDate }, "IX_WarningLetter_SiteId_LetterDate");

            builder.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("Id");

            builder.Property(e => e.LetterType)
                .HasColumnType("int(11)")
                .HasColumnName("LetterType")
                .HasConversion<int>();

            builder.Property(e => e.EmployeeId)
                .HasColumnType("int(11)")
                .HasColumnName("EmployeeId");

            builder.Property(e => e.VehicleId)
                .HasColumnType("int(11)")
                .HasColumnName("VehicleId");

            builder.Property(e => e.SiteId)
                .HasColumnType("int(11)")
                .HasColumnName("SiteId");

            builder.Property(e => e.LetterDate)
                .HasColumnType("datetime")
                .HasColumnName("LetterDate");

            builder.Property(e => e.PeriodStart)
                .HasColumnType("datetime")
                .HasColumnName("PeriodStart");

            builder.Property(e => e.PeriodEnd)
                .HasColumnType("datetime")
                .HasColumnName("PeriodEnd");

            builder.Property(e => e.ViolationSummary)
                .HasMaxLength(2000)
                .HasColumnName("ViolationSummary");

            builder.Property(e => e.ExpectedValue)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("ExpectedValue");

            builder.Property(e => e.ActualValue)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("ActualValue");

            builder.Property(e => e.ExcessValue)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("ExcessValue");

            builder.Property(e => e.FuelPrice)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("FuelPrice");

            builder.Property(e => e.ExcessCost)
                .HasColumnType("decimal(18,2)")
                .HasColumnName("ExcessCost");

            builder.Property(e => e.IssuedByUserId)
                .HasMaxLength(100)
                .HasColumnName("IssuedByUserId")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.IssuedByName)
                .HasMaxLength(200)
                .HasColumnName("IssuedByName");

            builder.Property(e => e.IssuedByTitle)
                .HasMaxLength(200)
                .HasColumnName("IssuedByTitle");

            builder.Property(e => e.HideWarningCountInSubject)
                .HasColumnType("tinyint(1)")
                .HasColumnName("HideWarningCountInSubject")
                .HasDefaultValue(false);

            builder.Property(e => e.PdfFilePath)
                .HasMaxLength(500)
                .HasColumnName("PdfFilePath");

            builder.Property(e => e.EmailSentAt)
                .HasColumnType("datetime")
                .HasColumnName("EmailSentAt");

            builder.Property(e => e.EmailRecipient)
                .HasMaxLength(255)
                .HasColumnName("EmailRecipient");

            builder.Property(e => e.SignatureRequestRecipientUserId)
                .HasMaxLength(100)
                .HasColumnName("SignatureRequestRecipientUserId")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.SignatureRequestRecipient)
                .HasMaxLength(255)
                .HasColumnName("SignatureRequestRecipient");

            builder.Property(e => e.SignatureRequestCcUserIds)
                .HasColumnType("text")
                .HasColumnName("SignatureRequestCcUserIds");

            builder.Property(e => e.SignatureRequestCcRecipients)
                .HasColumnType("text")
                .HasColumnName("SignatureRequestCcRecipients");

            builder.Property(e => e.SignatureRequestedAt)
                .HasColumnType("datetime")
                .HasColumnName("SignatureRequestedAt");

            builder.Property(e => e.SignatureRequestedBy)
                .HasMaxLength(100)
                .HasColumnName("SignatureRequestedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ApproveLetterFileName)
                .HasMaxLength(255)
                .HasColumnName("ApproveLetterFileName");

            builder.Property(e => e.ApproveLetterStoredFileName)
                .HasMaxLength(255)
                .HasColumnName("ApproveLetterStoredFileName");

            builder.Property(e => e.ApproveLetterFilePath)
                .HasMaxLength(500)
                .HasColumnName("ApproveLetterFilePath");

            builder.Property(e => e.ApproveLetterContentType)
                .HasMaxLength(100)
                .HasColumnName("ApproveLetterContentType");

            builder.Property(e => e.ApproveLetterFileSize)
                .HasColumnType("bigint(20)")
                .HasColumnName("ApproveLetterFileSize");

            builder.Property(e => e.ApproveLetterUploadedAt)
                .HasColumnType("datetime")
                .HasColumnName("ApproveLetterUploadedAt");

            builder.Property(e => e.ApproveLetterUploadedBy)
                .HasMaxLength(100)
                .HasColumnName("ApproveLetterUploadedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.SignedCopyFileName)
                .HasMaxLength(255)
                .HasColumnName("SignedCopyFileName");

            builder.Property(e => e.SignedCopyStoredFileName)
                .HasMaxLength(255)
                .HasColumnName("SignedCopyStoredFileName");

            builder.Property(e => e.SignedCopyFilePath)
                .HasMaxLength(500)
                .HasColumnName("SignedCopyFilePath");

            builder.Property(e => e.SignedCopyContentType)
                .HasMaxLength(100)
                .HasColumnName("SignedCopyContentType");

            builder.Property(e => e.SignedCopyFileSize)
                .HasColumnType("bigint(20)")
                .HasColumnName("SignedCopyFileSize");

            builder.Property(e => e.SignedCopyUploadedAt)
                .HasColumnType("datetime")
                .HasColumnName("SignedCopyUploadedAt");

            builder.Property(e => e.SignedCopyUploadedBy)
                .HasMaxLength(100)
                .HasColumnName("SignedCopyUploadedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Status)
                .HasColumnType("int(11)")
                .HasColumnName("Status")
                .HasConversion<int>();

            builder.Property(e => e.EmployeeAcknowledgedAt)
                .HasColumnType("datetime")
                .HasColumnName("EmployeeAcknowledgedAt");

            builder.Property(e => e.Notes)
                .HasMaxLength(1000)
                .HasColumnName("Notes");

            builder.Property(e => e.DateCreated)
                .HasColumnType("datetime")
                .HasColumnName("DateCreated");

            builder.Property(e => e.DateModified)
                .HasColumnType("datetime")
                .HasColumnName("DateModified");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100)
                .HasColumnName("CreatedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100)
                .HasColumnName("ModifiedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.HasOne(e => e.Employee)
                .WithMany(e => e.WarningLetters)
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Vehicle)
                .WithMany(v => v.WarningLetters)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Site)
                .WithMany()
                .HasForeignKey(e => e.SiteId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.IssuedByUser)
                .WithMany()
                .HasForeignKey(e => e.IssuedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.CreatedByNavigation)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.ModifiedByNavigation)
                .WithMany()
                .HasForeignKey(e => e.ModifiedBy)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasQueryFilter(e =>
                e.IssuedByUser.IsDeleted != true &&
                e.CreatedByNavigation.IsDeleted != true &&
                (e.ModifiedByNavigation == null || e.ModifiedByNavigation.IsDeleted != true));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error configuring WarningLetterConfiguration: {ex.Message}");
            throw;
        }
    }
}