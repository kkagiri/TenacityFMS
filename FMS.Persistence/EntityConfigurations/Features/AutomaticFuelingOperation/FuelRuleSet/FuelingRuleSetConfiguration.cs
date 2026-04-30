using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities.Features.FuelRuleSet;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the FuelingRuleSet entity.
    /// NOTE: Geofence assignments have been removed. Geofence validation is now a
    /// global system-wide policy configured via SystemConfiguration.
    /// </summary>
    public class FuelingRuleSetConfiguration : EntityTypeConfiguration<FuelingRuleSet>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<FuelingRuleSet> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("fuelingruleset");

                builder.Property(e => e.Id);
                builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
                builder.Property(e => e.Description).HasMaxLength(255);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring FuelingRuleSetConfiguration: {ex.Message}", ex);
            }
        }
    }
}

