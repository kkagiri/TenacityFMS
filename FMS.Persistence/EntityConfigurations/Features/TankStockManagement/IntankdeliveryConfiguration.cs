using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
       public class IntankdeliveryConfiguration : EntityTypeConfiguration<Intankdelivery>
       {
              public override void Configure(EntityTypeBuilder<Intankdelivery> builder)
              {
                     try
                     {
                            // Map the entity to the "intankdelivery" table.
                            builder.ToTable("intankdelivery");

                            // Primary key with auto-increment.
                            builder.HasKey(i => i.DeliveryId);

                            builder.HasIndex(i => i.Ptsid, "fk_psTID_idx");

                            builder.Property(i => i.DeliveryId)
                                   .IsRequired()
                                   .ValueGeneratedOnAdd();

                            builder.Property(i => i.Tank)
                                   .IsRequired();

                            builder.Property(i => i.FuelGradeId)
                                   .IsRequired();

                            builder.Property(i => i.FuelGradeName)
                                   .HasMaxLength(20)
                                   .HasMaxLength(20);

                            builder.Property(i => i.StartDateTime);

                            builder.Property(i => i.StartProductHeight);

                            builder.Property(i => i.StartWaterHeight);

                            builder.Property(i => i.StartTemperature);

                            builder.Property(i => i.StartProductVolume);

                            // Map property "StartProductTcvolume" to column "StartProductTCVolume"
                            builder.Property(i => i.StartProductTcvolume);

                            builder.Property(i => i.StartProductDensity);

                            builder.Property(i => i.StartProductMass);

                            builder.Property(i => i.EndDateTime);

                            builder.Property(i => i.EndProductHeight);

                            builder.Property(i => i.EndWaterHeight);

                            builder.Property(i => i.EndTemperature);

                            builder.Property(i => i.EndProductVolume);

                            // Map property "EndProductTcvolume" to column "EndProductTCVolume"
                            builder.Property(i => i.EndProductTcvolume);

                            builder.Property(i => i.EndProductDensity);

                            builder.Property(i => i.EndProductMass);

                            builder.Property(i => i.AbsoluteProductHeight);

                            builder.Property(i => i.AbsoluteWaterHeight);

                            builder.Property(i => i.AbsoluteTemperature);

                            builder.Property(i => i.AbsoluteProductVolume);

                            // Map property "AbsoluteProductTcvolume" to column "AbsoluteProductTCVolume"
                            builder.Property(i => i.AbsoluteProductTcvolume);

                            builder.Property(i => i.AbsoluteProductDensity);

                            builder.Property(i => i.AbsoluteProductMass);

                            builder.Property(i => i.PumpsDispensedVolume);

                            builder.Property(i => i.ConfigurationId)
                                   .HasMaxLength(50)
                                   .HasMaxLength(8);

                            // Map "Ptsid" property to column "PTSId" (as defined in the table, case-sensitive).
                            builder.Property(i => i.Ptsid)
                                   .HasMaxLength(100)
                                   .HasMaxLength(100)
                                   .IsRequired();

                            // Map "PacketId" property to column "PacketID"
                            builder.Property(i => i.PacketId)
                                   .IsRequired();

                            // New detection fields
                            builder.Property(i => i.TankId);

                            builder.Property(i => i.SiteId);

                            builder.Property(i => i.Status)
                                   .HasMaxLength(50)
                                   .HasDefaultValue("Detected");

                            builder.Property(i => i.MatchedDeliveryId);

                            builder.Property(i => i.IsProcessed)
                                   .HasDefaultValue(false);

                            builder.Property(i => i.DetectedAt);

                            // Configure the foreign key relationship with Ptsdevice.
                            // The constraint name in the DB is "fk_psTID" and it references "ptsdevice(PTSId)".
                            builder.HasOne(i => i.Pts)
                                   .WithMany(p => p.Intankdeliveries)
                                   .HasForeignKey(i => i.Ptsid)
                                   .OnDelete(DeleteBehavior.ClientSetNull)
                                   .HasConstraintName("fk_psTID");

                            // FK to Tank
                            builder.HasOne(i => i.TankNavigation)
                                   .WithMany()
                                   .HasForeignKey(i => i.TankId)
                                   .HasConstraintName("fk_itd_tankId")
                                   .OnDelete(DeleteBehavior.SetNull);

                            // FK to Delivery (matched manual delivery)
                            builder.HasOne(i => i.MatchedDelivery)
                                   .WithMany()
                                   .HasForeignKey(i => i.MatchedDeliveryId)
                                   .HasConstraintName("fk_itd_matchedDeliveryId")
                                   .OnDelete(DeleteBehavior.SetNull);

                            builder.HasIndex(i => i.TankId).HasDatabaseName("IX_intankdelivery_TankId");
                            builder.HasIndex(i => i.SiteId).HasDatabaseName("IX_intankdelivery_SiteId");
                            builder.HasIndex(i => i.Status).HasDatabaseName("IX_intankdelivery_Status");
                            builder.HasIndex(i => i.DetectedAt).HasDatabaseName("IX_intankdelivery_DetectedAt");
                     }

                     catch (Exception ex)
                     {
                            Console.WriteLine($"Error configuring  : {ex.Message}");

                            throw new Exception($"Error configuring IntankdeliveryConfiguration: {ex.Message}", ex);
                     }
              }
       }
}
