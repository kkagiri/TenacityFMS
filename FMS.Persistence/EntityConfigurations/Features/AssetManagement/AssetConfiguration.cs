using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Asset entity
    /// </summary>
    public class AssetConfiguration : EntityTypeConfiguration<Asset>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Asset> builder)
        {
            try
            {
                builder.HasKey(e => e.AssetId);

                builder.ToTable("asset");

                builder.Property(e => e.AssetId)
                    .HasMaxLength(255);

                builder.Property(e => e.AssetName).HasMaxLength(45);

                builder.Property(e => e.IsActive);

                builder.Property(e => e.SiteId)
                    .HasMaxLength(255);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring AssetConfiguration: {ex.Message}", ex);
            }
        }
    }
}

