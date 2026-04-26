/**
 * File: IssueReminderConfiguration.cs
 * Purpose: EF Core configuration for IssueReminder entity
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-05
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueReminderConfiguration : EntityTypeConfiguration<IssueReminder>
    {
        public override void Configure(EntityTypeBuilder<IssueReminder> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issue_reminder");

            builder.HasIndex(e => e.IssueId, "ix_issue_reminder_issue_id");
            builder.HasIndex(e => e.IsActive, "ix_issue_reminder_is_active");
            builder.HasIndex(e => e.NextReminderDate, "ix_issue_reminder_next_date");

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.IssueId)
                .IsRequired();

            builder.Property(e => e.ReminderType)
                .HasMaxLength(50)
                .HasDefaultValue("Daily");

            builder.Property(e => e.DaysBefore)
                .HasDefaultValue(1);

            builder.Property(e => e.ReminderTime);

            builder.Property(e => e.RecipientUserIds);

            builder.Property(e => e.NotifyAssignee)
                .HasDefaultValue(true);

            builder.Property(e => e.NotifyOpener)
                .HasDefaultValue(false);

            builder.Property(e => e.CustomMessage)
                .HasMaxLength(500);

            builder.Property(e => e.IsActive)
                .HasDefaultValue(true);

            builder.Property(e => e.LastSentDate);

            builder.Property(e => e.NextReminderDate);

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.CreatedDate)
                .IsRequired();

            // Relationships
            builder.HasOne(e => e.Issue)
                .WithMany()
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_reminder_issue");
        }
    }
}


