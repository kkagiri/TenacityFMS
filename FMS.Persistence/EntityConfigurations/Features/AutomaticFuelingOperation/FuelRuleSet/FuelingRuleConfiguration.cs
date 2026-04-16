using FMS.Domain.Entities.Features.FuelRule;
using FMS.Domain.Entities.Features.FuelRule.Rules;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the FuelingRule entity
    /// </summary>
    public class FuelingRuleConfiguration : EntityTypeConfiguration<FuelingRule>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<FuelingRule> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("fuelingrule");

                builder.HasIndex(e => e.FuelingRuleSetId, "FK_FuelingRule_FuelingRuleSet_idx");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.RuleName).HasMaxLength(100);
                builder.Property(e => e.IsActive).HasColumnType("tinyint(1)");
                builder.Property(e => e.CreatedAt).HasColumnType("datetime");
                builder.Property(e => e.UpdatedAt).HasColumnType("datetime");
                builder.Property(e => e.Discriminator).HasMaxLength(50);
                builder.Property(e => e.FuelingRuleSetId).HasColumnType("int(11)");
                builder.Property(e => e.VehicleId).HasColumnType("int(11)");
                builder.Property(e => e.SiteId).HasColumnType("int(11)");

                // DailyMonthlyLimitRule properties (all on base class for TPH)
                builder.Property(e => e.DailyLimitLiter).HasColumnName("DailyLimitLiter").HasColumnType("int(11)");
                builder.Property(e => e.MonthlyLimitLiter).HasColumnName("MonthlyLimitLiter").HasColumnType("int(11)");
                builder.Property(e => e.FuelingLimitPerTransaction).HasColumnName("FuelingLimitPerTransaction").HasColumnType("int(11)");

                // NoOfRefillRule properties (all on base class for TPH)
                builder.Property(e => e.MaxRefillsPerDay).HasColumnName("MaxRefillsPerDay").HasColumnType("int(11)");
                builder.Property(e => e.MaxRefillsPerWeek).HasColumnName("MaxRefillsPerWeek").HasColumnType("int(11)");
                builder.Property(e => e.MaxRefillsPerMonth).HasColumnName("MaxRefillsPerMonth").HasColumnType("int(11)");

                builder.HasOne(d => d.FuelingRuleSet)
                    .WithMany(p => p.Rules)
                    .HasForeignKey(d => d.FuelingRuleSetId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_FuelingRule_FuelingRuleSet");

                builder.HasOne(d => d.Vehicle)
                    .WithMany(p => p.FuelingRules)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_FuelingRule_Vehicle");

                builder.HasOne(d => d.Site)
                    .WithMany(p => p.FuelingRules)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_FuelingRule_Site");

                builder.HasDiscriminator<string>("Discriminator")
                    .HasValue<DailyMonthlyLimitRule>("DailyMonthlyLimit")
                    .HasValue<NoOfRefillRule>("NoOfRefill")
                    .HasValue<TimeWindowRule>("TimeWindow");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring FuelingRuleConfiguration: {ex.Message}", ex);
            }
        }
    }
}

// Note: DailyMonthlyLimitRuleConfiguration removed - FuelingLimitPerTransaction is now
// configured on the base FuelingRule class for proper TPH inheritance pattern.
// All TPH properties are on the base class to avoid property shadowing issues.

/// <summary>
/// Configuration for TimeWindowRule derived entity
/// NOTE: StartTime and EndTime columns must exist in database
/// Run migration: Documentation/database_migrations/2026-01-03_fueling_rules_cascade_model.sql
/// </summary>
public class TimeWindowRuleConfiguration : IEntityTypeConfiguration<TimeWindowRule>
{
    public void Configure(EntityTypeBuilder<TimeWindowRule> builder)
    {
        builder.Property(e => e.StartTime)
            .HasColumnName("StartTime")
            .HasColumnType("time");

        builder.Property(e => e.EndTime)
            .HasColumnName("EndTime")
            .HasColumnType("time");
    }
}