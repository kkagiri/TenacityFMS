using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the TankVolumeAdjustmentAudit entity
    /// </summary>
    public class TankVolumeAdjustmentAuditConfiguration : EntityTypeConfiguration<TankVolumeAdjustmentAudit>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<TankVolumeAdjustmentAudit> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("tankvolumeadjustmentaudit");

                builder.HasIndex(e => e.AdjustmentId, "IX_TankVolumeAdjustmentAudit_AdjustmentId");
                builder.HasIndex(e => e.AffectedRecordId, "IX_TankVolumeAdjustmentAudit_AffectedRecordId");
                builder.HasIndex(e => e.TankId, "IX_TankVolumeAdjustmentAudit_TankId");
                builder.HasIndex(e => e.AdjustmentTimestamp, "IX_TankVolumeAdjustmentAudit_Timestamp");
                builder.HasIndex(e => e.ProcessedBy, "IX_TankVolumeAdjustmentAudit_ProcessedBy");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.AdjustmentId).HasColumnType("int(11)");
                builder.Property(e => e.AffectedRecordId).HasColumnType("int(11)");
                builder.Property(e => e.OriginalRunningBalance).HasPrecision(15, 3);
                builder.Property(e => e.NewRunningBalance).HasPrecision(15, 3);
                builder.Property(e => e.AdjustmentAmount).HasPrecision(15, 3);
                builder.Property(e => e.AdjustmentTimestamp).HasColumnType("datetime");
                builder.Property(e => e.AdjustmentReason).HasMaxLength(255);
                builder.Property(e => e.ProcessedBy).HasMaxLength(100);
                builder.Property(e => e.TankId).HasColumnType("int(11)");
                builder.Property(e => e.OriginalVolumeChange).HasPrecision(15, 3);
                builder.Property(e => e.NewVolumeChange).HasPrecision(15, 3);
                builder.Property(e => e.OperationType).HasMaxLength(20);

                // Foreign key relationships
                builder.HasOne(d => d.AffectedRecordTankVolumeHistoryRecords)
                    .WithMany()
                    .HasForeignKey(d => d.AffectedRecordId)
                    .HasConstraintName("FK_TankVolumeAdjustmentAudit_TankVolumeHistory");

                builder.HasOne(d => d.Tank)
                    .WithMany()
                    .HasForeignKey(d => d.TankId)
                    .HasConstraintName("FK_TankVolumeAdjustmentAudit_Tank");

                builder.HasOne(d => d.ProcessedByNavigation)
                    .WithMany()
                    .HasForeignKey(d => d.ProcessedBy)
                    .HasConstraintName("FK_TankVolumeAdjustmentAudit_User");

                builder.HasQueryFilter(e => e.ProcessedByNavigation == null || e.ProcessedByNavigation.IsDeleted != true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring TankVolumeAdjustmentAuditConfiguration: {ex.Message}");
                throw new Exception($"Error configuring TankVolumeAdjustmentAuditConfiguration: {ex.Message}", ex);
            }
        }
    }
}