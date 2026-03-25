using FMS.Domain.Entities.Features.TankStockManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the UploadStatusProbeReading entity
    /// </summary>
    public class UploadStatusProbeReadingConfiguration : EntityTypeConfiguration<UploadStatusProbeReading>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<UploadStatusProbeReading> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");
                builder.ToTable("uploadstatusprobereading");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("Id");

                builder.Property(e => e.DateTime)
                    .HasColumnType("datetime");

                builder.Property(e => e.DeviceId)
                    .HasMaxLength(100)
                    .IsRequired();

                builder.Property(e => e.ProbeNumber)
                    .HasColumnType("int(11)");

                builder.Property(e => e.ProductTcvolume)
                    .HasColumnName("ProductTCVolume");

                builder.Property(e => e.TankFillingPercentage)
                    .HasColumnType("int(11)");

                builder.Property(e => e.TankId)
                    .HasColumnType("int(11)")
                    .IsRequired(false);

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .IsRequired(false);

                builder.Property(e => e.FuelGradeId)
                    .HasColumnType("int(11)")
                    .IsRequired(false);

                builder.Property(e => e.FuelGradeName)
                    .HasMaxLength(45)
                    .IsRequired(false);

                builder.HasOne(e => e.TankNavigation)
                    .WithMany(e => e.UploadStatusProbeReadings)
                    .HasForeignKey(e => e.TankId)
                    .OnDelete(DeleteBehavior.SetNull);

                builder.HasIndex(e => e.DateTime).HasDatabaseName("IX_uploadstatusprobereading_DateTime");
                builder.HasIndex(e => e.TankId).HasDatabaseName("IX_uploadstatusprobereading_TankId");
                builder.HasIndex(e => e.DeviceId).HasDatabaseName("IX_uploadstatusprobereading_DeviceId");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring UploadStatusProbeReading: {ex.Message}");
                throw new Exception($"Error configuring UploadStatusProbeReadingConfiguration: {ex.Message}", ex);
            }
        }
    }
}
