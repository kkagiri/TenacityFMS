using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Delivery entity
    /// </summary>
    public class DeliveryConfiguration : EntityTypeConfiguration<Delivery>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Delivery> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("delivery", tb => tb.HasComment("		"));

                builder.HasIndex(e => e.SupplierId, "Delivery_Supplier_idx");
                builder.HasIndex(e => e.RecordedBy, "Delivery_User_idx");
                builder.HasIndex(e => e.TankId, "Delivery_tank_idx");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.DeliveryDensity).HasPrecision(10);
                builder.Property(e => e.DeliveryMass).HasPrecision(10);
                builder.Property(e => e.DeliveryTemperature).HasPrecision(10);
                builder.Property(e => e.Lponumber)
                    .HasMaxLength(45)
                    .HasColumnName("LPONumber");
                builder.Property(e => e.ManualDeliveryAmount).HasPrecision(10);
                builder.Property(e => e.Product).HasMaxLength(100);
                builder.Property(e => e.RecordedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.SensorDeliveryAmount).HasPrecision(10);
                builder.Property(e => e.StockAfterDelivery).HasPrecision(10);
                builder.Property(e => e.StockBeforeDelivery).HasPrecision(10);
                builder.Property(e => e.SupplierId).HasColumnType("int(11)");
                builder.Property(e => e.TankId).HasColumnType("int(11)");

                // Relationships
                builder.HasOne(d => d.RecordedByNavigation).WithMany(p => p.Deliveries)
                    .HasForeignKey(d => d.RecordedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Delivery_User");

                builder.HasOne(d => d.Supplier).WithMany(p => p.Deliveries)
                    .HasForeignKey(d => d.SupplierId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Delivery_Supplier");

                builder.HasOne(d => d.Tank).WithMany(p => p.Deliveries)
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Delivery_tank");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring DeliveryConfiguration: {ex.Message}", ex);
            }
        }
    }
}
