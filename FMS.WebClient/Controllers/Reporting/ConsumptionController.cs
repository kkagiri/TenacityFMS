/**
 * File: ConsumptionController.cs
 * Purpose: Handles fuel consumption retrieval and fuel import processing workflows.
 * Dependencies: MediatR, AutoMapper, SignalR, configuration/logging services, JWT claims.
 * Last Modified: 2026-03-11
 *
 * Key Actions:
 * - GetManualConsumptionFiltered(): Returns filtered manual refill consumption data.
 * - ImportFuelReport(): Imports and validates fuel consumption report records.
 * - ImportFuelReportAsync(): Starts asynchronous fuel report import jobs.
 */
using System.Globalization;
using FMS.Application.Queries;
using FMS.Application.Queries.GPSGATEServer.GetconsumptionReport;
using FMS.Domain.Entities.Auth;
using MediatR;
using Microsoft.AspNetCore.Mvc;
//using FMS.Application.Queries.GPSGATEServer.LoginQuery;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.ConsumptionCmd;
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Update;
using FMS.Application.Queries.Database.FMSQuery.Consumption;
using FMS.WebClient.Models.DatabaseViewModel;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Collections.Generic;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Communication.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
//using FMS.Application.Queries.Database.Consumption;
using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{

    // Custom simplified validation error class
    public class ValidationIssue
    {
        public int? RowIndex { get; set; }
        public string Field { get; set; }
        public string Message { get; set; }
    }

    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Report.VehicleConsumption)]
    public class ConsumptionController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<ConsumptionController> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // Static dictionary to track cancellation tokens for fuel import jobs
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, CancellationTokenSource> _activeImportJobs
            = new System.Collections.Concurrent.ConcurrentDictionary<string, CancellationTokenSource>();

        public ConsumptionController(
            IMediator mediator,
            IConfiguration configuration,
            IMapper mapper,
            ILogger<ConsumptionController> logger,
            IHubContext<FrontEndHub> hubContext,
            IServiceScopeFactory serviceScopeFactory)
        {
            _mapper = mapper;
            _mediator = mediator;
            _configuration = configuration;
            _logger = logger;
            _hubContext = hubContext;
            _serviceScopeFactory = serviceScopeFactory;
        }

        private bool TryGetCurrentGuidUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        [HttpGet("manualRefills")]
        public async Task<IActionResult> GetManualConsumption([FromQuery] string startDate, string endDate)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            var query = new GetVehicleConsumptionManualRefillQuery(_startDate, _endDate);

            var results = await _mediator.Send(query);

            return Ok(results);
        }

        [HttpGet("manualRefillsFiltered")]
        public async Task<IActionResult> GetManualConsumptionFiltered(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] string? vehicleType = null,
            [FromQuery] int? vehicleTypeId = null,
            [FromQuery] List<int>? vehicleTypeIds = null,
            [FromQuery] string? vehicleCode = null,
            [FromQuery] int? vehicleId = null,
            [FromQuery] int? siteId = null,
            [FromQuery] List<int>? siteIds = null,
            [FromQuery] int? driverId = null,
            [FromQuery] bool? averageKmL = null)
        {

            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            try
            {
                var normalizedSiteIds = (siteIds ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                if (siteId.HasValue && siteId.Value > 0 && !normalizedSiteIds.Contains(siteId.Value))
                {
                    normalizedSiteIds.Add(siteId.Value);
                }

                // Use the new filtered query handler for better performance
                var query = new GetVehicleConsumptionManualRefillQueryFiltered(
                    _startDate,
                    _endDate,
                    vehicleType,
                    vehicleTypeId,
                    vehicleTypeIds,
                    vehicleCode,
                    vehicleId,
                    siteId,
                    normalizedSiteIds,
                    driverId,
                    averageKmL
                );

                var results = await _mediator.Send(query);

                _logger.LogInformation(
                    "Filtered consumption data retrieved successfully. " +
                    "Date range: {StartDate} to {EndDate}, Results: {Count}",
                    _startDate, _endDate, results?.Count ?? 0);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered consumption data");
                return StatusCode(500, new { message = "Error retrieving filtered consumption data", details = ex.Message });
            }
        }

        [HttpGet("gpsFiltered")]
        public async Task<IActionResult> GetGpsConsumptionFiltered(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? vehicleTypeId = null,
            [FromQuery] int? vehicleId = null,
            [FromQuery] int? siteId = null,
            [FromQuery] List<int>? siteIds = null,
            [FromQuery] bool? averageKmL = null)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            try
            {
                var normalizedSiteIds = (siteIds ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                if (siteId.HasValue && siteId.Value > 0 && !normalizedSiteIds.Contains(siteId.Value))
                {
                    normalizedSiteIds.Add(siteId.Value);
                }

                var query = new GetVehicleConsumptionGpsQueryFiltered(
                    _startDate,
                    _endDate,
                    vehicleTypeId,
                    vehicleId,
                    siteId,
                    normalizedSiteIds,
                    averageKmL
                );

                var results = await _mediator.Send(query);

                _logger.LogInformation(
                    "GPS consumption data retrieved successfully. " +
                    "Date range: {StartDate} to {EndDate}, Results: {Count}",
                    _startDate, _endDate, results?.Count ?? 0);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GPS consumption data");
                return StatusCode(500, new { message = "Error retrieving GPS consumption data", details = ex.Message });
            }
        }

        [HttpGet("gpsAnalytics")]
        public async Task<IActionResult> GetGpsConsumptionAnalytics(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? vehicleTypeId = null,
            [FromQuery] int? vehicleId = null,
            [FromQuery] int? siteId = null,
            [FromQuery] List<int>? siteIds = null)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            try
            {
                var normalizedSiteIds = (siteIds ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                if (siteId.HasValue && siteId.Value > 0 && !normalizedSiteIds.Contains(siteId.Value))
                {
                    normalizedSiteIds.Add(siteId.Value);
                }

                var query = new GetGpsConsumptionAnalyticsQuery(
                    _startDate,
                    _endDate,
                    vehicleTypeId,
                    vehicleId,
                    siteId,
                    normalizedSiteIds
                );

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving GPS consumption analytics");
                return StatusCode(500, new { message = "Error retrieving GPS consumption analytics", details = ex.Message });
            }
        }

        [HttpGet("records")]
        public async Task<IActionResult> GetConsumptionModuleRecords(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? vehicleTypeId = null,
            [FromQuery] int? vehicleId = null,
            [FromQuery] int? siteId = null,
            [FromQuery] List<int>? siteIds = null,
            [FromQuery] bool? averageKmL = null)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            try
            {
                var normalizedSiteIds = (siteIds ?? new List<int>())
                    .Where(id => id > 0)
                    .Distinct()
                    .ToList();

                if (siteId.HasValue && siteId.Value > 0 && !normalizedSiteIds.Contains(siteId.Value))
                {
                    normalizedSiteIds.Add(siteId.Value);
                }

                var query = new GetVehicleConsumptionModuleGridQuery(
                    _startDate,
                    _endDate,
                    vehicleTypeId,
                    vehicleId,
                    siteId,
                    normalizedSiteIds,
                    averageKmL);

                var results = await _mediator.Send(query);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle consumption module records");
                return StatusCode(500, new { message = "Error retrieving vehicle consumption module records", details = ex.Message });
            }
        }

        [HttpGet("manualRefillsbySiteId")]
        public async Task<IActionResult> GetManualConsumptionBySiteId([FromQuery] string startDate, string endDate, int SiteId)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (SiteId <= 0) return BadRequest("Invalid Site ID");

            if (_startDate == default(DateTime) || _endDate == default(DateTime)) return BadRequest("Invalid date");

            var query = new GetVehicleConsumptionManualRefillBySiteIdQuery(_startDate, _endDate, SiteId);

            var results = await _mediator.Send(query);

            return Ok(results);
        }

        [HttpGet("vehicleRefills")]
        public async Task<IActionResult> GetManualConsumptionByVehicleID([FromQuery] string startDate, string endDate, int? vehicleId)
        {
            var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (vehicleId == null || vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            if (_startDate == default(DateTime) || _endDate == default(DateTime))
            {
                return BadRequest("Invalid date");
            }

            var query = new GetConsumptionManualRefillByVehicleIDQuery(_startDate, _endDate, vehicleId);

            var results = await _mediator.Send(query);

            return Ok(results);
        }

        /// <summary>
        /// Get histroical data TODO: Search days on settings or application
        /// </summary>
        /// <param name="vehicleId"></param>
        /// <param name="date"></param>
        /// <returns></returns>
        [HttpGet("gethistoryconsumptionbyvehicle")]
        public async Task<IActionResult> GetHistoryConsumptionDatabyVehicle(
            [FromQuery] int vehicleId,
            [FromQuery] string datestring,
            [FromQuery] string? dateFromString = null,
            [FromQuery] int entry = 30)
        {
            var dateTo = DateTime.ParseExact(datestring, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            DateTime? dateFrom = null;

            if (!string.IsNullOrEmpty(dateFromString))
            {
                dateFrom = DateTime.ParseExact(dateFromString, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            }

            if (vehicleId <= 0 || dateTo == default(DateTime))
            {
                return BadRequest("Invalid vehicle ID or date");
            }

            if (entry < 5 || entry > 365)
            {
                return BadRequest("Entry must be between 5 and 365 days");
            }
            try
            {
                var query = new GetHistoryConsumptionByVehicleQuery
                {
                    Entry = entry,
                    VehicleId = vehicleId,
                    EndDate = dateTo,
                    StartDate = dateFrom ?? dateTo.AddDays(-entry)
                };

                var results = await _mediator.Send(query);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error Fetching history consumption Data");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = ex.Message });
            }

        }

        [HttpGet("getbyid")]
        public async Task<IActionResult> GetByID(int id)
        {
            if (id <= 0)
            {
                return BadRequest("invalid consumption ID");
            }
            try
            {
                var query = new GetConsumptionByIdQuery { Id = id };

                var result = await _mediator.Send(query);

                if (result == null)
                {
                    return NotFound();
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error Consumption data by ID");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = ex.Message });
            }
        }

        //TODO: Refactor and implement this

        // [HttpGet]
        // public async Task<IActionResult> Get(DateTime from)
        // {
        //     //load settings from appsettings.json

        //     string? username = _configuration["GPSGateUser:Username"];
        //     string? password = _configuration["GPSGateUser:Password"];
        //     int? applicationID = int.Parse(_configuration["ApplicationID"] ?? "0");
        //     int fuelConsumptionReportId = int.Parse(_configuration["FuelConsumptionReportID"] ?? "0");

        //     var fromDate = from.Date;
        //     var toDate = fromDate.AddDays(1).AddTicks(-1); //add one day to from date

        //     var loginquery = new LoginQuery
        //     {

        //         GPSGateConections = new GPSGateConections
        //         {
        //             GPSGateUser = new GPSGateUser
        //             {
        //                 UserName = username,
        //                 Password = password
        //             },
        //             ApplicationID = applicationID.Value
        //         }
        //     };

        //     var conn = await _mediator.Send(loginquery);

        //     var query = new GetConsumptionReportQuery(conn, fuelConsumptionReportId, fromDate, toDate);

        //     var results = await _mediator.Send(query);

        //     return Ok(results);

        // }

        [HttpPost("Create")]
        public async Task<IActionResult> ConsumptionCreate([FromBody] ConsumptionDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var command = _mapper.Map<ConsumptionCreateCmd>(model);

            await _mediator.Send(command);

            return Ok();

        }

        [HttpGet("getlist")]
        public async Task<IActionResult> GetConsumptionList(int pagingNo = 200)
        {
            if (pagingNo < 0 || pagingNo > 5000) return BadRequest("Invalid Paging No");
            var query = new GetConsumptionListQuery(pagingNo);
            var results = await _mediator.Send(query);
            if (results == null || !results.Any())
            {
                return NotFound();
            }
            return Ok(results);
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> ConsumptionUpdate(int id, [FromBody] ConsumptionDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var command = _mapper.Map<ComsumptionUpdateCmd>(model);

            command.Id = id;

            await _mediator.Send(command);

            return Ok();

        }

        [HttpGet("pumptransactions")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetPumpTransactions(
            [FromQuery] List<int>? vehicleId,
            [FromQuery] List<string>? ptsId,
            [FromQuery] List<int>? tankId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] bool? processedOnly,
            [FromQuery] List<int>? siteId,
            [FromQuery] bool includeTransfers = false)
        {
            try
            {
                // Adjust endDate to end of day if it's at midnight (00:00:00)
                // This handles cases where the client sends just a date like "2026-01-19"
                // which gets parsed as 2026-01-19 00:00:00, but we want to include the whole day
                DateTime? adjustedEndDate = endDate;
                if (endDate.HasValue && endDate.Value.TimeOfDay == TimeSpan.Zero)
                {
                    adjustedEndDate = endDate.Value.Date.AddDays(1).AddTicks(-1); // End of day: 23:59:59.9999999
                }

                // Support both single values (mobile) and arrays (web)
                // ASP.NET Core automatically converts single query params to List with one item
                var query = new FMS.Application.Features.TankManagement.PumpTransaction.GetPumpTransactionQuery
                {
                    VehicleIds = vehicleId?.Any() == true ? vehicleId : null,
                    PtsIds = ptsId?.Any() == true ? ptsId : null,
                    TankIds = tankId?.Any() == true ? tankId : null,
                    StartDate = startDate,
                    EndDate = adjustedEndDate,
                    ProcessedOnly = processedOnly,
                    SiteIds = siteId?.Any() == true ? siteId : null,
                    IncludeTransfers = includeTransfers
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result);
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pump transactions");
                var errorResponse = new { message = "An error occurred while retrieving pump transactions" };
                return StatusCode(500, errorResponse);
            }
        }

        /// Get consumption summary report grouped by site and vehicle model
        /// </summary>
        /// <param name="startDate">Start date (yyyy-MM-dd)</param>
        /// <param name="endDate">End date (yyyy-MM-dd)</param>
        /// <param name="siteId">Optional site ID filter</param>
        /// <param name="vehicleType">Optional vehicle type filter</param>
        /// <param name="groupBy">Period grouping: week, month, quarter, year (default: week)</param>
        [HttpGet("summary")]
        public async Task<IActionResult> GetConsumptionSummary(
            [FromQuery] string startDate,
            [FromQuery] string endDate,
            [FromQuery] int? siteId = null,
            [FromQuery] string? vehicleType = null,
            [FromQuery] string groupBy = "week")
        {
            try
            {
                var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
                var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

                if (_startDate == default(DateTime) || _endDate == default(DateTime))
                {
                    return BadRequest("Invalid date format. Use yyyy-MM-dd.");
                }

                if (_startDate > _endDate)
                {
                    return BadRequest("Start date cannot be after end date.");
                }

                var query = new GetConsumptionSummaryQuery
                {
                    StartDate = _startDate,
                    EndDate = _endDate,
                    SiteId = siteId,
                    VehicleType = vehicleType,
                    GroupBy = groupBy
                };

                var result = await _mediator.Send(query);

                _logger.LogInformation(
                    "Consumption summary retrieved successfully. " +
                    "Date range: {StartDate} to {EndDate}, Sites: {SiteCount}, Vehicles: {VehicleCount}",
                    _startDate, _endDate, result?.SiteSummaries?.Count ?? 0, result?.OverallSummary?.TotalVehicles ?? 0);

                return Ok(result);
            }
            catch (FormatException)
            {
                return BadRequest("Invalid date format. Use yyyy-MM-dd.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving consumption summary");
                return StatusCode(500, new { message = "Error retrieving consumption summary", details = ex.Message });
            }
        }

        /// <summary>
        /// Get detailed consumption data for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="startDate">Start date (yyyy-MM-dd)</param>
        /// <param name="endDate">End date (yyyy-MM-dd)</param>
        [HttpGet("vehicleDetail/{vehicleId}")]
        public async Task<IActionResult> GetVehicleConsumptionDetail(
            int vehicleId,
            [FromQuery] string startDate,
            [FromQuery] string endDate)
        {
            try
            {
                if (vehicleId <= 0)
                {
                    return BadRequest("Invalid vehicle ID.");
                }

                var _startDate = DateTime.ParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
                var _endDate = DateTime.ParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

                if (_startDate == default(DateTime) || _endDate == default(DateTime))
                {
                    return BadRequest("Invalid date format. Use yyyy-MM-dd.");
                }

                var query = new GetVehicleConsumptionDetailQuery
                {
                    VehicleId = vehicleId,
                    StartDate = _startDate,
                    EndDate = _endDate
                };

                var result = await _mediator.Send(query);

                if (result == null)
                {
                    return NotFound(new { message = $"Vehicle with ID {vehicleId} not found." });
                }

                _logger.LogInformation(
                    "Vehicle consumption detail retrieved for vehicle {VehicleId}. " +
                    "Date range: {StartDate} to {EndDate}, Refills: {RefillCount}",
                    vehicleId, _startDate, _endDate, result.RefillHistory?.Count ?? 0);

                return Ok(result);
            }
            catch (FormatException)
            {
                return BadRequest("Invalid date format. Use yyyy-MM-dd.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle consumption detail for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { message = "Error retrieving vehicle consumption detail", details = ex.Message });
            }
        }

        [HttpGet("recordDetail/{id}")]
        public async Task<IActionResult> GetConsumptionRecordDetail(int id)
        {
            if (id <= 0)
            {
                return BadRequest("Invalid consumption ID.");
            }

            try
            {
                var result = await _mediator.Send(new GetVehicleConsumptionRecordDetailQuery(id));

                if (result == null)
                {
                    return NotFound(new { message = $"Vehicle consumption record {id} was not found." });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle consumption record detail for {ConsumptionId}", id);
                return StatusCode(500, new { message = "Error retrieving vehicle consumption record detail", details = ex.Message });
            }
        }
    }
}
