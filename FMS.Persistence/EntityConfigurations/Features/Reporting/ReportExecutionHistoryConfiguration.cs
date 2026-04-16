using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    public class ReportExecutionHistoryConfiguration : IEntityTypeConfiguration<ReportExecutionHistory>
    {
        public void Configure(EntityTypeBuilder<ReportExecutionHistory> builder)
        {
            builder.ToTable("report_execution_history");

            builder.HasKey(e => e.ReportExecutionId);

            builder.Property(e => e.ReportExecutionId)
                .HasColumnName("ReportExecutionId")
                .ValueGeneratedOnAdd();

            builder.Property(e => e.ReportDefinitionId)
                .HasColumnName("ReportDefinitionId");

            builder.Property(e => e.ExecutedBy)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("ExecutedBy");

            builder.Property(e => e.ExecutedAt)
                .IsRequired()
                .HasColumnName("ExecutedAt")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(e => e.Filters)
                .HasColumnName("Filters")
                .HasColumnType("TEXT");

            builder.Property(e => e.ExportFormat)
                .HasMaxLength(50)
                .HasColumnName("ExportFormat");

            builder.Property(e => e.RecordCount)
                .HasColumnName("RecordCount");

            builder.Property(e => e.ExecutionTimeMs)
                .HasColumnName("ExecutionTimeMs");

            builder.Property(e => e.Success)
                .IsRequired()
                .HasColumnName("Success")
                .HasDefaultValue(true);

            builder.Property(e => e.ErrorMessage)
                .HasColumnName("ErrorMessage")
                .HasColumnType("TEXT");

            builder.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .HasColumnName("IpAddress");

            builder.Property(e => e.UserAgent)
                .HasMaxLength(500)
                .HasColumnName("UserAgent");

            // Relationship
            builder.HasOne(e => e.ReportDefinition)
                .WithMany()
                .HasForeignKey(e => e.ReportDefinitionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(e => e.ExecutedAt)
                .HasDatabaseName("IX_ReportExecutionHistory_ExecutedAt");

            builder.HasIndex(e => e.ExecutedBy)
                .HasDatabaseName("IX_ReportExecutionHistory_ExecutedBy");

            builder.HasIndex(e => new { e.ReportDefinitionId, e.ExecutedAt })
                .HasDatabaseName("IX_ReportExecutionHistory_DefId_ExecutedAt");

            builder.HasIndex(e => e.Success)
                .HasDatabaseName("IX_ReportExecutionHistory_Success");
        }
    }
}
