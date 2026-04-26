using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Tankmeasurement entity
    /// </summary>
    public class TankmeasurementConfiguration : EntityTypeConfiguration<Tankmeasurement> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<Tankmeasurement> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");
                builder.ToTable ("tankmeasurement");

                builder.Property (e => e.Id)
                    .HasColumnType ("int(11)");

                builder.Property (e => e.ConfigurationId).HasMaxLength (45);
                builder.Property (e => e.FuelGradeId).HasColumnType ("int(11)");
                builder.Property (e => e.PacketId).HasColumnType ("int(11)");
                builder.Property (e => e.ProductTcvolume);
                builder.Property (e => e.Ptsid);
                builder.Property (e => e.Status).HasMaxLength (45);
                builder.Property (e => e.Tank).HasColumnType ("int(11)");
                builder.Property (e => e.TankFillingPercentage).HasColumnType ("int(11)");
                builder.Property (e => e.WaterHeight);

                // Add new properties configuration
                builder.Property (e => e.FuelGradeName)
                    .HasMaxLength (45)
                    .IsRequired (false);

                builder.Property (e => e.TankId)
                    .HasColumnType ("int(11)")
                    .IsRequired (false);

                // Add relationship to Tank entity
                builder.HasOne (e => e.TankNavigation)
                    .WithMany (e => e.Tankmeasurements)
                    .HasForeignKey (e => e.TankId)
                    .OnDelete (DeleteBehavior.SetNull);

                // Note: Many-to-many relationship with Alarms is configured in AlarmConfiguration
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring Tankmeasurement: {ex.Message}");
                throw new Exception ($"Error configuring TankmeasurementConfiguration: {ex.Message}", ex);
            }
        }
    }
}