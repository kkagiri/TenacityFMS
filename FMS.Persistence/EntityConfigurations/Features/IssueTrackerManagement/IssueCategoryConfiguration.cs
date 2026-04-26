using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueCategoryConfiguration : EntityTypeConfiguration<Issuecategory>
    {
        public override void Configure(EntityTypeBuilder<Issuecategory> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("issuecategory");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever();
                builder.Property(e => e.Description).HasMaxLength(945);
                builder.Property(e => e.Name).HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring IssueCategoryConfiguration: {ex.Message}", ex);
            }
        }
    }
}

