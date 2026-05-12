using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class ReportCategoryConfiguration : IEntityTypeConfiguration<ReportCategory>
    {
        public void Configure(EntityTypeBuilder<ReportCategory> builder)
        {
            builder.ToTable("report_categories");

            builder.HasKey(e => e.ReportCategoryId);

            builder.Property(e => e.ReportCategoryId)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.CategoryName)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(e => e.CategoryName)
                .IsUnique()
                .HasDatabaseName("UQ_ReportCategories_CategoryName");

            builder.Property(e => e.Description)
                .HasMaxLength(500);

            builder.Property(e => e.Icon)
                .HasMaxLength(100)
                .HasDefaultValue("fa-light fa-folder");

            builder.Property(e => e.DisplayOrder)
                .HasDefaultValue(0);

            builder.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);
        }
    }
}
