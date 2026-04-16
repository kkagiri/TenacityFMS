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
                .HasColumnName("ReportDefinitionId")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ReportId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("ReportId");

            builder.HasIndex(e => e.ReportId)
                .IsUnique()
                .HasDatabaseName("UQ_ReportDefinitions_ReportId");

            builder.Property(e => e.ReportName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("ReportName");

            builder.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("Description");

            builder.Property(e => e.Category)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("Category");

            builder.HasIndex(e => new { e.Category, e.IsDeleted, e.IsActive })
                .HasDatabaseName("IX_ReportDefinitions_Category");

            builder.Property(e => e.ReportType)
                .IsRequired()
                .HasColumnName("ReportType");

            builder.HasIndex(e => new { e.ReportType, e.IsDeleted, e.IsActive })
                .HasDatabaseName("IX_ReportDefinitions_ReportType");

            builder.Property(e => e.Icon)
                .HasMaxLength(100)
                .HasColumnName("Icon")
                .HasDefaultValue("fa-light fa-file-chart-column");

            builder.Property(e => e.DataSourceEndpoint)
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnName("DataSourceEndpoint");

            builder.Property(e => e.RequiredPermission)
                .HasMaxLength(100)
                .HasColumnName("RequiredPermission");

            builder.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("IsActive")
                .HasDefaultValue(true);

            builder.Property(e => e.IsPublic)
                .IsRequired()
                .HasColumnName("IsPublic")
                .HasDefaultValue(true);

            builder.Property(e => e.IsBuiltIn)
                .IsRequired()
                .HasColumnName("IsBuiltIn")
                .HasDefaultValue(false);

            builder.Property(e => e.Configuration)
                .HasColumnName("Configuration")
                .HasColumnType("TEXT");

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("CreatedAt")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.CreatedBy)
                .HasMaxLength(100)
                .HasColumnName("CreatedBy");

            builder.Property(e => e.ModifiedAt)
                .HasColumnName("ModifiedAt");

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100)
                .HasColumnName("ModifiedBy");

            builder.Property(e => e.DeletedAt)
                .HasColumnName("DeletedAt");

            builder.Property(e => e.DeletedBy)
                .HasMaxLength(100)
                .HasColumnName("DeletedBy");

            builder.Property(e => e.IsDeleted)
                .IsRequired()
                .HasColumnName("IsDeleted")
                .HasDefaultValue(false);

            builder.HasIndex(e => new { e.IsActive, e.IsDeleted })
                .HasDatabaseName("IX_ReportDefinitions_IsActive");
        }
    }
}
