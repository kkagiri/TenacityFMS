using FMS.Domain.Entities.GPSGate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations.GPSGate
{
    public class GPSGateReportConfiguration : IEntityTypeConfiguration<GPSGateReport>
    {
        public void Configure(EntityTypeBuilder<GPSGateReport> builder)
        {
            builder.ToTable("gpsgate_reports");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Id)
                .ValueGeneratedOnAdd();

            builder.Property(r => r.ReportId)
                .IsRequired();

            builder.Property(r => r.ReportName)
                .HasMaxLength(200);

            builder.Property(r => r.HandleId)
                .IsRequired();

            builder.Property(r => r.SessionId)
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(r => r.StartDate)
                .IsRequired();

            builder.Property(r => r.EndDate)
                .IsRequired();

            builder.Property(r => r.Status)
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(r => r.RequestedAt)
                .IsRequired();

            builder.Property(r => r.CompletedAt);

            builder.Property(r => r.ReportData);

            builder.Property(r => r.ErrorMessage);

            builder.Property(r => r.RequestedByUserId);

            builder.HasIndex(r => r.HandleId)
                .IsUnique();

            builder.HasIndex(r => r.ReportId);

            builder.HasIndex(r => r.Status);

            builder.HasIndex(r => r.RequestedAt);
        }
    }
}

