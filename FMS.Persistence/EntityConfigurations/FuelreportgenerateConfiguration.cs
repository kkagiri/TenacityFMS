using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelreportgenerateConfiguration : EntityTypeConfiguration<Fuelreportgenerate>
    {
        public override void Configure(EntityTypeBuilder<Fuelreportgenerate> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("fuelreportgenerate");

                builder.HasIndex(e => e.ApprovedBy, "fuelregenrate_user_idx");
                builder.HasIndex(e => e.CreatedBy, "fuelregenrate_user_idx1");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)");
                builder.Property(e => e.ApprovedBy).HasMaxLength(100);
                builder.Property(e => e.CreatedBy).HasMaxLength(100);
                builder.Property(e => e.ModfifiedBy).HasMaxLength(100);
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring FuelreportgenerateConfiguration: {ex.Message}", ex);
            }
        }
    }
}
