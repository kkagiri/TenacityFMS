using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class ExpectedFuelAverageTemplateConfiguration : EntityTypeConfiguration<ExpectedFuelAverageTemplate>
    {
        public override void Configure(EntityTypeBuilder<ExpectedFuelAverageTemplate> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("expectedfuelaveragetemplates");

                // Indexes
                builder.HasIndex(e => e.VehicleTypeId, "IX_EFAT_VehicleType");
                builder.HasIndex(e => e.VehicleManufacturerId, "IX_EFAT_VehicleManufacturer");
                builder.HasIndex(e => e.VehicleModelId, "IX_EFAT_VehicleModel");
                builder.HasIndex(e => e.SiteId, "IX_EFAT_Site");
                builder.HasIndex(e => e.FuelRouteId, "IX_EFAT_FuelRoute");
                builder.HasIndex(e => e.LoadClassificationId, "IX_EFAT_LoadClassification");
                builder.HasIndex(e => e.UsageIntensityId, "IX_EFAT_UsageIntensity");
                builder.HasIndex(e => new { e.VehicleTypeId, e.VehicleManufacturerId, e.VehicleModelId, e.SiteId, e.FuelRouteId, e.LoadClassificationId, e.UsageIntensityId }, "IX_EFAT_Composite");

                // Properties
                builder.Property(e => e.Id);

                builder.Property(e => e.Name)
                    .HasMaxLength(250);

                builder.Property(e => e.Description)
                    .HasMaxLength(1000);

                builder.Property(e => e.VehicleTypeId)
                    .IsRequired();

                builder.Property(e => e.VehicleManufacturerId);

                builder.Property(e => e.VehicleModelId);

                builder.Property(e => e.YearOfManufacture)
                    .HasMaxLength(4);

                builder.Property(e => e.SiteId);

                builder.Property(e => e.FuelRouteId);

                builder.Property(e => e.LoadClassificationId);

                builder.Property(e => e.UsageIntensityId);

                builder.Property(e => e.IsKmPerLiter)
                    .HasDefaultValue(true);

                builder.Property(e => e.ExpectedValue)
                    .HasPrecision(10, 4)
                    .IsRequired();

                builder.Property(e => e.MinThreshold)
                    .HasPrecision(10, 4);

                builder.Property(e => e.MaxThreshold)
                    .HasPrecision(10, 4);

                builder.Property(e => e.TolerancePercent)
                    .HasPrecision(5, 2)
                    .HasDefaultValue(10m);

                builder.Property(e => e.Priority)
                    .HasDefaultValue(0);

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.EffectiveFrom);

                builder.Property(e => e.EffectiveTo);

                builder.Property(e => e.CreatedAt);

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.ModifiedAt);

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);

                // Relationships
                builder.HasOne(d => d.VehicleType)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleTypeId)
                    .OnDelete(DeleteBehavior.Restrict)
                    .HasConstraintName("FK_EFAT_VehicleType");

                builder.HasOne(d => d.VehicleManufacturer)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleManufacturerId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_VehicleManufacturer");

                builder.HasOne(d => d.VehicleModel)
                    .WithMany()
                    .HasForeignKey(d => d.VehicleModelId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_VehicleModel");

                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_Site");

                builder.HasOne(d => d.FuelRoute)
                    .WithMany(p => p.ExpectedFuelAverageTemplates)
                    .HasForeignKey(d => d.FuelRouteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_FuelRoute");

                builder.HasOne(d => d.LoadClassification)
                    .WithMany(p => p.ExpectedFuelAverageTemplates)
                    .HasForeignKey(d => d.LoadClassificationId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_LoadClassification");

                builder.HasOne(d => d.UsageIntensity)
                    .WithMany(p => p.ExpectedFuelAverageTemplates)
                    .HasForeignKey(d => d.UsageIntensityId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_EFAT_UsageIntensity");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring ExpectedFuelAverageTemplate: {ex.Message}");
                throw new Exception($"Error configuring ExpectedFuelAverageTemplate entity: {ex.Message}", ex);
            }
        }
    }
}


