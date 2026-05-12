using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class TagMonitoringConfigConfiguration : EntityTypeConfiguration<VehicleLocationTagMonitoringConfig> {
        public override void Configure (EntityTypeBuilder<VehicleLocationTagMonitoringConfig> builder) {
            builder.HasKey (e => e.Id);
            builder.ToTable ("tag_monitoring_config");

            builder.Property (e => e.Id)
                .ValueGeneratedOnAdd ();

            builder.Property (e => e.VehicleId);
            builder.Property (e => e.TagName).HasMaxLength (100);
            builder.Property (e => e.IsEnabled).HasDefaultValueSql ("'1'");
            builder.Property (e => e.IgnoredLocations).HasMaxLength (255);
            builder.Property (e => e.Monitored).HasDefaultValueSql ("'1'");

            builder.HasOne (e => e.Vehicle)
                .WithMany ()
                .HasForeignKey (e => e.VehicleId)
                .HasConstraintName ("FK_TagMonitoringConfig_Vehicle");
        }
    }
}