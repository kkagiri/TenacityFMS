using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Commands
{
    /// <summary>
    /// Command to cancel a GPSGate report generation.
    /// Sends cancellation instruction to GPSGate server and updates local status.
    /// </summary>
    public record CancelGpsReportCommand(string JobId) : IRequest<FMSResponse<object>>;

    public class CancelGpsReportCommandHandler : IRequestHandler<CancelGpsReportCommand, FMSResponse<object>>
    {
        private readonly ITrackingReportService _reportingService;
        private readonly GpsdataContext _context;
        private readonly ILogger<CancelGpsReportCommandHandler> _logger;

        public CancelGpsReportCommandHandler(
            ITrackingReportService reportingService,
            GpsdataContext context,
            ILogger<CancelGpsReportCommandHandler> logger)
        {
            _reportingService = reportingService;
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<object>> Handle(CancelGpsReportCommand request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.JobId))
                {
                    return FMSResponse<object>.Failed("Job ID is required");
                }

                _logger.LogInformation("Attempting to cancel GPS report for job {JobId}", request.JobId);

                // Find the GPSGateReport record by JobId
                // The JobId is the GUID created in the controller and stored in the database
                var report = await _context.GPSGateReports
                    .FirstOrDefaultAsync(r => r.JobId == request.JobId && r.Status == "Processing", cancellationToken);

                if (report == null)
                {
                    _logger.LogWarning("No processing GPS report found for job {JobId}", request.JobId);
                    return FMSResponse<object>.Failed("No active report found to cancel");
                }

                _logger.LogInformation(
                    "Found processing report {ReportId} (HandleId: {HandleId}, JobId: {JobId}) for cancellation",
                    report.Id, report.HandleId, report.JobId);                // Send cancellation request to GPSGate server
                var cancelResult = await _reportingService.CancelReportAsync(report.SessionId, report.HandleId);

                if (!cancelResult)
                {
                    _logger.LogWarning(
                        "GPSGate server cancellation failed for HandleId {HandleId}. Report may have already completed or failed.",
                        report.HandleId);

                    // Still update local status even if GPSGate cancellation failed
                    // (report may have already completed or failed on GPSGate side)
                }

                // Update local database status
                report.Status = "Cancelled";
                report.CompletedAt = DateTime.UtcNow;
                report.ErrorMessage = "Cancelled by user";

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "GPS report {ReportId} (HandleId: {HandleId}) cancelled successfully",
                    report.Id, report.HandleId);

                return FMSResponse<object>.Success(
                    new { ReportId = report.Id, HandleId = report.HandleId },
                    "Report cancellation request sent to GPSGate server");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling GPS report for job {JobId}", request.JobId);
                return FMSResponse<object>.Failed($"Report cancellation failed: {ex.Message}");
            }
        }
    }
}
