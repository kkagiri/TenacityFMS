using System;

namespace FMS.Application.Features.VehicleMaintenance.DTOs;

/// <summary>
/// Data Transfer Object for importing maintenance records from Excel/CSV
/// </summary>
public class MaintenanceImportDTO
{
    /// <summary>
    /// Vehicle number (Hyoung No) - Required
    /// </summary>
    public string VehicleNumber { get; set; } = null!;

    /// <summary>
    /// Type of maintenance (Oil Change, Tire Rotation, etc.)
    /// </summary>
    public string MaintenanceType { get; set; } = "General Repair";

    /// <summary>
    /// Scheduled date for maintenance
    /// </summary>
    public DateTime ScheduledDate { get; set; } = DateTime.Now;

    /// <summary>
    /// Priority level (1=Low, 2=Normal, 3=Medium, 4=High, 5=Critical)
    /// </summary>
    public int Priority { get; set; } = 2;

    /// <summary>
    /// Status (Scheduled, In Progress, Completed, Cancelled)
    /// </summary>
    public string Status { get; set; } = "Scheduled";

    /// <summary>
    /// Description of the maintenance work
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Row number from source file (for error reporting)
    /// </summary>
    public int RowNumber { get; set; }
}

/// <summary>
/// Result of import operation
/// </summary>
public class MaintenanceImportResultDTO
{
    /// <summary>
    /// Number of records successfully imported
    /// </summary>
    public int Imported { get; set; }

    /// <summary>
    /// Number of records that failed to import
    /// </summary>
    public int Failed { get; set; }

    /// <summary>
    /// List of errors encountered during import
    /// </summary>
    public List<MaintenanceImportErrorDTO> Errors { get; set; } = new();
}

/// <summary>
/// Error details for failed import record
/// </summary>
public class MaintenanceImportErrorDTO
{
    /// <summary>
    /// Row number from source file
    /// </summary>
    public int RowNumber { get; set; }

    /// <summary>
    /// Vehicle number that failed
    /// </summary>
    public string? VehicleNumber { get; set; }

    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = null!;
}
