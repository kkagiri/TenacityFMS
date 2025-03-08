using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Calibrationdatum entity
    /// </summary>
    public class CalibrationdatumConfiguration : EntityTypeConfiguration<Calibrationdatum>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Calibrationdatum> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("calibrationdata");

                builder.HasIndex(e => e.VehicleId, "calibrationDataRow_idx");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever()
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.CalibrationData).HasColumnType("text");

                builder.Property(e => e.CalibrationDate).HasColumnName("calibrationDate");

                builder.Property(e => e.VehicleId)
                    .HasMaxLength(45)
                    .HasColumnName("VehicleID");

                builder.HasOne(d => d.Vehicle).WithMany(p => p.Calibrationdata)
                    .HasPrincipalKey(p => p.HyoungNo)
                    .HasForeignKey(d => d.VehicleId)
                    .HasConstraintName("calibrationData_vehicle");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring CalibrationdatumConfiguration: {ex.Message}", ex);
            }
        }
    }
}
