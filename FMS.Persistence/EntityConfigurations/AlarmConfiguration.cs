using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Alarm entity
    /// </summary>
    public class AlarmConfiguration : EntityTypeConfiguration<Alarm> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<Alarm> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");
                builder.ToTable ("alarm");

                builder.Property (e => e.Id)
                    .HasColumnType ("int(11)")
                    .HasColumnName ("id");

                builder.Property (e => e.Description).HasMaxLength (300);
                builder.Property (e => e.Name).HasMaxLength (45);
                builder.Property (e => e.Priority).HasMaxLength (45);

                // Configure many-to-many relationship with Tankmeasurements
                builder.HasMany (e => e.TankMeasurements)
                    .WithMany (e => e.Alarms)
                    .UsingEntity (
                        "TankmeasurementAlarm",
                        l => l.HasOne (typeof (Tankmeasurement)).WithMany ().HasForeignKey ("TankmeasurementId"),
                        r => r.HasOne (typeof (Alarm)).WithMany ().HasForeignKey ("AlarmId"),
                        j => j.HasKey ("TankmeasurementId", "AlarmId"));
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring Alarm: {ex.Message}");
                throw new Exception ($"Error configuring AlarmConfiguration: {ex.Message}", ex);
            }
        }
    }
}