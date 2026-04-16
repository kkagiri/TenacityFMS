using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueAssignmentTrackerConfiguration : EntityTypeConfiguration<Issueassignmenttracker>
    {
        public override void Configure(EntityTypeBuilder<Issueassignmenttracker> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("issueassignmenttracker");

                builder.HasIndex(e => e.AssignedTo, "AssigneTo_idx");
                builder.HasIndex(e => e.AssignedFrom, "AssignedFrom_idx");
                builder.HasIndex(e => e.Issue, "Assigned_issue_idx");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.AssignedFrom)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.AssignedTo)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.Issue).HasColumnType("int(11)");

                builder.HasOne(d => d.AssignedFromNavigation)
                    .WithMany(p => p.IssueassignmenttrackerAssignedFromNavigations)
                    .HasForeignKey(d => d.AssignedFrom)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("assigned_user_From");

                builder.HasOne(d => d.AssignedToNavigation)
                    .WithMany(p => p.IssueassignmenttrackerAssignedToNavigations)
                    .HasForeignKey(d => d.AssignedTo)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Assigned_Issue_To");

                builder.HasOne(d => d.IssueNavigation)
                    .WithMany(p => p.Issueassignmenttrackers)
                    .HasForeignKey(d => d.Issue)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Assigned_issue");

                builder.HasQueryFilter(e =>
                    (e.AssignedFromNavigation == null || e.AssignedFromNavigation.IsDeleted != true) &&
                    (e.AssignedToNavigation == null || e.AssignedToNavigation.IsDeleted != true));
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring IssueAssignmentTrackerConfiguration: {ex.Message}", ex);
            }
        }
    }
}
