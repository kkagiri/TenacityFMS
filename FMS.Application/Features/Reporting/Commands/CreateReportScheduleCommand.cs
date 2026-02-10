using FMS.Application.Common;
using FMS.Application.Features.Reporting.DTOs;
using MediatR;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Command to create a report schedule
    /// </summary>
    public class CreateReportScheduleCommand : IRequest<FMSResponse<ReportScheduleDTO>>
    {
        public CreateReportScheduleDTO Schedule { get; set; } = new();
        public string UserId { get; set; } = string.Empty;
    }
}
