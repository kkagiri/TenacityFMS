using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations {
    /// <summary>
    /// Configuration for the Rolenavigation entity
    /// </summary>
    public class RolenavigationConfiguration : EntityTypeConfiguration<Rolenavigation> {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure (EntityTypeBuilder<Rolenavigation> builder) {
            try {
                builder.HasKey (e => e.Id).HasName ("PRIMARY");

                builder.ToTable ("rolenavigation");

                builder.Property (e => e.Id).HasColumnType ("int(11)");

                builder.Property (e => e.RoleId)
                    .IsRequired ()
                    .HasMaxLength (100);

                builder.Property (e => e.NavigationItemId)
                    .HasColumnType ("int(11)");

                // Configure relationships with Restrict delete behavior
                builder.HasOne (e => e.NavigationItem)
                    .WithMany (e => e.Rolenavigations)
                    .HasForeignKey (e => e.NavigationItemId)
                    .OnDelete (DeleteBehavior.Restrict)
                    .HasConstraintName ("FK_RoleNavigations_NavigationItems");

                builder.HasOne (e => e.Role)
                    .WithMany (e => e.Rolenavigations)
                    .HasForeignKey (e => e.RoleId)
                    .OnDelete (DeleteBehavior.Restrict)
                    .HasConstraintName ("FK_RoleNavigations_Roles");
            } catch (Exception ex) {
                Console.WriteLine ($"Error configuring  : {ex.Message}");

                throw new Exception ($"Error configuring RolenavigationConfiguration: {ex.Message}", ex);
            }
        }
    }
}