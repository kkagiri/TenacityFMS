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
    public class FetchReportQueryHandler : IRequestHandler<FetchReportQuery, FMSResponse<FetchReportResponseDto>>
    {
        private readonly IGPSGateReportingService _reportingService;
        private readonly IGPSGateDirectoryService _directoryService;
        private readonly ILogger<FetchReportQueryHandler> _logger;

        public FetchReportQueryHandler(
            IGPSGateReportingService reportingService,
            IGPSGateDirectoryService directoryService,
            ILogger<FetchReportQueryHandler> logger)
        {
            _reportingService = reportingService;
            _directoryService = directoryService;
            _logger = logger;
        }

        public async Task<FMSResponse<FetchReportResponseDto>> Handle(FetchReportQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate session
                if (string.IsNullOrWhiteSpace(request.SessionId))
                {
                    return FMSResponse<FetchReportResponseDto>.Failed("Session ID is required");
                }

                var isValidSession = await _directoryService.ValidateSessionAsync(request.SessionId);
                if (!isValidSession)
                {
                    return FMSResponse<FetchReportResponseDto>.Failed("Invalid or expired session");
                }

                if (request.HandleId <= 0)
                {
                    return FMSResponse<FetchReportResponseDto>.Failed("Valid Handle ID is required");
                }

                _logger.LogInformation($"Fetching report data for handle: {request.HandleId}");

                var result = await _reportingService.FetchReportAsync(request.SessionId, request.HandleId);

                if (!result.Success)
                {
                    _logger.LogWarning($"Failed to fetch report: {result.Message}");
                    return FMSResponse<FetchReportResponseDto>.Failed(result.Message);
                }

                return FMSResponse<FetchReportResponseDto>.Success(result, "Report fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching report for handle: {request.HandleId}");
                return FMSResponse<FetchReportResponseDto>.Failed($"Failed to fetch report: {ex.Message}");
            }
        }
    }
}
