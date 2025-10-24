using System;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Application.Features.FuelImport.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.Reporting
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class FuelImportController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<FuelImportController> _logger;

        public FuelImportController(IMediator mediator, ILogger<FuelImportController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get import calendar data for visualization
        /// </summary>
        /// <param name="startDate">Start date (YYYY-MM-DD)</param>
        /// <param name="endDate">End date (YYYY-MM-DD)</param>
        /// <param name="siteId">Optional site filter</param>
        /// <returns>Import calendar data</returns>
        [HttpGet("calendar")]
        public async Task<IActionResult> GetImportCalendar(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? siteId = null)
        {
            try
            {
                if (!DateTime.TryParse(startDate, out var start))
                {
                    return BadRequest(FMSResponse<object>.Failed("Invalid start date format. Use YYYY-MM-DD."));
                }

                if (!DateTime.TryParse(endDate, out var end))
                {
                    return BadRequest(FMSResponse<object>.Failed("Invalid end date format. Use YYYY-MM-DD."));
                }

                if (end < start)
                {
                    return BadRequest(FMSResponse<object>.Failed("End date must be after start date."));
                }

                // Limit to 3 months max to prevent performance issues
                if ((end - start).TotalDays > 90)
                {
                    return BadRequest(FMSResponse<object>.Failed("Date range cannot exceed 90 days."));
                }

                var query = new GetImportCalendarDataQuery
                {
                    StartDate = start,
                    EndDate = end,
                    SiteId = siteId
                };

                var result = await _mediator.Send(query);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching import calendar data");
                return StatusCode(500, FMSResponse<object>.Failed("An error occurred while fetching calendar data."));
            }
        }

        /// <summary>
        /// Get import summary statistics
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetImportSummary(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? siteId = null)
        {
            try
            {
                if (!DateTime.TryParse(startDate, out var start))
                {
                    return BadRequest(FMSResponse<object>.Failed("Invalid start date format."));
                }

                if (!DateTime.TryParse(endDate, out var end))
                {
                    return BadRequest(FMSResponse<object>.Failed("Invalid end date format."));
                }

                var query = new GetImportCalendarDataQuery
                {
                    StartDate = start,
                    EndDate = end,
                    SiteId = siteId
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return StatusCode(500, result);
                }

                // Generate summary
                var summary = new ImportSummaryDTO
                {
                    TotalImports = result.Data.Count(d => d.Status != "Missing"),
                    SuccessfulImports = result.Data.Count(d => d.Status == "Success"),
                    FailedImports = result.Data.Count(d => d.Status == "Failed"),
                    MissingSites = result.Data.Count(d => d.Status == "Missing"),
                    MissingSiteDetails = result.Data
                        .Where(d => d.Status == "Missing")
                        .Select(d => new MissingSiteDTO
                        {
                            Date = d.Date,
                            SiteId = d.SiteId,
                            SiteName = d.SiteName
                        })
                        .ToList()
                };

                return Ok(FMSResponse<ImportSummaryDTO>.Success(summary));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching import summary");
                return StatusCode(500, FMSResponse<object>.Failed("An error occurred while fetching summary data."));
            }
        }
    }
}
