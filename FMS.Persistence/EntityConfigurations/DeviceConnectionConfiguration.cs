using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the DeviceConnection entity
    /// </summary>
    public class DeviceConnectionConfiguration : EntityTypeConfiguration<DeviceConnection>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<DeviceConnection> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("deviceconnections");

                builder.HasIndex(e => e.PtsdeviceId, "DeviceConnection_PtsdeviceId_idx");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.IpAddress).HasMaxLength(45);
                builder.Property(e => e.ConnectedAt).HasColumnType("datetime");
                builder.Property(e => e.DisconnectedAt).HasColumnType("datetime");
                builder.Property(e => e.LastActivityAt).HasColumnType("datetime");
                builder.Property(e => e.ConnectionType).HasMaxLength(20);
                builder.Property(e => e.Status).HasMaxLength(20);
                builder.Property(e => e.PtsdeviceId).HasMaxLength(100);

                builder.HasOne(d => d.Ptsdevice)
                    .WithMany(p => p.DeviceConnections)
                    .HasForeignKey(d => d.PtsdeviceId)
                    .HasConstraintName("FK_DeviceConnection_Ptsdevice");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring Deviceconnection: {ex.Message}");
                throw new Exception($"Error configuring DeviceconnectionConfiguration: {ex.Message}", ex);
            }
        }
    }
}
