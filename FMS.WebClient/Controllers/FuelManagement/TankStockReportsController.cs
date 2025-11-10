using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.TankManagement.TankVolumeHistory.DTOs;
using FMS.Application.Features.TankManagement.TankVolumeHistory.Queries;
using FMS.Domain.Entities.enums;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TankStockReportsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<TankStockReportsController> _logger;

        public TankStockReportsController(IMediator mediator, ILogger<TankStockReportsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get tank volume history grouped by month
        /// </summary>
        [HttpGet("volume-history-summary/by-month")]
        public async Task<IActionResult> GetVolumeHistoryByMonth(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int[]? siteIds = null, [FromQuery] int[]? tankIds = null, [FromQuery] bool includeCumulative = false)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (startDate == default || endDate == default)
                    return BadRequest("Start date and end date are required");

                if (startDate > endDate)
                    return BadRequest("Start date cannot be greater than end date");

                var query = new GetTankVolumeHistoryByMonthQuery(startDate, endDate)
                {
                    SiteIds = siteIds?.ToList(),
                    TankIds = tankIds?.ToList(),
                    IncludeCumulative = includeCumulative
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting volume history by month");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get tank volume history grouped by quarter
        /// </summary>
        [HttpGet("volume-history-summary/by-quarter")]
        public async Task<IActionResult> GetVolumeHistoryByQuarter(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int[]? siteIds = null, [FromQuery] int[]? tankIds = null, [FromQuery] bool includeCumulative = false)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (startDate == default || endDate == default)
                    return BadRequest("Start date and end date are required");

                if (startDate > endDate)
                    return BadRequest("Start date cannot be greater than end date");

                var query = new GetTankVolumeHistoryByQuarterQuery(startDate, endDate)
                {
                    SiteIds = siteIds?.ToList(),
                    TankIds = tankIds?.ToList(),
                    IncludeCumulative = includeCumulative
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting volume history by quarter");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get tank volume history grouped by week
        /// </summary>
        [HttpGet("volume-history-summary/by-week")]
        public async Task<IActionResult> GetVolumeHistoryByWeek(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int[]? siteIds = null, [FromQuery] int[]? tankIds = null, [FromQuery] bool includeCumulative = false)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (startDate == default || endDate == default)
                    return BadRequest("Start date and end date are required");

                if (startDate > endDate)
                    return BadRequest("Start date cannot be greater than end date");

                var query = new GetTankVolumeHistoryByWeekQuery(startDate, endDate)
                {
                    SiteIds = siteIds?.ToList(),
                    TankIds = tankIds?.ToList(),
                    IncludeCumulative = includeCumulative
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting volume history by week");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get tank volume history for custom date ranges
        /// </summary>
        [HttpGet("volume-history-summary/custom")]
        public async Task<IActionResult> GetVolumeHistoryCustom(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string groupByPeriod = "Day", [FromQuery] int[]? siteIds = null, [FromQuery] int[]? tankIds = null, [FromQuery] bool includeCumulative = false)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (startDate == default || endDate == default)
                    return BadRequest("Start date and end date are required");

                if (startDate > endDate)
                    return BadRequest("Start date cannot be greater than end date");

                var query = new GetTankVolumeHistoryCustomDateQuery(startDate, endDate, groupByPeriod)
                {
                    SiteIds = siteIds?.ToList(),
                    TankIds = tankIds?.ToList(),
                    IncludeCumulative = includeCumulative
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting volume history custom");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get pivot data for DevExtreme PivotGrid
        /// </summary>
        [HttpGet("pivot-data")]
        public async Task<IActionResult> GetPivotData(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string groupByPeriod = "month",
            [FromQuery] int[]? siteIds = null,
            [FromQuery] int[]? tankIds = null,
            [FromQuery] bool useManualDispensing = false)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (startDate == default || endDate == default)
                    return BadRequest("Start date and end date are required");

                if (startDate > endDate)
                    return BadRequest("Start date cannot be greater than end date");

                var validGroupByOptions = new[] { "month", "quarter", "week", "day" };
                if (!validGroupByOptions.Contains(groupByPeriod))
                    return BadRequest("Invalid groupByPeriod. Allowed values: month, quarter, week, day");

                var query = new GetPivotDataQuery(startDate, endDate, groupByPeriod)
                {
                    SiteIds = siteIds?.ToList(),
                    TankIds = tankIds?.ToList(),
                    UseManualDispensing = useManualDispensing
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pivot data");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get all available volume change reasons for filtering
        /// </summary>
        [HttpGet("volume-change-reasons")]
        public IActionResult GetVolumeChangeReasons()
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                var reasons = Enum.GetValues(typeof(VolumeChangeReasonEnum))
                    .Cast<VolumeChangeReasonEnum>()
                    .Select(r => new
                    {
                        Value = (int)r,
                        Name = r.ToString()
                    })
                    .ToList();

                return Ok(reasons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting volume change reasons");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Export report data to PDF/Excel
        /// </summary>
        [HttpPost("export")]
        public async Task<IActionResult> ExportReport([FromBody] ExportRequestDTO request)
        {
            var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
            if (!hasPermission)
                return Forbid();

            try
            {
                if (request == null)
                    return BadRequest("Export request is required");

                if (request.StartDate == default || request.EndDate == default)
                    return BadRequest("Start date and end date are required");

                // For now, return pivot data as export - you can implement actual export later
                var query = new GetPivotDataQuery(request.StartDate, request.EndDate, request.ReportType)
                {
                    SiteIds = request.SiteIds,
                    TankIds = request.TankIds
                };

                var result = await _mediator.Send(query);

                if (result == null || result.Data == null || !result.Data.Any())
                    return NotFound("No data available for export");

                // Simple CSV export for now
                var csv = "Site,Tank,Period,ChangeReason,Volume,TransactionCount\n";
                foreach (var item in result.Data)
                {
                    csv += $"{item.SiteName},{item.TankName},{item.TimePeriod},{item.ChangeReasonDisplay},{item.TotalVolume},{item.TransactionCount}\n";
                }

                var contentType = request.Format.ToLower() == "pdf" ?
                    "application/pdf" :
                    "text/csv";

                var fileName = $"TankVolumeReport_{DateTime.Now:yyyyMMdd_HHmmss}.{(request.Format.ToLower() == "pdf" ? "pdf" : "csv")}";

                return File(System.Text.Encoding.UTF8.GetBytes(csv), contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting report");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}