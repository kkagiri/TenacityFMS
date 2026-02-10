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
                .HasColumnName("ReportScheduleId")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ScheduleName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("ScheduleName");

            builder.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("Description");

            builder.Property(e => e.ReportSourceId)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("ReportSourceId");

            builder.Property(e => e.Filters)
                .HasColumnName("Filters")
                .HasColumnType("TEXT");

            builder.Property(e => e.OutputFormat)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("OutputFormat")
                .HasDefaultValue("pdf");

            builder.Property(e => e.Frequency)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("Frequency")
                .HasDefaultValue("once");

            builder.Property(e => e.RepeatCount)
                .HasColumnName("RepeatCount")
                .HasDefaultValue(1);

            builder.Property(e => e.ExecutedCount)
                .HasColumnName("ExecutedCount")
                .HasDefaultValue(0);

            builder.Property(e => e.Recipients)
                .HasColumnName("Recipients")
                .HasColumnType("TEXT");

            builder.Property(e => e.ScheduleConfig)
                .HasColumnName("ScheduleConfig")
                .HasColumnType("TEXT");

            builder.Property(e => e.ScheduledAt)
                .IsRequired()
                .HasColumnName("ScheduledAt");

            builder.Property(e => e.LastExecutedAt)
                .HasColumnName("LastExecutedAt");

            builder.Property(e => e.NextExecutionAt)
                .HasColumnName("NextExecutionAt");

            builder.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasColumnName("Status")
                .HasDefaultValue("active");

            builder.Property(e => e.ErrorMessage)
                .HasColumnName("ErrorMessage")
                .HasColumnType("TEXT");

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

            builder.Property(e => e.CancelledAt)
                .HasColumnName("CancelledAt");

            builder.Property(e => e.CancelledBy)
                .HasMaxLength(100)
                .HasColumnName("CancelledBy");

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
