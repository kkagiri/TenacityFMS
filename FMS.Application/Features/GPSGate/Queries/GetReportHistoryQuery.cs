using System.Collections.Generic;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using MediatR;

namespace FMS.Application.Features.GPSGate.Queries
{
    public record GetReportHistoryQuery(int? ReportId = null, string Status = null)
        : IRequest<FMSResponse<List<GPSGateReportDto>>>;
}
