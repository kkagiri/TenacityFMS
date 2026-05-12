using FMS.Domain.Entities.Features.Reporting;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.DataAccess
{
    /// <summary>
    /// Partial class extension for Reporting entities
    /// </summary>
    public partial class GpsdataContext
    {
        // Reporting Module DbSets
        public virtual DbSet<ReportDefinition> ReportDefinitions { get; set; }
        public virtual DbSet<ReportTemplate> ReportTemplates { get; set; }
        public virtual DbSet<ReportExecutionHistory> ReportExecutionHistories { get; set; }
        public virtual DbSet<ReportCategory> ReportCategories { get; set; }
        public virtual DbSet<ReportSchedule> ReportSchedules { get; set; }
    }
}
