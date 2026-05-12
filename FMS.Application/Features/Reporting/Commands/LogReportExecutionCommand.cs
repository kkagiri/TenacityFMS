using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Command to log a report execution
    /// </summary>
    public class LogReportExecutionCommand : IRequest<FMSResponse<ReportExecutionHistoryDTO>>
    {
        public int ReportDefinitionId { get; set; }
        public string ExecutedBy { get; set; } = string.Empty;
        public string? Filters { get; set; }
        public string? ExportFormat { get; set; }
        public int? RecordCount { get; set; }
        public int? ExecutionTimeMs { get; set; }
        public bool Success { get; set; } = true;
        public string? ErrorMessage { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
    }
}
