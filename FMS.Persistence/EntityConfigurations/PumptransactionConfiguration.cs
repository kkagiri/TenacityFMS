using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Pumptransaction entity
    /// </summary>
    public class PumptransactionConfiguration : EntityTypeConfiguration<Pumptransaction> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<Pumptransaction> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("pumptransaction");

                builder.HasIndex (e => e.PtsId, "FK_pumptransaction_idx");

                //Cursor: Add additional indexes for performance
                builder.HasIndex (e => e.TankId, "idx_pumptransaction_tankid");
                builder.HasIndex (e => e.VehicleId, "idx_pumptransaction_vehicleid");
                builder.HasIndex (e => e.HasBeenProcessed, "idx_pumptransaction_processed");
                builder.HasIndex (e => e.DateTime, "idx_pumptransaction_datetime");
                builder.HasIndex (e => new { e.Pump, e.Transaction }, "idx_pumptransaction_pump_transaction");

                //Cursor: Add composite unique constraint for PTS-generated transaction IDs
                builder.HasIndex (e => new { e.PtsId, e.Transaction }, "idx_pumptransaction_pts_transaction_unique")
                    .IsUnique ();

                builder.Property (e => e.Id).HasColumnType ("int(11)");

                //Cursor: Update decimal precision for fuel measurements
                builder.Property (e => e.Amount).HasPrecision (10, 2); // 2 decimal places for currency
                builder.Property (e => e.TotalAmount).HasPrecision (10, 2); // 2 decimal places for currency
                builder.Property (e => e.Volume).HasPrecision (10, 3); // 3 decimal places for volume
                builder.Property (e => e.Tcvolume).HasPrecision (10, 3).HasColumnName ("TCVolume"); // 3 decimal places
                builder.Property (e => e.Price).HasPrecision (10, 3); // 3 decimal places for price per unit
                builder.Property (e => e.TotalVolume).HasPrecision (10, 3); // 3 decimal places for volume

                builder.Property (e => e.ConfigurationId).HasMaxLength (45);
                builder.Property (e => e.FuelGradeId).HasColumnType ("int(11)");
                builder.Property (e => e.FuelGradeName).HasMaxLength (45);
                builder.Property (e => e.Nozzle).HasColumnType ("int(11)");
                builder.Property (e => e.PacketId).HasColumnType ("int(11)");
                builder.Property (e => e.PtsId).HasMaxLength (100);
                builder.Property (e => e.Pump).HasColumnType ("int(11)");
                builder.Property (e => e.Tag).HasMaxLength (45);
                builder.Property (e => e.Transaction).HasColumnType ("int(11)");
                builder.Property (e => e.UserId).HasColumnType ("int(11)"); //Dont confuse with UserId in User table

                //Cursor: Configure new columns
                builder.Property (e => e.TankId).HasColumnType ("int(11)");
                builder.Property (e => e.VehicleId).HasColumnType ("int(11)");
                builder.Property (e => e.HasBeenProcessed)
                    .HasColumnType ("tinyint(1)")
                    .HasDefaultValue (false)
                    .HasComment ("Indicates whether this transaction has been processed by business logic");

                // Relationships
                builder.HasOne (d => d.Pts).WithMany (p => p.Pumptransactions)
                    .HasForeignKey (d => d.PtsId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("FK_pumptransaction");

                builder.HasOne (d => d.Tank)
                    .WithMany (p => p.Pumptransactions)
                    .HasForeignKey (d => d.TankId)
                    .OnDelete (DeleteBehavior.SetNull) //Cursor: Use SetNull instead of ClientSetNull
                    .HasConstraintName ("FK_tank");

                builder.HasOne (d => d.Vehicle)
                    .WithMany (p => p.Pumptransactions)
                    .HasForeignKey (d => d.VehicleId)
                    .OnDelete (DeleteBehavior.SetNull) //Cursor: Use SetNull instead of ClientSetNull
                    .HasConstraintName ("FK_vehicle");

            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring Pumptransaction: {ex.Message}");

                throw new Exception ($"Error configuring PumptransactionConfiguration: {ex.Message}", ex);
            }
        }
    }
}