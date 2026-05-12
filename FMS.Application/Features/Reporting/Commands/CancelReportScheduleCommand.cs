using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Command to cancel a report schedule
    /// </summary>
    public class CancelReportScheduleCommand : IRequest<FMSResponse<bool>>
    {
        public long ReportScheduleId { get; set; }
        public string UserId { get; set; } = string.Empty;
    }
}
