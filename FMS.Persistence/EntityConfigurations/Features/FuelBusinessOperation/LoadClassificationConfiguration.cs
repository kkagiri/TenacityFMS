using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class LoadClassificationConfiguration : EntityTypeConfiguration<LoadClassification>
    {
        public override void Configure(EntityTypeBuilder<LoadClassification> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("loadclassifications");

                builder.HasIndex(e => e.Name, "IX_LoadClassification_Name").IsUnique();

                builder.Property(e => e.Id);

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                builder.Property(e => e.MinWeightTonnes)
                    .HasPrecision(10, 2);

                builder.Property(e => e.MaxWeightTonnes)
                    .HasPrecision(10, 2);

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
                Console.WriteLine($"Error configuring LoadClassification: {ex.Message}");
                throw new Exception($"Error configuring LoadClassification entity: {ex.Message}", ex);
            }
        }
    }
}


