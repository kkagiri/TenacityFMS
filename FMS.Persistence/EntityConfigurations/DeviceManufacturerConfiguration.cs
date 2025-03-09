

using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class DevicemanufacturerConfiguration : EntityTypeConfiguration<Devicemanufacturer>
    {
        public override void Configure(EntityTypeBuilder<Devicemanufacturer> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("devicemanufacturer");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.Name).HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring DeviceManufacturerConfiguration: {ex.Message}", ex);
            }
        }
    }
}
