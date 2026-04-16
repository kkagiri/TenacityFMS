using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;
using System;

namespace FMS.Persistence.EntityConfigurations
{
    public class ExpectedAverageConfiguration : EntityTypeConfiguration<Expectedaverage>
    {
        public override void Configure(EntityTypeBuilder<Expectedaverage> builder)
        {
            try
            {
                builder.HasKey(e => e.Id)
                    .HasName("PRIMARY");

                builder.ToTable("expectedaverage")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasIndex(e => e.ExpectedAverageClassificationId, "Expected_classification_idx");
                builder.HasIndex(e => e.VehicleId, "Expected_vehicle_idx");
                builder.HasIndex(e => e.SiteId, "Site_idx");
                builder.HasIndex(e => new { e.VehicleId, e.SiteId, e.ExpectedAverageClassificationId }, "UniqueRecord")
                    .IsUnique();

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.ExpectedAverageClassificationId)
                    .HasColumnType("int(11)")
                    .HasColumnName("ExpectedAverageClassificationID");

                builder.Property(e => e.ExpectedAverageValue)
                    .HasPrecision(5, 2);

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteID");

                builder.Property(e => e.VehicleId)
                    .HasColumnType("int(11)")
                    .HasColumnName("VehicleID");

                builder.HasOne(d => d.ExpectedAverageClassification)
                    .WithMany(p => p.Expectedaverages)
                    .HasForeignKey(d => d.ExpectedAverageClassificationId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Expected_classification");

                builder.HasOne(d => d.Site)
                    .WithMany(p => p.Expectedaverages)
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Expected_site");

                builder.HasOne(d => d.Vehicle)
                    .WithMany(p => p.Expectedaverages)
                    .HasForeignKey(d => d.VehicleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("Expected_vehicle");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring ExpectedAverage entity: {ex.Message}", ex);
            }
        }
    }
}