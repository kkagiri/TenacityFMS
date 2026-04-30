/**
 * File: SiteConfiguration.cs
 * Purpose: EF Core mapping for Site entity, including GPSGate tag/geofence configuration.
 * Dependencies: Site, GpsGeofence.
 * Last Modified: 2026-02-26
 */
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Site entity
    /// </summary>
    public class SiteConfiguration : EntityTypeConfiguration<Site>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Site> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("site", tb => tb.HasComment("			"));

                builder.Property(e => e.Id);

                builder.Property(e => e.Name)
                    .HasMaxLength(45);

                builder.Property(e => e.IsActive)
                    .IsRequired()
                    .HasDefaultValue(true)
                    .HasComment("Indicates whether the site is active for fuel reporting");

                // Site Administrator relationship
                builder.Property(e => e.SiteAdministratorId)
                    .HasMaxLength(100);

                builder.HasOne(d => d.SiteAdministrator)
                    .WithMany()
                    .HasForeignKey(d => d.SiteAdministratorId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Site_SiteAdministrator");

                // Index for Site Administrator
                builder.HasIndex(e => e.SiteAdministratorId, "IX_Site_SiteAdministrator");

                // GPSGate Tag Configuration
                builder.Property(e => e.GpsGateTagId)
                    .HasComment("The GPSGate tag ID for monitoring vehicles at this site");

                builder.Property(e => e.GpsGateTagName)
                    .HasMaxLength(100)
                    .HasComment("The GPSGate tag name for display purposes");

                builder.Property(e => e.AutoUpdateGpsGateTag)
                    .HasDefaultValue(true)
                    .HasComment("Whether to automatically update GPSGate tags when vehicles are transferred");

                // GPSGate Geofence Configuration
                builder.Property(e => e.GpsGeofenceId)
                    .HasComment("Selected local GPS geofence ID from gps_geofence");

                builder.Property(e => e.GpsGeofenceName)
                    .HasMaxLength(200)
                    .HasComment("Selected GPS geofence display name snapshot");

                builder.Property(e => e.GpsGeofenceType)
                    .HasMaxLength(20)
                    .HasComment("Selected GPS geofence type snapshot: Circle, Polygon, Route");

                builder.Property(e => e.GpsGeofenceCenterLatitude)
                    .HasColumnType("decimal(10,7)")
                    .HasComment("Selected GPS geofence center latitude snapshot");

                builder.Property(e => e.GpsGeofenceCenterLongitude)
                    .HasColumnType("decimal(10,7)")
                    .HasComment("Selected GPS geofence center longitude snapshot");

                // Site Classification
                builder.Property(e => e.Classification)
                    .HasDefaultValue(SiteClassification.Unknown)
                    .HasComment("Operational classification: 0=Unknown, 1=Parking, 2=Load, 3=Dump, 4=Fuel, 5=Workshop");

                builder.HasOne(d => d.GpsGeofence)
                    .WithMany()
                    .HasForeignKey(d => d.GpsGeofenceId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Site_GpsGeofence");

                builder.HasIndex(e => e.GpsGeofenceId, "IX_Site_GpsGeofence");

                // Many-to-many relationship with User
                // builder.HasMany(d => d.Users).WithMany(p => p.Sites)
                //     .UsingEntity<Dictionary<string, object>>(
                //         "Usersite",
                //         r => r.HasOne<User>().WithMany()
                //             .HasForeignKey("UserId")
                //             .OnDelete(DeleteBehavior.ClientSetNull)
                //             .HasConstraintName("UserID"),
                //         l => l.HasOne<Site>().WithMany()
                //             .HasForeignKey("SiteId")
                //             .OnDelete(DeleteBehavior.ClientSetNull)
                //             .HasConstraintName("SiteID"),
                //         j =>
                //         {
                //             j.HasKey("SiteId", "UserId")
                //
                //;
                //             j.ToTable("usersite");
                //             j.HasIndex(new[] { "UserId" }, "UserID_idx");
                //             j.IndexerProperty<int>("SiteId");
                //             j.IndexerProperty<string>("UserId")
                //                 .HasMaxLength(100)
                //
                //;
                //         });
            }
            catch (Exception ex)
            {
                throw new Exception($"Error configuring SiteConfiguration: {ex.Message}", ex);
            }
        }
    }
}



