using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Queries
{
    public class GetReportStatusQueryHandler : IRequestHandler<GetReportStatusQuery, FMSResponse<ReportStatusDto>>
    {
        private readonly ITrackingReportService _reportingService;
        private readonly ITrackingDirectoryService _directoryService;
        private readonly ILogger<GetReportStatusQueryHandler> _logger;

        public GetReportStatusQueryHandler(
            ITrackingReportService reportingService,
            ITrackingDirectoryService directoryService,
            ILogger<GetReportStatusQueryHandler> logger)
        {
            _reportingService = reportingService;
            _directoryService = directoryService;
            _logger = logger;
        }

        public async Task<FMSResponse<ReportStatusDto>> Handle(GetReportStatusQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate session
                if (string.IsNullOrWhiteSpace(request.SessionId))
                {
                    return FMSResponse<ReportStatusDto>.Failed("Session ID is required");
                }

                var isValidSession = await _directoryService.ValidateSessionAsync(request.SessionId);
                if (!isValidSession)
                {
                    return FMSResponse<ReportStatusDto>.Failed("Invalid or expired session");
                }

                if (request.HandleId <= 0)
                {
                    return FMSResponse<ReportStatusDto>.Failed("Valid Handle ID is required");
                }

                _logger.LogInformation($"Checking report status for handle: {request.HandleId}");

                var result = await _reportingService.GetReportStatusAsync(request.SessionId, request.HandleId);

                return FMSResponse<ReportStatusDto>.Success(result, "Report status retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting report status for handle: {request.HandleId}");
                return FMSResponse<ReportStatusDto>.Failed($"Failed to get report status: {ex.Message}");
            }
        }
    }
}
