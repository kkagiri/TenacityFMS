using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Pumptransaction entity
    /// </summary>
    public class PumptransactionConfiguration : EntityTypeConfiguration<Pumptransaction>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Pumptransaction> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("pumptransaction");

                builder.HasIndex(e => e.PtsId, "FK_pumptransaction_idx");

                builder.Property(e => e.Id).HasColumnType("int(11)");
                builder.Property(e => e.Amount).HasPrecision(10);
                builder.Property(e => e.ConfigurationId).HasMaxLength(45);
                builder.Property(e => e.FuelGradeId).HasColumnType("int(11)");
                builder.Property(e => e.FuelGradeName).HasMaxLength(45);
                builder.Property(e => e.Nozzle).HasColumnType("int(11)");
                builder.Property(e => e.PacketId).HasColumnType("int(11)");
                builder.Property(e => e.Price).HasPrecision(10);
                builder.Property(e => e.PtsId).HasMaxLength(100);
                builder.Property(e => e.Pump).HasColumnType("int(11)");
                builder.Property(e => e.Tag).HasMaxLength(45);
                builder.Property(e => e.Tcvolume)
                    .HasPrecision(10)
                    .HasColumnName("TCVolume");
                builder.Property(e => e.TotalAmount).HasPrecision(10);
                builder.Property(e => e.TotalVolume).HasPrecision(10);
                builder.Property(e => e.Transaction).HasColumnType("int(11)");
                builder.Property(e => e.UserId).HasColumnType("int(11)");
                builder.Property(e => e.Volume).HasPrecision(10);

                // Relationships
                builder.HasOne(d => d.Pts).WithMany(p => p.Pumptransactions)
                    .HasForeignKey(d => d.PtsId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_pumptransaction");
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring PumptransactionConfiguration: {ex.Message}", ex);
            }
        }
    }
}
