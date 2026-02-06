/**
 * File: IssueFollowerConfiguration.cs
 * Purpose: EF Core configuration for IssueFollower entity
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-05
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueFollowerConfiguration : EntityTypeConfiguration<IssueFollower>
    {
        public override void Configure(EntityTypeBuilder<IssueFollower> builder)
        {
            builder.HasKey(e => e.Id).HasName("PRIMARY");

            builder.ToTable("issue_follower");

            builder.HasIndex(e => e.IssueId, "ix_issue_follower_issue_id");
            builder.HasIndex(e => e.UserId, "ix_issue_follower_user_id");
            builder.HasIndex(e => new { e.IssueId, e.UserId }, "uq_issue_follower_issue_user").IsUnique();

            builder.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnType("int(11)")
                .HasColumnName("id");

            builder.Property(e => e.IssueId)
                .HasColumnType("int(11)")
                .HasColumnName("issue_id")
                .IsRequired();

            builder.Property(e => e.UserId)
                .HasMaxLength(100)
                .HasColumnName("user_id")
                .IsRequired()
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");

            builder.Property(e => e.UserName)
                .HasMaxLength(200)
                .HasColumnName("user_name")
                .UseCollation("utf8_general_ci")
                .HasCharSet("utf8");

            builder.Property(e => e.FollowedDate)
                .HasColumnName("followed_date")
                .IsRequired();

            builder.Property(e => e.NotifyByEmail)
                .HasColumnName("notify_by_email")
                .HasDefaultValue(true);

            builder.Property(e => e.NotifyByPush)
                .HasColumnName("notify_by_push")
                .HasDefaultValue(true);

            // Relationships
            builder.HasOne(e => e.Issue)
                .WithMany()
                .HasForeignKey(e => e.IssueId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_issue_follower_issue");
        }
    }
}
