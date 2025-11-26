using System.Collections.Generic;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Command to generate a report based on report definition
    /// </summary>
    public class GenerateReportCommand : IRequest<GenerateReportResponseDTO>
    {
        public string ReportId { get; set; } = string.Empty;
        public Dictionary<string, object>? Filters { get; set; }
        public string ExportFormat { get; set; } = "json"; // json, excel, pdf, csv
        public bool IncludeCharts { get; set; } = false;
        public string? UserId { get; set; }
    }

    /// <summary>
    /// Command to save a report template
    /// </summary>
    public class SaveReportTemplateCommand : IRequest<ReportTemplateDTO>
    {
        public SaveReportTemplateDTO Template { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Command to delete a report template
    /// </summary>
    public class DeleteReportTemplateCommand : IRequest<bool>
    {
        public string TemplateId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
    }
}
