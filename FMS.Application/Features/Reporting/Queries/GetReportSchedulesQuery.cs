using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Queries
{
    /// <summary>
    /// Query to get all report schedules
    /// </summary>
    public class GetReportSchedulesQuery : IRequest<FMSResponse<List<ReportScheduleDTO>>>
    {
        public string? Status { get; set; }
    }
}
