using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the FuelRefill entity
    /// </summary>
    public class FuelRefillConfiguration : EntityTypeConfiguration<FuelRefill> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<FuelRefill> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");
                builder.ToTable ("fuelrefil");

                // Indexes
                builder.HasIndex (e => e.VehicleId, "fuelrefill_vehicle_idx");
                builder.HasIndex (e => e.FuelBy, "fuelrefill_user_idx");
                builder.HasIndex (e => e.TankId, "fuelrefill_tank_idx");
                builder.HasIndex (e => e.SiteId, "fuelrefill_site_idx");
                builder.HasIndex (e => e.Date, "fuelrefill_date_idx");

                // Column configurations
                builder.Property (e => e.Id).HasColumnType ("int(11)");
                builder.Property (e => e.VehicleId).HasColumnType ("int(11)");
                builder.Property (e => e.ManualFuelrefillAmount).HasPrecision (10, 2).HasColumnName ("ManualFuelrefilAmount");
                builder.Property (e => e.Date).HasColumnType ("datetime");
                builder.Property (e => e.PreviousMeterReading).HasPrecision (10, 2);
                builder.Property (e => e.CurrentMeterReading).HasPrecision (10, 2);
                builder.Property (e => e.SiteId).HasColumnType ("int(11)");
                builder.Property (e => e.Comment).HasMaxLength (500);
                builder.Property (e => e.FuelBy)
                    .HasMaxLength (450)
                    .IsRequired ();
                builder.Property (e => e.PumpTranscationId).HasColumnType ("int(11)");
                builder.Property (e => e.DriverId).HasColumnType ("int(11)");
                builder.Property (e => e.TagId).HasMaxLength (50);
                builder.Property (e => e.TankId).HasColumnType ("int(11)");
                builder.Property (e => e.DateCreated).HasColumnType ("datetime");
                builder.Property (e => e.DateModified).HasColumnType ("datetime");
                builder.Property (e => e.ModifiedBy).HasMaxLength (450);
                builder.Property (e => e.IsModified).HasColumnType ("tinyint(4)");

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

                // Correction tracking properties
                builder.Property (e => e.IsCorrection)
                    .HasColumnType ("tinyint(1)")
                    .HasColumnName ("is_correction")
                    .IsRequired()
                    .HasDefaultValue (false);

                builder.Property (e => e.CorrectsRecordId)
                    .HasColumnType ("int(11)")
                    .HasColumnName ("corrects_record_id");

                builder.Property (e => e.CorrectionReason)
                    .HasMaxLength (200)
                    .HasColumnName ("correction_reason");

                // Global query filter to exclude soft deleted records
                builder.HasQueryFilter (fr => !fr.IsDeleted);

                // Relationships
                builder.HasOne (d => d.Tank)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.TankId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fuelrefill_tank");

                builder.HasOne (d => d.Driver)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.DriverId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fuelrefill_driver");

                builder.HasOne (d => d.FuelByNavigation)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.FuelBy)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fuelrefill_user");

                builder.HasOne (d => d.DeletedByNavigation)
                    .WithMany (p => p.FuelRefillsDeleted)
                    .HasForeignKey (d => d.DeletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fuelrefill_deleted_by");

                builder.HasOne (d => d.PumpTranscation)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.PumpTranscationId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fuelrefill_pump_transaction");

                builder.HasOne (d => d.Site)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.SiteId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fuelrefill_site");

                builder.HasOne (d => d.TagNavigation)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.TagId)
                    .HasPrincipalKey (p => p.Name)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fuelrefill_tag");

                builder.HasOne (d => d.Vehicle)
                    .WithMany (p => p.Fuelrefils)
                    .HasForeignKey (d => d.VehicleId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fuelrefill_vehicle");

                // Self-referencing relationship for corrections
                builder.HasOne (d => d.CorrectsRecord)
                    .WithMany (d => d.CorrectionRecords)
                    .HasForeignKey (d => d.CorrectsRecordId)
                    .OnDelete (DeleteBehavior.Restrict)
                    .HasConstraintName ("fuelrefil_corrects_record");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring FuelRefillConfiguration: {ex.Message}");
                throw new Exception ($"Error configuring FuelRefillConfiguration: {ex.Message}", ex);
            }
        }
    }
}