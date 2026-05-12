using System.Threading.Tasks;
using System;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.DailyTankReconciliation.Commands;
using FMS.Application.Features.TankManagement.DailyTankReconciliation.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers;

//Cursor - Controller for daily tank reconciliation operations
[ApiController]
[Route("api/v1/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.TankStock.Read)]
public class DailyTankReconciliationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DailyTankReconciliationController> _logger;

    public DailyTankReconciliationController(
        IMediator mediator,
        ILogger<DailyTankReconciliationController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Process daily tank reconciliation for a specific date or date range
    /// </summary>
    /// <param name="command">Daily reconciliation processing parameters</param>
    /// <returns>Processing result with summary statistics</returns>
    [HttpPost("process")]
    public async Task<ActionResult<FMSResponse<DailyReconciliationResult>>> ProcessDailyReconciliation(
        [FromBody] ProcessDailyReconciliationCommand command)
    {
        try
        {
            _logger.LogInformation("Processing daily reconciliation request for date range {StartDate} to {EndDate}",
                command.StartDate, command.EndDate);

            var result = await _mediator.Send(command);

            if (result.IsSuccess)
            {
                _logger.LogInformation("Daily reconciliation completed successfully for {TankCount} tanks",
                    result.Data?.TotalTanksProcessed ?? 0);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Daily reconciliation failed: {Message}", result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing daily reconciliation");
            return StatusCode(500, FMSResponse<DailyReconciliationResult>.SystemError("Internal server error"));
        }
    }

    /// <summary>
    /// Get daily reconciliation report for dashboard display
    /// </summary>
    /// <param name="query">Report query parameters</param>
    /// <returns>Comprehensive reconciliation report with analytics</returns>
    [HttpGet("report")]
    public async Task<ActionResult<FMSResponse<DailyReconciliationReport>>> GetDailyReconciliationReport(
        [FromQuery] GetDailyReconciliationReportQuery query)
    {
        try
        {
            _logger.LogInformation("Generating daily reconciliation report for period {StartDate} to {EndDate}",
                query.StartDate, query.EndDate);

            var result = await _mediator.Send(query);

            if (result.IsSuccess)
            {
                _logger.LogInformation("Generated reconciliation report with {RecordCount} records",
                    result.Data?.Items?.Count ?? 0);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Failed to generate reconciliation report: {Message}", result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating daily reconciliation report");
            return StatusCode(500, FMSResponse<DailyReconciliationReport>.SystemError("Internal server error"));
        }
    }

    /// <summary>
    /// Process daily reconciliation for yesterday's data (convenience endpoint)
    /// </summary>
    /// <param name="siteId">Optional site ID filter</param>
    /// <param name="tankId">Optional tank ID filter</param>
    /// <returns>Processing result</returns>
    [HttpPost("process-yesterday")]
    public async Task<ActionResult<FMSResponse<DailyReconciliationResult>>> ProcessYesterdayReconciliation(
        [FromQuery] int? siteId = null, [FromQuery] int? tankId = null)
    {
        try
        {
            var yesterday = DateTime.Today.AddDays(-1);
            var command = new ProcessDailyReconciliationCommand
            {
                StartDate = yesterday,
                EndDate = yesterday,
                SiteId = siteId,
                TankId = tankId,
                ForceReprocess = false
            };

            _logger.LogInformation("Processing yesterday's reconciliation for {Date}", yesterday);

            var result = await _mediator.Send(command);

            if (result.IsSuccess)
            {
                _logger.LogInformation("Yesterday's reconciliation completed for {TankCount} tanks",
                    result.Data?.TotalTanksProcessed ?? 0);
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Yesterday's reconciliation failed: {Message}", result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing yesterday's reconciliation");
            return StatusCode(500, FMSResponse<DailyReconciliationResult>.SystemError("Internal server error"));
        }
    }

    /// <summary>
    /// Get reconciliation summary for dashboard widgets
    /// </summary>
    /// <param name="days">Number of days to include in summary (default: 7)</param>
    /// <param name="siteId">Optional site ID filter</param>
    /// <returns>Summary statistics for dashboard</returns>
    [HttpGet("summary")]
    public async Task<ActionResult<FMSResponse<DailyReconciliationSummary>>> GetReconciliationSummary(
        [FromQuery] int days = 7, [FromQuery] int? siteId = null)
    {
        try
        {
            var endDate = DateTime.Today;
            var startDate = endDate.AddDays(-days);

            var query = new GetDailyReconciliationReportQuery
            {
                StartDate = startDate,
                EndDate = endDate,
                SiteId = siteId,
                PageNumber = 1,
                PageSize = 1 // We only need the summary
            };

            _logger.LogInformation("Generating reconciliation summary for last {Days} days", days);

            var result = await _mediator.Send(query);

            if (result.IsSuccess && result.Data != null)
            {
                return Ok(FMSResponse<DailyReconciliationSummary>.Success(result.Data.Summary,
                    "Summary generated successfully"));
            }
            else
            {
                _logger.LogWarning("Failed to generate reconciliation summary: {Message}", result.Message);
                return BadRequest(FMSResponse<DailyReconciliationSummary>.Failed(result.Message));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating reconciliation summary");
            return StatusCode(500, FMSResponse<DailyReconciliationSummary>.SystemError("Internal server error"));
        }
    }

    /// <summary>
    /// Get discrepancy alerts for dashboard notifications
    /// </summary>
    /// <param name="days">Number of days to look back (default: 3)</param>
    /// <param name="siteId">Optional site ID filter</param>
    /// <returns>List of discrepancy alerts</returns>
    [HttpGet("alerts")]
    public async Task<ActionResult<FMSResponse<List<DiscrepancyAlert>>>> GetDiscrepancyAlerts(
        [FromQuery] int days = 3, [FromQuery] int? siteId = null)
    {
        try
        {
            var endDate = DateTime.Today;
            var startDate = endDate.AddDays(-days);

            var query = new GetDailyReconciliationReportQuery
            {
                StartDate = startDate,
                EndDate = endDate,
                SiteId = siteId,
                IncludeDiscrepanciesOnly = true,
                PageNumber = 1,
                PageSize = 50
            };

            _logger.LogInformation("Getting discrepancy alerts for last {Days} days", days);

            var result = await _mediator.Send(query);

            if (result.IsSuccess && result.Data != null)
            {
                return Ok(FMSResponse<List<DiscrepancyAlert>>.Success(result.Data.DiscrepancyAlerts,
                    $"Found {result.Data.DiscrepancyAlerts.Count} alerts"));
            }
            else
            {
                _logger.LogWarning("Failed to get discrepancy alerts: {Message}", result.Message);
                return BadRequest(FMSResponse<List<DiscrepancyAlert>>.Failed(result.Message));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting discrepancy alerts");
            return StatusCode(500, FMSResponse<List<DiscrepancyAlert>>.SystemError("Internal server error"));
        }
    }
}