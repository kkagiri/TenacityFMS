using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Vehicletype entity
    /// </summary>
    public class VehicletypeConfiguration : EntityTypeConfiguration<Vehicletype>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Vehicletype> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("vehicletype", tb => tb.HasComment("			"));

                builder.Property(e => e.Id);

                builder.Property(e => e.Abbvr).HasMaxLength(45);
                builder.Property(e => e.Name).HasMaxLength(45);
                builder.Property(e => e.Nothinghere).HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring VehicletypeConfiguration: {ex.Message}", ex);
            }
        }
    }
}

