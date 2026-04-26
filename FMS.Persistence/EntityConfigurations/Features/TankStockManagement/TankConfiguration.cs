using FMS.Domain.Entities;
using FMS.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Tank entity
    /// </summary>
    public class TankConfiguration : EntityTypeConfiguration<Tank>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Tank> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("tank");

                builder.HasIndex(e => e.SiteId, "Tank_site_idx");
                builder.HasIndex(e => e.LinkedVehicleId, "IX_Tank_LinkedVehicleId");
                builder.HasIndex(e => e.TankType, "IX_Tank_TankType");

                builder.Property(e => e.Id);
                builder.Property(e => e.CurrentStock).HasPrecision(10);
                builder.Property(e => e.DiscrepancyThreshold).HasPrecision(10, 2);

                builder.Property(e => e.Name).HasMaxLength(45);
                builder.Property(e => e.PtsId)
                    .HasMaxLength(100);

                builder.Property(e => e.SiteId);
                builder.Property(e => e.TankHeight).HasPrecision(10);
                builder.Property(e => e.TankLength).HasPrecision(10);
                builder.Property(e => e.TankVolume).HasPrecision(10);
                builder.Property(e => e.UseBookKeeping)
                    .HasDefaultValueSql("'0'");

                //Cursor: Add FuelGradeId and FuelGradeName configuration
                builder.Property(e => e.FuelGradeId)
                    .IsRequired(false);

                builder.Property(e => e.FuelGradeName)
                    .HasMaxLength(45)
                    .IsRequired(false);

                //Cursor: Add PhysicalStockValue and LastPhysicalStockUpdate configuration
                builder.Property(e => e.PhysicalStockValue)
                    .HasPrecision(10, 2)
                    .IsRequired(false);

                builder.Property(e => e.LastPhysicalStockUpdate)
                    .IsRequired(false);

                builder.Property(e => e.PhysicalStockSource)
                    .HasMaxLength(50)
                    .IsRequired(false);

                builder.Property(e => e.ProbePhysicalStockUpdateSource)
                    .HasMaxLength(32)
                    .IsRequired(false);

                builder.Property(e => e.CalibrationChartSource)
                    .HasMaxLength(32)
                    .IsRequired(false);

                builder.Property(e => e.ProductVolumeSource)
                    .HasMaxLength(32)
                    .IsRequired(false);

                // =====================================================
                // Location Validation Properties
                // =====================================================

                builder.Property(e => e.TankType)
                    .HasConversion<string>()
                    .HasMaxLength(20)
                    .HasDefaultValue(TankType.Stationary)
                    .IsRequired();

                builder.Property(e => e.Latitude)
                    .HasPrecision(10, 8)
                    .IsRequired(false);

                builder.Property(e => e.Longitude)
                    .HasPrecision(11, 8)
                    .IsRequired(false);

                builder.Property(e => e.LinkedVehicleId)
                    .IsRequired(false);

                builder.Property(e => e.LocationValidationRadius)
                    .HasDefaultValue(100)
                    .IsRequired(false);

                // Relationships
                builder.HasOne(d => d.Site).WithMany(p => p.Tanks)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Tank_site");

                // Relationship to PTS device
                builder.HasOne(d => d.Pts)
                    .WithMany(p => p.Tanks)
                    .HasForeignKey(d => d.PtsId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("Tank_ptsdevice");

                // Relationship to LinkedVehicle for mobile tankers
                builder.HasOne(d => d.LinkedVehicle)
                    .WithMany()
                    .HasForeignKey(d => d.LinkedVehicleId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Tank_LinkedVehicle");

                //Cursor: Add relationship to tank measurements
                builder.HasMany(e => e.Tankmeasurements)
                    .WithOne(e => e.TankNavigation)
                    .HasForeignKey(e => e.TankId)
                    .OnDelete(DeleteBehavior.SetNull);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring TankConfiguration: {ex.Message}", ex);
            }
        }
    }
}
