using System.Collections.Generic;
using System;


namespace FMS.Application.Features.TankManagement.BulkImport.DTOs
{
    /// <summary>
    /// Response DTO for bulk import operation
    /// </summary>
    public class BulkImportResponseDTO
    {
        /// <summary>
        /// Total number of rows in the import file
        /// </summary>
        public int TotalRows { get; set; }

        /// <summary>
        /// Number of rows successfully imported
        /// </summary>
        public int ImportedRows { get; set; }

        /// <summary>
        /// Number of rows skipped (duplicates or invalid)
        /// </summary>
        public int SkippedRows { get; set; }

        /// <summary>
        /// Number of rows with validation warnings
        /// </summary>
        public int WarningRows { get; set; }

        /// <summary>
        /// Validation result containing all anomalies
        /// </summary>
        public BulkImportValidationResult ValidationResult { get; set; } = new BulkImportValidationResult();

        /// <summary>
        /// List of duplicate entries found (if any)
        /// </summary>
        public List<DuplicateEntryInfo> Duplicates { get; set; } = new List<DuplicateEntryInfo>();

        /// <summary>
        /// Whether the import was successful
        /// </summary>
        public bool IsSuccessful => ImportedRows > 0 && !ValidationResult.HasBlockingAnomalies;

        /// <summary>
        /// Summary message
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Import batch ID (for tracking)
        /// </summary>
        public int? BatchId { get; set; }
    }

    /// <summary>
    /// Information about a duplicate entry
    /// </summary>
    public class DuplicateEntryInfo
    {
        public string TankName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int RowNumber { get; set; }
        public int ExistingStockId { get; set; }
        public string Action { get; set; } = string.Empty; // "Skipped" or "Replaced"
    }
}
