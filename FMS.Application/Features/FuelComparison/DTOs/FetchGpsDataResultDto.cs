using System;
using System.Collections.Generic;

namespace FMS.Application.Features.FuelComparison.DTOs
{
    /// <summary>
    /// DTO for result of GPS data fetch operation
    /// Provides detailed information about the async fetch process
    /// </summary>
    public class FetchGpsDataResultDto
    {
        /// <summary>
        /// GPSGate session ID used for the operation
        /// </summary>
        public string SessionId { get; set; }

        /// <summary>
        /// Handle ID of the generated report
        /// </summary>
        public int ReportHandleId { get; set; }

        /// <summary>
        /// Requested date range for the fetch
        /// </summary>
        public string RequestedDateRange { get; set; }

        /// <summary>
        /// When the fetch operation started
        /// </summary>
        public DateTime StartedAt { get; set; }

        /// <summary>
        /// When the fetch operation completed
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Total number of records fetched from GPSGate
        /// </summary>
        public int TotalRecordsFetched { get; set; }

        /// <summary>
        /// Number of new records saved to database
        /// </summary>
        public int NewRecordsSaved { get; set; }

        /// <summary>
        /// Number of existing records updated (if OverwriteExisting = true)
        /// </summary>
        public int RecordsUpdated { get; set; }

        /// <summary>
        /// Number of records skipped (already exist, OverwriteExisting = false)
        /// </summary>
        public int RecordsSkipped { get; set; }

        /// <summary>
        /// Duration of the operation in seconds
        /// </summary>
        public double DurationSeconds => CompletedAt.HasValue
            ? (CompletedAt.Value - StartedAt).TotalSeconds
            : 0;
    }
}
