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
                .ValueGeneratedOnAdd();

            builder.Property(e => e.IssueId)
                .IsRequired();

            builder.Property(e => e.ActivityType)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(e => e.FieldName)
                .HasMaxLength(100);

            builder.Property(e => e.OldValue)
                .HasMaxLength(500);

            builder.Property(e => e.NewValue)
                .HasMaxLength(500);

            builder.Property(e => e.Description)
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(e => e.PerformedBy)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.PerformedByUserName)
                .HasMaxLength(100);

            builder.Property(e => e.ActivityDate)
                .IsRequired();

            builder.Property(e => e.Metadata);

            // Relationships
            builder.HasOne(e => e.Issue)
                .WithMany()
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_activity_log_issue");
        }
    }
}


