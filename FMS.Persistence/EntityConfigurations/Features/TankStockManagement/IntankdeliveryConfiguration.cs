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
                            builder.HasKey(i => i.DeliveryId).HasName("PRIMARY");

                            builder.HasIndex(i => i.Ptsid, "fk_psTID_idx");

                            builder.Property(i => i.DeliveryId)
                                   .HasColumnName("DeliveryId")
                                   .HasColumnType("int(11)")
                                   .IsRequired()
                                   .ValueGeneratedOnAdd();

                            builder.Property(i => i.Tank)
                                   .HasColumnName("Tank")
                                   .HasColumnType("int(11)")
                                   .IsRequired();

                            builder.Property(i => i.FuelGradeId)
                                   .HasColumnName("FuelGradeId")
                                   .HasColumnType("int(11)")
                                   .IsRequired();

                            builder.Property(i => i.FuelGradeName)
                                   .HasColumnName("FuelGradeName")
                                   .HasColumnType("varchar(20)")
                                   .HasMaxLength(20);

                            builder.Property(i => i.StartDateTime)
                                   .HasColumnName("StartDateTime")
                                   .HasColumnType("datetime");

                            builder.Property(i => i.StartProductHeight)
                                   .HasColumnName("StartProductHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.StartWaterHeight)
                                   .HasColumnName("StartWaterHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.StartTemperature)
                                   .HasColumnName("StartTemperature")
                                   .HasColumnType("float");

                            builder.Property(i => i.StartProductVolume)
                                   .HasColumnName("StartProductVolume")
                                   .HasColumnType("float");

                            // Map property "StartProductTcvolume" to column "StartProductTCVolume"
                            builder.Property(i => i.StartProductTcvolume)
                                   .HasColumnName("StartProductTCVolume")
                                   .HasColumnType("float");

                            builder.Property(i => i.StartProductDensity)
                                   .HasColumnName("StartProductDensity")
                                   .HasColumnType("float");

                            builder.Property(i => i.StartProductMass)
                                   .HasColumnName("StartProductMass")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndDateTime)
                                   .HasColumnName("EndDateTime")
                                   .HasColumnType("datetime");

                            builder.Property(i => i.EndProductHeight)
                                   .HasColumnName("EndProductHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndWaterHeight)
                                   .HasColumnName("EndWaterHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndTemperature)
                                   .HasColumnName("EndTemperature")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndProductVolume)
                                   .HasColumnName("EndProductVolume")
                                   .HasColumnType("float");

                            // Map property "EndProductTcvolume" to column "EndProductTCVolume"
                            builder.Property(i => i.EndProductTcvolume)
                                   .HasColumnName("EndProductTCVolume")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndProductDensity)
                                   .HasColumnName("EndProductDensity")
                                   .HasColumnType("float");

                            builder.Property(i => i.EndProductMass)
                                   .HasColumnName("EndProductMass")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteProductHeight)
                                   .HasColumnName("AbsoluteProductHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteWaterHeight)
                                   .HasColumnName("AbsoluteWaterHeight")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteTemperature)
                                   .HasColumnName("AbsoluteTemperature")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteProductVolume)
                                   .HasColumnName("AbsoluteProductVolume")
                                   .HasColumnType("float");

                            // Map property "AbsoluteProductTcvolume" to column "AbsoluteProductTCVolume"
                            builder.Property(i => i.AbsoluteProductTcvolume)
                                   .HasColumnName("AbsoluteProductTCVolume")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteProductDensity)
                                   .HasColumnName("AbsoluteProductDensity")
                                   .HasColumnType("float");

                            builder.Property(i => i.AbsoluteProductMass)
                                   .HasColumnName("AbsoluteProductMass")
                                   .HasColumnType("float");

                            builder.Property(i => i.PumpsDispensedVolume)
                                   .HasColumnName("PumpsDispensedVolume")
                                   .HasColumnType("float");

                            builder.Property(i => i.ConfigurationId)
                                   .HasColumnName("ConfigurationId")
                                   .HasColumnType("varchar(50)")
                                   .HasMaxLength(8);

                            // Map "Ptsid" property to column "PTSId" (as defined in the table, case-sensitive).
                            builder.Property(i => i.Ptsid)
                                   .HasColumnName("PTSId")
                                   .HasColumnType("varchar(100)")
                                   .HasMaxLength(100)
                                   .IsRequired();

                            // Map "PacketId" property to column "PacketID"
                            builder.Property(i => i.PacketId)
                                   .HasColumnName("PacketID")
                                   .HasColumnType("int(11)")
                                   .IsRequired();

                            // New detection fields
                            builder.Property(i => i.TankId)
                                   .HasColumnName("TankId");

                            builder.Property(i => i.SiteId)
                                   .HasColumnName("SiteId");

                            builder.Property(i => i.Status)
                                   .HasColumnName("Status")
                                   .HasMaxLength(50)
                                   .HasDefaultValue("Detected");

                            builder.Property(i => i.MatchedDeliveryId)
                                   .HasColumnName("MatchedDeliveryId");

                            builder.Property(i => i.IsProcessed)
                                   .HasColumnName("IsProcessed")
                                   .HasDefaultValue(false);

                            builder.Property(i => i.DetectedAt)
                                   .HasColumnName("DetectedAt");

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