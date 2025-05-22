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
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Vehicle;
//using FMS.Application.Queries.Database.Consumption;
using System;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.WebClient.Controllers {

    // Custom simplified validation error class
    public class ValidationIssue {
        public int? RowIndex { get; set; }
        public string Field { get; set; }
        public string Message { get; set; }
    }

    [ApiController]
    [Route ("api/[controller]")]
    public class ConsumptionController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<ConsumptionController> _logger;

        public ConsumptionController (IMediator mediator, IConfiguration configuration, IMapper mapper, ILogger<ConsumptionController> logger) {
            _mapper = mapper;
            _mediator = mediator;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet ("manualRefills")]
        public async Task<IActionResult> GetManualConsumption ([FromQuery] string startDate, string endDate) {
            var _startDate = DateTime.ParseExact (startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact (endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (_startDate == default (DateTime) || _endDate == default (DateTime)) {
                return BadRequest ("Invalid date");
            }

            var query = new GetVehicleConsumptionManualRefillQuery (_startDate, _endDate);

            var results = await _mediator.Send (query);

            return Ok (results);
        }

        [HttpGet ("manualRefillsbySiteId")]
        public async Task<IActionResult> GetManualConsumptionBySiteId ([FromQuery] string startDate, string endDate, int SiteId) {
            var _startDate = DateTime.ParseExact (startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact (endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (SiteId <= 0) return BadRequest ("Invalid Site ID");

            if (_startDate == default (DateTime) || _endDate == default (DateTime)) return BadRequest ("Invalid date");

            var query = new GetVehicleConsumptionManualRefillBySiteIdQuery (_startDate, _endDate, SiteId);

            var results = await _mediator.Send (query);

            return Ok (results);
        }

        [HttpGet ("vehicleRefills")]
        public async Task<IActionResult> GetManualConsumptionByVehicleID ([FromQuery] string startDate, string endDate, int? vehicleId) {
            var _startDate = DateTime.ParseExact (startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            var _endDate = DateTime.ParseExact (endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (vehicleId == null || vehicleId <= 0) {
                return BadRequest ("Invalid vehicle ID");
            }

            if (_startDate == default (DateTime) || _endDate == default (DateTime)) {
                return BadRequest ("Invalid date");
            }

            var query = new GetConsumptionManualRefillByVehicleIDQuery (_startDate, _endDate, vehicleId);

            var results = await _mediator.Send (query);

            return Ok (results);
        }

        /// <summary>
        /// Get histroical data TODO: Search days on settings or application
        /// </summary>
        /// <param name="vehicleId"></param>
        /// <param name="date"></param>
        /// <returns></returns>
        [HttpGet ("gethistoryconsumptionbyvehicle")]
        public async Task<IActionResult> GetHistoryConsumptionDatabyVehicle ([FromQuery] int vehicleId, [FromQuery] string datestring, [FromQuery] int entry) {
            var date = DateTime.ParseExact (datestring, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (vehicleId <= 0 || date == default (DateTime)) {
                return BadRequest ("Invalid vehicle ID or date");
            }

            if (entry < 5 || entry > 30) {
                return BadRequest ("Entry must be between 5 and 30 days");
            }
            try {

                var query = new GetHistoryConsumptionByVehicleQuery { Entry = entry, VehicleId = vehicleId, startDate = date };

                var results = await _mediator.Send (query);

                return Ok (results);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error Fetching history consumption Data");
                return StatusCode (StatusCodes.Status500InternalServerError, new { Message = ex.Message });
            }

        }

        [HttpGet ("getbyid")]
        public async Task<IActionResult> GetByID (int id) {
            if (id <= 0) {
                return BadRequest ("invalid consumption ID");
            }
            try {
                var query = new GetConsumptionByIdQuery { Id = id };

                var result = await _mediator.Send (query);

                if (result == null) {
                    return NotFound ();
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error Consumption data by ID");
                return StatusCode (StatusCodes.Status500InternalServerError, new { Message = ex.Message });
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

        [HttpPost ("Create")]
        public async Task<IActionResult> ConsumptionCreate ([FromBody] ConsumptionDTO model) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }

            var command = _mapper.Map<ConsumptionCreateCmd> (model);

            await _mediator.Send (command);

            return Ok ();

        }

        [HttpGet ("getlist")]
        public async Task<IActionResult> GetConsumptionList (int pagingNo = 200) {
            if (pagingNo < 0 || pagingNo > 5000) return BadRequest ("Invalid Paging No");
            var query = new GetConsumptionListQuery (pagingNo);
            var results = await _mediator.Send (query);
            if (results == null || !results.Any ()) {
                return NotFound ();
            }
            return Ok (results);
        }

        [HttpPut ("Update/{id}")]
        public async Task<IActionResult> ConsumptionUpdate (int id, [FromBody] ConsumptionDTO model) {
            if (!ModelState.IsValid) {
                return BadRequest (ModelState);
            }

            var command = _mapper.Map<ComsumptionUpdateCmd> (model);

            command.Id = id;

            await _mediator.Send (command);

            return Ok ();

        }

        /// <summary>
        /// Imports a fuel report with multiple consumption records after validating them.
        /// </summary>
        [HttpPost ("import")]
        public async Task<IActionResult> ImportFuelReport ([FromBody] object requestObj) {
            try {
                // Log the incoming request object type to help with debugging
                _logger.LogInformation ("Received import request object of type: {Type}", requestObj?.GetType ().FullName);

                if (requestObj == null) {
                    _logger.LogWarning ("Received null request object during fuel report import");
                    return BadRequest (new {
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
                if (requestObj is Newtonsoft.Json.Linq.JObject jObject) {
                    _logger.LogInformation ("Processing fuel import as JObject structure");

                    if (jObject.ContainsKey ("consumptions")) {
                        // Extract the consumptions array and flags
                        models = jObject["consumptions"].ToObject<List<ConsumptionDTO>> ();

                        // Get the overwrite flag if present
                        if (jObject.ContainsKey ("overwriteExisting") && jObject["overwriteExisting"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean) {
                            overwriteExisting = jObject["overwriteExisting"].Value<bool> ();
                            _logger.LogInformation ("Import with overwriteExisting flag: {Flag}", overwriteExisting);
                        }

                        // Get the skipDuplicates flag if present
                        if (jObject.ContainsKey ("skipDuplicates") && jObject["skipDuplicates"].Type == Newtonsoft.Json.Linq.JTokenType.Boolean) {
                            skipDuplicates = jObject["skipDuplicates"].Value<bool> ();
                            _logger.LogInformation ("Import with skipDuplicates flag: {Flag}", skipDuplicates);
                        }
                    } else {
                        // Try to deserialize the JObject directly to a list
                        try {
                            models = jObject.ToObject<List<ConsumptionDTO>> ();
                        } catch (Exception ex) {
                            _logger.LogError (ex, "Failed to deserialize JObject to List<ConsumptionDTO>");
                            return BadRequest (new {
                                isSuccess = false,
                                    message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                                    validationErrors = new string[] { "Invalid data format" }
                            });
                        }
                    }
                } else if (requestObj is System.Text.Json.JsonElement jsonElement) {
                    _logger.LogInformation ("Processing fuel import as JsonElement structure");

                    // Handle System.Text.Json format
                    if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Object) {
                        try {
                            // Try to get the consumptions array
                            if (jsonElement.TryGetProperty ("consumptions", out var consumptionsElement) && consumptionsElement.ValueKind == System.Text.Json.JsonValueKind.Array) {
                                models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>> (consumptionsElement.GetRawText ());

                                // Get the overwrite flag if present
                                if (jsonElement.TryGetProperty ("overwriteExisting", out var overwriteElement) && overwriteElement.ValueKind == System.Text.Json.JsonValueKind.True) {
                                    overwriteExisting = true;
                                    _logger.LogInformation ("Import with overwriteExisting flag: {Flag}", overwriteExisting);
                                }

                                // Get the skipDuplicates flag if present
                                if (jsonElement.TryGetProperty ("skipDuplicates", out var skipElement) && skipElement.ValueKind == System.Text.Json.JsonValueKind.True) {
                                    skipDuplicates = true;
                                    _logger.LogInformation ("Import with skipDuplicates flag: {Flag}", skipDuplicates);
                                }
                            } else {
                                // Try to deserialize the whole object as a list
                                models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>> (jsonElement.GetRawText ());
                            }
                        } catch (Exception ex) {
                            _logger.LogError (ex, "Failed to deserialize JsonElement to List<ConsumptionDTO>");
                            return BadRequest (new {
                                isSuccess = false,
                                    message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                                    validationErrors = new string[] { "Error parsing request data: " + ex.Message }
                            });
                        }
                    } else if (jsonElement.ValueKind == System.Text.Json.JsonValueKind.Array) {
                        // Direct array format
                        models = System.Text.Json.JsonSerializer.Deserialize<List<ConsumptionDTO>> (jsonElement.GetRawText ());
                    } else {
                        _logger.LogError ("Unsupported JsonElement format: {Kind}", jsonElement.ValueKind);
                        return BadRequest (new {
                            isSuccess = false,
                                message = "Invalid data format. Expected an array of consumption records or a structure with a 'consumptions' array.",
                                validationErrors = new string[] { "Unsupported data format" }
                        });
                    }
                } else {
                    _logger.LogWarning ("Unexpected request format: {Type}", requestObj.GetType ().FullName);
                    return BadRequest (new {
                        isSuccess = false,
                            message = "Invalid data format. Expected JSON data.",
                            validationErrors = new string[] { "Invalid request format" }
                    });
                }

                if (models == null || models.Count == 0) {
                    _logger.LogWarning ("No consumption records found in the request");
                    return BadRequest (new {
                        isSuccess = false,
                            message = "No consumption records found in the request",
                            validationErrors = new string[] { "No consumption records found" }
                    });
                }

                _logger.LogInformation ("Processing {Count} consumption records with overwriteExisting={OverwriteFlag} and skipDuplicates={SkipFlag}",
                    models.Count, overwriteExisting, skipDuplicates);

                // Ensure models are valid - perform basic validation
                var validationErrors = ValidateFuelReportData (models);
                if (validationErrors.Count > 0) {
                    _logger.LogWarning ("Validation failed with {Count} errors during import", validationErrors.Count);
                    return BadRequest (new {
                        isSuccess = false,
                            message = "Validation failed. Please check the data and try again.",
                            validationErrors = validationErrors.Select (v => v.Message).ToArray ()
                    });
                }

                // Set the overwriteExisting flag on all records if needed
                if (overwriteExisting) {
                    models.ForEach (model => model.OverwriteExisting = true);
                }

                // Set the skipDuplicates flag properly at the command level
                var command = new ImportFuelReportCommand {
                    Models = models,
                    SkipDuplicates = skipDuplicates,
                    OverwriteExisting = overwriteExisting
                };

                var result = await _mediator.Send (command);

                // Log the result for monitoring
                if (result != null && result.Data != null) {
                    _logger.LogInformation (
                        "Import completed with: TotalRecords={Total}, Processed={Processed}, Success={Success}, Failed={Failed}, Skipped={Skipped}, Duplicates={Duplicates}",
                        result.Data.TotalRecords, result.Data.TotalProcessed, result.Data.SuccessCount,
                        result.Data.FailureCount, result.Data.SkippedCount, result.Data.DuplicateCount);

                    // Check if there are duplicate records in the response
                    if (result.Data.DuplicateRecords != null && result.Data.DuplicateRecords.Count > 0) {
                        _logger.LogInformation ("Import result includes {Count} duplicate records information",
                            result.Data.DuplicateRecords.Count);
                    }
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "An error occurred while importing fuel report");
                return StatusCode (500, new {
                    isSuccess = false,
                        message = "An error occurred while importing fuel report: " + ex.Message,
                        validationErrors = new string[] { "Server error: " + ex.Message }
                });
            }
        }

        /// <summary>
        /// Private helper to validate fuel report data.
        /// </summary>
        /// <returns>A list of validation issues. Empty list means validation passed.</returns>
        private List<ValidationIssue> ValidateFuelReportData (List<ConsumptionDTO> models) {
            var validationErrors = new List<ValidationIssue> ();
            if (models == null) return validationErrors; // Should not happen due to controller check, but good practice

            for (int i = 0; i < models.Count; i++) {
                var model = models[i];
                var originalRowIndex = i + 1; // For user-friendly message

                // Map DriverName to EmployeeName if DriverName exists but EmployeeName doesn't
                if (model.GetType ().GetProperty ("DriverName") != null) {
                    var driverNameProperty = model.GetType ().GetProperty ("DriverName");
                    if (driverNameProperty != null) {
                        var driverName = driverNameProperty.GetValue (model) as string;
                        if (!string.IsNullOrEmpty (driverName) && string.IsNullOrEmpty (model.EmployeeName)) {
                            model.EmployeeName = driverName;
                        }
                    }
                }

                //Cursor

                // Validate VehicleId
                if (model.VehicleId <= 0) {
                    validationErrors.Add (new ValidationIssue {
                        RowIndex = i,
                            Field = "vehicleName",
                            Message = $"Row {originalRowIndex}: Vehicle ID is missing or invalid."
                    });
                }

                // Validate SiteId (Required for L/Hr reports)
                if (model.SiteId <= 0 && !model.IsKmPerHr) {
                    validationErrors.Add (new ValidationIssue {
                        RowIndex = i,
                            Field = "locationName",
                            Message = $"Row {originalRowIndex}: Site is required for L/Hr report type and is missing or invalid."
                    });
                }

                // Validate Date
                if (model.Date == default || model.Date.Year < 1900) {
                    validationErrors.Add (new ValidationIssue {
                        RowIndex = i,
                            Field = "date",
                            Message = $"Row {originalRowIndex}: Date is invalid."
                    });
                }

                // Add more specific validations for numeric fields if needed (e.g., range checks)
                // Example: Check if TotalFuel is negative
                if (model.TotalFuel.HasValue && model.TotalFuel < 0) {
                    validationErrors.Add (new ValidationIssue {
                        RowIndex = i,
                            Field = "totalFuel",
                            Message = $"Row {originalRowIndex}: Total Fuel cannot be negative."
                    });
                }
            }
            return validationErrors;
        }
    }
}