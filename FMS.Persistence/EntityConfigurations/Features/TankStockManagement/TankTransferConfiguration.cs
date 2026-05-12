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
                builder.HasKey (e => e.Id);

                builder.ToTable ("tanktransfer");

                // Indexes matching DDL
                builder.HasIndex (e => e.SourceTankId, "source_idx");
                builder.HasIndex (e => e.DestinationTankId, "dest_idx");
                builder.HasIndex (e => e.RecordedBy, "recordedby_idx");

                builder.Property (e => e.Id);
                builder.Property (e => e.SourceTankId);
                builder.Property (e => e.DestinationTankId);
                // Schema requires DECIMAL(10,0)
                builder.Property (e => e.Amount).HasPrecision (10, 0);
                builder.Property (e => e.TransferDate);
                builder.Property (e => e.RecordedBy).HasMaxLength (100);
                builder.Property (e => e.CreatedOn);

                // Soft delete properties
                builder.Property (e => e.IsDeleted)
                    .HasDefaultValue (false);

                builder.Property (e => e.DeletedAt);

                builder.Property (e => e.DeletedBy)
                    .HasMaxLength (450);

                // Correction tracking properties
                builder.Property (e => e.IsCorrection)
                    .HasDefaultValue (false);

                builder.Property (e => e.CorrectsRecordId);

                builder.Property (e => e.CorrectionReason)
                    .HasMaxLength (200);

                // Global query filter to exclude soft deleted records
                builder.HasQueryFilter (tt => !tt.IsDeleted);

                builder.HasOne (d => d.SourceTank)
                    .WithMany (p => p.TankTransfersAsSource)
                    .HasForeignKey (d => d.SourceTankId)
                    .HasConstraintName ("source");

                builder.HasOne (d => d.DestinationTank)
                    .WithMany (p => p.TankTransfersAsDestination)
                    .HasForeignKey (d => d.DestinationTankId)
                    .HasConstraintName ("dest");

                builder.HasOne (d => d.RecordedByNavigation)
                    .WithMany (p => p.TankTransfers)
                    .HasForeignKey (d => d.RecordedBy)
                    .HasConstraintName ("recordedby");

                builder.HasOne (d => d.DeletedByNavigation)
                    .WithMany (p => p.TankTransfersDeleted)
                    .HasForeignKey (d => d.DeletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("FK_TankTransfer_DeletedBy");

                // Self-referencing relationship for corrections
                builder.HasOne (d => d.CorrectsRecord)
                    .WithMany (d => d.CorrectionRecords)
                    .HasForeignKey (d => d.CorrectsRecordId)
                    .OnDelete (DeleteBehavior.Restrict)
                    .HasConstraintName ("FK_TankTransfer_CorrectsRecord");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring TankTransferConfiguration: {ex.Message}", ex);
            }
        }
    }
}