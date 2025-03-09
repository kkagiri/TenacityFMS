using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the Alarm entity
    /// </summary>
    public class AlarmConfiguration : EntityTypeConfiguration<Alarm>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<Alarm> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("alarm");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("id");

                builder.Property(e => e.Description).HasMaxLength(300);

                builder.Property(e => e.Name).HasMaxLength(45);

                builder.Property(e => e.Priority).HasMaxLength(45);
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring AlarmConfiguration: {ex.Message}", ex);
            }
        }
    }
}
