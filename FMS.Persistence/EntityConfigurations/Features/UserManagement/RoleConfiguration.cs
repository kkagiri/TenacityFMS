using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Role entity
    /// </summary>
    public class RoleConfiguration : EntityTypeConfiguration<Role>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Role> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder
                    .ToTable("roles");

                builder.Property(e => e.Id).HasMaxLength(100);
                builder.Property(e => e.ConcurrencyStamp).HasMaxLength(256);
                builder.Property(e => e.Description).HasMaxLength(256);
                builder.Property(e => e.Name).HasMaxLength(256);
                builder.Property(e => e.NormalizedName).HasMaxLength(256);

                // Configure relationship with Rolenavigation
                builder.HasMany(e => e.Rolenavigations)
                    .WithOne(e => e.Role)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring RoleConfiguration: {ex.Message}", ex);
            }
        }
    }
}


