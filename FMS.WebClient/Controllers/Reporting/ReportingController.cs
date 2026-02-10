/**
 * File: ReportingController.cs
 * Purpose: Manages report generation and user template operations for reporting.
 * Dependencies: MediatR reporting commands/queries, ILogger, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GenerateReport(): Generates filtered reports and optional exports.
 * - GetReportTemplates(): Retrieves templates for current user scope.
 * - SaveReportTemplate(): Saves user-owned report templates.
 */
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using FMS.Application.Features.Reporting.Commands;
using FMS.Application.Features.Reporting.DTOs;
using FMS.Application.Features.Reporting.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    /// <summary>
    /// Controller for managing DevExtreme reports
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Report.VehicleConsumption)]
    public class ReportingController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<ReportingController> _logger;

        public ReportingController(IMediator mediator, ILogger<ReportingController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        /// <summary>
        /// Get all available report definitions
        /// </summary>
        [HttpGet("definitions")]
        public async Task<IActionResult> GetReportDefinitions([FromQuery] string? category = null)
        {
            try
            {
                var query = new GetAllReportDefinitionsQuery
                {
                    Category = category,
                    ActiveOnly = true
                };

                var reports = await _mediator.Send(query);
                return Ok(reports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report definitions");
                return StatusCode(500, "Error retrieving report definitions");
            }
        }

        /// <summary>
        /// Get a specific report definition by ID
        /// </summary>
        [HttpGet("definitions/{reportId}")]
        public async Task<IActionResult> GetReportDefinition(string reportId)
        {
            try
            {
                var query = new GetReportDefinitionQuery(reportId);
                var report = await _mediator.Send(query);

                if (report == null)
                    return NotFound($"Report definition not found: {reportId}");

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report definition {ReportId}", reportId);
                return StatusCode(500, "Error retrieving report definition");
            }
        }

        /// <summary>
        /// Generate a report with specified filters
        /// </summary>
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateReport([FromBody] GenerateReportRequestDTO request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.ReportId))
                    return BadRequest("ReportId is required");

                // Get user ID from claims
                string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                var command = new GenerateReportCommand
                {
                    ReportId = request.ReportId,
                    Filters = request.Filters,
                    ExportFormat = request.ExportFormat,
                    IncludeCharts = request.IncludeCharts,
                    UserId = userId
                };

                var result = await _mediator.Send(command);

                if (!result.Success)
                    return BadRequest(result.Message);

                // Return file if export format is specified
                if (!string.IsNullOrEmpty(request.ExportFormat) &&
                    request.ExportFormat.ToLower() != "json" &&
                    result.FileContent != null)
                {
                    return File(result.FileContent, result.ContentType ?? "application/octet-stream", result.FileName);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating report");
                return StatusCode(500, $"Error generating report: {ex.Message}");
            }
        }

        /// <summary>
        /// Get report templates for current user
        /// </summary>
        [HttpGet("templates")]
        public async Task<IActionResult> GetReportTemplates(
            [FromQuery] string? reportId = null,
            [FromQuery] bool includeShared = true)
        {
            try
            {
                string? userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;

                var query = new GetReportTemplatesQuery
                {
                    UserId = userId,
                    ReportId = reportId,
                    IncludeShared = includeShared
                };

                var templates = await _mediator.Send(query);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report templates");
                return StatusCode(500, "Error retrieving report templates");
            }
        }

        /// <summary>
        /// Save a report template
        /// </summary>
        [HttpPost("templates")]
        public async Task<IActionResult> SaveReportTemplate([FromBody] SaveReportTemplateDTO template)
        {
            try
            {
                if (string.IsNullOrEmpty(template.TemplateName))
                    return BadRequest("Template name is required");

                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new SaveReportTemplateCommand
                {
                    Template = template,
                    UserId = userId
                };

                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving report template");
                return StatusCode(500, "Error saving report template");
            }
        }

        /// <summary>
        /// Delete a report template
        /// </summary>
        [HttpDelete("templates/{templateId}")]
        public async Task<IActionResult> DeleteReportTemplate(string templateId)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new DeleteReportTemplateCommand
                {
                    TemplateId = templateId,
                    UserId = userId
                };

                var result = await _mediator.Send(command);

                if (!result)
                    return NotFound("Template not found or you don't have permission to delete it");

                return Ok(new { success = true, message = "Template deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report template");
                return StatusCode(500, "Error deleting report template");
            }
        }

        /// <summary>
        /// Get available report categories
        /// </summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetReportCategories()
        {
            try
            {
                var query = new GetAllReportDefinitionsQuery { ActiveOnly = true };
                var reports = await _mediator.Send(query);

                var categories = reports
                    .Select(r => r.Category)
                    .Distinct()
                    .OrderBy(c => c)
                    .Select(c => new { name = c, icon = "fa-light fa-folder" })
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report categories");
                return StatusCode(500, "Error retrieving report categories");
            }
        }

        // ========== Execution History Endpoints ==========

        /// <summary>
        /// Get report execution history with optional date-range filter
        /// </summary>
        [HttpGet("execution-history")]
        public async Task<IActionResult> GetExecutionHistory(
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo = null)
        {
            try
            {
                var query = new GetExecutionHistoryQuery
                {
                    DateFrom = dateFrom,
                    DateTo = dateTo
                };

                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting execution history");
                return StatusCode(500, "Error retrieving execution history");
            }
        }

        /// <summary>
        /// Log a report execution event
        /// </summary>
        [HttpPost("execution-log")]
        public async Task<IActionResult> LogExecution([FromBody] LogReportExecutionCommand command)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                command.ExecutedBy = userId;
                command.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                command.UserAgent = Request.Headers["User-Agent"].ToString();

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging report execution");
                return StatusCode(500, "Error logging report execution");
            }
        }

        // ========== Schedule Endpoints ==========

        /// <summary>
        /// Get all report schedules with optional status filter
        /// </summary>
        [HttpGet("schedules")]
        public async Task<IActionResult> GetSchedules([FromQuery] string? status = null)
        {
            try
            {
                var query = new GetReportSchedulesQuery { Status = status };
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report schedules");
                return StatusCode(500, "Error retrieving report schedules");
            }
        }

        /// <summary>
        /// Create a new report schedule
        /// </summary>
        [HttpPost("schedules")]
        public async Task<IActionResult> CreateSchedule([FromBody] CreateReportScheduleDTO schedule)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new CreateReportScheduleCommand
                {
                    Schedule = schedule,
                    UserId = userId
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report schedule");
                return StatusCode(500, "Error creating report schedule");
            }
        }

        /// <summary>
        /// Cancel (soft-delete) a report schedule
        /// </summary>
        [HttpDelete("schedules/{id}")]
        public async Task<IActionResult> CancelSchedule(long id)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new CancelReportScheduleCommand
                {
                    ReportScheduleId = id,
                    UserId = userId
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling report schedule {ScheduleId}", id);
                return StatusCode(500, "Error cancelling report schedule");
            }
        }
    }
}
