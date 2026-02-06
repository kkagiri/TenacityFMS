/**
 * File: IssueActivityLogConfiguration.cs
 * Purpose: EF Core configuration for IssueActivityLog entity
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-05
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueActivityLogConfiguration : EntityTypeConfiguration<IssueActivityLog>
    {
        public override void Configure(EntityTypeBuilder<IssueActivityLog> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issue_activity_log");

            builder.HasIndex(e => e.IssueId, "ix_issue_activity_log_issue_id");
            builder.HasIndex(e => e.PerformedBy, "ix_issue_activity_log_performed_by");
            builder.HasIndex(e => e.ActivityDate, "ix_issue_activity_log_activity_date");
            builder.HasIndex(e => e.ActivityType, "ix_issue_activity_log_activity_type");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("int(11)")
                .HasColumnName("Id");

            builder.Property(e => e.IssueId)
                .HasColumnType("int(11)")
                .HasColumnName("IssueId")
                .IsRequired();

            builder.Property(e => e.ActivityType)
                .HasMaxLength(50)
                .HasColumnName("ActivityType")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.FieldName)
                .HasMaxLength(100)
                .HasColumnName("FieldName")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.OldValue)
                .HasMaxLength(500)
                .HasColumnName("OldValue")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.NewValue)
                .HasMaxLength(500)
                .HasColumnName("NewValue")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("Description")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.PerformedBy)
                .HasMaxLength(100)
                .HasColumnName("PerformedBy")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.PerformedByUserName)
                .HasMaxLength(100)
                .HasColumnName("PerformedByUserName")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ActivityDate)
                .HasColumnName("ActivityDate")
                .IsRequired();

            builder.Property(e => e.Metadata)
                .HasColumnType("longtext")
                .HasColumnName("Metadata")
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");

            // Relationships
            builder.HasOne(e => e.Issue)
                .WithMany()
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_activity_log_issue");
        }
    }
}
