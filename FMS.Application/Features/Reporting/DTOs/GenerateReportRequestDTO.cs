using System;
using System.Collections.Generic;

namespace FMS.Application.Features.Reporting.DTOs
{
    /// <summary>
    /// Request DTO for generating a report
    /// </summary>
    public class GenerateReportRequestDTO
    {
        public string ReportId { get; set; } = string.Empty;
        public Dictionary<string, object>? Filters { get; set; }
        public string ExportFormat { get; set; } = "excel"; // excel, pdf, csv, json
        public bool IncludeCharts { get; set; } = false;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    /// <summary>
    /// Response DTO for generated report
    /// </summary>
    public class GenerateReportResponseDTO
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public object? Data { get; set; }
        public ReportMetadata? Metadata { get; set; }
        public byte[]? FileContent { get; set; } // For file exports
        public string? FileName { get; set; }
        public string? ContentType { get; set; }
    }

    public class ReportMetadata
    {
        public string ReportId { get; set; } = string.Empty;
        public string ReportName { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        public string GeneratedBy { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public Dictionary<string, object>? AppliedFilters { get; set; }
        public TimeSpan ExecutionTime { get; set; }
    }

    /// <summary>
    /// DTO for saving report templates
    /// </summary>
    public class SaveReportTemplateDTO
    {
        public string? TemplateId { get; set; } // Null for new templates
        public string TemplateName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ReportDefinitionDTO ReportDefinition { get; set; } = new();
        public bool IsDefault { get; set; } = false;
        public bool ShareWithUsers { get; set; } = false;
    }

    /// <summary>
    /// Response for saved report templates
    /// </summary>
    public class ReportTemplateDTO
    {
        public string TemplateId { get; set; } = string.Empty;
        public string TemplateName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ReportDefinitionDTO ReportDefinition { get; set; } = new();
        public bool IsDefault { get; set; }
        public bool IsShared { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }
    }
}