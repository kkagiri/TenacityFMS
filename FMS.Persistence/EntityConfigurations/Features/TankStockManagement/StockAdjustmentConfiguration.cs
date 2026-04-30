using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the StockAdjustment entity
    /// </summary>
    public class StockAdjustmentConfiguration : EntityTypeConfiguration<StockAdjustment> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<StockAdjustment> builder) {
            try {
                // Table configuration
                builder.ToTable ("stock_adjustments");
                builder.HasKey (e => e.Id);

                // Indexes
                builder.HasIndex (e => e.TankId, "idx_stock_adjustments_tank_id");
                builder.HasIndex (e => e.SiteId, "idx_stock_adjustments_site_id");
                builder.HasIndex (e => e.AdjustmentDate, "idx_stock_adjustments_date");
                builder.HasIndex (e => e.CreatedBy, "idx_stock_adjustments_created_by");
                builder.HasIndex (e => e.Status, "idx_stock_adjustments_status");
                builder.HasIndex (e => new { e.TankId, e.AdjustmentDate }, "idx_stock_adjustments_tank_date");

                // Column configurations
                builder.Property (e => e.Id);

                builder.Property (e => e.TankId);

                builder.Property (e => e.SiteId);

                builder.Property (e => e.AdjustmentDate);

                builder.Property (e => e.PreviousVolume)
                    .HasPrecision (10, 2);

                builder.Property (e => e.NewVolume)
                    .HasPrecision (10, 2);

                builder.Property (e => e.VolumeChange)
                    .HasPrecision (10, 2);

                builder.Property (e => e.AdjustmentType)
                    .HasComment ("0=Increase, 1=Decrease, 2=Correction");

                builder.Property (e => e.ReasonCode);

                builder.Property (e => e.Reason)
                    .HasMaxLength (200)
                    .IsRequired ();

                builder.Property (e => e.Notes)
                    .HasMaxLength (500);

                builder.Property (e => e.CreatedBy)
                    .HasMaxLength (100)
                    .IsRequired ();

                builder.Property (e => e.CreatedOn)
                    .HasDefaultValueSql ("CURRENT_TIMESTAMP");

                builder.Property (e => e.ApprovedBy)
                    .HasMaxLength (100);

                builder.Property (e => e.ApprovedOn);

                builder.Property (e => e.Status)
                    .HasDefaultValue (1)
                    .HasComment ("0=Pending, 1=Approved, 2=Rejected");

                builder.Property (e => e.TankVolumeHistoryId);

                // Soft delete properties
                builder.Property (e => e.IsDeleted)
                    .HasDefaultValue (false);

                builder.Property (e => e.DeletedAt);

                builder.Property (e => e.DeletedBy)
                    .HasMaxLength (450);

                // Global query filter to exclude soft deleted records
                builder.HasQueryFilter (sa => !sa.IsDeleted);

                // Relationships
                builder.HasOne (d => d.Tank)
                    .WithMany (p => p.StockAdjustments)
                    .HasForeignKey (d => d.TankId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fk_stock_adjustments_tank");

                builder.HasOne (d => d.Site)
                    .WithMany (p => p.StockAdjustments)
                    .HasForeignKey (d => d.SiteId)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fk_stock_adjustments_site");

                builder.HasOne (d => d.CreatedByNavigation)
                    .WithMany (p => p.StockAdjustmentsCreated)
                    .HasForeignKey (d => d.CreatedBy)
                    .OnDelete (DeleteBehavior.ClientSetNull)
                    .HasConstraintName ("fk_stock_adjustments_created_by");

                builder.HasOne (d => d.ApprovedByNavigation)
                    .WithMany (p => p.StockAdjustmentsApproved)
                    .HasForeignKey (d => d.ApprovedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fk_stock_adjustments_approved_by");

                builder.HasOne (d => d.DeletedByNavigation)
                    .WithMany (p => p.StockAdjustmentsDeleted)
                    .HasForeignKey (d => d.DeletedBy)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fk_stock_adjustments_deleted_by");

                builder.HasOne (d => d.TankVolumeHistory)
                    .WithOne (p => p.StockAdjustment)
                    .HasForeignKey<StockAdjustment> (d => d.TankVolumeHistoryId)
                    .OnDelete (DeleteBehavior.SetNull)
                    .HasConstraintName ("fk_stock_adjustments_volume_history");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring StockAdjustmentConfiguration: {ex.Message}");
                throw new Exception ($"Error configuring StockAdjustmentConfiguration: {ex.Message}", ex);
            }
        }
    }
}