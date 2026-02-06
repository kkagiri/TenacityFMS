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
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issue_attachments");

            builder.HasIndex(e => e.IssueId, "issueattach_issue_idx");
            builder.HasIndex(e => e.AttachmentCategory, "issueattach_category_idx");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("int(11)")
                .HasColumnName("Id");

            builder.Property(e => e.IssueId)
                .IsRequired()
                .HasColumnType("int(11)")
                .HasColumnName("IssueId");

            builder.Property(e => e.FileName)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("FileName")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.StoredFileName)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("StoredFileName")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.FilePath)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("FilePath")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ContentType)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("ContentType")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.FileSize)
                .IsRequired()
                .HasColumnType("bigint")
                .HasColumnName("FileSize");

            builder.Property(e => e.AttachmentCategory)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("General")
                .HasColumnName("AttachmentCategory")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("Description")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.UploadedBy)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("UploadedBy")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.UploadedAt)
                .IsRequired()
                .HasColumnName("UploadedAt");

            // Relationship to Issuetracker
            builder.HasOne(d => d.Issue)
                .WithMany(p => p.Attachments)
                .HasForeignKey(d => d.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("issueattach_issue");
        }
    }
}
