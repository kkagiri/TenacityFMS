using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Application.Features.Reporting.Services;
using MediatR;

namespace FMS.Application.Features.Reporting.Queries
{
    /// <summary>
    /// Handler for getting a specific report definition
    /// </summary>
    public class GetReportDefinitionQueryHandler : IRequestHandler<GetReportDefinitionQuery, ReportDefinitionDTO?>
    {
        private readonly IReportDefinitionService _reportService;

        public GetReportDefinitionQueryHandler(IReportDefinitionService reportService)
        {
            _reportService = reportService;
        }

        public async Task<ReportDefinitionDTO?> Handle(GetReportDefinitionQuery request, CancellationToken cancellationToken)
        {
            return await _reportService.GetReportDefinitionAsync(request.ReportId);
        }
    }

    /// <summary>
    /// Handler for getting all report definitions
    /// </summary>
    public class GetAllReportDefinitionsQueryHandler : IRequestHandler<GetAllReportDefinitionsQuery, List<ReportDefinitionDTO>>
    {
        private readonly IReportDefinitionService _reportService;

        public GetAllReportDefinitionsQueryHandler(IReportDefinitionService reportService)
        {
            _reportService = reportService;
        }

        public async Task<List<ReportDefinitionDTO>> Handle(GetAllReportDefinitionsQuery request, CancellationToken cancellationToken)
        {
            var reports = await _reportService.GetAllReportDefinitionsAsync();

            if (!string.IsNullOrEmpty(request.Category))
            {
                reports = reports.Where(r => r.Category.Equals(request.Category, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (request.ActiveOnly)
            {
                reports = reports.Where(r => r.IsActive).ToList();
            }

            return reports;
        }
    }

    /// <summary>
    /// Handler for getting report templates
    /// </summary>
    public class GetReportTemplatesQueryHandler : IRequestHandler<GetReportTemplatesQuery, List<ReportTemplateDTO>>
    {
        private readonly IReportDefinitionService _reportService;

        public GetReportTemplatesQueryHandler(IReportDefinitionService reportService)
        {
            _reportService = reportService;
        }

        public async Task<List<ReportTemplateDTO>> Handle(GetReportTemplatesQuery request, CancellationToken cancellationToken)
        {
            return await _reportService.GetReportTemplatesAsync(request.UserId, request.ReportId, request.IncludeShared);
        }
    }
}
