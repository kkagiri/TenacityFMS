using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    public class AutomatedFuelingConfigurationConfiguration : IEntityTypeConfiguration<AutomatedFuelingConfiguration> {
        public void Configure (EntityTypeBuilder<AutomatedFuelingConfiguration> builder) {
            // Table name
            builder.ToTable ("automatedfuelingconfigurations");

            // Primary key
            builder.HasKey (e => e.Id);
            builder.Property (e => e.Id)
                .HasColumnName ("Id")
                .HasColumnType ("int(11)")
                .ValueGeneratedOnAdd ();

            // Site relationship (nullable for global settings)
            builder.Property (e => e.SiteId)
                .HasColumnName ("SiteId")
                .HasColumnType ("int(11)")
                .IsRequired (false);

            // Configuration flags
            builder.Property (e => e.UpdateTankVolumeFromBookKeeping)
                .HasColumnName ("UpdateTankVolumeFromBookKeeping")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (true);

            builder.Property (e => e.UsePtsProbeReadings)
                .HasColumnName ("UsePtsProbeReadings")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (false);

            builder.Property (e => e.VolumeSourcePriority)
                .HasColumnName ("VolumeSourcePriority")
                .HasColumnType ("int(11)")
                .HasDefaultValue (1); // BookKeeping = 1

            builder.Property (e => e.AutoCreateLedgerEntries)
                .HasColumnName ("AutoCreateLedgerEntries")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (true);

            builder.Property (e => e.CheckForDuplicateManualEntries)
                .HasColumnName ("CheckForDuplicateManualEntries")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (true);

            builder.Property (e => e.DuplicateVolumeTolerance)
                .HasColumnName ("DuplicateVolumeTolerance")
                .HasColumnType ("decimal(5,4)")
                .HasPrecision (5, 4)
                .HasDefaultValue (0.01m); // 1%

            builder.Property (e => e.AutoReconcileTankVolumes)
                .HasColumnName ("AutoReconcileTankVolumes")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (false);

            builder.Property (e => e.ReconciliationFrequencyMinutes)
                .HasColumnName ("ReconciliationFrequencyMinutes")
                .HasColumnType ("int(11)")
                .HasDefaultValue (60);

            builder.Property (e => e.MaxVolumeDiscrepancyThreshold)
                .HasColumnName ("MaxVolumeDiscrepancyThreshold")
                .HasColumnType ("decimal(10,3)")
                .HasPrecision (10, 3)
                .IsRequired (false);

            builder.Property (e => e.DiscrepancyAction)
                .HasColumnName ("DiscrepancyAction")
                .HasColumnType ("int(11)")
                .HasDefaultValue (1); // Alert = 1

            builder.Property (e => e.IsActive)
                .HasColumnName ("IsActive")
                .HasColumnType ("tinyint(1)")
                .HasDefaultValue (true);

            // Audit fields
            builder.Property (e => e.CreatedOn)
                .HasColumnName ("CreatedOn")
                .HasColumnType ("datetime")
                .HasDefaultValueSql ("CURRENT_TIMESTAMP");

            builder.Property (e => e.ModifiedOn)
                .HasColumnName ("ModifiedOn")
                .HasColumnType ("datetime")
                .IsRequired (false);

            builder.Property (e => e.CreatedBy)
                .HasColumnName ("CreatedBy")
                .HasMaxLength (255)
                .IsRequired ();

            builder.Property (e => e.ModifiedBy)
                .HasColumnName ("ModifiedBy")
                .HasMaxLength (255)
                .IsRequired (false);

            // Foreign key relationships
            builder.HasOne (e => e.Site)
                .WithMany ()
                .HasForeignKey (e => e.SiteId)
                .HasConstraintName ("FK_AutomatedFuelingConfiguration_Site")
                .OnDelete (DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex (e => e.SiteId)
                .HasDatabaseName ("IX_AutomatedFuelingConfiguration_SiteId");

            builder.HasIndex (e => e.IsActive)
                .HasDatabaseName ("IX_AutomatedFuelingConfiguration_IsActive");

            // Unique constraint for active configurations per site
            builder.HasIndex (e => new { e.SiteId, e.IsActive })
                .HasDatabaseName ("IX_AutomatedFuelingConfiguration_SiteId_IsActive_Unique")
                .IsUnique ()
                .HasFilter ("IsActive = 1");
        }
    }
}