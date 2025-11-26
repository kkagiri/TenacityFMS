namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// Summary metrics for variance analysis
    /// </summary>
    public class VarianceReportSummary
    {
        /// <summary>
        /// Total number of fuel records in the period
        /// </summary>
        public int TotalRecords { get; set; }

        /// <summary>
        /// Records with all 3 data sources available
        /// </summary>
        public int CompleteRecords { get; set; }

        /// <summary>
        /// Records with only 2 data sources
        /// </summary>
        public int PartialRecords { get; set; }

        /// <summary>
        /// Records with only 1 data source
        /// </summary>
        public int SingleSourceRecords { get; set; }

        /// <summary>
        /// Number of records with variance exceeding threshold
        /// </summary>
        public int HighVarianceCount { get; set; }

        /// <summary>
        /// Average variance across all records (in liters)
        /// </summary>
        public decimal AverageVariance { get; set; }

        /// <summary>
        /// Maximum variance found (in liters)
        /// </summary>
        public decimal MaxVariance { get; set; }

        /// <summary>
        /// Total volume from manual entries (liters)
        /// </summary>
        public decimal TotalManualVolume { get; set; }

        /// <summary>
        /// Total volume from PTS transactions (liters)
        /// </summary>
        public decimal TotalPtsVolume { get; set; }

        /// <summary>
        /// Total effective volume from GPS entries (liters)
        /// </summary>
        public decimal TotalGpsVolume { get; set; }

        /// <summary>
        /// Number of GPS entries that have been modified
        /// </summary>
        public int ModifiedGpsEntriesCount { get; set; }

        /// <summary>
        /// Number of GPS entries that have been soft deleted
        /// </summary>
        public int DeletedGpsEntriesCount { get; set; }

        /// <summary>
        /// Percentage of records with complete data (all 3 sources)
        /// </summary>
        public decimal DataCompletenessPercent { get; set; }

        /// <summary>
        /// Percentage of records exceeding variance threshold
        /// </summary>
        public decimal HighVariancePercent { get; set; }
    }
}
