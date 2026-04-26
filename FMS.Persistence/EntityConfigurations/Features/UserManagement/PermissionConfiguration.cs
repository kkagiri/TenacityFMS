using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Permission entity
    /// </summary>
    public class PermissionConfiguration : EntityTypeConfiguration<Permission>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Permission> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder
                    .ToTable("permissions");

                builder.HasIndex(e => e.ParentId, "FK_Permissions_Parent");
                builder.HasIndex(e => e.Name, "Name_UNIQUE").IsUnique();

                builder.Property(e => e.Id);
                builder.Property(e => e.Name).HasMaxLength(100);
                builder.Property(e => e.ParentId);

                // Relationships
                builder.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                    .HasForeignKey(d => d.ParentId)
                    .HasConstraintName("FK_Permissions_Parent");
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring PermissionConfiguration: {ex.Message}", ex);
            }
        }
    }
}

