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
                .HasColumnName("id")
                .ValueGeneratedOnAdd();

            builder.Property(r => r.ReportId)
                .HasColumnName("report_id")
                .IsRequired();

            builder.Property(r => r.ReportName)
                .HasColumnName("report_name")
                .HasMaxLength(200);

            builder.Property(r => r.HandleId)
                .HasColumnName("handle_id")
                .IsRequired();

            builder.Property(r => r.SessionId)
                .HasColumnName("session_id")
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(r => r.StartDate)
                .HasColumnName("start_date")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(r => r.EndDate)
                .HasColumnName("end_date")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(r => r.Status)
                .HasColumnName("status")
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(r => r.RequestedAt)
                .HasColumnName("requested_at")
                .HasColumnType("datetime")
                .IsRequired();

            builder.Property(r => r.CompletedAt)
                .HasColumnName("completed_at")
                .HasColumnType("datetime");

            builder.Property(r => r.ReportData)
                .HasColumnName("report_data")
                .HasColumnType("longtext");

            builder.Property(r => r.ErrorMessage)
                .HasColumnName("error_message")
                .HasColumnType("text");

            builder.Property(r => r.RequestedByUserId)
                .HasColumnName("requested_by_user_id");

            builder.HasIndex(r => r.HandleId)
                .IsUnique();

            builder.HasIndex(r => r.ReportId);

            builder.HasIndex(r => r.Status);

            builder.HasIndex(r => r.RequestedAt);
        }
    }
}
