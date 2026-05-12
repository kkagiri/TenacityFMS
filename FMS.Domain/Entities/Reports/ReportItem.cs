using FMS.Domain.Entities.Common;
using System;
using System.ComponentModel.DataAnnotations;

namespace FMS.Domain.Entities.Reports;

/// <summary>
/// Report type enumeration for categorizing reports
/// </summary>
public enum ReportType
{
    DataGrid = 0,
    PivotGrid = 1,
    Chart = 2,
    Dashboard = 3,
    DevExtreme = 4
}

public class ReportItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    /// <summary>
    /// Description of the report for gallery display
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Category for grouping reports (e.g., "Tank Management", "Vehicle Reports")
    /// </summary>
    public string Category { get; set; } = "DevExtreme Reports";

    /// <summary>
    /// FontAwesome icon class (e.g., "fa-light fa-file-chart-column")
    /// </summary>
    public string Icon { get; set; } = "fa-light fa-file-chart-column";

    /// <summary>
    /// Type of report for display purposes
    /// </summary>
    public ReportType ReportType { get; set; } = ReportType.DevExtreme;

    /// <summary>
    /// DevExpress report layout data (REPX format stored as bytes)
    /// </summary>
    public byte[]? LayoutData { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public string? UpdatedBy { get; set; }





}

