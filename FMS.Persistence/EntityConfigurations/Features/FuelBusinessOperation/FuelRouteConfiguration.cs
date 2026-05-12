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
                builder.HasKey(e => e.Id);

                builder.ToTable("fuelroutes");

                builder.HasIndex(e => e.SiteId, "FK_FuelRoute_Site_idx");
                builder.HasIndex(e => new { e.FromLocation, e.ToLocation }, "IX_FuelRoute_Locations");
                builder.HasIndex(e => e.Name, "IX_FuelRoute_Name");

                builder.Property(e => e.Id);

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.Description)
                    .HasMaxLength(500);

                builder.Property(e => e.FromLocation)
                    .HasMaxLength(200)
                    .IsRequired();

                builder.Property(e => e.ToLocation)
                    .HasMaxLength(200)
                    .IsRequired();

                builder.Property(e => e.DistanceKm)
                    .HasPrecision(10, 2);

                builder.Property(e => e.ElevationChange);

                builder.Property(e => e.RouteType)
                    .HasMaxLength(50);

                builder.Property(e => e.SiteId);

                builder.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                builder.Property(e => e.CreatedAt);

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100);

                builder.Property(e => e.ModifiedAt);

                builder.Property(e => e.ModifiedBy)
                    .HasMaxLength(100);

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


