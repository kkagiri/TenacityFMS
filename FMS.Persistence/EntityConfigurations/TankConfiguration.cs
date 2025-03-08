using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

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

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.CurrentStock).HasPrecision(10);
                builder.Property(e => e.DiscrepancyThreshold).HasPrecision(10, 2);

                builder.Property(e => e.Name).HasMaxLength(45);
                builder.Property(e => e.PtsId)
                    .HasColumnType("varchar(100)")
                    .HasColumnName("ptsID");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");
                builder.Property(e => e.TankHeight).HasPrecision(10);
                builder.Property(e => e.TankLength).HasPrecision(10);
                builder.Property(e => e.TankVolume).HasPrecision(10);
                builder.Property(e => e.UseBookKeeping)
                    .HasDefaultValueSql("'0'")
                    .HasColumnType("tinyint(4)");

                // Relationships
                builder.HasOne(d => d.Site).WithMany(p => p.Tanks)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Tank_site");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring TankConfiguration: {ex.Message}", ex);
            }
        }
    }
}
