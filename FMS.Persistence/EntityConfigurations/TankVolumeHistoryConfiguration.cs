using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the TankVolumeHistory entity
    /// </summary>
    public class TankVolumeHistoryConfiguration : EntityTypeConfiguration<TankVolumeHistory> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<TankVolumeHistory> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("tankvolumehistory");

                builder.HasIndex (e => e.TankId, "FK_TankVolumeHistory_Tank_idx");
                builder.HasIndex (e => e.RecordedBy, "FK_TankVolumeHistory_User_idx");

                builder.Property (e => e.Id).HasColumnType ("int(11)");
                builder.Property (e => e.TankId).HasColumnType ("int(11)");
                builder.Property (e => e.Timestamp).HasColumnType ("datetime");
                builder.Property (e => e.VolumeChange).HasPrecision (10, 2);
                builder.Property (e => e.NewVolume).HasPrecision (10, 2);
                builder.Property (e => e.ChangeReason).HasColumnType ("int(11)");
                builder.Property (e => e.RecordedBy).HasMaxLength (100);
                builder.Property (e => e.ReferenceId).HasColumnType ("int(11)");
                builder.Property (e => e.ReferenceType).HasMaxLength (50);
                builder.Property (e => e.CreatedOn).HasColumnType ("datetime");

                // Soft delete fields
                builder.Property (e => e.IsDeleted)
                    .HasDefaultValueSql ("'0'")
                    .IsRequired (false);

                builder.Property (e => e.DeletedAt)
                    .HasColumnType ("datetime")
                    .IsRequired (false);

                builder.Property (e => e.DeletedBy)
                    .HasMaxLength (100)
                    .IsRequired (false);

                builder.HasOne (d => d.Tank)
                    .WithMany (p => p.TankVolumeHistories)
                    .HasForeignKey (d => d.TankId)
                    .HasConstraintName ("FK_TankVolumeHistory_Tank");

                builder.HasOne (d => d.RecordedByNavigation)
                    .WithMany (p => p.TankVolumeHistories)
                    .HasForeignKey (d => d.RecordedBy)
                    .HasConstraintName ("FK_TankVolumeHistory_User");

                builder.HasOne (d => d.DeletedByNavigation)
                    .WithMany ()
                    .HasForeignKey (d => d.DeletedBy)
                    .HasConstraintName ("FK_tankvolumehistory_user_DeletedBy")
                    .OnDelete (DeleteBehavior.SetNull);

                // Apply global query filter for soft delete - exclude deleted records
                builder.HasQueryFilter (tvh => tvh.IsDeleted != true);
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring TankVolumeHistoryConfiguration: {ex.Message}", ex);
            }
        }
    }
}