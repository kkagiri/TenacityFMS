using FMS.Domain.Entities.Features.FuelRuleSet;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the FuelingRuleSetAssignment entity.
    /// This entity links FuelingRuleSets to their targets (Site, VehicleType, Vehicle, Tag).
    /// </summary>
    public class FuelingRuleSetAssignmentConfiguration : EntityTypeConfiguration<FuelingRuleSetAssignment>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<FuelingRuleSetAssignment> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("fueling_rule_set_assignments");

                // Primary Key
                builder.Property(e => e.Id);

                // Foreign key to RuleSet
                builder.Property(e => e.FuelingRuleSetId)
                    .IsRequired();

                // Target type enum stored as string
                builder.Property(e => e.TargetType)
                    .HasConversion<string>()
                    .HasMaxLength(20)
                    .IsRequired();

                // Target IDs (nullable - only one should be set based on TargetType)
                builder.Property(e => e.SiteId);

                builder.Property(e => e.VehicleTypeId);

                builder.Property(e => e.VehicleId);

                builder.Property(e => e.TagId);

                // Priority for conflict resolution
                builder.Property(e => e.Priority)
                    .HasDefaultValue(0);

                // Active flag
                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                // Audit fields
                builder.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                builder.Property(e => e.CreatedByUserId);

                builder.Property(e => e.UpdatedAt);

                builder.Property(e => e.UpdatedByUserId);

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                // Indexes
                builder.HasIndex(e => e.FuelingRuleSetId, "IX_Assignment_RuleSetId");
                builder.HasIndex(e => e.SiteId, "IX_Assignment_SiteId");
                builder.HasIndex(e => e.VehicleTypeId, "IX_Assignment_VehicleTypeId");
                builder.HasIndex(e => e.VehicleId, "IX_Assignment_VehicleId");
                builder.HasIndex(e => e.TagId, "IX_Assignment_TagId");
                builder.HasIndex(e => new { e.TargetType, e.IsActive }, "IX_Assignment_TargetType_Active");

                // Relationships
                builder.HasOne(d => d.FuelingRuleSet)
                    .WithMany()  // RuleSet doesn't need navigation back to assignments
                    .HasForeignKey(d => d.FuelingRuleSetId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Assignment_FuelingRuleSet");

                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Assignment_Site");

                builder.HasOne(d => d.VehicleType)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleTypeId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Assignment_VehicleType");

                builder.HasOne(d => d.Vehicle)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Assignment_Vehicle");

                builder.HasOne(d => d.Tag)
                    .WithMany()
                    .HasForeignKey(d => d.TagId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_Assignment_FuelTag");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring FuelingRuleSetAssignmentConfiguration: {ex.Message}");
                throw new Exception($"Error configuring FuelingRuleSetAssignmentConfiguration: {ex.Message}", ex);
            }
        }
    }
}

