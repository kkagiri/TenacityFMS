using System;

namespace FMS.Application.Features.Reporting.DTOs
{
    /// <summary>
    /// DTO for report execution history records
    /// </summary>
    public class ReportExecutionHistoryDTO
    {
        public long ReportExecutionId { get; set; }
        public int ReportDefinitionId { get; set; }
        public string ExecutedBy { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
        public string? Filters { get; set; }
        public string? ExportFormat { get; set; }
        public int? RecordCount { get; set; }
        public int? ExecutionTimeMs { get; set; }
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public string? IpAddress { get; set; }
    }
}
