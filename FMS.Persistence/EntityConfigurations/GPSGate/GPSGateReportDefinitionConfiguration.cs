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
                .ValueGeneratedOnAdd();

            builder.Property(d => d.ReportId)
                .IsRequired();

            builder.Property(d => d.ReportName)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(d => d.Description);

            builder.Property(d => d.IsActive)
                .IsRequired();

            builder.Property(d => d.CreatedAt)
                .IsRequired();

            builder.Property(d => d.UpdatedAt);

            builder.HasIndex(d => d.ReportId)
                .IsUnique();
        }
    }
}

