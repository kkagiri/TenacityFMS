using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the TankTransfer entity
    /// </summary>
    public class TankTransferConfiguration : EntityTypeConfiguration<TankTransfer> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<TankTransfer> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("tanktransfer");

                builder.HasIndex (e => e.SourceTankId, "FK_TankTransfer_SourceTank_idx");
                builder.HasIndex (e => e.DestinationTankId, "FK_TankTransfer_DestinationTank_idx");
                builder.HasIndex (e => e.RecordedBy, "FK_TankTransfer_User_idx");

                builder.Property (e => e.Id).HasColumnType ("int(11)");
                builder.Property (e => e.SourceTankId).HasColumnType ("int(11)");
                builder.Property (e => e.DestinationTankId).HasColumnType ("int(11)");
                builder.Property (e => e.Amount).HasPrecision (10, 2);
                builder.Property (e => e.TransferDate).HasColumnType ("datetime");
                builder.Property (e => e.RecordedBy).HasMaxLength (50);
                builder.Property (e => e.CreatedOn).HasColumnType ("datetime");

                // Soft delete properties
                builder.Property (e => e.IsDeleted)
                    .HasColumnType ("tinyint(1)")
                    .HasColumnName ("is_deleted")
                    .HasDefaultValue (false);

                builder.Property (e => e.DeletedAt)
                    .HasColumnType ("datetime")
                    .HasColumnName ("deleted_at");

                builder.Property (e => e.DeletedBy)
                    .HasMaxLength (450)
                    .HasColumnName ("deleted_by");

                // Global query filter to exclude soft deleted records
                builder.HasQueryFilter (tt => !tt.IsDeleted);

                builder.HasOne (d => d.SourceTank)
                    .WithMany (p => p.TankTransfersAsSource)
                    .HasForeignKey (d => d.SourceTankId)
                    .HasConstraintName ("FK_TankTransfer_SourceTank");

                builder.HasOne (d => d.DestinationTank)
                    .WithMany (p => p.TankTransfersAsDestination)
                    .HasForeignKey (d => d.DestinationTankId)
                    .HasConstraintName ("FK_TankTransfer_DestinationTank");

                builder.HasOne (d => d.RecordedByNavigation)
                    .WithMany (p => p.TankTransfers)
                    .HasForeignKey (d => d.RecordedBy)
                    .HasConstraintName ("FK_TankTransfer_User");

                builder.HasOne (d => d.DeletedByNavigation)
                    .WithMany (p => p.TankTransfersDeleted)
                    .HasForeignKey (d => d.DeletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_TankTransfer_DeletedBy");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring TankTransferConfiguration: {ex.Message}", ex);
            }
        }
    }
}