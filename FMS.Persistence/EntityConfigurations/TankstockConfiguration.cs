using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Tankstock entity
    /// </summary>
    public class TankstockConfiguration : EntityTypeConfiguration<Tankstock>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Tankstock> builder)
        {
            try
            {
                builder.HasKey(e => e.EntryId).HasName("PRIMARY");

                builder.ToTable("tankstock");

                builder.HasIndex(e => e.TankId, "TankID_idx");
                builder.HasIndex(e => e.RecordedBy, "TankStock_User_idx");
                builder.HasIndex(e => e.SiteId, "TankStock_site_idx");

                builder.Property(e => e.EntryId)
                    .HasColumnType("int(11)")
                    .HasColumnName("EntryID");

                builder.Property(e => e.Comment).HasMaxLength(2000);
                builder.Property(e => e.Discrepancy).HasPrecision(10);
                builder.Property(e => e.EntryType).HasColumnType("int(11)");
                builder.Property(e => e.ExpectedClosingLevel).HasPrecision(10);
                builder.Property(e => e.ManualAmount).HasPrecision(10, 2);
                builder.Property(e => e.ManualCalculatedUsage).HasPrecision(10, 2);
                builder.Property(e => e.ManualClosingLevel).HasPrecision(10, 2);
                builder.Property(e => e.ManualOpeningLevel).HasPrecision(10, 2);
                builder.Property(e => e.RecordedBy)
                    .HasMaxLength(100)
                    .UseCollation("utf8mb4_general_ci")
                    .HasCharSet("utf8mb4");
                builder.Property(e => e.SensorCalculatedUsage).HasPrecision(10, 2);
                builder.Property(e => e.SensorClosingLevel).HasPrecision(10, 2);
                builder.Property(e => e.SensorDiscrepancy).HasPrecision(10);
                builder.Property(e => e.SensorOpeningLevel).HasPrecision(10, 2);
                builder.Property(e => e.SiteId).HasColumnType("int(11)");
                builder.Property(e => e.TankId)
                    .HasColumnType("int(11)")
                    .HasColumnName("TankID");

                // Relationships
                builder.HasOne(d => d.RecordedByNavigation).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.RecordedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankStock_User");

                builder.HasOne(d => d.Site).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankStock_site");

                builder.HasOne(d => d.Tank).WithMany(p => p.Tankstocks)
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("TankID");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring TankstockConfiguration: {ex.Message}", ex);
            }
        }
    }
}
