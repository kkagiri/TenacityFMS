/**
 * File: IssuetrackerConfiguration.cs
 * Purpose: Configures the EF Core mapping for the issuetracker entity including relationships and constraints.
 * Dependencies: Microsoft.EntityFrameworkCore, FMS.Domain.Entities
 * Last Modified: 2025-11-04
 *
 * Key Functions/Components:
 * - Configure(): Applies entity configuration metadata for Issuetracker.
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
                    .ValueGeneratedOnAdd()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.AssignTo)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.ClosingDate).HasColumnName("closingDate");
                //builder.Property(e => e.DeviceId)
                //    .HasColumnType("int(11)")
                //    .HasColumnName("DeviceID");
                builder.Ignore(e => e.DeviceType);
                builder.Property(e => e.DueDate).HasColumnName("dueDate");
                builder.Property(e => e.IssueCategoryId)
                    .HasColumnType("int(11)")
                    .HasColumnName("IssueCategoryID");
                builder.Property(e => e.OpenDate).HasColumnName("openDate");
                builder.Property(e => e.Openby)
                    .HasMaxLength(100)
                    .HasColumnName("openby")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.Priority)
                    .HasColumnType("int(11)")
                    .HasColumnName("priority");
                builder.Property(e => e.ProblemDescription)
                    .HasMaxLength(945)
                    .HasColumnName("problemDescription");
                builder.Property(e => e.ProblemTitle)
                    .HasMaxLength(45)
                    .HasColumnName("problemTitle");
                builder.Property(e => e.RelatedIssue)
                    .HasColumnType("int(11)")
                    .HasColumnName("relatedIssue");
                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("siteID");
                builder.Property(e => e.Status)
                    .HasColumnType("int(11)")
                    .HasColumnName("status");
                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleID");

                builder.Property(e => e.ActiveAlarmId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ActiveAlarmId");

                builder.Property(e => e.LastModfield)
                    .HasColumnName("LastModfield");

                // V2 Template-based fields
                builder.Property(e => e.IssueTemplateId)
                    .HasColumnType("int(11)")
                    .HasColumnName("IssueTemplateId");

                builder.Property(e => e.DeviceTypeId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DeviceTypeId");

                builder.Property(e => e.CanAutoClose)
                    .HasDefaultValue(false)
                    .HasColumnName("CanAutoClose");

                builder.Property(e => e.AutoCloseReason)
                    .HasMaxLength(500)
                    .HasColumnName("AutoCloseReason")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.Property(e => e.IsAutoCreated)
                    .HasDefaultValue(false)
                    .HasColumnName("IsAutoCreated");

                // V2 Related entity fields for background service auto-creation
                builder.Property(e => e.RelatedEntityId)
                    .HasColumnType("int(11)")
                    .HasColumnName("RelatedEntityId");

                builder.Property(e => e.RelatedEntityType)
                    .HasMaxLength(50)
                    .HasColumnName("RelatedEntityType")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.Property(e => e.AssignedTo)
                    .HasMaxLength(100)
                    .HasColumnName("AssignedTo")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

                builder.Property(e => e.ReportedBy)
                    .HasMaxLength(100)
                    .HasColumnName("ReportedBy")
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");

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

                builder.HasOne(d => d.ActiveAlarm)
                    .WithMany(p => p.IssueTrackers)
                    .HasForeignKey(d => d.ActiveAlarmId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("issuetracker_activealarm");

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
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring IssuetrackerConfiguration: {ex.Message}");
                throw new Exception($"Error configuring IssuetrackerConfiguration: {ex.Message}", ex);
            }
        }
    }
}
