using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Tag entity
    /// </summary>
    public class TagConfiguration : EntityTypeConfiguration<FuelTag> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<FuelTag> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("tag");

                builder.HasIndex (e => e.FuelRuleSetId, "FuelRuleSetId_FK_idx");
                builder.HasIndex (e => e.VehicleId, "TAG_Vehicle_idx");
                builder.HasIndex (e => e.Name, "Name_UNIQUE").IsUnique ();

                builder.Property (e => e.Id)
                    .ValueGeneratedNever ()
                    .HasColumnType ("int(11)");

                builder.Property (e => e.FuelRuleSetId).HasColumnType ("int(11)");

                builder.Property (e => e.IsEnabled).HasDefaultValueSql ("'1'");
                builder.Property (e => e.IsMaster).HasDefaultValueSql ("'0'");
                builder.Property (e => e.Name).HasMaxLength (100);
                builder.Property (e => e.VehicleId).HasColumnType ("int(11)");

                // Relationships
                builder.HasOne (d => d.FuelRuleSet).WithMany (p => p.Tags)
                    .HasForeignKey (d => d.FuelRuleSetId)
                    .HasConstraintName ("FuelRuleSetId_FK");

                builder.HasOne (d => d.Vehicle).WithMany (p => p.Tags)
                    .HasForeignKey (d => d.VehicleId)
                    .HasConstraintName ("TAG_Vehicle");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring TagConfiguration: {ex.Message}", ex);
            }
        }
    }
}