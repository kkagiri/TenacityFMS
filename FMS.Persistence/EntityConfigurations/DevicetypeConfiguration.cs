using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class DevicetypeConfiguration : EntityTypeConfiguration<Devicetype>
    {
        public override void Configure(EntityTypeBuilder<Devicetype> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("devicetype");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("id");
                builder.Property(e => e.Name).HasMaxLength(45);
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring DevicetypeConfiguration: {ex.Message}", ex);
            }
        }
    }
}