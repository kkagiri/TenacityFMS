using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using FMS.Domain.Entities.Reports;

namespace FMS.Persistence.EntityConfigurations
{
    /// <summary>
    /// Configuration for the ReportItem entity
    /// </summary>
    public class ReportItemConfiguration : EntityTypeConfiguration<ReportItem>
    {
        /// <summary>
        /// Configures the entity
        /// </summary>
        /// <param name="builder">The entity type builder</param>
        public override void Configure(EntityTypeBuilder<ReportItem> builder)
        {
            try
            {
                builder.HasKey(e => e.Id);

                builder.ToTable("reportitems");

                builder.Property(e => e.Id);
                builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
                builder.Property(e => e.DisplayName).HasMaxLength(100);
                builder.Property(e => e.Description).HasMaxLength(500);
                builder.Property(e => e.Category).HasMaxLength(100).HasDefaultValue("DevExtreme Reports");
                builder.Property(e => e.Icon).HasMaxLength(100).HasDefaultValue("fa-light fa-file-chart-column");
                builder.Property(e => e.ReportType).HasDefaultValue((FMS.Domain.Entities.Reports.ReportType)4);
                builder.Property(e => e.LayoutData);
                builder.Property(e => e.CreatedAt);
                builder.Property(e => e.UpdatedAt);
                builder.Property(e => e.CreatedBy).HasMaxLength(50);
                builder.Property(e => e.UpdatedBy).HasMaxLength(50);
            }

            catch (Exception ex)
            {
                Console.WriteLine($"Error configuring  : {ex.Message}");

                throw new Exception($"Error configuring ReportItemConfiguration: {ex.Message}", ex);
            }
        }
    }
}
