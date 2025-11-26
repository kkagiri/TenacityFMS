using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using MediatR;
using System;

namespace FMS.Application.Features.GPSGate.Queries
{
    /// <summary>
    /// Generic query to process a report with specific type
    /// </summary>
    /// <typeparam name="T">The DTO type for the report data</typeparam>
    public record ProcessReportQuery<T>(
        string SessionId,
        int HandleId,
        int ReportId
    ) : IRequest<FMSResponse<ProcessedReportDto<T>>> where T : class;
}
