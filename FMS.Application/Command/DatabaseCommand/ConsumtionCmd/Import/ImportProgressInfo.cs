using System;
using System.Collections.Generic;

namespace FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Import
{
    /// <summary>
    /// DTO for fuel import progress updates broadcasted via SignalR
    /// </summary>
    public class ImportProgressInfo
    {
        /// <summary>
        /// Current status of the import operation (e.g., "Processing", "Completed", "Failed")
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Number of records processed so far
        /// </summary>
        public int ProcessedRecords { get; set; }

        /// <summary>
        /// Total number of records to process
        /// </summary>
        public int TotalRecords { get; set; }

        /// <summary>
        /// Progress percentage (0-100)
        /// </summary>
        public int ProgressPercentage { get; set; }

        /// <summary>
        /// Number of successfully imported records
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// Number of failed records
        /// </summary>
        public int FailedCount { get; set; }

        /// <summary>
        /// Number of skipped records (e.g., duplicates)
        /// </summary>
        public int SkippedCount { get; set; }

        /// <summary>
        /// List of error messages for failed records
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// Unique job ID for tracking the import operation
        /// </summary>
        public string JobId { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp of the progress update
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Whether the import operation is complete
        /// </summary>
        public bool IsComplete { get; set; }

        /// <summary>
        /// Optional message providing additional context
        /// </summary>
        public string? Message { get; set; }
    }
}
