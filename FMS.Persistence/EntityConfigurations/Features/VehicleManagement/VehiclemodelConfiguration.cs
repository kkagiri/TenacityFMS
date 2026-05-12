using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Vehiclemodel entity
    /// </summary>
    public class VehiclemodelConfiguration : EntityTypeConfiguration<Vehiclemodel>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Vehiclemodel> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("vehiclemodel");

                builder.Property(e => e.Id);

                builder.Property(e => e.ManufacturerId);

                builder.Property(e => e.Name).HasMaxLength(45);

                // Relationships
                builder.HasOne(d => d.Manufacturer).WithMany(p => p.Vehiclemodels)
                    .HasForeignKey(d => d.ManufacturerId)
                    .HasConstraintName("vehiclemodel_manufacturer");
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring VehiclemodelConfiguration: {ex.Message}", ex);
            }
        }
    }
}

