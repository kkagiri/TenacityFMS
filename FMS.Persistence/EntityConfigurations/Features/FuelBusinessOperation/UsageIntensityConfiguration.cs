using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class UsageIntensityConfiguration : EntityTypeConfiguration<UsageIntensity>
    {
        public override void Configure(EntityTypeBuilder<UsageIntensity> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("usageintensities");

                builder.HasIndex(e => e.Name, "IX_UsageIntensity_Name").IsUnique();

                builder.Property(e => e.Id);

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                builder.Property(e => e.TypicalHoursPerDay)
                    .HasPrecision(5, 2);

                builder.Property(e => e.SortOrder)
                    .HasDefaultValue(0);

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.CreatedAt);

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring UsageIntensity: {ex.Message}");
                throw new Exception($"Error configuring UsageIntensity entity: {ex.Message}", ex);
            }
        }
    }
}


