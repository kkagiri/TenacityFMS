using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using MediatR;

namespace FMS.Application.Features.GPSGate.Queries
{
    public record FetchReportQuery(string SessionId, int HandleId)
        : IRequest<FMSResponse<FetchReportResponseDto>>;
}
