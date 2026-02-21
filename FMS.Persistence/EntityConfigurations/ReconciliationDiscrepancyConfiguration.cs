//Cursor - Entity Framework Configuration for ReconciliationDiscrepancy
using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the ReconciliationDiscrepancy entity
    /// </summary>
    public class ReconciliationDiscrepancyConfiguration : EntityTypeConfiguration<ReconciliationDiscrepancy>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<ReconciliationDiscrepancy> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("reconciliationdiscrepancy");

                // Indexes
                builder.HasIndex(e => e.PolicyExecutionId, "FK_ReconciliationDiscrepancy_PolicyExecution_idx");
                builder.HasIndex(e => e.TankId, "FK_ReconciliationDiscrepancy_Tank_idx");
                builder.HasIndex(e => e.DetectedAt, "IX_ReconciliationDiscrepancy_DetectedAt");
                builder.HasIndex(e => e.Severity, "IX_ReconciliationDiscrepancy_Severity");
                builder.HasIndex(e => e.IsResolved, "IX_ReconciliationDiscrepancy_IsResolved");

                // Properties
                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.PolicyExecutionId).HasColumnType("int(11)");
                builder.Property(e => e.TankId).HasColumnType("int(11)").IsRequired();
                builder.Property(e => e.DetectedAt).HasColumnType("datetime").IsRequired();
                builder.Property(e => e.CurrentStock).HasPrecision(10, 2).IsRequired();
                builder.Property(e => e.ExpectedStock).HasPrecision(10, 2).IsRequired();
                builder.Property(e => e.AbsoluteVariance).HasPrecision(10, 2).IsRequired();
                builder.Property(e => e.PercentageVariance).HasPrecision(5, 2).IsRequired();
                builder.Property(e => e.DiscrepancyType).HasColumnType("int(11)").IsRequired()
                    .HasDefaultValue(FMS.Domain.Entities.enums.DiscrepancyType.ClosingStockReconciliation);
                builder.HasIndex(e => e.DiscrepancyType, "IX_ReconciliationDiscrepancy_DiscrepancyType");
                builder.Property(e => e.Severity).HasColumnType("int(11)").IsRequired();
                builder.Property(e => e.IsResolved).HasDefaultValue(false);
                builder.Property(e => e.ResolvedAt).HasColumnType("datetime");
                builder.Property(e => e.ResolutionMethod).HasMaxLength(100);
                builder.Property(e => e.AnalysisNotes).HasMaxLength(500);
                builder.Property(e => e.TrendAnalysis).HasColumnType("text");
                builder.Property(e => e.BusinessImpactScore).HasPrecision(5, 2);

                // Relationships
                builder.HasOne(d => d.PolicyExecution)
                    .WithMany(p => p.Discrepancies)
                    .HasForeignKey(d => d.PolicyExecutionId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_ReconciliationDiscrepancy_PolicyExecution");

                builder.HasOne(d => d.Tank)
                     .WithMany()
                     .HasForeignKey(d => d.TankId)
                     .HasConstraintName("FK_ReconciliationDiscrepancy_Tank");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring ReconciliationDiscrepancy: {ex.Message}");
                throw;
            }
        }
    }
}