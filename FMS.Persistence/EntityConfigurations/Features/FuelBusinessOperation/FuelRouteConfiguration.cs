using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelRouteConfiguration : EntityTypeConfiguration<FuelRoute>
    {
        public override void Configure(EntityTypeBuilder<FuelRoute> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("fuelroutes")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasIndex(e => e.SiteId, "FK_FuelRoute_Site_idx");
                builder.HasIndex(e => new { e.FromLocation, e.ToLocation }, "IX_FuelRoute_Locations");
                builder.HasIndex(e => e.Name, "IX_FuelRoute_Name");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasColumnName("Name");

                builder.Property(e => e.Description)
                    .HasMaxLength(500)
                    .HasColumnName("Description");

                builder.Property(e => e.FromLocation)
                    .HasMaxLength(200)
                    .IsRequired()
                    .HasColumnName("FromLocation");

                builder.Property(e => e.ToLocation)
                    .HasMaxLength(200)
                    .IsRequired()
                    .HasColumnName("ToLocation");

                builder.Property(e => e.DistanceKm)
                    .HasPrecision(10, 2)
                    .HasColumnName("DistanceKm");

                builder.Property(e => e.ElevationChange)
                    .HasColumnType("int(11)")
                    .HasColumnName("ElevationChange");

                builder.Property(e => e.RouteType)
                    .HasMaxLength(50)
                    .HasColumnName("RouteType");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");

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
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_FuelRoute_Site");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring FuelRoute: {ex.Message}");
                throw new Exception($"Error configuring FuelRoute entity: {ex.Message}", ex);
            }
        }
    }
}
