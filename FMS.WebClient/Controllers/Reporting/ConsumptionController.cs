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
using FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Import;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Application.Features.FuelImport.Commands;
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
            [FromQuery] string? hyoungNo = null,
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
                    hyoungNo,
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

        /// <summary>
        /// Imports a fuel report with multiple consumption records after validating them.
        /// </summary>
        [HttpPost("import")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ImportFuelReport([FromBody] object requestObj)
        {
            try
            {
                // Log the incoming request object type to help with debugging
                _logger.LogInformation("Received import request object of type: {Type}", requestObj?.GetType().FullName);

                if (requestObj == null)
                {
                    _logger.LogWarning("Received null request object during fuel report import");
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "No data provided in request",
                        validationErrors = new string[] { "No data provided in request" }
                    });
                }

                // First try to parse the request as the new structure
                List<ConsumptionDTO> models;
                bool overwriteExisting = false;
                bool skipDuplicates = false;

                // Check if request has the new structure with { consumptions, overwriteExisting } or the old direct list
                if (requestObj is Newtonsoft.Json.Linq.JObject jObject)
                {
                    _logger.LogInformation("Processing fuel import as JObject structure");

                    if (jObject.ContainsKey("consumptions"))
                    {
                        // Extract the consumptions array and flags
                        models = jObject["consumptions"].ToObject<List<ConsumptionDTO>>();

                        // Get the overwrite flag if present
                        if (jObject.ContainsKey("overwriteExisting") && jObject["overwriteExisting"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean)
                        {
                            overwriteExisting = jObject["overwriteExisting"].Value<bool>();
                            _logger.LogInformation("Import with overwriteExisting flag: {Flag}", overwriteExisting);
                        }

                        // Get the skipDuplicates flag if present
                        if (jObject.ContainsKey("skipDuplicates") && jObject["skipDuplicates"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean)
                        {
                            skipDuplicates = jObject["skipDuplicates"].Value<bool>();
                            _logger.LogInformation("Import with skipDuplicates flag: {Flag}", skipDuplicates);
                        }
                    }
                    else
                    {
                        // Try to deserialize the JObject directly to a list
                        try
                        {
                            models = jObject.ToObject<List<ConsumptionDTO>>();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to deserialize JObject to List<ConsumptionDTO>");
                            return BadRequest(new
                            {
                                isSuccess = false,
                                message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                                validationErrors = new string[] { "Invalid data format" }
                            });
                        }
                    }
                }
                else if (requestObj is System.Text.Json.JsonElement jsonElement)
                {
                    _logger.LogInformation("Processing fuel import as JsonElement structure");

                    // Handle System.Text.Json format
                    if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        try
                        {
                            // Try to get the consumptions array
                            if (jsonElement.TryGetProperty("consumptions", out var consumptionsElement) && consumptionsElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(consumptionsElement.GetRawText());

                                // Get the overwrite flag if present
                                if (jsonElement.TryGetProperty("overwriteExisting", out var overwriteElement) && overwriteElement.ValueKind == System.Text.Json.JsonValueKind.True)
                                {
                                    overwriteExisting = true;
                                    _logger.LogInformation("Import with overwriteExisting flag: {Flag}", overwriteExisting);
                                }

                                // Get the skipDuplicates flag if present
                                if (jsonElement.TryGetProperty("skipDuplicates", out var skipElement) && skipElement.ValueKind == System.Text.Json.JsonValueKind.True)
                                {
                                    skipDuplicates = true;
                                    _logger.LogInformation("Import with skipDuplicates flag: {Flag}", skipDuplicates);
                                }
                            }
                            else
                            {
                                // Try to deserialize the whole object as a list
                                models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(jsonElement.GetRawText());
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to deserialize JsonElement to List<ConsumptionDTO>");
                            return BadRequest(new
                            {
                                isSuccess = false,
                                message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                                validationErrors = new string[] { "Error parsing request data: " + ex.Message }
                            });
                        }
                    }
                    else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        // Direct array format
                        models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(jsonElement.GetRawText());
                    }
                    else
                    {
                        _logger.LogError("Unsupported JsonElement format: {Kind}", jsonElement.ValueKind);
                        return BadRequest(new
                        {
                            isSuccess = false,
                            message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                            validationErrors = new string[] { "Unsupported data format" }
                        });
                    }
                }
                else
                {
                    _logger.LogWarning("Unexpected request format: {Type}", requestObj.GetType().FullName);
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Invalid data format. Expected JSON data.",
                        validationErrors = new string[] { "Invalid request format" }
                    });
                }

                if (models == null || models.Count == 0)
                {
                    _logger.LogWarning("No consumption records found in the request");
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "No consumption records found in the request",
                        validationErrors = new string[] { "No consumption records found" }
                    });
                }

                _logger.LogInformation("Processing {Count} consumption records with overwriteExisting={OverwriteFlag} and skipDuplicates={SkipFlag}",
                    models.Count, overwriteExisting, skipDuplicates);

                // Ensure models are valid - perform basic validation
                var validationErrors = ValidateFuelReportData(models);
                if (validationErrors.Count > 0)
                {
                    _logger.LogWarning("Validation failed with {Count} errors during import", validationErrors.Count);
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Validation failed. Please check the data and try again.",
                        validationErrors = validationErrors.Select(v => v.Message).ToArray()
                    });
                }

                // Set the overwriteExisting flag on all records if needed
                if (overwriteExisting)
                {
                    models.ForEach(model => model.OverwriteExisting = true);
                }

                // Get user ID from claims for tracking
                string userId;
                if (TryGetCurrentGuidUserId(out var currentUserId))
                {
                    userId = currentUserId;
                    _logger.LogInformation("Import initiated by user: {UserId}", userId);
                }
                else
                {
                    // Log all available claims for debugging
                    _logger.LogWarning("User ID claim not found. Available claims: {Claims}",
                        string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

                    // Use "System" as fallback but log it
                    userId = "System";
                    _logger.LogWarning("Falling back to System as user ID for fuel import");
                }

                // Set the skipDuplicates flag properly at the command level
                var command = new FMS.Application.Features.FuelImport.Commands.ImportFuelReportCommand
                {
                    Models = models,
                    SkipDuplicates = skipDuplicates,
                    OverwriteExisting = overwriteExisting,
                    UserId = userId // Track who imported
                };

                var result = await _mediator.Send(command);

                // Log the result for monitoring
                if (result != null && result.Data != null)
                {
                    _logger.LogInformation(
                        "Import completed with: TotalRecords={Total}, Processed={Processed}, Success={Success}, Failed={Failed}, Skipped={Skipped}, Duplicates={Duplicates}",
                        result.Data.TotalRecords, result.Data.TotalProcessed, result.Data.SuccessCount,
                        result.Data.FailureCount, result.Data.SkippedCount, result.Data.DuplicateCount);

                    // Check if there are duplicate records in the response
                    if (result.Data.DuplicateRecords != null && result.Data.DuplicateRecords.Count > 0)
                    {
                        _logger.LogInformation("Import result includes {Count} duplicate records information",
                            result.Data.DuplicateRecords.Count);
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while importing fuel report");
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "An error occurred while importing fuel report: " + ex.Message,
                    validationErrors = new string[] { "Server error: " + ex.Message }
                });
            }
        }

        /// <summary>
        /// Async import endpoint - returns immediately with a job ID and processes in background.
        /// Progress and completion are sent via SignalR.
        /// </summary>
        [HttpPost("import/async")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> ImportFuelReportAsync([FromBody] object requestObj)
        {
            try
            {
                _logger.LogInformation("Received async import request");

                if (requestObj == null)
                {
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "No data provided in request"
                    });
                }

                // Parse the request (same logic as sync import)
                List<ConsumptionDTO> models;
                bool overwriteExisting = false;
                bool skipDuplicates = false;

                if (requestObj is Newtonsoft.Json.Linq.JObject jObject)
                {
                    if (jObject.ContainsKey("consumptions"))
                    {
                        models = jObject["consumptions"].ToObject<List<ConsumptionDTO>>();
                        if (jObject.ContainsKey("overwriteExisting") && jObject["overwriteExisting"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean)
                            overwriteExisting = jObject["overwriteExisting"].Value<bool>();
                        if (jObject.ContainsKey("skipDuplicates") && jObject["skipDuplicates"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean)
                            skipDuplicates = jObject["skipDuplicates"].Value<bool>();
                    }
                    else
                    {
                        models = jObject.ToObject<List<ConsumptionDTO>>();
                    }
                }
                else if (requestObj is System.Text.Json.JsonElement jsonElement)
                {
                    if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                    {
                        if (jsonElement.TryGetProperty("consumptions", out var consumptionsElement))
                        {
                            models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(consumptionsElement.GetRawText());
                            if (jsonElement.TryGetProperty("overwriteExisting", out var overwriteElement) && overwriteElement.ValueKind == System.Text.Json.JsonValueKind.True)
                                overwriteExisting = true;
                            if (jsonElement.TryGetProperty("skipDuplicates", out var skipElement) && skipElement.ValueKind == System.Text.Json.JsonValueKind.True)
                                skipDuplicates = true;
                        }
                        else
                        {
                            models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(jsonElement.GetRawText());
                        }
                    }
                    else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>>(jsonElement.GetRawText());
                    }
                    else
                    {
                        return BadRequest(new { isSuccess = false, message = "Invalid data format" });
                    }
                }
                else
                {
                    return BadRequest(new { isSuccess = false, message = "Invalid request format" });
                }

                if (models == null || models.Count == 0)
                {
                    return BadRequest(new { isSuccess = false, message = "No consumption records found" });
                }

                // Generate job ID
                var jobId = Guid.NewGuid().ToString("N");

                // Get user ID from claims for tracking
                string userId;
                if (TryGetCurrentGuidUserId(out var currentUserId))
                {
                    userId = currentUserId;
                }
                else
                {
                    // Log all available claims for debugging
                    _logger.LogWarning("User ID claim not found for async import. Available claims: {Claims}",
                        string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

                    // Use "System" as fallback but log it
                    userId = "System";
                    _logger.LogWarning("Falling back to System as user ID for async fuel import");
                }

                _logger.LogInformation("Starting async import job {JobId} with {Count} records for user {UserId}", jobId, models.Count, userId);

                // Validate data first (quick validation before returning)
                var validationErrors = ValidateFuelReportData(models);
                if (validationErrors.Count > 0)
                {
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Validation failed",
                        validationErrors = validationErrors.Select(v => v.Message).ToArray()
                    });
                }

                // Notify that job has started via SignalR
                await _hubContext.Clients.All.SendAsync("FuelImportJobStarted", new
                {
                    JobId = jobId,
                    TotalRecords = models.Count,
                    Status = "Started",
                    Timestamp = DateTime.UtcNow
                });

                // Create cancellation token for this job
                var cts = new CancellationTokenSource();
                _activeImportJobs.TryAdd(jobId, cts);

                // Start background processing with a new DI scope
                // IMPORTANT: We capture the IServiceScopeFactory to create a fresh scope
                // This prevents the "disposed context" error that occurs when using scoped services in background tasks
                var scopeFactory = _serviceScopeFactory;
                var hubContext = _hubContext;

                _ = Task.Run(async () =>
                {
                    // Create a new scope for the background work
                    using var scope = scopeFactory.CreateScope();
                    var scopedMediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<ConsumptionController>>();

                    try
                    {
                        // Check for cancellation before starting
                        if (cts.Token.IsCancellationRequested)
                        {
                            scopedLogger.LogInformation("Import job {JobId} cancelled before starting", jobId);
                            await hubContext.Clients.All.SendAsync("FuelImportCancelled", new
                            {
                                JobId = jobId,
                                Message = "Import job was cancelled",
                                Timestamp = DateTime.UtcNow
                            });
                            return;
                        }

                        scopedLogger.LogInformation("Background import job {JobId} starting with new scope", jobId);

                        // Set overwrite flag on all records if needed
                        if (overwriteExisting)
                        {
                            models.ForEach(model => model.OverwriteExisting = true);
                        }

                        var command = new FMS.Application.Features.FuelImport.Commands.ImportFuelReportCommand
                        {
                            Models = models,
                            SkipDuplicates = skipDuplicates,
                            OverwriteExisting = overwriteExisting,
                            UserId = userId,
                            JobId = jobId
                        };

                        // Use the scoped mediator for background work
                        // Note: The command handler also receives a CancellationToken from MediatR
                        var result = await scopedMediator.Send(command, cts.Token);

                        // Check for cancellation after command execution
                        if (cts.Token.IsCancellationRequested)
                        {
                            scopedLogger.LogInformation("Import job {JobId} cancelled after processing", jobId);
                            await hubContext.Clients.All.SendAsync("FuelImportCancelled", new
                            {
                                JobId = jobId,
                                Message = "Import job was cancelled",
                                Timestamp = DateTime.UtcNow
                            });
                            return;
                        }

                        // Send completion notification via SignalR
                        await hubContext.Clients.All.SendAsync("FuelImportCompleted", new
                        {
                            JobId = jobId,
                            IsSuccess = result.IsSuccess,
                            Message = result.Message,
                            Data = result.Data,
                            Timestamp = DateTime.UtcNow
                        });

                        scopedLogger.LogInformation("Async import job {JobId} completed: {Success}", jobId, result.IsSuccess);
                    }
                    catch (OperationCanceledException)
                    {
                        scopedLogger.LogInformation("Import job {JobId} was cancelled", jobId);
                        await hubContext.Clients.All.SendAsync("FuelImportCancelled", new
                        {
                            JobId = jobId,
                            Message = "Import job was cancelled",
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch (Exception ex)
                    {
                        scopedLogger.LogError(ex, "Async import job {JobId} failed", jobId);

                        // Send error notification via SignalR
                        await hubContext.Clients.All.SendAsync("FuelImportError", new
                        {
                            JobId = jobId,
                            Message = ex.Message,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    finally
                    {
                        // Clean up the cancellation token
                        if (_activeImportJobs.TryRemove(jobId, out var removedCts))
                        {
                            removedCts.Dispose();
                        }
                    }
                });

                // Return immediately with job ID
                return Ok(new
                {
                    isSuccess = true,
                    message = "Import job started. Progress will be sent via SignalR.",
                    data = new
                    {
                        jobId = jobId,
                        totalRecords = models.Count,
                        status = "Processing"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting async fuel report import");
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = "Error starting import: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Cancel an in-progress fuel report import job
        /// </summary>
        /// <param name="jobId">The job ID to cancel</param>
        /// <returns>Success or error response</returns>
        [HttpPost("import/cancel/{jobId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CancelFuelImport(string jobId)
        {
            try
            {
                if (string.IsNullOrEmpty(jobId))
                {
                    return BadRequest(new
                    {
                        isSuccess = false,
                        message = "Job ID is required"
                    });
                }

                if (_activeImportJobs.TryRemove(jobId, out var cts))
                {
                    // Cancel the job
                    cts.Cancel();

                    // Send cancellation notification via SignalR
                    await _hubContext.Clients.All.SendAsync("FuelImportCancelled", new
                    {
                        JobId = jobId,
                        Message = "Import job was cancelled by user",
                        Timestamp = DateTime.UtcNow
                    });

                    cts.Dispose();

                    _logger.LogInformation("Fuel import job {JobId} cancelled successfully", jobId);
                    return Ok(new
                    {
                        isSuccess = true,
                        message = "Import job cancelled successfully"
                    });
                }
                else
                {
                    _logger.LogWarning("Fuel import job {JobId} not found or already completed", jobId);
                    return NotFound(new
                    {
                        isSuccess = false,
                        message = "Job not found or already completed"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling fuel import job {JobId}", jobId);
                return StatusCode(500, new
                {
                    isSuccess = false,
                    message = $"Failed to cancel import: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Private helper to validate fuel report data.
        /// </summary>
        /// <returns>A list of validation issues. Empty list means validation passed.</returns>
        private List<ValidationIssue> ValidateFuelReportData(List<ConsumptionDTO> models)
        {
            var validationErrors = new List<ValidationIssue>();
            if (models == null) return validationErrors; // Should not happen due to controller check, but good practice

            for (int i = 0; i < models.Count; i++)
            {
                var model = models[i];
                var originalRowIndex = i + 1; // For user-friendly message

                // Map DriverName to EmployeeName if DriverName exists but EmployeeName doesn't
                if (model.GetType().GetProperty("DriverName") != null)
                {
                    var driverNameProperty = model.GetType().GetProperty("DriverName");
                    if (driverNameProperty != null)
                    {
                        var driverName = driverNameProperty.GetValue(model) as string;
                        if (!string.IsNullOrEmpty(driverName) && string.IsNullOrEmpty(model.EmployeeName))
                        {
                            model.EmployeeName = driverName;
                        }
                    }
                }

                //Cursor

                // Validate VehicleId
                if (model.VehicleId <= 0)
                {
                    validationErrors.Add(new ValidationIssue
                    {
                        RowIndex = i,
                        Field = "vehicleName",
                        Message = $"Row {originalRowIndex}: Vehicle ID is missing or invalid."
                    });
                }

                // Validate SiteId (Required for L/Hr reports)
                if (model.SiteId <= 0 && !model.IsKmperLiter)
                {
                    validationErrors.Add(new ValidationIssue
                    {
                        RowIndex = i,
                        Field = "locationName",
                        Message = $"Row {originalRowIndex}: Site is required for L/Hr report type and is missing or invalid."
                    });
                }

                // Validate Date
                if (model.Date == default || model.Date.Year < 1900)
                {
                    validationErrors.Add(new ValidationIssue
                    {
                        RowIndex = i,
                        Field = "date",
                        Message = $"Row {originalRowIndex}: Date is invalid."
                    });
                }

                // Add more specific validations for numeric fields if needed (e.g., range checks)
                // Example: Check if TotalFuel is negative
                if (model.TotalFuel.HasValue && model.TotalFuel < 0)
                {
                    validationErrors.Add(new ValidationIssue
                    {
                        RowIndex = i,
                        Field = "totalFuel",
                        Message = $"Row {originalRowIndex}: Total Fuel cannot be negative."
                    });
                }
            }
            return validationErrors;
        }

        /// <summary>
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
    }
}