using FMS.Domain.Entities.Features.FuelImport;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the FuelReportImportHistory entity
    /// Maps to fuelreportimportlog table
    /// </summary>
    public class FuelReportImportHistoryConfiguration : EntityTypeConfiguration<FuelReportImportHistory>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<FuelReportImportHistory> builder)
        {
            try
            {
                builder.HasKey(e => e.Id).HasName("PRIMARY");

                builder.ToTable("fuelreportimportlog");

                builder.Property(e => e.Id)
                    .HasColumnType("int(11)")
                    .HasColumnName("Id");

                builder.Property(e => e.ReportId)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("ReportId");

                builder.Property(e => e.ImportDate)
                    .IsRequired()
                    .HasColumnType("datetime")
                    .HasColumnName("ImportDate");

                builder.Property(e => e.StartDate)
                    .HasColumnType("datetime")
                    .HasColumnName("StartDate");

                builder.Property(e => e.EndDate)
                    .HasColumnType("datetime")
                    .HasColumnName("EndDate");

                builder.Property(e => e.SiteId)
                    .HasColumnType("int(11)")
                    .HasColumnName("SiteId");

                builder.Property(e => e.TotalRecords)
                    .IsRequired()
                    .HasColumnType("int(11)")
                    .HasColumnName("TotalRecords")
                    .HasDefaultValue(0);

                builder.Property(e => e.SuccessCount)
                    .IsRequired()
                    .HasColumnType("int(11)")
                    .HasColumnName("SuccessCount")
                    .HasDefaultValue(0);

                builder.Property(e => e.FailedCount)
                    .IsRequired()
                    .HasColumnType("int(11)")
                    .HasColumnName("FailedCount")
                    .HasDefaultValue(0);

                builder.Property(e => e.SkippedCount)
                    .IsRequired()
                    .HasColumnType("int(11)")
                    .HasColumnName("SkippedCount")
                    .HasDefaultValue(0);

                builder.Property(e => e.DuplicateCount)
                    .IsRequired()
                    .HasColumnType("int(11)")
                    .HasColumnName("DuplicateCount")
                    .HasDefaultValue(0);

                builder.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasColumnName("Status")
                    .HasDefaultValue("Completed");

                builder.Property(e => e.FileName)
                    .HasMaxLength(255)
                    .HasColumnName("FileName");

                builder.Property(e => e.ImportedBy)
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnName("ImportedBy");

                // Indexes
                builder.HasIndex(e => e.ReportId, "FuelReportImportLog")
                    .IsUnique()
                    .HasDatabaseName("FuelReportImportLog");

                builder.HasIndex(e => e.SiteId, "SiteID_reportID_idx")
                    .HasDatabaseName("SiteID_reportID_idx");

                builder.HasIndex(e => e.ImportedBy, "fk_fuel_import_history_user")
                    .HasDatabaseName("fk_fuel_import_history_user");

                // Relationships
                builder.HasOne(d => d.Site)
                    .WithMany()
                    .HasForeignKey(d => d.SiteId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_fuelreportimportlog_site");

                builder.HasOne(d => d.User)
                    .WithMany()
                    .HasForeignKey(d => d.ImportedBy)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_fuel_import_history_user");
            }
            catch (Exception ex)
            {
                throw new Exception($"Error configuring FuelReportImportHistoryConfiguration: {ex.Message}", ex);
            }
        }
    }
}
