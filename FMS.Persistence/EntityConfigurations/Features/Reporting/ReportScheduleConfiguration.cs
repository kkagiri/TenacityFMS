using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class ReportScheduleConfiguration : IEntityTypeConfiguration<ReportSchedule>
    {
        public void Configure(EntityTypeBuilder<ReportSchedule> builder)
        {
            builder.ToTable("report_schedules");

            builder.HasKey(e => e.ReportScheduleId);

            builder.Property(e => e.ReportScheduleId)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ScheduleName)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(e => e.Description)
                .HasMaxLength(1000);

            builder.Property(e => e.ReportSourceId)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.Filters);

            builder.Property(e => e.OutputFormat)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("pdf");

            builder.Property(e => e.Frequency)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("once");

            builder.Property(e => e.RepeatCount)
                .HasDefaultValue(1);

            builder.Property(e => e.ExecutedCount)
                .HasDefaultValue(0);

            builder.Property(e => e.Recipients);

            builder.Property(e => e.ScheduleConfig);

            builder.Property(e => e.ScheduledAt)
                .IsRequired();

            builder.Property(e => e.LastExecutedAt);

            builder.Property(e => e.NextExecutionAt);

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("active");

            builder.Property(e => e.ErrorMessage);

            builder.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.ModifiedAt);

            builder.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            builder.Property(e => e.CancelledAt);

            builder.Property(e => e.CancelledBy)
                .HasMaxLength(100);

            // Indexes
            builder.HasIndex(e => e.Status)
                .HasDatabaseName("IX_ReportSchedules_Status");

            builder.HasIndex(e => e.NextExecutionAt)
                .HasDatabaseName("IX_ReportSchedules_NextExecution");

            builder.HasIndex(e => e.CreatedBy)
                .HasDatabaseName("IX_ReportSchedules_CreatedBy");

            builder.HasIndex(e => e.ReportSourceId)
                .HasDatabaseName("IX_ReportSchedules_SourceId");
        }
    }
}

