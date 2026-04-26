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
                .ValueGeneratedOnAdd();

            builder.Property(e => e.IssueId)
                .IsRequired();

            builder.Property(e => e.UserId)
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.UserName)
                .HasMaxLength(200);

            builder.Property(e => e.FollowedDate)
                .IsRequired();

            builder.Property(e => e.NotifyByEmail)
                .HasDefaultValue(true);

            builder.Property(e => e.NotifyByPush)
                .HasDefaultValue(true);

            // Navigation properties are [NotMapped] on the entity,
            // so we must Ignore them explicitly to avoid conflict,
            // and define the FK constraint at the column level only.
            builder.Ignore(e => e.Issue);
            builder.Ignore(e => e.User);
        }
    }
}


