using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Configuration entity
    /// </summary>
    public class ConfigurationConfiguration : EntityTypeConfiguration<Configuration>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Configuration> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("configuration");

                builder.HasIndex(e => e.Ptsid, "FK_ptsdevice_configu_idx");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.Configuration1).HasColumnName("Configuration");
                builder.Property(e => e.ConfigurationId).HasMaxLength(8);
                builder.Property(e => e.PacketId)
                    .HasColumnType("int(11)");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring ConfigurationConfiguration: {ex.Message}", ex);
            }
        }
    }
}
