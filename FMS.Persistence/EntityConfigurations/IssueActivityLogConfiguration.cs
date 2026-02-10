/**
 * File: IssueActivityLogConfiguration.cs
 * Purpose: EF Core configuration for IssueActivityLog entity
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-10
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

            builder.ToTable("issueactivitylogs");

            builder.HasIndex(e => e.IssueId, "ix_issue_activity_log_issue_id");
            builder.HasIndex(e => e.PerformedBy, "ix_issue_activity_log_performed_by");
            builder.HasIndex(e => e.ActivityDate, "ix_issue_activity_log_activity_date");
            builder.HasIndex(e => e.ActivityType, "ix_issue_activity_log_activity_type");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("int(11)")
                .HasColumnName("id");

            builder.Property(e => e.IssueId)
                .HasColumnType("int(11)")
                .HasColumnName("issue_id")
                .IsRequired();

            builder.Property(e => e.ActivityType)
                .HasMaxLength(50)
                .HasColumnName("activity_type")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.FieldName)
                .HasMaxLength(100)
                .HasColumnName("field_name")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.OldValue)
                .HasMaxLength(500)
                .HasColumnName("old_value")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.NewValue)
                .HasMaxLength(500)
                .HasColumnName("new_value")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.Description)
                .HasMaxLength(500)
                .HasColumnName("description")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.PerformedBy)
                .HasMaxLength(100)
                .HasColumnName("performed_by")
                .IsRequired()
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.PerformedByUserName)
                .HasMaxLength(100)
                .HasColumnName("performed_by_user_name")
                .UseCollation("utf8mb4_general_ci")
                .HasCharSet("utf8mb4");

            builder.Property(e => e.ActivityDate)
                .HasColumnName("activity_date")
                .IsRequired();

            builder.Property(e => e.Metadata)
                .HasColumnType("longtext")
                .HasColumnName("metadata")
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
