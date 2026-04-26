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
                    .HasMaxLength(100);

                builder.Property(e => e.PtsName)
                    .HasMaxLength(200);

                builder.Property(e => e.AllowedForDirectCommands);
                builder.Property(e => e.AuthenticationType).HasMaxLength(45);
                builder.Property(e => e.Ipaddress)
                    .HasMaxLength(100);
                builder.Property(e => e.IsActive);
                builder.Property(e => e.IsAuthenticated);
                builder.Property(e => e.Login).HasMaxLength(145);
                builder.Property(e => e.PhoneNumber)
                    .HasMaxLength(50);
                builder.Property(e => e.Password).HasMaxLength(1045);
                builder.Property(e => e.PortNumber);
                builder.Property(e => e.ProtocolSecurityType).HasMaxLength(145);
                builder.Property(e => e.Site);
                builder.Property(e => e.WebSocketCapable);
                builder.Property(e => e.ConnectionStatus).HasMaxLength(20);
                builder.Property(e => e.LastActivity);

                // Auto-assign user master tag setting
                builder.Property(e => e.AutoAssignUserMasterTag)
                    .HasDefaultValue((sbyte)0);

                // =====================================================
                // Location Validation Settings
                // =====================================================

                builder.Property(e => e.EnableLocationValidation)
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.RequireVehicleProximity)
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.RequireMobileAppProximity)
                    .HasDefaultValue((sbyte)0);

                builder.Property(e => e.VehicleProximityRadius)
                    .HasDefaultValue(100)
                    .IsRequired(false);

                builder.Property(e => e.MobileAppProximityRadius)
                    .HasDefaultValue(50)
                    .IsRequired(false);

                builder.Property(e => e.BypassOnGPSFailure)
                    .HasDefaultValue((sbyte)1);

                builder.Property(e => e.MinimumGPSAccuracy)
                    .HasDefaultValue(20)
                    .IsRequired(false);

                builder.Property(e => e.ProximityGracePeriodMeters)
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

