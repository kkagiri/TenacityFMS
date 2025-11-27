using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.GPSGate.Commands
{
    public record GenerateGPSReportCommand(
        string SessionId,
        GenerateReportRequestDto ReportRequest,
        string? JobId = null) : IRequest<FMSResponse<GenerateReportResponseDto>>;

    public class GenerateGPSReportCommandHandler : IRequestHandler<GenerateGPSReportCommand, FMSResponse<GenerateReportResponseDto>>
    {
        private readonly IGPSGateReportingService _reportingService;
        private readonly IGPSGateDirectoryService _directoryService;
        private readonly ILogger<GenerateGPSReportCommandHandler> _logger;

        public GenerateGPSReportCommandHandler(
            IGPSGateReportingService reportingService,
            IGPSGateDirectoryService directoryService,
            ILogger<GenerateGPSReportCommandHandler> logger)
        {
            _reportingService = reportingService;
            _directoryService = directoryService;
            _logger = logger;
        }

        public async Task<FMSResponse<GenerateReportResponseDto>> Handle(GenerateGPSReportCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate session
                if (string.IsNullOrWhiteSpace(request.SessionId))
                {
                    return FMSResponse<GenerateReportResponseDto>.Failed("Session ID is required");
                }

                var isValidSession = await _directoryService.ValidateSessionAsync(request.SessionId);
                if (!isValidSession)
                {
                    return FMSResponse<GenerateReportResponseDto>.Failed("Invalid or expired session");
                }

                // Validate input
                if (request.ReportRequest.ReportId <= 0)
                {
                    return FMSResponse<GenerateReportResponseDto>.Failed("Valid Report ID is required");
                }

                if (request.ReportRequest.StartDate >= request.ReportRequest.EndDate)
                {
                    return FMSResponse<GenerateReportResponseDto>.Failed("Start date must be before end date");
                }

                _logger.LogInformation($"Generating report {request.ReportRequest.ReportId} from {request.ReportRequest.StartDate} to {request.ReportRequest.EndDate}");

                var result = await _reportingService.GenerateReportAsync(
                    request.SessionId,
                    request.ReportRequest.ReportId,
                    request.ReportRequest.StartDate,
                    request.ReportRequest.EndDate,
                    request.JobId); // Pass JobId to service

                if (!result.Success)
                {
                    _logger.LogWarning($"Report generation failed: {result.Message}");
                    return FMSResponse<GenerateReportResponseDto>.Failed(result.Message);
                }

                _logger.LogInformation($"Report generation initiated with handle ID: {result.HandleId}");
                return FMSResponse<GenerateReportResponseDto>.Success(result, "Report generation initiated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report");
                return FMSResponse<GenerateReportResponseDto>.Failed($"Report generation failed: {ex.Message}");
            }
        }
    }
}
