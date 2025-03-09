using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Tankmeasurement entity
    /// </summary>
    public class TankmeasurementConfiguration : EntityTypeConfiguration<Tankmeasurement>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Tankmeasurement> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("tankmeasurement");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");

                builder.Property(e => e.ConfigurationId).HasMaxLength(45);
                builder.Property(e => e.FuelGradeId).HasColumnType("int(11)");
                builder.Property(e => e.PacketId).HasColumnType("int(11)");
                builder.Property(e => e.ProductTcvolume).HasColumnName("ProductTCVolume");
                builder.Property(e => e.Ptsid).HasColumnName("PTSId");
                builder.Property(e => e.Status).HasMaxLength(45);
                builder.Property(e => e.Tank).HasColumnType("int(11)");
                builder.Property(e => e.TankFillingPercentage).HasColumnType("int(11)");
                builder.Property(e => e.WaterHeight).HasColumnName("waterHeight");

                // Many-to-many relationship with Alarm
                builder.HasMany(d => d.Alarms).WithMany(p => p.TankMeasurements)
                    .UsingEntity<Dictionary<string, object>>(
                        "AlarmTankmeasurement",
                        r => r.HasOne<Alarm>().WithMany()
                            .HasForeignKey("AlarmId")
                            .HasConstraintName("alarmmeasurement_alarm"),
                        l => l.HasOne<Tankmeasurement>().WithMany()
                            .HasForeignKey("TankMeasurementId")
                            .HasConstraintName("alarmMeasurement_tankmeasurement"),
                        j =>
                        {
                            j.HasKey("TankMeasurementId", "AlarmId")
                                .HasName("PRIMARY")
                                .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });
                            j.ToTable("alarm_tankmeasurement");
                            j.HasIndex(new[] { "TankMeasurementId" }, "alarmMeasurement_tankmeasurement_idx");
                            j.HasIndex(new[] { "AlarmId" }, "alarmmeasurement_alarm_idx");
                            j.IndexerProperty<int>("TankMeasurementId")
                                .HasColumnType("int(11)")
                                .HasColumnName("tankMeasurementID");
                            j.IndexerProperty<int>("AlarmId")
                                .HasColumnType("int(11)")
                                .HasColumnName("alarmID");
                        });
            }


            catch (Exception ex)
            {
                throw new Exception($"Error configuring TankmeasurementConfiguration: {ex.Message}", ex);
            }
        }
    }
}
