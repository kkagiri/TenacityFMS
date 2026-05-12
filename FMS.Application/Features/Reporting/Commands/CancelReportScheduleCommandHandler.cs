using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Reporting.Commands
{
    /// <summary>
    /// Handler for cancelling a report schedule
    /// </summary>
    public class CancelReportScheduleCommandHandler
        : IRequestHandler<CancelReportScheduleCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CancelReportScheduleCommandHandler> _logger;

        public CancelReportScheduleCommandHandler(
            GpsdataContext context,
            ILogger<CancelReportScheduleCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(
            CancelReportScheduleCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var schedule = await _context.ReportSchedules
                    .FirstOrDefaultAsync(s => s.ReportScheduleId == request.ReportScheduleId, cancellationToken);

                if (schedule == null)
                    return FMSResponse<bool>.Failed("Schedule not found");

                schedule.Status = "cancelled";
                schedule.CancelledAt = DateTime.UtcNow;
                schedule.CancelledBy = request.UserId;
                schedule.ModifiedAt = DateTime.UtcNow;
                schedule.ModifiedBy = request.UserId;

                await _context.SaveChangesAsync(cancellationToken);

                return FMSResponse<bool>.Success(true, "Schedule cancelled successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling schedule {ScheduleId}", request.ReportScheduleId);
                return FMSResponse<bool>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
