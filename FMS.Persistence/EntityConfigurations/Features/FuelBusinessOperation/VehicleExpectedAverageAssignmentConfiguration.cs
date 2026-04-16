using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class VehicleExpectedAverageAssignmentConfiguration : EntityTypeConfiguration<VehicleExpectedAverageAssignment>
    {
        public override void Configure(EntityTypeBuilder<VehicleExpectedAverageAssignment> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("vehicleexpectedaverageassignments")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                // Indexes
                builder.HasIndex(e => e.VehicleId, "IX_VEAA_Vehicle");
                builder.HasIndex(e => e.ExpectedFuelAverageTemplateId, "IX_VEAA_Template");
                builder.HasIndex(e => new { e.VehicleId, e.ExpectedFuelAverageTemplateId }, "IX_VEAA_Vehicle_Template").IsUnique();
                builder.HasIndex(e => new { e.VehicleId, e.IsDefault }, "IX_VEAA_Vehicle_Default");

                // Properties
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .IsRequired()
                    .HasColumnName("VehicleID");

                builder.Property(e => e.ExpectedFuelAverageTemplateId)
                    .HasColumnType("int(11)")
                    .IsRequired()
                    .HasColumnName("ExpectedFuelAverageTemplateID");

                builder.Property(e => e.IsDefault)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(false)
                    .HasColumnName("IsDefault");

                builder.Property(e => e.OverrideExpectedValue)
                    .HasPrecision(10, 4)
                    .HasColumnName("OverrideExpectedValue");

                builder.Property(e => e.OverrideTolerancePercent)
                    .HasPrecision(5, 2)
                    .HasColumnName("OverrideTolerancePercent");

                builder.Property(e => e.Notes)
                    .HasMaxLength(500)
                    .HasColumnName("Notes");

                builder.Property(e => e.IsActive)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(true)
                    .HasColumnName("IsActive");

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
                builder.HasOne(d => d.Vehicle)
                    .WithMany(p => p.ExpectedAverageAssignments)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_VEAA_Vehicle");

                builder.HasOne(d => d.ExpectedFuelAverageTemplate)
                    .WithMany(p => p.VehicleAssignments)
                    .HasForeignKey(d => d.ExpectedFuelAverageTemplateId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_VEAA_Template");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring VehicleExpectedAverageAssignment: {ex.Message}");
                throw new Exception($"Error configuring VehicleExpectedAverageAssignment entity: {ex.Message}", ex);
            }
        }
    }
}
