using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Reporting.DTOs
{
    /// <summary>
    /// Defines a report configuration for DevExtreme report generation
    /// </summary>
    public class ReportDefinitionDTO
    {
        public string ReportId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // e.g., "Tank Management", "Fuel Analysis"
        public ReportType Type { get; set; } = ReportType.DataGrid;
        public string Icon { get; set; } = "fa-light fa-file-chart-column";

        // Data source configuration
        public string DataSourceEndpoint { get; set; } = string.Empty; // API endpoint to fetch data
        public Dictionary<string, object>? DefaultFilters { get; set; }

        // Report layout configuration
        public List<ReportColumnDTO>? Columns { get; set; }
        public List<ReportGroupingDTO>? Groupings { get; set; }
        public List<ReportSummaryDTO>? Summaries { get; set; }
        public ReportExportOptions? ExportOptions { get; set; }

        // Pivot Grid specific configuration
        public PivotGridConfiguration? PivotConfiguration { get; set; }

        // Permissions
        public string RequiredPermission { get; set; } = string.Empty;

        // Metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedBy { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsPublic { get; set; } = true;
    }

    public class ReportColumnDTO
    {
        public string DataField { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public string DataType { get; set; } = "string"; // string, number, date, boolean
        public string Format { get; set; } = string.Empty; // e.g., "0.00", "MM/dd/yyyy"
        public bool Visible { get; set; } = true;
        public int Width { get; set; } = 0; // 0 means auto
        public bool AllowSorting { get; set; } = true;
        public bool AllowFiltering { get; set; } = true;
        public bool AllowGrouping { get; set; } = true;
        public string Alignment { get; set; } = "left"; // left, center, right
        public bool Fixed { get; set; } = false;
        public string FixedPosition { get; set; } = "left"; // left, right
    }

    public class ReportGroupingDTO
    {
        public string DataField { get; set; } = string.Empty;
        public string SortOrder { get; set; } = "asc"; // asc, desc
        public bool GroupInterval { get; set; } = false;
        public string GroupIntervalType { get; set; } = ""; // day, month, year
    }

    public class ReportSummaryDTO
    {
        public string DataField { get; set; } = string.Empty;
        public string SummaryType { get; set; } = "sum"; // sum, avg, min, max, count
        public string DisplayFormat { get; set; } = "{0}";
        public bool ShowInGroupFooter { get; set; } = true;
        public bool ShowInColumn { get; set; } = true;
    }

    public class ReportExportOptions
    {
        public bool EnablePdfExport { get; set; } = true;
        public bool EnableExcelExport { get; set; } = true;
        public bool EnableCsvExport { get; set; } = true;
        public string DefaultFileName { get; set; } = "report";
        public string PdfPageOrientation { get; set; } = "landscape"; // portrait, landscape
    }

    public class PivotGridConfiguration
    {
        public List<PivotFieldDTO>? Fields { get; set; }
        public bool ShowBorders { get; set; } = true;
        public bool ShowColumnGrandTotals { get; set; } = true;
        public bool ShowRowGrandTotals { get; set; } = true;
        public bool ShowColumnTotals { get; set; } = true;
        public bool ShowRowTotals { get; set; } = true;
        public bool AllowSortingBySummary { get; set; } = true;
        public bool AllowFiltering { get; set; } = true;
        public bool AllowExpanding { get; set; } = true;
    }

    public class PivotFieldDTO
    {
        public string DataField { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public string Area { get; set; } = "row"; // row, column, data, filter
        public string DataType { get; set; } = "string";
        public string SummaryType { get; set; } = "sum"; // For data fields
        public string Format { get; set; } = string.Empty;
        public bool AllowSorting { get; set; } = true;
        public bool AllowFiltering { get; set; } = true;
        public bool AllowExpanding { get; set; } = true;
        public string SortOrder { get; set; } = "asc";
    }

    public enum ReportType
    {
        DataGrid,
        PivotGrid,
        Chart,
        CustomDashboard
    }
}
