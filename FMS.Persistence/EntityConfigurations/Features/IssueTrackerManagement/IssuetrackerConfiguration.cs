/**
 * File: IssuetrackerConfiguration.cs
 * Purpose: Configures the EF Core mapping for the issuetracker entity including relationships and constraints.
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - Configure(): Applies entity configuration metadata for Issuetracker.
 *
 * CRITICAL FIX: Removed HasDefaultValue() from CanAutoClose and IsAutoCreated
 * - HasDefaultValue() causes EF to treat these as database-generated values
 * - This triggers a SELECT after INSERT which fails with concurrency exception
 * - Solution: Use ValueGeneratedNever() to indicate these are client-set values
 */
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssuetrackerConfiguration : EntityTypeConfiguration<Issuetracker>
    {
        public override void Configure(EntityTypeBuilder<Issuetracker> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("issuetracker");

                builder.HasIndex(e => e.Priority, "Issue_tracker_issuepriorty_idx");
                builder.HasIndex(e => e.AssignTo, "Issue_user_idx");
                builder.HasIndex(e => e.Status, "Issuetracker_status_idx");
                builder.HasIndex(e => e.IssueCategoryId, "issetracker_issueID_idx");
                builder.HasIndex(e => e.VehicleId, "issue_vehicle_idx");
                builder.HasIndex(e => e.SiteId, "issuetracker_site_idx");
                builder.HasIndex(e => e.Openby, "openby_idx");
                builder.HasIndex(e => e.ActiveAlarmId, "activealarm_idx");

                builder.Property(e => e.Id)
                    .ValueGeneratedOnAdd();
                builder.Property(e => e.AssignTo)
                    .HasMaxLength(100);
                builder.Property(e => e.ClosingDate);
                //builder.Property(e => e.DeviceId)
                //
                //;
                builder.Ignore(e => e.DeviceType);
                builder.Property(e => e.DueDate);
                builder.Property(e => e.IssueCategoryId);
                builder.Property(e => e.OpenDate);
                builder.Property(e => e.Openby)
                    .HasMaxLength(100);
                builder.Property(e => e.Priority);
                builder.Property(e => e.ProblemDescription)
                    .HasMaxLength(2000);
                builder.Property(e => e.ProblemTitle)
                    .HasMaxLength(255);
                builder.Property(e => e.RelatedIssue);
                builder.Property(e => e.SiteId);
                builder.Property(e => e.Status);
                builder.Property(e => e.VehicleId);

                builder.Property(e => e.ActiveAlarmId);

                builder.Property(e => e.LastModfield);

                // V2 Template-based fields
                builder.Property(e => e.IssueTemplateId);

                builder.Property(e => e.DeviceTypeId);

                // CRITICAL FIX: These are client-set values, not database-generated
                // Previously had HasDefaultValue(false) which caused EF to try reading them back
                // This triggered a SELECT after INSERT that failed with concurrency exception
                builder.Property(e => e.CanAutoClose)
                    .IsRequired()
                    .ValueGeneratedNever(); // Not database-generated

                builder.Property(e => e.AutoCloseReason)
                    .HasMaxLength(500);

                builder.Property(e => e.IsAutoCreated)
                    .IsRequired()
                    .ValueGeneratedNever(); // Not database-generated

                // V2 Related entity fields for background service auto-creation
                builder.Property(e => e.RelatedEntityId);

                builder.Property(e => e.RelatedEntityType)
                    .HasMaxLength(50);

                builder.Property(e => e.AssignedTo)
                    .HasMaxLength(500);

                builder.Property(e => e.ReportedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.CompletionNotes)
                    .HasMaxLength(2000);

                builder.Property(e => e.ClosingNotes)
                    .HasMaxLength(2000);

                builder.HasOne(d => d.AssignToNavigation)
                    .WithMany(p => p.IssuetrackerAssignToNavigations)
                    .HasForeignKey(d => d.AssignTo)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Issue_user");

                //builder.HasOne(d => d.DeviceTypeNavigation)
                //    .WithMany(p => p.Issuetrackers)
                //    .HasForeignKey(d => d.DeviceType)
                //    .HasConstraintName("Isuse_deviceType");

                builder.HasOne(d => d.IssueCategory)
                    .WithMany(p => p.Issuetrackers)
                    .HasForeignKey(d => d.IssueCategoryId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("issuetrcker_issuecategoryID");

                builder.HasOne(d => d.OpenbyNavigation)
                    .WithMany(p => p.IssuetrackerOpenbyNavigations)
                    .HasForeignKey(d => d.Openby)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("issue_ser");

                builder.HasOne(d => d.PriorityNavigation)
                    .WithMany(p => p.Issuetrackers)
                    .HasForeignKey(d => d.Priority)
                    .HasConstraintName("Issue_tracker_issuepriorty");

                builder.HasOne(d => d.Site)
                    .WithMany(p => p.Issuetrackers)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("issuetracker_site");

                builder.HasOne(d => d.StatusNavigation)
                    .WithMany(p => p.Issuetrackers)
                    .HasForeignKey(d => d.Status)
                    .HasConstraintName("Issuetracker_status");

                builder.HasOne(d => d.Vehicle)
                    .WithMany(p => p.Issuetrackers)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("issue_vehicle");

                // V2 Navigation relationships
                builder.HasOne(d => d.IssueTemplate)
                    .WithMany()
                    .HasForeignKey(d => d.IssueTemplateId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("issuetracker_template");

                builder.HasOne(d => d.DeviceTypeNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.DeviceTypeId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("issuetracker_devicetype_v2");

                // V2 Indexes
                builder.HasIndex(e => e.IssueTemplateId, "issuetracker_template_idx");
                builder.HasIndex(e => e.DeviceTypeId, "issuetracker_devicetype_v2_idx");
                builder.HasIndex(e => e.CanAutoClose, "issuetracker_canautoclose_idx");
                builder.HasIndex(e => e.IsAutoCreated, "issuetracker_isautocreated_idx");

                builder.HasQueryFilter(e =>
                    (e.AssignToNavigation == null || e.AssignToNavigation.IsDeleted != true) &&
                    (e.OpenbyNavigation == null || e.OpenbyNavigation.IsDeleted != true));
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring IssuetrackerConfiguration: {ex.Message}");
                throw new Exception($"Error configuring IssuetrackerConfiguration: {ex.Message}", ex);
            }
        }
    }
}

