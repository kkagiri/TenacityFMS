using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class TagChangeLogConfiguration : EntityTypeConfiguration<VehicleTagChangeLog> {
        public override void Configure (EntityTypeBuilder<VehicleTagChangeLog> builder) {
            builder.HasKey (e => e.Id);
            builder.ToTable ("tag_change_log");

            builder.Property (e => e.Id)
                .ValueGeneratedOnAdd ();

            builder.Property (e => e.VehicleId);
            builder.Property (e => e.Username).HasMaxLength (100);
            builder.Property (e => e.OldTag).HasMaxLength (100);
            builder.Property (e => e.NewTag).HasMaxLength (100);
            builder.Property (e => e.Location).HasMaxLength (255);
            builder.Property (e => e.Timestamp);
            builder.Property (e => e.Action).HasMaxLength (50);
            builder.Property (e => e.Note).HasMaxLength (255);

            builder.HasOne (e => e.Vehicle)
                .WithMany ()
                .HasForeignKey (e => e.VehicleId)
                .HasConstraintName ("FK_TagChangeLog_Vehicle");
        }
    }
}