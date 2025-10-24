using System;

namespace FMS.Domain.Entities.Features.FuelImport;

/// <summary>
/// Entity to track fuel report import history for calendar visualization
/// Maps to the fuelreportimportlog table
/// </summary>
public partial class FuelReportImportHistory
{
    public int Id { get; set; }

    /// <summary>
    /// Unique identifier for the import batch (GUID)
    /// </summary>
    public string ReportId { get; set; } = null!;

    /// <summary>
    /// Timestamp when the import was performed
    /// </summary>
    public DateTime ImportDate { get; set; }

    /// <summary>
    /// Start date of the imported consumption data range
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// End date of the imported consumption data range
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Site ID for which the report was imported (nullable)
    /// </summary>
    public int? SiteId { get; set; }

    /// <summary>
    /// Total number of records processed
    /// </summary>
    public int TotalRecords { get; set; }

    /// <summary>
    /// Number of records successfully imported
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Number of records that failed to import
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>
    /// Number of records skipped
    /// </summary>
    public int SkippedCount { get; set; }

    /// <summary>
    /// Number of duplicate records found
    /// </summary>
    public int DuplicateCount { get; set; }

    /// <summary>
    /// Import status: Completed, Failed, Partial
    /// </summary>
    public string Status { get; set; } = "Completed";

    /// <summary>
    /// Name of the imported file
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// User who performed the import
    /// </summary>
    public string ImportedBy { get; set; } = null!;

    // Navigation properties
    public virtual Site? Site { get; set; }
    public virtual User User { get; set; } = null!;
}
