/**
 * File: ReportGeneratorController.cs
 * Purpose: Manages JSReport template CRUD and report rendering (HTML/PDF/Excel).
 * Dependencies: MediatR, IJsReportService, FMSResponse
 * Last Modified: 2026-02-12
 *
 * Key Actions:
 * - PreviewHtml(): Renders template to HTML for in-app preview
 * - RenderPdf(): Renders template to PDF
 * - RenderExcel(): Renders template to Excel
 */
using FMS.Application.Common;
using FMS.Application.Features.IssueTracker.Queries;
using FMS.Application.Features.TankManagement.PumpTransaction;
using FMS.WebClient.Services.Reporting;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using FMS.Application.Features.Reporting.Services;
using FMS.Application.Features.Reporting.DTOs;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.Reporting
{
    /// <summary>
    /// Controller for generating PDF/Excel reports using JsReport engine
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Report.VehicleConsumption)]
    public class ReportGeneratorController : ControllerBase
    {
        private readonly IJsReportService _reportService;
        private readonly IMediator _mediator;
        private readonly ILogger<ReportGeneratorController> _logger;
        private readonly IReportJobManager _reportJobManager;

        public ReportGeneratorController(
            IJsReportService reportService,
            IMediator mediator,
            ILogger<ReportGeneratorController> logger,
            IReportJobManager reportJobManager)
        {
            _reportService = reportService;
            _mediator = mediator;
            _logger = logger;
            _reportJobManager = reportJobManager;
        }

        #region Template Management

        /// <summary>
        /// Get list of available report templates
        /// </summary>
        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            var templates = await _reportService.GetTemplateListAsync();
            return Ok(FMSResponse<IEnumerable<string>>.Success(templates));
        }

        /// <summary>
        /// Get a specific template content
        /// </summary>
        [HttpGet("templates/{name}")]
        public async Task<IActionResult> GetTemplate(string name)
        {
            var content = await _reportService.GetTemplateAsync(name);
            if (content == null)
            {
                return NotFound(FMSResponse<string>.Failed($"Template '{name}' not found"));
            }
            return Ok(FMSResponse<object>.Success(new { name, content }));
        }

        /// <summary>
        /// Save or update a template
        /// </summary>
        [HttpPost("templates")]
        public async Task<IActionResult> SaveTemplate([FromBody] SaveTemplateRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.Content))
            {
                return BadRequest(FMSResponse<string>.Failed("Name and content are required"));
            }

            await _reportService.SaveTemplateAsync(request.Name, request.Content);
            return Ok(FMSResponse<string>.Success($"Template '{request.Name}' saved successfully"));
        }

        /// <summary>
        /// Delete a template
        /// </summary>
        [HttpDelete("templates/{name}")]
        public async Task<IActionResult> DeleteTemplate(string name)
        {
            var deleted = await _reportService.DeleteTemplateAsync(name);
            if (!deleted)
            {
                return NotFound(FMSResponse<string>.Failed($"Template '{name}' not found"));
            }
            return Ok(FMSResponse<string>.Success($"Template '{name}' deleted"));
        }

        #endregion

        #region Report Rendering

        /// <summary>
        /// Render a template to PDF with custom data
        /// </summary>
        [HttpPost("render/pdf/{templateName}")]
        public async Task<IActionResult> RenderPdf(string templateName, [FromBody] object data)
        {
            try
            {
                var normalizedData = NormalizeRenderData(data);
                var pdfBytes = await _reportService.RenderPdfAsync(templateName, normalizedData);
                return File(pdfBytes, "application/pdf", $"{templateName}.pdf");
            }
            catch (FileNotFoundException)
            {
                return NotFound(FMSResponse<string>.Failed($"Template '{templateName}' not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering PDF for template {Template}", templateName);
                return StatusCode(500, FMSResponse<string>.Failed($"Error rendering report: {ex.Message}"));
            }
        }

        /// <summary>
        /// Render a template to Excel with custom data
        /// </summary>
        [HttpPost("render/excel/{templateName}")]
        public async Task<IActionResult> RenderExcel(string templateName, [FromBody] object data)
        {
            try
            {
                var normalizedData = NormalizeRenderData(data);
                var excelBytes = await _reportService.RenderExcelAsync(templateName, normalizedData);
                return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"{templateName}.xlsx");
            }
            catch (FileNotFoundException)
            {
                return NotFound(FMSResponse<string>.Failed($"Template '{templateName}' not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering Excel for template {Template}", templateName);
                return StatusCode(500, FMSResponse<string>.Failed($"Error rendering report: {ex.Message}"));
            }
        }

        /// <summary>
        /// Preview a template as HTML
        /// </summary>
        [HttpPost("preview/{templateName}")]
        public async Task<IActionResult> PreviewHtml(string templateName, [FromBody] object data)
        {
            try
            {
                var normalizedData = NormalizeRenderData(data);
                var html = await _reportService.RenderHtmlAsync(templateName, normalizedData);
                return Content(html, "text/html");
            }
            catch (FileNotFoundException)
            {
                return NotFound(FMSResponse<string>.Failed($"Template '{templateName}' not found"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering HTML preview for template {Template}", templateName);
                return StatusCode(500, FMSResponse<string>.Failed($"Error rendering preview: {ex.Message}"));
            }
        }

        /// <summary>
        /// Render inline HTML template to PDF
        /// </summary>
        [HttpPost("render/inline")]
        public async Task<IActionResult> RenderInlinePdf([FromBody] InlineRenderRequest request)
        {
            try
            {
                var normalizedData = NormalizeRenderData(request.Data);
                var pdfBytes = await _reportService.RenderInlinePdfAsync(request.Template, normalizedData);
                return File(pdfBytes, "application/pdf", "report.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rendering inline PDF");
                return StatusCode(500, FMSResponse<string>.Failed($"Error rendering report: {ex.Message}"));
            }
        }

        #endregion

        #region Async Report Generation

        /// <summary>
        /// Submit an async report generation job. Returns immediately with a Job ID.
        /// Progress is broadcast via SignalR (ReportJobStarted, ReportJobProgress, ReportJobCompleted, ReportJobError).
        /// </summary>
        [HttpPost("generate-async")]
        public async Task<IActionResult> GenerateAsync([FromBody] SubmitReportJobDTO request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.SourceId))
                {
                    return BadRequest(FMSResponse<string>.Failed("SourceId is required"));
                }
                if (string.IsNullOrWhiteSpace(request.TemplateName))
                {
                    return BadRequest(FMSResponse<string>.Failed("TemplateName is required"));
                }

                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value ?? "unknown";
                var userName = User.FindFirst("name")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                    ?? User.Identity?.Name ?? "Unknown";
                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "";

                var job = await _reportJobManager.SubmitJobAsync(request, userId, userName, userEmail);
                return Ok(FMSResponse<ReportJobDTO>.Success(job, "Report job submitted. Track progress via SignalR."));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(FMSResponse<string>.Failed(ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting async report job");
                return StatusCode(500, FMSResponse<string>.Failed($"Error submitting report job: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get the status of an async report job
        /// </summary>
        [HttpGet("jobs/{jobId}")]
        public IActionResult GetJobStatus(string jobId)
        {
            var job = _reportJobManager.GetJobStatus(jobId);
            if (job == null)
            {
                return NotFound(FMSResponse<string>.Failed($"Job '{jobId}' not found"));
            }
            return Ok(FMSResponse<ReportJobDTO>.Success(job));
        }

        /// <summary>
        /// Download the result of a completed async report job
        /// </summary>
        [HttpGet("jobs/{jobId}/download")]
        public IActionResult DownloadJobResult(string jobId)
        {
            var job = _reportJobManager.GetJobStatus(jobId);
            if (job == null)
            {
                return NotFound(FMSResponse<string>.Failed($"Job '{jobId}' not found"));
            }
            if (job.Status != ReportJobStatus.Completed && job.Status != ReportJobStatus.EmailSent)
            {
                return BadRequest(FMSResponse<string>.Failed($"Job is not completed yet. Status: {job.Status}"));
            }

            var fileBytes = _reportJobManager.GetJobResult(jobId);
            if (fileBytes == null)
            {
                return Gone(FMSResponse<string>.Failed("Report result has expired. Please regenerate."));
            }

            var ext = job.OutputFormat?.ToLower() switch { "excel" => "xlsx", _ => "pdf" };
            var contentType = ext switch
            {
                "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                _ => "application/pdf"
            };
            var fileName = $"{SanitizeFileName(job.ReportTitle)}_{job.CreatedAtUtc:yyyyMMdd}.{ext}";

            return File(fileBytes, contentType, fileName);
        }

        /// <summary>
        /// Cancel a running async report job
        /// </summary>
        [HttpPost("jobs/{jobId}/cancel")]
        public IActionResult CancelJob(string jobId)
        {
            var cancelled = _reportJobManager.CancelJob(jobId);
            if (!cancelled)
            {
                return NotFound(FMSResponse<string>.Failed($"Job '{jobId}' not found or already completed"));
            }
            return Ok(FMSResponse<string>.Success("Job cancelled"));
        }

        /// <summary>
        /// Enable email delivery on a running or completed report job
        /// </summary>
        [HttpPost("jobs/{jobId}/email")]
        public IActionResult RequestEmailDelivery(string jobId)
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value ?? string.Empty;

            var result = _reportJobManager.SetEmailDelivery(jobId, userEmail);
            if (!result)
            {
                return NotFound(FMSResponse<string>.Failed($"Job '{jobId}' not found or cannot enable email"));
            }
            return Ok(FMSResponse<string>.Success("Email delivery enabled. You will receive the report when ready."));
        }

        /// <summary>
        /// Get active report jobs for the current user
        /// </summary>
        [HttpGet("jobs")]
        public IActionResult GetActiveJobs()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value ?? "unknown";
            var jobs = _reportJobManager.GetActiveJobs(userId);
            return Ok(FMSResponse<IEnumerable<ReportJobDTO>>.Success(jobs));
        }

        private IActionResult Gone(FMSResponse<string> response)
        {
            return StatusCode(410, response);
        }

        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Report";
            var invalid = System.IO.Path.GetInvalidFileNameChars();
            return string.Join("_", name.Split(invalid, StringSplitOptions.RemoveEmptyEntries)).Trim();
        }

        #endregion

        private object NormalizeRenderData(object? data)
        {
            if (data == null)
            {
                return new { };
            }

            if (data is JsonElement jsonElement)
            {
                var rawJson = jsonElement.GetRawText();
                if (string.IsNullOrWhiteSpace(rawJson))
                {
                    return new { };
                }

                return JsonConvert.DeserializeObject<object>(rawJson) ?? new { };
            }

            return data;
        }

        private static List<int>? NormalizeIdFilter(JsonElement? value)
        {
            if (!value.HasValue)
            {
                return null;
            }

            if (value.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            {
                return null;
            }

            var ids = new List<int>();

            if (value.Value.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in value.Value.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var numericId))
                    {
                        ids.Add(numericId);
                        continue;
                    }

                    if (item.ValueKind == JsonValueKind.String &&
                        int.TryParse(item.GetString(), out var parsedId))
                    {
                        ids.Add(parsedId);
                    }
                }
            }
            else if (value.Value.ValueKind == JsonValueKind.Number &&
                     value.Value.TryGetInt32(out var singleNumericId))
            {
                ids.Add(singleNumericId);
            }
            else if (value.Value.ValueKind == JsonValueKind.String &&
                     int.TryParse(value.Value.GetString(), out var singleParsedId))
            {
                ids.Add(singleParsedId);
            }

            return ids.Count == 0 ? null : ids.Distinct().ToList();
        }

        private static string? BuildFilterLabel(string? explicitName, List<int>? ids, string fallbackPrefix)
        {
            if (!string.IsNullOrWhiteSpace(explicitName))
            {
                return explicitName;
            }

            if (ids == null || ids.Count == 0)
            {
                return null;
            }

            return string.Join(", ", ids.Select(id => $"{fallbackPrefix} #{id}"));
        }

        #region Issue Tracker Report

        /// <summary>
        /// Get Issue Tracker report data with filters and pagination.
        /// </summary>
        [HttpGet("issue-tracker/data")]
        public async Task<IActionResult> GetIssueTrackerReportData(
            [FromQuery] IssueTrackerReportRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var query = new GetIssueTrackerReportQuery
                {
                    DateFrom = request.DateFrom,
                    DateTo = request.DateTo,
                    SiteIds = request.SiteId,
                    VehicleIds = request.VehicleId,
                    IssueTemplateIds = request.IssueTemplateId,
                    StatusIds = request.Status,
                    CategoryIds = request.CategoryIds,
                    PageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber,
                    PageSize = request.PageSize <= 0 ? 200 : request.PageSize
                };

                var result = await _mediator.Send(query, cancellationToken);
                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Issue Tracker report data");
                return StatusCode(500, FMSResponse<string>.Failed($"Error fetching Issue Tracker report data: {ex.Message}"));
            }
        }

        #endregion

        #region Pump Transaction Report

        /// <summary>
        /// Generate Pump Transaction Report with filters - fetches data from database
        /// </summary>
        [HttpPost("pump-transactions")]
        public async Task<IActionResult> GeneratePumpTransactionReport([FromBody] PumpTransactionReportRequest request)
        {
            try
            {
                var siteIds = NormalizeIdFilter(request.SiteId);
                var tankIds = NormalizeIdFilter(request.TankId);
                var vehicleIds = NormalizeIdFilter(request.VehicleId);
                var fuelGradeIds = NormalizeIdFilter(request.FuelGradeId);
                var employeeIds = NormalizeIdFilter(request.EmployeeId);

                var startDate = request.DateFrom?.Date;
                var endDate = request.DateTo?.Date.AddDays(1).AddTicks(-1);

                // Fetch pump transactions using existing query
                var query = new GetPumpTransactionQuery
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    SiteIds = siteIds,
                    TankIds = tankIds,
                    VehicleIds = vehicleIds
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess || result.Data == null)
                {
                    return BadRequest(FMSResponse<string>.Failed("Failed to fetch pump transactions"));
                }

                var transactions = result.Data.ToList();

                if (fuelGradeIds is { Count: > 0 })
                {
                    transactions = transactions
                        .Where(t => t.FuelGradeId.HasValue && fuelGradeIds.Contains(t.FuelGradeId.Value))
                        .ToList();
                }

                if (employeeIds is { Count: > 0 })
                {
                    transactions = transactions
                        .Where(t => t.EmployeeId.HasValue && employeeIds.Contains(t.EmployeeId.Value))
                        .ToList();
                }

                var reportData = PumpTransactionReportDataBuilder.Build(
                    transactions,
                    request.ReportTitle,
                    request.DateFrom?.Date,
                    request.DateTo?.Date,
                    User.Identity?.Name ?? "System",
                    BuildFilterLabel(request.SiteName, siteIds, "Site"),
                    BuildFilterLabel(request.TankName, tankIds, "Tank"),
                    BuildFilterLabel(request.VehicleName, vehicleIds, "Vehicle"),
                    BuildFilterLabel(request.FuelGradeName, fuelGradeIds, "Fuel Grade"));

                // Render based on requested format
                if (request.Format?.ToLower() == "excel")
                {
                    var excelBytes = await _reportService.RenderExcelAsync("pump-transaction-report", reportData);
                    return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        $"PumpTransactions_{DateTime.Now:yyyyMMdd}.xlsx");
                }
                else if (request.Format?.ToLower() == "html")
                {
                    var html = await _reportService.RenderHtmlAsync("pump-transaction-report", reportData);
                    return Content(html, "text/html");
                }
                else // Default to PDF
                {
                    var pdfBytes = await _reportService.RenderPdfAsync("pump-transaction-report", reportData);
                    return File(pdfBytes, "application/pdf", $"PumpTransactions_{DateTime.Now:yyyyMMdd}.pdf");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating pump transaction report");
                return StatusCode(500, FMSResponse<string>.Failed($"Error generating report: {ex.Message}"));
            }
        }

        #endregion
    }

    #region Request DTOs

    public class SaveTemplateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class InlineRenderRequest
    {
        public string Template { get; set; } = string.Empty;
        public object Data { get; set; } = new { };
    }

    public class PumpTransactionReportRequest
    {
        public string? ReportTitle { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public JsonElement? SiteId { get; set; }
        public string? SiteName { get; set; }
        public JsonElement? TankId { get; set; }
        public string? TankName { get; set; }
        public JsonElement? VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public JsonElement? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }
        public JsonElement? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? Format { get; set; } = "pdf"; // pdf, excel, html
    }

    public class IssueTrackerReportRequest
    {
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public List<int>? SiteId { get; set; }
        public List<int>? VehicleId { get; set; }
        public List<int>? IssueTemplateId { get; set; }
        public List<int>? Status { get; set; }
        public List<int>? CategoryIds { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 200;
    }

    #endregion
}
