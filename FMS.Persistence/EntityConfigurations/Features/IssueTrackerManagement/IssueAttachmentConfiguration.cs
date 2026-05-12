/**
 * File: IssueAttachmentConfiguration.cs
 * Purpose: EF Core configuration for the issue_attachments table
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-06
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueAttachmentConfiguration : EntityTypeConfiguration<IssueAttachment>
    {
        public override void Configure(EntityTypeBuilder<IssueAttachment> builder)
        {
            builder.HasKey(e => e.Id);

            builder.ToTable("issue_attachments");

            builder.HasIndex(e => e.IssueId, "issueattach_issue_idx");
            builder.HasIndex(e => e.AttachmentCategory, "issueattach_category_idx");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.IssueId)
                .IsRequired();

            builder.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(e => e.StoredFileName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(e => e.ContentType)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.FileSize)
                .IsRequired();

            builder.Property(e => e.AttachmentCategory)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("General");

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.UploadedBy)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.UploadedAt)
                .IsRequired();

            // Relationship to Issuetracker
            builder.HasOne(d => d.Issue)
                .WithMany(p => p.Attachments)
                .HasForeignKey(d => d.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("issueattach_issue");
        }
    }
}


