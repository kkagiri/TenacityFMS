using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the FuelingRule entity
    /// </summary>
    public class FuelingRuleConfiguration : EntityTypeConfiguration<FuelingRule> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<FuelingRule> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("fuelingrule");

                builder.HasIndex (e => e.FuelingRuleSetId, "FK_FuelingRule_FuelingRuleSet_idx");

                builder.Property (e => e.Id).HasColumnType ("int(11)");
                builder.Property (e => e.RuleName).HasMaxLength (100);
                builder.Property (e => e.IsActive).HasColumnType ("tinyint(1)");
                builder.Property (e => e.CreatedAt).HasColumnType ("datetime");
                builder.Property (e => e.UpdatedAt).HasColumnType ("datetime");
                builder.Property (e => e.Discriminator).HasMaxLength (50);
                builder.Property (e => e.FuelingRuleSetId).HasColumnType ("int(11)");
                builder.Property (e => e.VehicleId).HasColumnType ("int(11)");
                builder.Property (e => e.SiteId).HasColumnType ("int(11)");

                builder.HasOne (d => d.FuelingRuleSet)
                    .WithMany (p => p.Rules)
                    .HasForeignKey (d => d.FuelingRuleSetId)
                    .OnDelete (DeleteBehavior.Cascade)
                    .HasConstraintName ("FK_FuelingRule_FuelingRuleSet");

                builder.HasOne (d => d.Vehicle)
                    .WithMany (p => p.FuelingRules)
                    .HasForeignKey (d => d.VehicleId)
                    .OnDelete (DeleteBehavior.Cascade)
                    .HasConstraintName ("FK_FuelingRule_Vehicle");

                builder.HasOne (d => d.Site)
                    .WithMany (p => p.FuelingRules)
                    .HasForeignKey (d => d.SiteId)
                    .OnDelete (DeleteBehavior.Cascade)
                    .HasConstraintName ("FK_FuelingRule_Site");

                builder.HasDiscriminator<string> ("Discriminator")
                    .HasValue<DailyMonthlyLimitRule> ("DailyMonthlyLimit")
                    .HasValue<NoOfRefillRule> ("NoOfRefill");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring FuelingRuleConfiguration: {ex.Message}", ex);
            }
        }
    }
}