using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class DailytankreconciliationConfiguration : EntityTypeConfiguration<Dailytankreconciliation>
    {
        public override void Configure(EntityTypeBuilder<Dailytankreconciliation> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("dailytankreconciliation");

                builder.HasIndex(e => e.TankId, "DailyTankReconciliation_TankId_idx");
                builder.HasIndex(e => new { e.TankId, e.ReconciliationDate }, "unique_tank_date").IsUnique();

                builder.Property(e => e.Id);
                builder.Property(e => e.ClosingLevel).HasPrecision(10);
                builder.Property(e => e.OpeningLevel).HasPrecision(10);
                builder.Property(e => e.TankId);
                builder.Property(e => e.TotalDeliveries).HasPrecision(10);
                builder.Property(e => e.TotalRefills).HasPrecision(10);
                builder.Property(e => e.TotalTransfersIn).HasPrecision(10);
                builder.Property(e => e.TotalTransfersOut).HasPrecision(10);

                builder.HasOne(d => d.Tank)
                    .WithMany(p => p.Dailytankreconciliations)
                    .HasForeignKey(d => d.TankId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("DailyTankReconciliation_TankId");
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring DailytankreconciliationConfiguration: {ex.Message}", ex);
            }
        }
    }
}

