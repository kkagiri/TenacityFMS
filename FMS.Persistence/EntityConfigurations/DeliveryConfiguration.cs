using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Delivery entity
    /// </summary>
    public class DeliveryConfiguration : EntityTypeConfiguration<Delivery> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<Delivery> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("delivery", tb => tb.HasComment ("		"));

                builder.HasIndex (e => e.SupplierId, "Delivery_Supplier_idx");
                builder.HasIndex (e => e.RecordedBy, "Delivery_User_idx");
                builder.HasIndex (e => e.TankId, "Delivery_tank_idx");

                // Add composite index for performance optimization
                builder.HasIndex (e => new { e.TankId, e.DeliveryDate, e.PricePerLiter }, "IX_Delivery_TankId_DeliveryDate_PricePerLiter");

                builder.Property (e => e.Id).HasColumnType ("int(11)");
                builder.Property (e => e.DeliveryDensity).HasPrecision (10);
                builder.Property (e => e.DeliveryMass).HasPrecision (10);
                builder.Property (e => e.DeliveryTemperature).HasPrecision (10);
                builder.Property (e => e.Lponumber)
                    .HasMaxLength (45)
                    .HasColumnName ("LPONumber");
                builder.Property (e => e.ManualDeliveryAmount).HasPrecision (10);
                builder.Property (e => e.Product).HasMaxLength (100);
                builder.Property (e => e.RecordedBy)
                    .HasMaxLength (100)
                    .UseCollation ("utf8mb4_general_ci")
                    .HasCharSet ("utf8mb4");
                builder.Property (e => e.SensorDeliveryAmount).HasPrecision (10);
                builder.Property (e => e.StockAfterDelivery).HasPrecision (10);
                builder.Property (e => e.StockBeforeDelivery).HasPrecision (10);
                builder.Property (e => e.SupplierId).HasColumnType ("int(11)");
                builder.Property (e => e.TankId).HasColumnType ("int(11)");

                // CreatedOn and PricePerLiter properties
                builder.Property (e => e.CreatedOn)
                    .HasColumnType ("datetime")
                    .IsRequired ();

                builder.Property (e => e.PricePerLiter)
                    .HasPrecision (10, 2)
                    .HasDefaultValue (150.00m)
                    .HasComment ("Price per liter in Kenya Shillings (KES)");

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
                // builder.Property (e => e.IsCorrection)
                //     .HasColumnType ("tinyint(1)")
                //     .HasColumnName ("is_correction")
                //     .HasDefaultValue (false);

                // builder.Property (e => e.CorrectsRecordId)
                //     .HasColumnType ("int(11)")
                //     .HasColumnName ("corrects_record_id");

                // builder.Property (e => e.CorrectionReason)
                //     .HasMaxLength (200)
                //     .HasColumnName ("correction_reason");

                // Global query filter to exclude soft deleted records
                builder.HasQueryFilter (d => !d.IsDeleted);

                // Relationships
                builder.HasOne (d => d.RecordedByNavigation).WithMany (p => p.Deliveries)
                    .HasForeignKey (d => d.RecordedBy)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("Delivery_User");

                builder.HasOne (d => d.DeletedByNavigation).WithMany (p => p.DeliveriesDeleted)
                    .HasForeignKey (d => d.DeletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("Delivery_DeletedBy");

                builder.HasOne (d => d.Supplier).WithMany (p => p.Deliveries)
                    .HasForeignKey (d => d.SupplierId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("Delivery_Supplier");

                builder.HasOne (d => d.Tank).WithMany (p => p.Deliveries)
                    .HasForeignKey (d => d.TankId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("Delivery_tank");

                // Self-referencing relationship for corrections
                // builder.HasOne (d => d.CorrectsRecord)
                //     .WithMany (d => d.CorrectionRecords)
                //     .HasForeignKey (d => d.CorrectsRecordId)
                //     .OnDelete (DeleteBehavior.Restrict)
                //     .HasConstraintName ("Delivery_CorrectsRecord");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring DeliveryConfiguration: {ex.Message}", ex);
            }
        }
    }
}