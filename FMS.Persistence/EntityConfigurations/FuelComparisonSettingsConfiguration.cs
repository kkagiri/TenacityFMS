using FMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class FuelComparisonSettingsConfiguration : IEntityTypeConfiguration<FuelComparisonSettings>
    {
        public void Configure(EntityTypeBuilder<FuelComparisonSettings> builder)
        {
            builder.ToTable("fuel_comparison_settings");

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnName("Id");

            builder.Property(e => e.UserId)
                .HasColumnName("UserId")
                .HasMaxLength(100)
                .IsRequired();

            builder.Property(e => e.VarianceThreshold)
                .HasColumnName("VarianceThreshold")
                .HasColumnType("decimal(5,2)")
                .HasDefaultValue(10.00m)
                .IsRequired();

            builder.Property(e => e.ShowDeleted)
                .HasColumnName("ShowDeleted")
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(false)
                .IsRequired();

            builder.Property(e => e.DefaultFilter)
                .HasColumnName("DefaultFilter")
                .HasMaxLength(50)
                .HasDefaultValue("all");

            builder.Property(e => e.DefaultGrouping)
                .HasColumnName("DefaultGrouping")
                .HasMaxLength(50)
                .HasDefaultValue("vehicle");

            builder.Property(e => e.UpdatedAt)
                .HasColumnName("UpdatedAt")
                .HasColumnType("datetime")
                .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
                .IsRequired();

            // Relationships
            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint: One settings record per user
            builder.HasIndex(e => e.UserId)
                .IsUnique()
                .HasDatabaseName("uk_user");
        }
    }
}
