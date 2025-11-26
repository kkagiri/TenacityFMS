using FMS.Domain.Entities.GPSGate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.GPSGate
{
    public class GPSGateReportDefinitionConfiguration : IEntityTypeConfiguration<GPSGateReportDefinition>
    {
        public void Configure(EntityTypeBuilder<GPSGateReportDefinition> builder)
        {
            builder.ToTable("gpsgate_report_definitions");

            builder.HasKey(d => d.Id);

            builder.Property(d => d.Id)
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(d => d.ReportId)
                .HasColumnName("report_id")
                .IsRequired();

            builder.Property(d => d.ReportName)
                .HasColumnName("report_name")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(d => d.Description)
                .HasColumnName("description")
                .HasColumnType("text");

            builder.Property(d => d.IsActive)
                .HasColumnName("is_active")
                .IsRequired();

            builder.Property(d => d.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(d => d.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("datetime");

            builder.HasIndex(d => d.ReportId)
                .IsUnique();
        }
    }
}
