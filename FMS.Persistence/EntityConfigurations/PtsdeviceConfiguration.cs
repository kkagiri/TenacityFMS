using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Ptsdevice entity
    /// </summary>
    public class PtsdeviceConfiguration : EntityTypeConfiguration<Ptsdevice>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Ptsdevice> builder)
        {
            try
            {
                builder.HasKey(e => e.Ptsid).HasName("PRIMARY");

                builder.ToTable("ptsdevice");

                builder.HasIndex(e => e.Site, "PTSDevice_site_idx");

                builder.Property(e => e.Ptsid)
                    .HasMaxLength(100)
                    .HasColumnName("PTSId");

                builder.Property(e => e.AllowedForDirectCommands).HasColumnType("tinyint(4)");
                builder.Property(e => e.AuthenticationType).HasMaxLength(45);
                builder.Property(e => e.Ipaddress)
                    .HasMaxLength(100)
                    .HasColumnName("IPAddress");
                builder.Property(e => e.IsActive).HasColumnType("tinyint(4)");
                builder.Property(e => e.IsAuthenticated).HasColumnType("tinyint(4)");
                builder.Property(e => e.Login).HasMaxLength(145);
                builder.Property(e => e.Password).HasMaxLength(1045);
                builder.Property(e => e.PortNumber).HasColumnType("int(11)");
                builder.Property(e => e.ProtocolSecurityType).HasMaxLength(145);
                builder.Property(e => e.Site).HasColumnType("int(11)");
                builder.Property(e => e.WebSocketCapable).HasColumnType("tinyint(4)");

                // Relationships
                builder.HasOne(d => d.SiteNavigation).WithMany(p => p.Ptsdevices)
                    .HasForeignKey(d => d.Site)
                    .HasConstraintName("PTSDevice_site");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring PtsdeviceConfiguration: {ex.Message}", ex);
            }
        }
    }
}
