using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class IssueStatusConfiguration : EntityTypeConfiguration<Issuestatus>
    {
        public override void Configure(EntityTypeBuilder<Issuestatus> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("issuestatus");

                builder.Property(e => e.Id)
                    .ValueGeneratedNever();
                builder.Property(e => e.Status)
                    .HasMaxLength(45);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring IssueStatusConfiguration: {ex.Message}", ex);
            }
        }
    }
}
