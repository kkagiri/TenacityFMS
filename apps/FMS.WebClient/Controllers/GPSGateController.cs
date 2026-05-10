using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.GPSGate.Commands;
using FMS.Application.Features.GPSGate.DTOs;
using FMS.Application.Features.GPSGate.Queries;
using FMS.Application.Features.GPSGate.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [ApiController]
    [Route("api/v1/[controller]")]
    [RequirePermission(Permissions.Vehicle.Read)]
    public class GPSGateController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<GPSGateController> _logger;

        public GPSGateController(IMediator mediator, ILogger<GPSGateController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        #region Tags

        /// <summary>
        /// Get all tags from GPSGate
        /// GET /api/v1/GPSGate/tags
        /// </summary>
        [HttpGet("tags")]
        public async Task<IActionResult> GetTags([FromServices] ITrackingViewsService viewsService)
        {
            try
            {
                _logger.LogInformation("Fetching GPSGate tags...");
                var result = await viewsService.GetTagsAsync();

                if (result.IsSuccess)
                {
                    return Ok(result);
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching GPSGate tags");
                return StatusCode(500, FMSResponse<List<GPSGateTagDTO>>.Failed($"Error: {ex.Message}"));
            }
        }

        #endregion

        /// <summary>
        /// TEST: Login to GPSGate using credentials from provider_configurations
        /// No authentication required for testing
        /// </summary>
        [HttpPost("test-login")]
        [AllowAnonymous]
        public async Task<IActionResult> TestLogin([FromServices] ITrackingDirectoryService directoryService)
        {
            try
            {
                _logger.LogInformation("TEST: Attempting GPSGate login using provider configuration...");

                var result = await directoryService.AuthenticateAsync();

                if (result.Success)
                {
                    _logger.LogInformation("TEST: GPSGate login successful! SessionId: {SessionId}", result.SessionId);
                    return Ok(FMSResponse<LoginResponseDto>.Success(result, "Login successful"));
                }
                else
                {
                    _logger.LogWarning("TEST: GPSGate login failed: {Message}", result.Message);
                    return BadRequest(FMSResponse<LoginResponseDto>.Failed(result.Message));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "TEST: Error during GPSGate login");
                return StatusCode(500, FMSResponse<LoginResponseDto>.Failed($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Test endpoint - check report status
        /// </summary>
        [HttpGet("reports/status-test/{handleId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReportStatusTest(int handleId)
        {
            try
            {
                // Simple test to check status of a specific report
                // You'll need to provide sessionId as query param
                // Usage: GET /api/v1/GPSGate/reports/status-test/123?sessionId=ABC123

                return Ok(FMSResponse<object>.Success(new
                {
                    Message = "Use the status endpoint instead: GET /api/v1/GPSGate/reports/status/{handleId}?sessionId=ABC123",
                    HandleId = handleId
                }, "Test endpoint - see message"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in test endpoint");
                return StatusCode(500, FMSResponse<object>.Failed($"Error: {ex.Message}"));
            }
        }        /// <summary>
                 /// Login to GPSGate and obtain a session
                 /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            try
            {
                var command = new LoginCommand(loginRequest);
                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during GPSGate login");
                return StatusCode(500, FMSResponse<LoginResponseDto>.Failed("An error occurred during login"));
            }
        }

        /// <summary>
        /// Generate a report
        /// </summary>
        [HttpPost("reports/generate")]
        public async Task<IActionResult> GenerateReport([FromQuery] string sessionId, [FromBody] GenerateReportRequestDto reportRequest)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<GenerateReportResponseDto>.Failed("Session ID is required"));
                }

                var reportingService = HttpContext.RequestServices.GetRequiredService<ITrackingReportService>();

                var result = await reportingService.GenerateReportAsync(
                    sessionId,
                    reportRequest.ReportId,
                    reportRequest.StartDate,
                    reportRequest.EndDate);

                if (!result.Success)
                {
                    return BadRequest(FMSResponse<GenerateReportResponseDto>.Failed(result.Message));
                }

                return Ok(FMSResponse<GenerateReportResponseDto>.Success(result, result.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report");
                return StatusCode(500, FMSResponse<GenerateReportResponseDto>.Failed("An error occurred while generating the report"));
            }
        }        /// <summary>
                 /// Get report status
                 /// </summary>
        [HttpGet("reports/status/{handleId}")]
        public async Task<IActionResult> GetReportStatus([FromQuery] string sessionId, int handleId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<ReportStatusDto>.Failed("Session ID is required"));
                }

                var query = new GetReportStatusQuery(sessionId, handleId);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting report status for handle: {handleId}");
                return StatusCode(500, FMSResponse<ReportStatusDto>.Failed("An error occurred while checking report status"));
            }
        }

        /// <summary>
        /// Cancel a running report
        /// </summary>
        [HttpPost("reports/cancel/{handleId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CancelReport([FromQuery] string sessionId, int handleId)
        {
            try
            {
                _logger.LogInformation("Cancelling report with handle {HandleId}", handleId);

                var reportingService = HttpContext.RequestServices.GetRequiredService<ITrackingReportService>();

                // Cancel the report
                var success = await reportingService.CancelReportAsync(sessionId, handleId);

                if (success)
                {
                    return Ok(FMSResponse<string>.Success("Report cancelled successfully"));
                }

                return BadRequest(FMSResponse<string>.Failed("Failed to cancel report"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling report {HandleId}", handleId);
                return StatusCode(500, FMSResponse<string>.Failed($"Error: {ex.Message}"));
            }
        }        /// <summary>
                 /// Fetch completed report data
                 /// </summary>
        [HttpGet("reports/fetch/{handleId}")]
        public async Task<IActionResult> FetchReport([FromQuery] string sessionId, int handleId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<FetchReportResponseDto>.Failed("Session ID is required"));
                }

                var query = new FetchReportQuery(sessionId, handleId);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching report for handle: {handleId}");
                return StatusCode(500, FMSResponse<FetchReportResponseDto>.Failed("An error occurred while fetching the report"));
            }
        }

        /// <summary>
        /// Get report history with optional filters
        /// </summary>
        [HttpGet("reports/history")]
        public async Task<IActionResult> GetReportHistory([FromQuery] int? reportId = null, [FromQuery] string status = null)
        {
            try
            {
                var query = new GetReportHistoryQuery(reportId, status);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching report history");
                return StatusCode(500, FMSResponse<object>.Failed("An error occurred while fetching report history"));
            }
        }

        /// <summary>
        /// Process Fuel Consumption Report (Report ID: 208)
        /// Returns parsed fuel consumption data
        /// </summary>
        [HttpGet("reports/process/fuel-consumption/{handleId}")]
        public async Task<IActionResult> ProcessFuelConsumptionReport([FromQuery] string sessionId, int handleId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<ProcessedReportDto<FuelConsumptionReportDto>>.Failed("Session ID is required"));
                }

                var query = new ProcessReportQuery<FuelConsumptionReportDto>(sessionId, handleId, 208);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing fuel consumption report for handle: {handleId}");
                return StatusCode(500, FMSResponse<ProcessedReportDto<FuelConsumptionReportDto>>.Failed("An error occurred while processing the report"));
            }
        }

        /// <summary>
        /// Process Refueling Report (Report ID: 212)
        /// Returns parsed refueling event data
        /// </summary>
        [HttpGet("reports/process/refueling/{handleId}")]
        public async Task<IActionResult> ProcessRefuelingReport([FromQuery] string sessionId, int handleId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<ProcessedReportDto<RefuelingReportDto>>.Failed("Session ID is required"));
                }

                var query = new ProcessReportQuery<RefuelingReportDto>(sessionId, handleId, 212);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing refueling report for handle: {handleId}");
                return StatusCode(500, FMSResponse<ProcessedReportDto<RefuelingReportDto>>.Failed("An error occurred while processing the report"));
            }
        }

        /// <summary>
        /// Process any report type by ID
        /// Returns parsed data based on registered processor
        /// </summary>
        [HttpGet("reports/process/{reportId}/{handleId}")]
        public async Task<IActionResult> ProcessReport([FromQuery] string sessionId, int reportId, int handleId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return BadRequest(FMSResponse<object>.Failed("Session ID is required"));
                }

                // Route to specific processor based on reportId
                switch (reportId)
                {
                    case 208: // Fuel Consumption
                        var fuelQuery = new ProcessReportQuery<FuelConsumptionReportDto>(sessionId, handleId, reportId);
                        var fuelResult = await _mediator.Send(fuelQuery);
                        return fuelResult.IsSuccess ? Ok(fuelResult) : BadRequest(fuelResult);

                    case 212: // Refueling
                        var refuelQuery = new ProcessReportQuery<RefuelingReportDto>(sessionId, handleId, reportId);
                        var refuelResult = await _mediator.Send(refuelQuery);
                        return refuelResult.IsSuccess ? Ok(refuelResult) : BadRequest(refuelResult);

                    default:
                        return BadRequest(FMSResponse<object>.Failed($"Report ID {reportId} is not supported. Supported reports: 208 (Fuel Consumption), 212 (Refueling)"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing report {reportId} for handle: {handleId}");
                return StatusCode(500, FMSResponse<object>.Failed("An error occurred while processing the report"));
            }
        }
    }
}
