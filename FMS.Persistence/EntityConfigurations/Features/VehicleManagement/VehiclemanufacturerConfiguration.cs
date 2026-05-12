using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Vehiclemanufacturer entity
    /// </summary>
    public class VehiclemanufacturerConfiguration : EntityTypeConfiguration<Vehiclemanufacturer>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Vehiclemanufacturer> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("vehiclemanufacturer");

                builder.Property(e => e.Id);

                builder.Property(e => e.Name).HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring VehiclemanufacturerConfiguration: {ex.Message}", ex);
            }
        }
    }
}

