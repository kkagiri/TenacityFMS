using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.FuelAudit.Commands;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Queries;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.FuelManagement
{
    /// <summary>
    /// API Controller for Fuel Audit GPS data operations.
    /// Provides endpoints to fetch fuel levels from GPS tracking for audit purposes.
    /// Supports category-aware routing for 5 vehicle categories.
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.TankStock.Read)]
    public class FuelAuditGPSController : ControllerBase
    {
        private readonly IFuelAuditGPSService _fuelAuditGPSService;
        private readonly IFullTankEstimationService _fullTankEstimationService;
        private readonly IMediator _mediator;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly ILogger<FuelAuditGPSController> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly GpsdataContext _context;

        // Track active GPS fetch jobs
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _activeJobs = new();

        public FuelAuditGPSController(
            IFuelAuditGPSService fuelAuditGPSService,
            IFullTankEstimationService fullTankEstimationService,
            IMediator mediator,
            IHubContext<FrontEndHub> hubContext,
            ILogger<FuelAuditGPSController> logger,
            IServiceScopeFactory serviceScopeFactory,
            GpsdataContext context)
        {
            _fuelAuditGPSService = fuelAuditGPSService ?? throw new ArgumentNullException(nameof(fuelAuditGPSService));
            _fullTankEstimationService = fullTankEstimationService ?? throw new ArgumentNullException(nameof(fullTankEstimationService));
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _serviceScopeFactory = serviceScopeFactory ?? throw new ArgumentNullException(nameof(serviceScopeFactory));
            _context = context ?? throw new ArgumentNullException(nameof(context));
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
            var query = new GetFleetAuditPeriodQuery(
                request.VehicleIds,
                request.StartDate,
                request.EndDate,
                request.AuditId,
                request.RequestedBy);

            var result = await _mediator.Send(query, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
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
            var command = new CategoryAuditCommand(request);
            var result = await _mediator.Send(command, cancellationToken);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
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

        /// <summary>
        /// Start async GPS data fetch with SignalR progress updates.
        /// Returns immediately with a job ID, then broadcasts progress via SignalR.
        /// </summary>
        /// <param name="request">Category-aware request with vehicle info</param>
        /// <returns>Job ID for tracking progress</returns>
        [HttpPost("fleet/category-audit-async")]
        public IActionResult StartCategoryAuditAsync([FromBody] CategoryAuditRequestDTO request)
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

            // Generate unique job ID
            var jobId = Guid.NewGuid().ToString("N")[..12];
            var cts = new CancellationTokenSource();

            // Store the job for potential cancellation
            _activeJobs[jobId] = cts;

            _logger.LogInformation(
                "Starting async category audit job {JobId} for {Count} vehicles from {StartDate} to {EndDate}",
                jobId, request.Vehicles.Count, request.StartDate.ToString("yyyy-MM-dd"), request.EndDate.ToString("yyyy-MM-dd"));

            // Start background processing with a new DI scope to avoid disposed DbContext issues
            // The original HTTP request scope will be disposed when this method returns,
            // so we need a fresh scope for the background task
            _ = Task.Run(async () =>
            {
                try
                {
                    // Create a new scope for the background task
                    using var scope = _serviceScopeFactory.CreateScope();
                    var scopedMediator = scope.ServiceProvider.GetRequiredService<IMediator>();

                    var command = new CategoryAuditAsyncCommand(jobId, request, cts.Token);
                    await scopedMediator.Send(command, cts.Token);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in background GPS fetch job {JobId}", jobId);

                    // Try to notify clients of the error
                    try
                    {
                        await _hubContext.Clients.All.SendAsync("GpsFetchError", new
                        {
                            jobId,
                            error = ex.Message,
                            timestamp = DateTime.UtcNow
                        });
                    }
                    catch
                    {
                        // Ignore notification errors
                    }
                }
                finally
                {
                    // Clean up the job from active jobs
                    _activeJobs.TryRemove(jobId, out _);
                }
            }, cts.Token);

            return Ok(FMSResponse<object>.Success(new
            {
                JobId = jobId,
                Message = "GPS data fetch started. Progress will be broadcast via SignalR.",
                TotalVehicles = request.Vehicles.Count
            }, "Job started successfully"));
        }

        /// <summary>
        /// Cancel an active GPS fetch job.
        /// </summary>
        /// <param name="jobId">Job ID to cancel</param>
        [HttpPost("fleet/category-audit-async/{jobId}/cancel")]
        public IActionResult CancelCategoryAuditJob(string jobId)
        {
            if (_activeJobs.TryRemove(jobId, out var cts))
            {
                cts.Cancel();
                _logger.LogInformation("Cancelled GPS fetch job {JobId}", jobId);
                return Ok(FMSResponse<object>.Success(new { JobId = jobId, Message = "Job cancelled" }));
            }

            return NotFound(FMSResponse<object>.Failed($"Job {jobId} not found or already completed"));
        }


    }
}
