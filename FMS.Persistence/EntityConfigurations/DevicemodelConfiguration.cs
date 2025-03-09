using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class DevicemodelConfiguration : EntityTypeConfiguration<Devicemodel>
    {
        public override void Configure(EntityTypeBuilder<Devicemodel> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("devicemodel");

                builder.HasIndex(e => e.DevicemanufacturerId, "deviceModel_deviceManufaturer_idx");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.DevicemanufacturerId)
                    .HasColumnType("int(11)")
                    .HasColumnName("DevicemanufacturerID");
                builder.Property(e => e.Name)
                    .HasMaxLength(45)
                    .HasColumnName("name");

                builder.HasOne(d => d.Devicemanufacturer)
                    .WithMany(p => p.Devicemodels)
                    .HasForeignKey(d => d.DevicemanufacturerId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("deviceModel_deviceManufaturer");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring DevicemodelConfiguration: {ex.Message}", ex);
            }
        }
    }
}
