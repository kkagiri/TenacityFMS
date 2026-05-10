/**
 * File: StockReportController.cs
 * Purpose: Generates and exports tank stock reports with filtering options.
 * Dependencies: MediatR stock report commands/queries, ILogger, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GenerateStockReport(): Generates stock reports for selected filters.
 * - ExportStockReport(): Exports generated reports in selected format.
 * - GetStockReports(): Retrieves generated stock report history.
 */
using System.ComponentModel.DataAnnotations;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankStock;
using FMS.Application.Features.TankManagement.TankStock.Commands;
using FMS.Application.Features.TankManagement.TankStock.Queries;
using MediatR;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers;

//Cursor - Stock Report Controller for comprehensive stock reporting
[Route("api/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[RequirePermission(Permissions.TankStock.Read)]
public class StockReportController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<StockReportController> _logger;

    public StockReportController(IMediator mediator, ILogger<StockReportController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub") ??
            string.Empty;

        return Guid.TryParse(userId, out _);
    }

    /// <summary>
    /// Generate a stock report based on specified criteria
    /// </summary>
    [HttpPost("generate")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GenerateStockReport([FromBody] StockReportRequestDTO reportRequest)
    {
        // var hasPermission = User.HasClaim ("permissions", "_Create_stockReport");
        // if (!hasPermission) return Forbid ();

        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (!TryGetCurrentUserId(out var userId)) return BadRequest(new FMSResponseMessage(false, "Invalid User ID"));

        try
        {
            //Cursor - Generate actual stock report using real data
            var command = new GenerateStockReportCommand
            {
                ReportType = reportRequest.ReportType,
                SiteId = reportRequest.SiteId,
                StartDate = reportRequest.StartDate,
                EndDate = reportRequest.EndDate,
                IncludeCharts = reportRequest.IncludeCharts,
                IncludeDetails = reportRequest.IncludeDetails,
                TankIds = reportRequest.TankIds,
                UserId = userId
            };

            var result = await _mediator.Send(command);

            if (result.IsSuccess)
            {
                _logger.LogInformation("Stock report generated successfully: {ReportId} for user {UserId}",
                    result.Data.Id, userId);

                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Failed to generate stock report for user {UserId}: {Message}",
                    userId, result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating stock report for user {UserId}", userId);
            return BadRequest(FMSResponse<StockReportResultDTO>.SystemError("Error generating stock report"));
        }
    }

    /// <summary>
    /// Export a generated stock report in specified format
    /// </summary>
    [HttpGet("export/{reportId}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> ExportStockReport(string reportId, [FromQuery] string format = "excel")
    {
        // var hasPermission = User.HasClaim ("permissions", "_Read_stockReport");
        // if (!hasPermission) return Forbid ();

        if (string.IsNullOrEmpty(reportId)) return BadRequest("Report ID is required");

        try
        {
            // For now, return a mock file. Replace with actual export service when implemented
            var fileName = $"stock-report-{reportId}.{(format.ToLower() == "csv" ? "csv" : "xlsx")}";
            var mockData = System.Text.Encoding.UTF8.GetBytes("Mock report data - replace with actual export");

            var contentType = format.ToLower() switch
            {
                "csv" => "text/csv",
                "pdf" => "application/pdf",
                _ => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };

            _logger.LogInformation("Exporting stock report {ReportId} in {Format} format", reportId, format);

            return File(mockData, contentType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting stock report {ReportId}", reportId);
            return BadRequest(FMSResponse.SystemError("Error exporting stock report"));
        }
    }

    /// <summary>
    /// Get list of available stock reports
    /// </summary>
    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetStockReports(
        [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string? reportType = null)
    {
        // var hasPermission = User.HasClaim ("permissions", "_Read_stockReport");
        // if (!hasPermission) return Forbid ();

        try
        {
            //Cursor - Get actual stock reports from database
            var query = new GetStockReportsQuery
            {
                StartDate = startDate,
                EndDate = endDate,
                ReportType = reportType
            };

            var result = await _mediator.Send(query);

            if (result.IsSuccess)
            {
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("Failed to retrieve stock reports: {Message}", result.Message);
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving stock reports");
            return BadRequest(FMSResponse<List<StockReportSummaryDTO>>.SystemError("Error retrieving stock reports"));
        }
    }
}

//Cursor - Stock Report DTOs
#region Stock Report DTOs

public class StockReportRequestDTO
{
    [Required]
    [StringLength(50)]
    public string ReportType { get; set; } = null!; // summary, variance, utilization, movements

    public int? SiteId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IncludeCharts { get; set; } = true;

    public bool IncludeDetails { get; set; } = true;

    public List<int>? TankIds { get; set; }
}

public class StockReportResultDTO
{
    public string Id { get; set; } = null!;
    public string ReportType { get; set; } = null!;
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; } = null!;
    public int TotalTanks { get; set; }
    public decimal TotalCapacity { get; set; }
    public decimal TotalCurrentStock { get; set; }
    public decimal AverageUtilization { get; set; }
    public string Status { get; set; } = null!;
    public List<object>? ReportData { get; set; }
}

public class StockReportSummaryDTO
{
    public string Id { get; set; } = null!;
    public string ReportType { get; set; } = null!;
    public DateTime GeneratedDate { get; set; }
    public string GeneratedBy { get; set; } = null!;
    public string Status { get; set; } = null!;
}

#endregion