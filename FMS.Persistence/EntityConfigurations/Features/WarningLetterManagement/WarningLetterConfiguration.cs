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

            builder.Property(e => e.Id);

            builder.Property(e => e.LetterType)
                .HasConversion<int>();

            builder.Property(e => e.EmployeeId);

            builder.Property(e => e.VehicleId);

            builder.Property(e => e.SiteId);

            builder.Property(e => e.LetterDate);

            builder.Property(e => e.PeriodStart);

            builder.Property(e => e.PeriodEnd);

            builder.Property(e => e.ViolationSummary)
                .HasMaxLength(2000);

            builder.Property(e => e.ExpectedValue)
                .HasColumnType("decimal(18,2)");

            builder.Property(e => e.ActualValue)
                .HasColumnType("decimal(18,2)");

            builder.Property(e => e.ExcessValue)
                .HasColumnType("decimal(18,2)");

            builder.Property(e => e.FuelPrice)
                .HasColumnType("decimal(18,2)");

            builder.Property(e => e.ExcessCost)
                .HasColumnType("decimal(18,2)");

            builder.Property(e => e.IssuedByUserId)
                .HasMaxLength(100);

            builder.Property(e => e.IssuedByName)
                .HasMaxLength(200);

            builder.Property(e => e.IssuedByTitle)
                .HasMaxLength(200);

            builder.Property(e => e.HideWarningCountInSubject)
                .HasDefaultValue(false);

            builder.Property(e => e.PdfFilePath)
                .HasMaxLength(500);

            builder.Property(e => e.EmailSentAt);

            builder.Property(e => e.EmailRecipient)
                .HasMaxLength(255);

            builder.Property(e => e.SignatureRequestRecipientUserId)
                .HasMaxLength(100);

            builder.Property(e => e.SignatureRequestRecipient)
                .HasMaxLength(255);

            builder.Property(e => e.SignatureRequestCcUserIds);

            builder.Property(e => e.SignatureRequestCcRecipients);

            builder.Property(e => e.SignatureRequestedAt);

            builder.Property(e => e.SignatureRequestedBy)
                .HasMaxLength(100);

            builder.Property(e => e.ApproveLetterFileName)
                .HasMaxLength(255);

            builder.Property(e => e.ApproveLetterStoredFileName)
                .HasMaxLength(255);

            builder.Property(e => e.ApproveLetterFilePath)
                .HasMaxLength(500);

            builder.Property(e => e.ApproveLetterContentType)
                .HasMaxLength(100);

            builder.Property(e => e.ApproveLetterFileSize);

            builder.Property(e => e.ApproveLetterUploadedAt);

            builder.Property(e => e.ApproveLetterUploadedBy)
                .HasMaxLength(100);

            builder.Property(e => e.SignedCopyFileName)
                .HasMaxLength(255);

            builder.Property(e => e.SignedCopyStoredFileName)
                .HasMaxLength(255);

            builder.Property(e => e.SignedCopyFilePath)
                .HasMaxLength(500);

            builder.Property(e => e.SignedCopyContentType)
                .HasMaxLength(100);

            builder.Property(e => e.SignedCopyFileSize);

            builder.Property(e => e.SignedCopyUploadedAt);

            builder.Property(e => e.SignedCopyUploadedBy)
                .HasMaxLength(100);

            builder.Property(e => e.Status)
                .HasConversion<int>();

            builder.Property(e => e.EmployeeAcknowledgedAt);

            builder.Property(e => e.Notes)
                .HasMaxLength(1000);

            builder.Property(e => e.DateCreated);

            builder.Property(e => e.DateModified);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

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

