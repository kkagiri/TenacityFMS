using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class ExpectedAverageClassificationConfiguration : EntityTypeConfiguration<Expectedaverageclassification>
    {
        public override void Configure(EntityTypeBuilder<Expectedaverageclassification> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("expectedaverageclassification");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");
                builder.Property(e => e.Description).HasColumnType("text");
                builder.Property(e => e.IskmperLiter).HasColumnType("tinyint(4)");
                builder.Property(e => e.Name).HasMaxLength(545);
            }


            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring ExpectedaverageclassificationConfiguration: {ex.Message}", ex);
            }
        }
    }
}