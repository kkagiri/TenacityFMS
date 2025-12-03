using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Queries;
using FMS.Application.Features.FuelAudit.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// API Controller for Fuel Audit GPS data operations.
    /// Provides endpoints to fetch fuel levels from GPS tracking for audit purposes.
    /// Supports category-aware routing for 5 vehicle categories.
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class FuelAuditGPSController : ControllerBase
    {
        private readonly IFuelAuditGPSService _fuelAuditGPSService;
        private readonly IFullTankEstimationService _fullTankEstimationService;
        private readonly IMediator _mediator;
        private readonly ILogger<FuelAuditGPSController> _logger;

        public FuelAuditGPSController(
            IFuelAuditGPSService fuelAuditGPSService,
            IFullTankEstimationService fullTankEstimationService,
            IMediator mediator,
            ILogger<FuelAuditGPSController> logger)
        {
            _fuelAuditGPSService = fuelAuditGPSService ?? throw new ArgumentNullException(nameof(fuelAuditGPSService));
            _fullTankEstimationService = fullTankEstimationService ?? throw new ArgumentNullException(nameof(fullTankEstimationService));
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get fuel position for a single vehicle at a specific date.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Target date (format: yyyy-MM-dd)</param>
        /// <param name="readingType">Reading type: "opening" or "closing"</param>
        /// <param name="useCache">Whether to use cached data (default: true)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Vehicle fuel position with data quality information</returns>
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<IActionResult> GetVehicleFuelPosition(
            int vehicleId,
            [FromQuery] DateTime date,
            [FromQuery] string readingType = "opening",
            [FromQuery] bool useCache = true,
            CancellationToken cancellationToken = default)
        {
            if (vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            if (date == default)
            {
                return BadRequest("Date is required");
            }

            if (readingType != "opening" && readingType != "closing")
            {
                return BadRequest("Reading type must be 'opening' or 'closing'");
            }

            _logger.LogInformation("Getting fuel position for vehicle {VehicleId} on {Date} ({ReadingType})",
                vehicleId, date.ToString("yyyy-MM-dd"), readingType);

            var result = await _fuelAuditGPSService.GetVehicleFuelAtDateAsync(
                vehicleId, date, readingType, useCache, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get fuel positions for multiple vehicles at a specific date.
        /// Processes vehicles in parallel with throttling for performance.
        /// </summary>
        /// <param name="request">Fleet fuel position request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Fleet fuel positions with summary statistics</returns>
        [HttpPost("fleet")]
        public async Task<IActionResult> GetFleetFuelPositions(
            [FromBody] FleetFuelPositionRequestDTO request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (request.VehicleIds == null || request.VehicleIds.Count == 0)
            {
                return BadRequest("At least one vehicle ID is required");
            }

            if (request.Date == default)
            {
                return BadRequest("Date is required");
            }

            _logger.LogInformation("Getting fleet fuel positions for {Count} vehicles on {Date}",
                request.VehicleIds.Count, request.Date.ToString("yyyy-MM-dd"));

            var result = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(request, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get fuel consumption for a vehicle over a date range.
        /// Calculates consumption from opening to closing fuel levels.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="startDate">Start date (opening stock date)</param>
        /// <param name="endDate">End date (closing stock date)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Vehicle fuel consumption data</returns>
        [HttpGet("vehicle/{vehicleId}/consumption")]
        public async Task<IActionResult> GetVehicleConsumption(
            int vehicleId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            CancellationToken cancellationToken = default)
        {
            if (vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            if (startDate == default || endDate == default)
            {
                return BadRequest("Start date and end date are required");
            }

            if (endDate < startDate)
            {
                return BadRequest("End date must be after start date");
            }

            _logger.LogInformation("Getting consumption for vehicle {VehicleId} from {StartDate} to {EndDate}",
                vehicleId, startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"));

            var result = await _fuelAuditGPSService.GetVehicleConsumptionAsync(
                vehicleId, startDate, endDate, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Detect refuel events for a vehicle on a specific date.
        /// Analyzes GPS track data to identify fuel level increases.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Date to analyze</param>
        /// <param name="minimumThreshold">Minimum fuel increase to consider as refuel (default: 10L)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of detected refuel events</returns>
        [HttpGet("vehicle/{vehicleId}/refuel-events")]
        public async Task<IActionResult> DetectRefuelEvents(
            int vehicleId,
            [FromQuery] DateTime date,
            [FromQuery] decimal minimumThreshold = 10.0m,
            CancellationToken cancellationToken = default)
        {
            if (vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            if (date == default)
            {
                return BadRequest("Date is required");
            }

            _logger.LogInformation("Detecting refuel events for vehicle {VehicleId} on {Date}",
                vehicleId, date.ToString("yyyy-MM-dd"));

            var result = await _fuelAuditGPSService.DetectRefuelEventsAsync(
                vehicleId, date, minimumThreshold, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Refresh GPS data for a vehicle on a specific date.
        /// Clears cached data and fetches fresh data from GPS provider.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Date to refresh</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Success status</returns>
        [HttpPost("vehicle/{vehicleId}/refresh")]
        public async Task<IActionResult> RefreshVehicleData(
            int vehicleId,
            [FromQuery] DateTime date,
            CancellationToken cancellationToken = default)
        {
            if (vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            if (date == default)
            {
                return BadRequest("Date is required");
            }

            _logger.LogInformation("Refreshing GPS data for vehicle {VehicleId} on {Date}",
                vehicleId, date.ToString("yyyy-MM-dd"));

            var result = await _fuelAuditGPSService.RefreshVehicleDataAsync(vehicleId, date, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Check if a vehicle has a fuel sensor configured.
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Whether vehicle has fuel sensor</returns>
        [HttpGet("vehicle/{vehicleId}/has-fuel-sensor")]
        public async Task<IActionResult> HasFuelSensor(
            int vehicleId,
            CancellationToken cancellationToken = default)
        {
            if (vehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID");
            }

            var result = await _fuelAuditGPSService.HasFuelSensorAsync(vehicleId, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get fuel positions for multiple vehicles with date range (opening and closing).
        /// Convenience endpoint for audit workflows.
        /// </summary>
        /// <param name="request">Batch request with vehicle IDs and date range</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Opening and closing fuel positions for all vehicles</returns>
        [HttpPost("fleet/audit-period")]
        public async Task<IActionResult> GetFleetAuditPeriodFuel(
            [FromBody] FleetAuditPeriodRequestDTO request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (request.VehicleIds == null || request.VehicleIds.Count == 0)
            {
                return BadRequest("At least one vehicle ID is required");
            }

            if (request.StartDate == default || request.EndDate == default)
            {
                return BadRequest("Start date and end date are required");
            }

            _logger.LogInformation("Getting fleet audit period fuel for {Count} vehicles from {StartDate} to {EndDate}",
                request.VehicleIds.Count, request.StartDate.ToString("yyyy-MM-dd"), request.EndDate.ToString("yyyy-MM-dd"));

            // Get opening positions
            var openingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = request.VehicleIds,
                Date = request.StartDate,
                ReadingType = "opening",
                AuditId = request.AuditId,
                RequestedBy = request.RequestedBy
            };

            var openingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(openingRequest, cancellationToken);

            // Get closing positions
            var closingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = request.VehicleIds,
                Date = request.EndDate,
                ReadingType = "closing",
                AuditId = request.AuditId,
                RequestedBy = request.RequestedBy
            };

            var closingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(closingRequest, cancellationToken);

            if (!openingResult.IsSuccess || !closingResult.IsSuccess)
            {
                return BadRequest(new
                {
                    Message = "Error fetching audit period data",
                    OpeningError = openingResult.IsSuccess ? null : openingResult.Message,
                    ClosingError = closingResult.IsSuccess ? null : closingResult.Message
                });
            }

            var response = new FleetAuditPeriodResponseDTO
            {
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TotalVehicles = request.VehicleIds.Count,
                Opening = openingResult.Data!,
                Closing = closingResult.Data!
            };

            return Ok(response);
        }

        /// <summary>
        /// Category-aware endpoint for fleet audit period fuel positions.
        /// Routes to appropriate data sources based on vehicle category:
        /// - Category 1 (Site GPS Fleet): Uses GPSGate REST API
        /// - Category 2 (Site Full Tank): Uses Full Tank Estimation
        /// - Category 3 (Site Equipment): Uses FuelRefill records only
        /// - Category 4 (Cross-Site Company): Uses GPSGate REST/SOAP
        /// - Category 5 (External Non-Company): No GPS data (refill only)
        /// </summary>
        /// <param name="request">Category-aware request with vehicle info</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Category-organized fuel audit results</returns>
        [HttpPost("fleet/category-audit")]
        public async Task<IActionResult> GetCategoryAuditFuel(
            [FromBody] CategoryAuditRequestDTO request,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest("Request body is required");
            }

            if (request.Vehicles == null || request.Vehicles.Count == 0)
            {
                return BadRequest("At least one vehicle is required");
            }

            if (request.StartDate == default || request.EndDate == default)
            {
                return BadRequest("Start date and end date are required");
            }

            _logger.LogInformation(
                "Processing category-aware audit for {Count} vehicles from {StartDate} to {EndDate}",
                request.Vehicles.Count,
                request.StartDate.ToString("yyyy-MM-dd"),
                request.EndDate.ToString("yyyy-MM-dd"));

            var response = new CategoryAuditResponseDTO
            {
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                TotalVehicles = request.Vehicles.Count
            };

            // Group vehicles by category
            var vehiclesByCategory = request.Vehicles.GroupBy(v => v.Category).ToList();

            foreach (var categoryGroup in vehiclesByCategory)
            {
                var categoryResult = await ProcessCategoryAsync(
                    categoryGroup.Key,
                    categoryGroup.ToList(),
                    request.StartDate,
                    request.EndDate,
                    request.AuditId,
                    request.RequestedBy,
                    cancellationToken);

                response.CategoryResults.Add(categoryResult);
            }

            // Calculate summary
            CalculateCategorySummary(response);

            _logger.LogInformation(
                "Category audit complete: GPS={GPS}, Estimated={Est}, RefillOnly={Refill}, NoData={NoData}",
                response.Summary.VehiclesWithGPS,
                response.Summary.VehiclesWithEstimate,
                response.Summary.VehiclesWithRefillOnly,
                response.Summary.VehiclesWithNoData);

            return Ok(FMSResponse<CategoryAuditResponseDTO>.Success(response));
        }

        /// <summary>
        /// Get full tank estimations for Category 2 vehicles.
        /// </summary>
        [HttpPost("estimate/full-tank")]
        public async Task<IActionResult> GetFullTankEstimations(
            [FromBody] List<FullTankEstimationRequestDTO> requests,
            CancellationToken cancellationToken = default)
        {
            if (requests == null || !requests.Any())
            {
                return BadRequest("At least one vehicle estimation request is required");
            }

            _logger.LogInformation("Processing full tank estimation for {Count} vehicles", requests.Count);

            var result = await _fullTankEstimationService.EstimateBatchAsync(requests, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        #region Private Category Processing Methods

        private async Task<CategoryResultDTO> ProcessCategoryAsync(
            int category,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            int? auditId,
            int? requestedBy,
            CancellationToken cancellationToken)
        {
            var result = new CategoryResultDTO
            {
                Category = category,
                CategoryName = GetCategoryName(category),
                VehicleCount = vehicles.Count,
                DataSource = GetCategoryDataSource(category)
            };

            try
            {
                switch (category)
                {
                    case 1: // Site GPS Fleet - Use REST API
                        await ProcessGPSCategoryAsync(result, vehicles, startDate, endDate, auditId, requestedBy, cancellationToken);
                        break;

                    case 2: // Site Full Tank - Use Estimation
                        await ProcessFullTankCategoryAsync(result, vehicles, startDate, endDate, cancellationToken);
                        break;

                    case 3: // Site Equipment - Refill data only
                        ProcessEquipmentCategory(result, vehicles, startDate, endDate);
                        break;

                    case 4: // Cross-Site Company - Use SOAP data from gpsgate_report_entries
                        await ProcessCrossSiteCategoryAsync(result, vehicles, startDate, endDate, cancellationToken);
                        break;

                    case 5: // External Non-Company - Refill data only
                        ProcessExternalCategory(result, vehicles, startDate, endDate);
                        break;

                    default:
                        result.ErrorMessage = $"Unknown category: {category}";
                        break;
                }

                result.AllProcessed = result.Vehicles.All(v => v.IsAuditable);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing category {Category}", category);
                result.ErrorMessage = ex.Message;
                result.AllProcessed = false;
            }

            return result;
        }

        private async Task ProcessGPSCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            int? auditId,
            int? requestedBy,
            CancellationToken cancellationToken)
        {
            var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();

            // Get opening positions
            var openingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = vehicleIds,
                Date = startDate,
                ReadingType = "opening",
                AuditId = auditId,
                RequestedBy = requestedBy
            };
            var openingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(openingRequest, cancellationToken);

            // Get closing positions
            var closingRequest = new FleetFuelPositionRequestDTO
            {
                VehicleIds = vehicleIds,
                Date = endDate,
                ReadingType = "closing",
                AuditId = auditId,
                RequestedBy = requestedBy
            };
            var closingResult = await _fuelAuditGPSService.GetFleetFuelAtDateAsync(closingRequest, cancellationToken);

            // Fetch GPS-measured consumption from VehicleConsumption table for all vehicles
            var gpsConsumptionByVehicle = new Dictionary<int, decimal>();
            foreach (var vehicleId in vehicleIds)
            {
                try
                {
                    var consumptionQuery = new FMS.Application.Queries.Database.FMSQuery.Consumption.GetHistoryConsumptionByVehicleQuery
                    {
                        VehicleId = vehicleId,
                        StartDate = startDate,
                        EndDate = endDate
                    };
                    var consumptionData = await _mediator.Send(consumptionQuery, cancellationToken);

                    // Sum all daily consumption (TotalFuel field contains daily consumption)
                    var totalGpsConsumption = consumptionData?.Sum(c => c.TotalFuel ?? 0) ?? 0;
                    gpsConsumptionByVehicle[vehicleId] = totalGpsConsumption;

                    _logger.LogDebug("Vehicle {VehicleId}: GPS consumption from {Start} to {End} = {Consumption}L",
                        vehicleId, startDate.ToString("yyyy-MM-dd"), endDate.ToString("yyyy-MM-dd"), totalGpsConsumption);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch GPS consumption for vehicle {VehicleId}", vehicleId);
                    gpsConsumptionByVehicle[vehicleId] = 0;
                }
            }

            // Variance thresholds (from algorithm)
            const decimal VEHICLE_VARIANCE_THRESHOLD = 5.0m;
            const decimal CONSUMPTION_VARIANCE_THRESHOLD = 10.0m;

            // Combine results
            foreach (var vehicle in vehicles)
            {
                var opening = openingResult.Data?.VehiclePositions
                    .FirstOrDefault(p => p.VehicleId == vehicle.VehicleId);
                var closing = closingResult.Data?.VehiclePositions
                    .FirstOrDefault(p => p.VehicleId == vehicle.VehicleId);

                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = vehicle.Category,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    DataSource = "GPS_REST",
                    Confidence = "HIGH"
                };

                if (opening != null)
                {
                    vehicleResult.OpeningFuelLevel = opening.FuelLevel;
                    vehicleResult.OpeningTimestamp = opening.ReadingTimestamp;
                    vehicleResult.OpeningDataQuality = opening.DataQuality;
                    vehicleResult.OpeningDataQualityReason = opening.DataQualityReason;
                    vehicleResult.VehicleName = opening.VehicleName;
                }

                if (closing != null)
                {
                    vehicleResult.ClosingFuelLevel = closing.FuelLevel;
                    vehicleResult.ClosingTimestamp = closing.ReadingTimestamp;
                    vehicleResult.ClosingDataQuality = closing.DataQuality;
                    vehicleResult.ClosingDataQualityReason = closing.DataQualityReason;

                    if (string.IsNullOrEmpty(vehicleResult.VehicleName))
                        vehicleResult.VehicleName = closing.VehicleName;
                }

                // Get GPS-measured consumption
                gpsConsumptionByVehicle.TryGetValue(vehicle.VehicleId, out var gpsConsumption);
                vehicleResult.GpsMeasuredConsumption = gpsConsumption;

                // Calculate formula-based consumption (Opening + Refueled - Closing)
                if (vehicleResult.OpeningFuelLevel.HasValue && vehicleResult.ClosingFuelLevel.HasValue)
                {
                    vehicleResult.CalculatedConsumption =
                        vehicleResult.OpeningFuelLevel.Value
                        + vehicleResult.TotalFuelRefilled
                        - vehicleResult.ClosingFuelLevel.Value;

                    // Calculate consumption variance (Calculated - GPS Measured)
                    // Per algorithm: Positive = Calculated shows more consumption than GPS
                    if (gpsConsumption > 0)
                    {
                        vehicleResult.ConsumptionVariance = vehicleResult.CalculatedConsumption.Value - gpsConsumption;
                    }

                    // Calculate vehicle variance per algorithm Phase 2.1:
                    // expected_closing = opening_dead_stock + total_refueled - gps_consumption
                    // vehicle_variance = actual_closing - expected_closing
                    if (gpsConsumption > 0)
                    {
                        var expectedClosing = vehicleResult.OpeningFuelLevel.Value
                            + vehicleResult.TotalFuelRefilled
                            - gpsConsumption;
                        vehicleResult.VehicleVariance = vehicleResult.ClosingFuelLevel.Value - expectedClosing;
                    }
                }

                // Flag if variance exceeds thresholds
                if (vehicleResult.VehicleVariance.HasValue &&
                    Math.Abs(vehicleResult.VehicleVariance.Value) > VEHICLE_VARIANCE_THRESHOLD)
                {
                    vehicleResult.HasVarianceFlag = true;
                    vehicleResult.VarianceFlagMessage = $"Vehicle variance ({vehicleResult.VehicleVariance:F1}L) exceeds {VEHICLE_VARIANCE_THRESHOLD}L threshold";
                }
                else if (vehicleResult.ConsumptionVariance.HasValue &&
                         Math.Abs(vehicleResult.ConsumptionVariance.Value) > CONSUMPTION_VARIANCE_THRESHOLD)
                {
                    vehicleResult.HasVarianceFlag = true;
                    vehicleResult.VarianceFlagMessage = $"Consumption variance ({vehicleResult.ConsumptionVariance:F1}L) exceeds {CONSUMPTION_VARIANCE_THRESHOLD}L threshold";
                }

                vehicleResult.IsAuditable = vehicleResult.OpeningFuelLevel.HasValue && vehicleResult.ClosingFuelLevel.HasValue;

                result.Vehicles.Add(vehicleResult);
            }

            _logger.LogInformation(
                "Processed {Count} GPS vehicles with variance analysis. Flagged: {Flagged}",
                vehicles.Count,
                result.Vehicles.Count(v => v.HasVarianceFlag));
        }

        private async Task ProcessFullTankCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken)
        {
            var estimationRequests = vehicles.Select(v => new FullTankEstimationRequestDTO
            {
                VehicleId = v.VehicleId,
                VehicleName = "", // Will be populated by service
                StartDate = startDate,
                EndDate = endDate,
                FuelTankCapacity = v.FuelTankCapacity,
                AverageEfficiency = v.AverageEfficiency,
                IsKmL = v.IsKmL,
                IsFullTankPolicy = v.IsFullTankPolicy
            }).ToList();

            var estimationResult = await _fullTankEstimationService.EstimateBatchAsync(estimationRequests, cancellationToken);

            if (estimationResult.IsSuccess && estimationResult.Data != null)
            {
                foreach (var estimate in estimationResult.Data)
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == estimate.VehicleId);

                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = estimate.VehicleId,
                        VehicleName = estimate.VehicleName,
                        Category = 2,
                        OpeningFuelLevel = estimate.EstimatedOpeningLevel,
                        OpeningTimestamp = estimate.OpeningReferenceDate,
                        OpeningDataQuality = estimate.OpeningDataQuality,
                        OpeningDataQualityReason = estimate.OpeningDetails,
                        ClosingFuelLevel = estimate.EstimatedClosingLevel,
                        ClosingTimestamp = estimate.ClosingReferenceDate,
                        ClosingDataQuality = estimate.ClosingDataQuality,
                        ClosingDataQualityReason = estimate.ClosingDetails,
                        TotalFuelRefilled = estimate.TotalFuelRefilled,
                        CalculatedConsumption = estimate.CalculatedConsumption,
                        DataSource = "Estimated",
                        Confidence = estimate.Confidence,
                        IsAuditable = estimate.IsReliable
                    };

                    result.Vehicles.Add(vehicleResult);
                }
            }
        }

        /// <summary>
        /// Process Category 4: Cross-Site Company vehicles.
        /// Uses data from gpsgate_report_entries table (populated by FetchAndStoreGpsDataCommand via SOAP Report 212).
        /// </summary>
        private async Task ProcessCrossSiteCategoryAsync(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken)
        {
            var vehicleIds = vehicles.Select(v => v.VehicleId).ToList();

            // Use the GetCrossSiteGpsDataQuery to fetch from gpsgate_report_entries
            var query = new GetCrossSiteGpsDataQuery(vehicleIds, startDate, endDate);
            var queryResult = await _mediator.Send(query, cancellationToken);

            if (queryResult.IsSuccess && queryResult.Data != null)
            {
                foreach (var gpsData in queryResult.Data)
                {
                    var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == gpsData.VehicleId);

                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = gpsData.VehicleId,
                        VehicleName = gpsData.VehicleName ?? vehicle?.VehicleName ?? $"Vehicle {gpsData.VehicleId}",
                        Category = 4,
                        OpeningFuelLevel = gpsData.OpeningFuelLevel,
                        OpeningTimestamp = gpsData.FirstReadingTime,
                        OpeningDataQuality = gpsData.DataQuality,
                        OpeningDataQualityReason = gpsData.HasCompleteData ? "From GPSGate SOAP Report 212" : "Incomplete data",
                        ClosingFuelLevel = gpsData.ClosingFuelLevel,
                        ClosingTimestamp = gpsData.LastReadingTime,
                        ClosingDataQuality = gpsData.DataQuality,
                        ClosingDataQualityReason = gpsData.HasCompleteData ? "From GPSGate SOAP Report 212" : "Incomplete data",
                        TotalFuelRefilled = vehicle?.TotalFuelRefilled ?? gpsData.TotalFuelRefilled,
                        CalculatedConsumption = gpsData.CalculatedConsumption,
                        DataSource = "GPS_SOAP",
                        Confidence = gpsData.Confidence,
                        IsAuditable = gpsData.HasCompleteData
                    };

                    // Add any warnings
                    if (gpsData.Warnings?.Any() == true)
                    {
                        vehicleResult.OpeningDataQualityReason += $" ({string.Join(", ", gpsData.Warnings)})";
                    }

                    result.Vehicles.Add(vehicleResult);
                }
            }
            else
            {
                // Fall back to marking as unavailable
                foreach (var vehicle in vehicles)
                {
                    var vehicleResult = new VehicleFuelAuditResultDTO
                    {
                        VehicleId = vehicle.VehicleId,
                        VehicleName = vehicle.VehicleName ?? $"Vehicle {vehicle.VehicleId}",
                        Category = 4,
                        TotalFuelRefilled = vehicle.TotalFuelRefilled,
                        OpeningDataQuality = FuelDataQuality.Unavailable,
                        OpeningDataQualityReason = queryResult.Message ?? "Cross-site GPS data not available. Run GPS fetch first.",
                        ClosingDataQuality = FuelDataQuality.Unavailable,
                        ClosingDataQualityReason = queryResult.Message ?? "Cross-site GPS data not available. Run GPS fetch first.",
                        DataSource = "GPS_SOAP",
                        Confidence = "LOW",
                        IsAuditable = false
                    };

                    result.Vehicles.Add(vehicleResult);
                }
            }
        }

        private void ProcessEquipmentCategory(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate)
        {
            // Category 3: Equipment with no GPS
            // We can only track fuel issued, not opening/closing
            foreach (var vehicle in vehicles)
            {
                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = 3,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    OpeningDataQuality = FuelDataQuality.Unavailable,
                    OpeningDataQualityReason = "Equipment without GPS - cannot track opening fuel level",
                    ClosingDataQuality = FuelDataQuality.Unavailable,
                    ClosingDataQualityReason = "Equipment without GPS - cannot track closing fuel level",
                    DataSource = "FuelRefill",
                    Confidence = "LOW",
                    IsAuditable = false // Cannot audit without opening/closing
                };

                result.Vehicles.Add(vehicleResult);
            }
        }

        private void ProcessExternalCategory(
            CategoryResultDTO result,
            List<CategoryVehicleDTO> vehicles,
            DateTime startDate,
            DateTime endDate)
        {
            // Category 5: External non-company vehicles
            // Track fuel issued only - for accountability purposes
            foreach (var vehicle in vehicles)
            {
                var vehicleResult = new VehicleFuelAuditResultDTO
                {
                    VehicleId = vehicle.VehicleId,
                    Category = 5,
                    TotalFuelRefilled = vehicle.TotalFuelRefilled,
                    ExternalFuel = vehicle.TotalFuelRefilled, // All fuel issued is "external"
                    OpeningDataQuality = FuelDataQuality.NoSensor,
                    OpeningDataQualityReason = "External vehicle - opening stock not tracked",
                    ClosingDataQuality = FuelDataQuality.NoSensor,
                    ClosingDataQualityReason = "External vehicle - closing stock not tracked",
                    DataSource = "FuelRefill",
                    Confidence = "ACCOUNTED",
                    IsAuditable = true // Auditable in the sense that fuel issued is accounted for
                };

                result.Vehicles.Add(vehicleResult);
            }
        }

        private string GetCategoryName(int category) => category switch
        {
            1 => "Site GPS Fleet",
            2 => "Site Full Tank",
            3 => "Site Equipment",
            4 => "Cross-Site Company",
            5 => "External Non-Company",
            _ => "Unknown"
        };

        private string GetCategoryDataSource(int category) => category switch
        {
            1 => "GPS_REST",
            2 => "Estimated",
            3 => "FuelRefill",
            4 => "GPS_SOAP",
            5 => "FuelRefill",
            _ => "Unknown"
        };

        private void CalculateCategorySummary(CategoryAuditResponseDTO response)
        {
            var allVehicles = response.CategoryResults.SelectMany(c => c.Vehicles).ToList();

            response.Summary = new CategorySummaryDTO
            {
                VehiclesWithGPS = allVehicles.Count(v => v.DataSource == "GPS_REST" && v.OpeningFuelLevel.HasValue),
                VehiclesWithEstimate = allVehicles.Count(v => v.DataSource == "Estimated" && v.OpeningFuelLevel.HasValue),
                VehiclesWithRefillOnly = allVehicles.Count(v => v.DataSource == "FuelRefill"),
                VehiclesWithNoData = allVehicles.Count(v =>
                    v.OpeningDataQuality == FuelDataQuality.Unavailable &&
                    v.ClosingDataQuality == FuelDataQuality.Unavailable),
                TotalOpeningFuel = allVehicles.Where(v => v.OpeningFuelLevel.HasValue).Sum(v => v.OpeningFuelLevel),
                TotalClosingFuel = allVehicles.Where(v => v.ClosingFuelLevel.HasValue).Sum(v => v.ClosingFuelLevel),
                TotalFuelRefilled = allVehicles.Sum(v => v.TotalFuelRefilled),
                TotalCalculatedConsumption = allVehicles.Where(v => v.CalculatedConsumption.HasValue).Sum(v => v.CalculatedConsumption),

                // NEW: Variance aggregates
                TotalGpsMeasuredConsumption = allVehicles.Where(v => v.GpsMeasuredConsumption.HasValue).Sum(v => v.GpsMeasuredConsumption),
                TotalConsumptionVariance = allVehicles.Where(v => v.ConsumptionVariance.HasValue).Sum(v => v.ConsumptionVariance),
                TotalVehicleVariance = allVehicles.Where(v => v.VehicleVariance.HasValue).Sum(v => v.VehicleVariance),
                VehiclesWithVarianceFlag = allVehicles.Count(v => v.HasVarianceFlag)
            };

            // Data quality by category
            foreach (var category in response.CategoryResults)
            {
                var auditable = category.Vehicles.Count(v => v.IsAuditable);
                var total = category.VehicleCount;
                response.Summary.DataQualityByCategory[category.Category] = $"{auditable}/{total} auditable";

                // Variance by category
                var categoryVariance = category.Vehicles
                    .Where(v => v.VehicleVariance.HasValue)
                    .Sum(v => v.VehicleVariance);
                response.Summary.VarianceByCategory[category.Category] = categoryVariance;
            }
        }

        #endregion
    }

    /// <summary>
    /// Request DTO for fleet audit period fuel positions
    /// </summary>
    public class FleetAuditPeriodRequestDTO
    {
        public List<int> VehicleIds { get; set; } = new();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? AuditId { get; set; }
        public int? RequestedBy { get; set; }
    }

    /// <summary>
    /// Response DTO for fleet audit period fuel positions
    /// </summary>
    public class FleetAuditPeriodResponseDTO
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalVehicles { get; set; }
        public FleetFuelPositionResponseDTO Opening { get; set; } = new();
        public FleetFuelPositionResponseDTO Closing { get; set; } = new();
    }
}
