using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class ReportTemplateConfiguration : IEntityTypeConfiguration<ReportTemplate>
    {
        public void Configure(EntityTypeBuilder<ReportTemplate> builder)
        {
            builder.ToTable("report_templates");

            builder.HasKey(e => e.ReportTemplateId);

            builder.Property(e => e.ReportTemplateId)
                .HasColumnName("ReportTemplateId")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.TemplateId)
                .IsRequired()
                .HasMaxLength(36)
                .HasColumnName("TemplateId");

            builder.HasIndex(e => e.TemplateId)
                .IsUnique()
                .HasDatabaseName("UQ_ReportTemplates_TemplateId");

            builder.Property(e => e.ReportDefinitionId)
                .HasColumnName("ReportDefinitionId");

            builder.Property(e => e.TemplateName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("TemplateName");

            builder.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("Description");

            builder.Property(e => e.Configuration)
                .IsRequired()
                .HasColumnName("Configuration")
                .HasColumnType("TEXT");

            builder.Property(e => e.IsDefault)
                .HasColumnName("IsDefault")
                .HasDefaultValue(false);

            builder.Property(e => e.IsShared)
                .HasColumnName("IsShared")
                .HasDefaultValue(false);

            builder.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("CreatedBy");

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("CreatedAt")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

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

            // Relationship
            builder.HasOne(e => e.ReportDefinition)
                .WithMany()
                .HasForeignKey(e => e.ReportDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(e => new { e.ReportDefinitionId, e.IsDeleted })
                .HasDatabaseName("IX_ReportTemplates_DefinitionId");

            builder.HasIndex(e => new { e.CreatedBy, e.IsDeleted })
                .HasDatabaseName("IX_ReportTemplates_CreatedBy");
        }
    }
}
