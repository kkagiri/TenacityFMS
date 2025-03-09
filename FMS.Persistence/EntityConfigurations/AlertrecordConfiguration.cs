using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Alertrecord entity
    /// </summary>
    public class AlertrecordConfiguration : EntityTypeConfiguration<Alertrecord>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Alertrecord> builder)
        {
            try
            {
                builder.HasKey(e => e.AlertId).HasName("PRIMARY");

                builder.ToTable("alertrecord");

                builder.Property(e => e.AlertId).HasColumnType("int(11)");
                builder.Property(e => e.Code).HasColumnType("int(11)");
                builder.Property(e => e.ConfigurationId).HasMaxLength(8);
                builder.Property(e => e.DeviceNumber).HasColumnType("int(11)");
                builder.Property(e => e.DeviceType).HasMaxLength(20);
                builder.Property(e => e.PacketId)
                    .HasColumnType("int(11)")
                    .HasColumnName("PacketID");
                builder.Property(e => e.Ptsid)
                    .HasMaxLength(23)
                    .HasColumnName("PTSId");
                builder.Property(e => e.State).HasMaxLength(20);
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring AlertrecordConfiguration: {ex.Message}", ex);
            }
        }
    }
}
