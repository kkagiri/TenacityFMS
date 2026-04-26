using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Navigationitem entity
    /// </summary>
    public class NavigationitemConfiguration : EntityTypeConfiguration<Navigationitem>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Navigationitem> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("navigationitems");

                builder.Property(e => e.Id);

                builder.Property(e => e.Icon)
                    .HasMaxLength(100);

                builder.Property(e => e.Link)
                    .IsRequired()
                    .HasMaxLength(200);

                builder.Property(e => e.Page)
                    .IsRequired()
                    .HasMaxLength(100);

                builder.Property(e => e.ParentId);

                // Configure the relationship with Rolenavigation
                builder.HasMany(e => e.Rolenavigations)
                    .WithOne(e => e.NavigationItem)
                    .HasForeignKey(e => e.NavigationItemId)
                    .OnDelete(DeleteBehavior.Cascade);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring NavigationitemConfiguration: {ex.Message}", ex);
            }
        }
    }
}

