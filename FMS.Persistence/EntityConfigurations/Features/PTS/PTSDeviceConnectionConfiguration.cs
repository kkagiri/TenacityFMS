using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the DeviceConnection entity
    /// </summary>
    public class PTSDeviceConnectionConfiguration : EntityTypeConfiguration<PTSDeviceConnection> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<PTSDeviceConnection> builder) {
            try {
                builder.HasKey (e => e.Id);

                builder.ToTable ("deviceconnections");

                builder.HasIndex (e => e.PtsdeviceId, "DeviceConnection_PtsdeviceId_idx");

                builder.Property (e => e.Id);
                builder.Property (e => e.IpAddress).HasMaxLength (45);
                builder.Property (e => e.ConnectedAt);
                builder.Property (e => e.DisconnectedAt);
                builder.Property (e => e.LastActivityAt);
                builder.Property (e => e.ConnectionType).HasMaxLength (20);
                builder.Property (e => e.Status).HasMaxLength (20);
                builder.Property (e => e.PtsdeviceId).HasMaxLength (100);

                builder.HasOne (d => d.Ptsdevice)
                    .WithMany (p => p.DeviceConnections)
                    .HasForeignKey (d => d.PtsdeviceId)
                    .HasConstraintName ("FK_DeviceConnection_Ptsdevice");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring Deviceconnection: {ex.Message}");
                throw new Exception ($"Error configuring DeviceconnectionConfiguration: {ex.Message}", ex);
            }
        }
    }
}