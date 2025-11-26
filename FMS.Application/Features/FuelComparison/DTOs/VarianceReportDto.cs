using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for variance analysis report with detailed metrics
    /// </summary>
    public class VarianceReportDto
    {
        /// <summary>
        /// Report generation timestamp
        /// </summary>
        public DateTime GeneratedAt { get; set; }

        /// <summary>
        /// Start date of the report period
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// End date of the report period
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Filter applied: "all", "site", or "tank"
        /// </summary>
        public string FilterType { get; set; }

        /// <summary>
        /// Site ID if filtered by site
        /// </summary>
        public int? SiteId { get; set; }

        /// <summary>
        /// Tank ID if filtered by tank
        /// </summary>
        public int? TankId { get; set; }

        /// <summary>
        /// Current variance threshold used for analysis (in liters)
        /// </summary>
        public decimal VarianceThreshold { get; set; }

        /// <summary>
        /// Summary metrics for the report
        /// </summary>
        public VarianceReportSummary Summary { get; set; }

        /// <summary>
        /// Detailed comparison data for each record
        /// </summary>
        public List<FuelDataComparisonDto> Details { get; set; }

        /// <summary>
        /// High variance records (exceeds threshold)
        /// </summary>
        public List<FuelDataComparisonDto> HighVarianceRecords { get; set; }
    }
}
