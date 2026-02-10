/**
 * File: ReportGeneratorController.cs
 * Purpose: Manages JSReport template CRUD and report rendering (HTML/PDF/Excel).
 * Dependencies: MediatR, IJsReportService, FMSResponse
 * Last Modified: 2026-02-09
 *
 * Key Actions:
 * - PreviewHtml(): Renders template to HTML for in-app preview
 * - RenderPdf(): Renders template to PDF
 * - RenderExcel(): Renders template to Excel
 */
using FMS.Application.Common;
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
using System.Threading.Tasks;

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

        public ReportGeneratorController(
            IJsReportService reportService,
            IMediator mediator,
            ILogger<ReportGeneratorController> logger)
        {
            _reportService = reportService;
            _mediator = mediator;
            _logger = logger;
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

        #region Pump Transaction Report

        /// <summary>
        /// Generate Pump Transaction Report with filters - fetches data from database
        /// </summary>
        [HttpPost("pump-transactions")]
        public async Task<IActionResult> GeneratePumpTransactionReport([FromBody] PumpTransactionReportRequest request)
        {
            try
            {
                // Fetch pump transactions using existing query
                var query = new GetPumpTransactionQuery
                {
                    StartDate = request.DateFrom,
                    EndDate = request.DateTo,
                    SiteIds = request.SiteId.HasValue ? new List<int> { request.SiteId.Value } : null,
                    TankIds = request.TankId.HasValue ? new List<int> { request.TankId.Value } : null,
                    VehicleIds = request.VehicleId.HasValue ? new List<int> { request.VehicleId.Value } : null
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess || result.Data == null)
                {
                    return BadRequest(FMSResponse<string>.Failed("Failed to fetch pump transactions"));
                }

                var transactions = result.Data.ToList();

                // Build report data
                var reportData = new
                {
                    reportTitle = request.ReportTitle ?? "Pump Transaction Report",
                    generatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    generatedBy = User.Identity?.Name ?? "System",
                    dateFrom = request.DateFrom?.ToString("yyyy-MM-dd") ?? "All",
                    dateTo = request.DateTo?.ToString("yyyy-MM-dd") ?? "All",
                    reportId = $"RPT-{DateTime.Now:yyyyMMdd-HHmmss}",

                    filters = new
                    {
                        siteName = request.SiteName,
                        tankName = request.TankName,
                        vehicleName = request.VehicleName,
                        fuelGrade = request.FuelGradeName
                    },

                    summary = new
                    {
                        totalTransactions = transactions.Count,
                        totalVolume = transactions.Sum(t => t.Volume).ToString("N2"),
                        totalAmount = transactions.Sum(t => t.Amount).ToString("N2"),
                        uniqueVehicles = transactions.Where(t => t.VehicleId.HasValue)
                            .Select(t => t.VehicleId).Distinct().Count(),
                        avgVolumePerTransaction = transactions.Count > 0
                            ? (transactions.Sum(t => t.Volume) / transactions.Count).ToString("N2")
                            : "0.00",
                        currency = "$"
                    },

                    transactions = transactions.Select((t, index) => new
                    {
                        rowNumber = index + 1,
                        dateTime = t.DateTime.ToString("yyyy-MM-dd HH:mm"),
                        dateTimeStart = t.DateTimeStart.ToString("yyyy-MM-dd HH:mm"),
                        ptsName = t.PtsName ?? "-",
                        pump = t.Pump,
                        nozzle = t.Nozzle,
                        transaction = t.Transaction.ToString(),
                        vehicleName = t.VehicleName ?? "-",
                        vehicleNumberPlate = t.VehicleNumberPlate ?? "",
                        tankName = t.TankName ?? "-",
                        destinationTankName = t.DestinationTankName ?? "",
                        isTransferMode = t.IsTransferMode,
                        fuelGradeName = t.FuelGradeName ?? "-",
                        volume = t.Volume.ToString("N2"),
                        price = (t.Price ?? 0).ToString("N2"),
                        amount = t.Amount.ToString("N2"),
                        odometer = t.Odometer?.ToString("N0"),
                        employeeName = t.UserName ?? "-",
                        userName = t.UserName ?? "",
                        tag = t.Tag ?? ""
                    }).ToList(),

                    // Group by fuel grade for breakdown
                    fuelGradeBreakdown = transactions
                        .GroupBy(t => t.FuelGradeName ?? "Unknown")
                        .Select(g => new
                        {
                            fuelGradeName = g.Key,
                            transactionCount = g.Count(),
                            totalVolume = g.Sum(t => t.Volume).ToString("N2"),
                            totalAmount = g.Sum(t => t.Amount).ToString("N2"),
                            percentage = transactions.Sum(t => t.Volume) > 0
                                ? (g.Sum(t => t.Volume) / transactions.Sum(t => t.Volume) * 100).ToString("N1")
                                : "0"
                        }).ToList()
                };

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
        public int? SiteId { get; set; }
        public string? SiteName { get; set; }
        public int? TankId { get; set; }
        public string? TankName { get; set; }
        public int? VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public int? FuelGradeId { get; set; }
        public string? FuelGradeName { get; set; }
        public int? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? Format { get; set; } = "pdf"; // pdf, excel, html
    }

    #endregion
}
