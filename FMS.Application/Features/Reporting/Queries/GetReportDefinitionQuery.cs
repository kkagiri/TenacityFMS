using System.Collections.Generic;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Queries
{
    /// <summary>
    /// Query to get a specific report definition by ID
    /// </summary>
    public class GetReportDefinitionQuery : IRequest<ReportDefinitionDTO?>
    {
        public string ReportId { get; set; }

        public GetReportDefinitionQuery(string reportId)
        {
            ReportId = reportId;
        }
    }

    /// <summary>
    /// Query to get all available report definitions
    /// </summary>
    public class GetAllReportDefinitionsQuery : IRequest<List<ReportDefinitionDTO>>
    {
        public string? Category { get; set; }
        public bool ActiveOnly { get; set; } = true;
    }

    /// <summary>
    /// Query to get report templates for a user
    /// </summary>
    public class GetReportTemplatesQuery : IRequest<List<ReportTemplateDTO>>
    {
        public string? UserId { get; set; }
        public string? ReportId { get; set; }
        public bool IncludeShared { get; set; } = true;
    }
}
