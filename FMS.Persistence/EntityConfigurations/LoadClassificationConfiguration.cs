using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class LoadClassificationConfiguration : EntityTypeConfiguration<LoadClassification>
    {
        public override void Configure(EntityTypeBuilder<LoadClassification> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("loadclassifications")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasIndex(e => e.Name, "IX_LoadClassification_Name").IsUnique();

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("ID");

                builder.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasColumnName("Name");

                builder.Property(e => e.Description)
                    .HasMaxLength(500)
                    .HasColumnName("Description");

                builder.Property(e => e.MinWeightTonnes)
                    .HasPrecision(10, 2)
                    .HasColumnName("MinWeightTonnes");

                builder.Property(e => e.MaxWeightTonnes)
                    .HasPrecision(10, 2)
                    .HasColumnName("MaxWeightTonnes");

                builder.Property(e => e.SortOrder)
                    .HasColumnType("int(11)")
                    .HasDefaultValue(0)
                    .HasColumnName("SortOrder");

                builder.Property(e => e.IsActive)
                    .HasColumnType("tinyint(1)")
                    .HasDefaultValue(true)
                    .HasColumnName("IsActive");

                builder.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasColumnName("CreatedAt");

                builder.Property(e => e.CreatedBy)
                    .HasMaxLength(100)
                    .HasColumnName("CreatedBy");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring LoadClassification: {ex.Message}");
                throw new Exception($"Error configuring LoadClassification entity: {ex.Message}", ex);
            }
        }
    }
}
