using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities;

namespace FMS.Persistence.EntityConfigurations
{
    public class UsageIntensityConfiguration : EntityTypeConfiguration<UsageIntensity>
    {
        public override void Configure(EntityTypeBuilder<UsageIntensity> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("usageintensities")
                    .HasCharSet("utf8mb4")
                    .UseCollation("utf8mb4_general_ci");

                builder.HasIndex(e => e.Name, "IX_UsageIntensity_Name").IsUnique();

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

                builder.Property(e => e.TypicalHoursPerDay)
                    .HasPrecision(5, 2)
                    .HasColumnName("TypicalHoursPerDay");

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
                Console.WriteLine($"Error configuring UsageIntensity: {ex.Message}");
                throw new Exception($"Error configuring UsageIntensity entity: {ex.Message}", ex);
            }
        }
    }
}
