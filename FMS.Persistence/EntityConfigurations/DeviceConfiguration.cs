using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
       public class DeviceConfiguration : EntityTypeConfiguration<Device> {
              public override void Configure (EntityTypeBuilder<Device> builder) {
                     try {
                            // Map the entity to the "device" table
                            builder.ToTable ("device");

                            // Configure DeviceImei as the primary key
                            builder.HasKey (d => d.DeviceImei)
                                   .HasName ("PRIMARY");

                            // Map DeviceImei property to the corresponding column
                            builder.Property (d => d.DeviceImei)
                                   .HasColumnName ("DeviceIMEI")
                                   .HasColumnType ("int(11)")
                                   .IsRequired ();

                            // Map DeviceMakerId property to a column
                            builder.Property (d => d.DeviceMakerId)
                                   .HasColumnName ("DeviceMakerID")
                                   .HasColumnType ("int(11)")
                                   .IsRequired ();

                            // Map DevicePhoneNumber property to a column
                            builder.Property (d => d.DevicePhoneNumber)
                                   .HasColumnName ("DevicePhoneNumber")
                                   .HasColumnType ("int(11)")
                                   .IsRequired ();

                            // Map DeviceType property (the foreign key) to a column
                            builder.Property (d => d.DeviceType)
                                   .HasColumnName ("DeviceType")
                                   .HasColumnType ("int(11)")
                                   .IsRequired ();

                            // Configure the one-to-many relationship where:
                            // A Device belongs to one Devicetype (the navigation property on Device)
                            // and a Devicetype may have many Devices.
                            builder.HasOne (d => d.DeviceTypeNavigation)
                                   .WithMany (dt => dt.Devices)
                                   .HasForeignKey (d => d.DeviceType)
                                   .HasConstraintName ("Device_type");

                            // Configure the one-to-many relationship with Vehicle.
                            // When a Device is deleted, we set the foreign key in related Vehicle rows to NULL.
                            builder.HasMany (d => d.Vehicles)
                                   .WithOne (v => v.Device)
                                   .HasForeignKey (v => v.DeviceId)
                                   .HasConstraintName ("FK_Vehicle_Device")
                                   .OnDelete (DeleteBehavior.SetNull);
                     } catch (Exception ex) {
                            Console.WriteLine ($"Error configuring  : {ex.Message}");

                            throw new Exception ($"Error configuring DeviceConfiguration: {ex.Message}", ex);
                     }
              }
       }
}