using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssuePriorityConfiguration : EntityTypeConfiguration<Issuepriority>
    {
        public override void Configure(EntityTypeBuilder<Issuepriority> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("issuepriority");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever();
                builder.Property(e => e.Name).HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring IssuePriorityConfiguration: {ex.Message}", ex);
            }
        }
    }
}

