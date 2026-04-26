using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class ReportDefinitionConfiguration : IEntityTypeConfiguration<ReportDefinition>
    {
        public void Configure(EntityTypeBuilder<ReportDefinition> builder)
        {
            builder.ToTable("report_definitions");

            builder.HasKey(e => e.ReportDefinitionId);

            builder.Property(e => e.ReportDefinitionId)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ReportId)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(e => e.ReportId)
                .IsUnique()
                .HasDatabaseName("UQ_ReportDefinitions_ReportId");

            builder.Property(e => e.ReportName)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(e => e.Description)
                .HasMaxLength(1000);

            builder.Property(e => e.Category)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(e => new { e.Category, e.IsDeleted, e.IsActive })
                .HasDatabaseName("IX_ReportDefinitions_Category");

            builder.Property(e => e.ReportType)
                .IsRequired();

            builder.HasIndex(e => new { e.ReportType, e.IsDeleted, e.IsActive })
                .HasDatabaseName("IX_ReportDefinitions_ReportType");

            builder.Property(e => e.Icon)
                .HasMaxLength(100)
                .HasDefaultValue("fa-light fa-file-chart-column");

            builder.Property(e => e.DataSourceEndpoint)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(e => e.RequiredPermission)
                .HasMaxLength(100);

            builder.Property(e => e.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            builder.Property(e => e.IsPublic)
                .IsRequired()
                .HasDefaultValue(true);

            builder.Property(e => e.IsBuiltIn)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(e => e.Configuration);

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            builder.Property(e => e.ModifiedAt);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            builder.Property(e => e.DeletedAt);

            builder.Property(e => e.DeletedBy)
                .HasMaxLength(100);

            builder.Property(e => e.IsDeleted)
                .IsRequired()
                .HasDefaultValue(false);

            builder.HasIndex(e => new { e.IsActive, e.IsDeleted })
                .HasDatabaseName("IX_ReportDefinitions_IsActive");
        }
    }
}

