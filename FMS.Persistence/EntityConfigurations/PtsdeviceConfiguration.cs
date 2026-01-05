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

                builder.Property(e => e.PtsName)
                    .HasMaxLength(200)
                    .HasColumnName("PTSName");

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
                builder.Property(e => e.ConnectionStatus).HasMaxLength(20);
                builder.Property(e => e.LastActivity).HasColumnType("datetime");

                // Auto-assign user master tag setting
                builder.Property(e => e.AutoAssignUserMasterTag)
                    .HasColumnType("tinyint(4)")
                    .HasDefaultValue((sbyte)0);

                // =====================================================
                // Location Validation Settings
                // =====================================================

                builder.Property(e => e.EnableLocationValidation)
                    .HasColumnType("tinyint(4)")
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.RequireVehicleProximity)
                    .HasColumnType("tinyint(4)")
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.RequireMobileAppProximity)
                    .HasColumnType("tinyint(4)")
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.VehicleProximityRadius)
                    .HasColumnType("int")
                    .HasDefaultValue(100)
                    .IsRequired(false);

                builder.Property(e => e.MobileAppProximityRadius)
                    .HasColumnType("int")
                    .HasDefaultValue(50)
                    .IsRequired(false);

                builder.Property(e => e.BypassOnGPSFailure)
                    .HasColumnType("tinyint(4)")
                    .HasDefaultValue((sbyte)1);

                builder.Property(e => e.MinimumGPSAccuracy)
                    .HasColumnType("int")
                    .HasDefaultValue(20)
                    .IsRequired(false);

                builder.Property(e => e.ProximityGracePeriodMeters)
                    .HasColumnType("int")
                    .HasDefaultValue(10)
                    .IsRequired(false);

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
