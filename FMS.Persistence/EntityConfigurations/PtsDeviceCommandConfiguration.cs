using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class PtsDeviceCommandConfiguration : EntityTypeConfiguration<PtsDevicePendingCommand>
    {
        public override void Configure(EntityTypeBuilder<PtsDevicePendingCommand> builder)
        {
            try
            {
                // Map the entity to the "device_commands" table
                builder.ToTable("ptsdevice_pendingcommands");

                // Define the primary key
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                // Auto-increment ID
                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .ValueGeneratedOnAdd();


                // Command type and device ID
                builder.Property(e => e.CommandType)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.PtsDeviceId)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasColumnName("PtsDeviceId");

                // Command data JSON
                builder.Property(e => e.CommandDataJson)
                    .HasColumnType("longtext")
                    .IsRequired();

                // Timestamps
                builder.Property(e => e.AssignedAt)
                    .HasColumnType("datetime")
                    .IsRequired();

                builder.Property(e => e.CompletedAt)
                    .HasColumnType("datetime")
                    .IsRequired(false);

                builder.Property(e => e.DeliveredAt)
                    .HasColumnType("datetime")
                    .IsRequired(false);

                builder.Property(e => e.ExpiryAt)
                    .HasColumnType("datetime")
                    .IsRequired(false);

                // Status and response
                builder.Property(e => e.Status)
                    .HasMaxLength(20)
                    .IsRequired()
                    .HasDefaultValue("Pending");

                builder.Property(e => e.ResponseJson)
                    .HasColumnType("longtext")
                    .IsRequired(false);

                builder.Property(e => e.ResponseCode)
                    .HasColumnType("int(11)")
                    .IsRequired(false);

                // Priority and source
                builder.Property(e => e.Priority)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0);

                builder.Property(e => e.Source)
                    .HasMaxLength(50)
                    .IsRequired(false);

                // Create indexes for frequently queried columns
                builder.HasIndex(e => e.PtsDeviceId)
                    .HasDatabaseName("IX_device_commands_PtsDeviceId");

                builder.HasIndex(e => new { e.PtsDeviceId, e.Status })
                    .HasDatabaseName("IX_device_commands_PtsDeviceId_Status");

                builder.HasIndex(e => e.CommandType)
                    .HasDatabaseName("IX_device_commands_CommandType");

                // Relationship with Ptsdevice
                builder.HasOne(d => d.PtsDevice)
                    .WithMany() // You can add a collection to Ptsdevice if needed
                    .HasForeignKey(d => d.PtsDeviceId)
                    .OnDelete(DeleteBehavior.Cascade)
                    .HasConstraintName("FK_device_commands_ptsdevice");

            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring PtsDeviceCommandConfiguration: {ex.Message}", ex);
            }
        }
    }
}