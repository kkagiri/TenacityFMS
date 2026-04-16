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

                builder.ToTable("expectedfuelaveragetemplates")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

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
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.Name)
                    .HasMaxLength(250)
                    .HasColumnName("Name");

                builder.Property(e => e.Description)
                    .HasMaxLength(1000)
                    .HasColumnName("Description");

                builder.Property(e => e.VehicleTypeId)
                    .HasColumnType("int(11)")
                    .IsRequired()
                    .HasColumnName("VehicleTypeID");

                builder.Property(e => e.VehicleManufacturerId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleManufacturerID");

                builder.Property(e => e.VehicleModelId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleModelID");

                builder.Property(e => e.YearOfManufacture)
                    .HasMaxLength(4)
                    .HasColumnName("YearOfManufacture");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");

                builder.Property(e => e.FuelRouteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("FuelRouteID");

                builder.Property(e => e.LoadClassificationId)
                    .HasColumnType("int(11)")
                    .HasColumnName("LoadClassificationID");

                builder.Property(e => e.UsageIntensityId)
                    .HasColumnType("int(11)")
                    .HasColumnName("UsageIntensityID");

                builder.Property(e => e.IsKmPerLiter)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(true)
                    .HasColumnName("IsKmPerLiter");

                builder.Property(e => e.ExpectedValue)
                    .HasPrecision(10, 4)
                    .IsRequired()
                    .HasColumnName("ExpectedValue");

                builder.Property(e => e.MinThreshold)
                    .HasPrecision(10, 4)
                    .HasColumnName("MinThreshold");

                builder.Property(e => e.MaxThreshold)
                    .HasPrecision(10, 4)
                    .HasColumnName("MaxThreshold");

                builder.Property(e => e.TolerancePercent)
                    .HasPrecision(5, 2)
                    .HasDefaultValue(10m)
                    .HasColumnName("TolerancePercent");

                builder.Property(e => e.Priority)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0)
                    .HasColumnName("Priority");

                builder.Property(e => e.IsActive)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(true)
                    .HasColumnName("IsActive");

                builder.Property(e => e.EffectiveFrom)
                    .HasColumnType("datetime")
                    .HasColumnName("EffectiveFrom");

                builder.Property(e => e.EffectiveTo)
                    .HasColumnType("datetime")
                    .HasColumnName("EffectiveTo");

                builder.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasColumnName("CreatedAt");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .HasColumnName("CreatedBy");

                builder.Property(e => e.ModifiedAt)
                    .HasColumnType("datetime")
                    .HasColumnName("ModifiedAt");

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100)
                    .HasColumnName("ModifiedBy");

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
