using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelComparison.Commands;
using FMS.Application.Features.FuelComparison.DTOs;
using FMS.Application.Features.FuelComparison.Queries;
using FMS.Application.Features.GPSGate.Commands;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace FMS.WebClient.Controllers
{
    /// <summary>
    /// API Controller for Fuel Data Comparison & Variance Analysis
    /// Compares manual entries, PTS transactions, and GPSGate data
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    public class FuelComparisonController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<FuelComparisonController> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // Static dictionary to track cancellation tokens for GPS fetch jobs
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, CancellationTokenSource> _activeJobs
            = new System.Collections.Concurrent.ConcurrentDictionary<string, CancellationTokenSource>();

        public FuelComparisonController(
            IMediator mediator,
            ILogger<FuelComparisonController> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _mediator = mediator;
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        /// <summary>
        /// Get fuel data comparison with variance analysis
        /// </summary>
        /// <param name="startDate">Start date for comparison</param>
        /// <param name="endDate">End date for comparison</param>
        /// <param name="filterType">Filter type: all, site, or tank</param>
        /// <param name="siteId">Site ID if filtering by site</param>
        /// <param name="tankId">Tank ID if filtering by tank</param>
        /// <param name="showDeleted">Include soft-deleted GPS entries</param>
        /// <returns>List of comparison records</returns>
        [HttpGet("data")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetComparisonData(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string filterType = "all",
            [FromQuery] int? siteId = null,
            [FromQuery] int? tankId = null,
            [FromQuery] bool showDeleted = false)
        {
            try
            {
                var userId = "ec18aed0-2f9d-411c-9bbe-6079084ab2a5"; // TESTING: Hardcoded
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                var query = new GetComparisonDataQuery(
                    startDate,
                    endDate,
                    filterType,
                    siteId,
                    tankId,
                    userId,
                    showDeleted
                );

                var result = await _mediator.Send(query);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comparison data");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get variance analysis report with summary metrics
        /// </summary>
        /// <param name="startDate">Start date for report</param>
        /// <param name="endDate">End date for report</param>
        /// <param name="filterType">Filter type: all, site, or tank</param>
        /// <param name="siteId">Site ID if filtering by site</param>
        /// <param name="tankId">Tank ID if filtering by tank</param>
        /// <returns>Variance report with summary and details</returns>
        [HttpGet("variance-report")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetVarianceReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string filterType = "all",
            [FromQuery] int? siteId = null,
            [FromQuery] int? tankId = null)
        {
            try
            {
                var userId = "ec18aed0-2f9d-411c-9bbe-6079084ab2a5"; // TESTING: Hardcoded
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                var query = new GetVarianceReportQuery(
                    startDate,
                    endDate,
                    filterType,
                    siteId,
                    tankId,
                    userId
                );

                var result = await _mediator.Send(query);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating variance report");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Fetch GPS data from GPSGate Report 212 (async operation with real-time progress)
        /// Returns immediately with jobId, progress updates sent via SignalR
        /// </summary>
        /// <param name="request">Fetch request with date range</param>
        /// <returns>Job ID for tracking progress via SignalR</returns>
        [HttpPost("fetch-gps-data")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public IActionResult FetchGpsData([FromBody] FetchGpsDataRequestDto request)
        {
            try
            {
                // Generate unique job ID
                var jobId = Guid.NewGuid().ToString();

                // Create cancellation token source for this job
                var cts = new CancellationTokenSource();
                _activeJobs.TryAdd(jobId, cts);

                // Fire-and-forget: Start the long-running operation in background
                // IMPORTANT: Use IServiceScopeFactory to create a new DI scope for background work
                // This prevents ObjectDisposedException when the controller's scope is disposed
                _ = Task.Run(async () =>
                {
                    // Create a new scope for the background task
                    using var scope = _serviceScopeFactory.CreateScope();
                    var scopedMediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                    var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<FuelComparisonController>>();

                    try
                    {
                        var command = new FetchAndStoreGpsDataCommand(
                            request.StartDate,
                            request.EndDate,
                            jobId
                        );

                        await scopedMediator.Send(command, cts.Token);
                    }
                    catch (OperationCanceledException)
                    {
                        scopedLogger.LogInformation("GPS fetch job {JobId} was cancelled", jobId);
                    }
                    catch (Exception ex)
                    {
                        scopedLogger.LogError(ex, "Background GPS fetch job {JobId} failed", jobId);
                    }
                    finally
                    {
                        // Clean up cancellation token
                        if (_activeJobs.TryRemove(jobId, out var removedCts))
                        {
                            removedCts?.Dispose();
                        }
                    }
                }, cts.Token);

                // Return immediately with job ID
                return Ok(FMSResponse<object>.Success(
                    new { jobId },
                    "GPS data fetch started. You will receive progress updates via SignalR."
                ));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting GPS data fetch");
                return StatusCode(500, FMSResponse<object>.Failed($"Failed to start GPS data fetch: {ex.Message}"));
            }
        }

        /// <summary>
        /// Cancel a running GPS data fetch job
        /// Sends cancellation request to GPSGate server and cancels local processing
        /// </summary>
        /// <param name="jobId">Job ID to cancel</param>
        /// <returns>Success or error response</returns>
        [HttpPost("cancel-gps-fetch/{jobId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CancelGpsFetch(string jobId)
        {
            try
            {
                if (string.IsNullOrEmpty(jobId))
                {
                    return BadRequest(FMSResponse<object>.Failed("Job ID is required"));
                }

                if (_activeJobs.TryRemove(jobId, out var cts))
                {
                    // Cancel the local processing token
                    cts.Cancel();

                    // Send cancellation instruction to GPSGate server
                    // This will instruct GPSGate to stop generating the report
                    var cancelCommand = new CancelGpsReportCommand(jobId);
                    await _mediator.Send(cancelCommand);

                    cts.Dispose();

                    _logger.LogInformation("GPS fetch job {JobId} cancelled successfully (local + GPSGate server)", jobId);
                    return Ok(FMSResponse<object>.Success(null, "GPS fetch cancelled successfully"));
                }
                else
                {
                    _logger.LogWarning("GPS fetch job {JobId} not found or already completed", jobId);
                    return NotFound(FMSResponse<object>.Failed("Job not found or already completed"));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling GPS fetch job {JobId}", jobId);
                return StatusCode(500, FMSResponse<object>.Failed($"Failed to cancel GPS fetch: {ex.Message}"));
            }
        }

        /// <summary>
        /// DIAGNOSTIC ENDPOINT: Check GPSGate provider configuration
        /// Use this to verify the provider_configurations table has the correct data
        /// </summary>


        /// <summary>
        /// TESTING ENDPOINT: Fetch GPS data synchronously (waits for completion)
        /// Use this for testing - it returns the full result instead of just a jobId
        /// </summary>
        /// <param name="request">Fetch request with date range</param>
        /// <returns>Full fetch result with counts</returns>
        [HttpPost("fetch-gps-data-sync")]
        [AllowAnonymous] // Allow testing without auth for now
        public async Task<IActionResult> FetchGpsDataSync([FromBody] FetchGpsDataRequestDto request)
        {
            try
            {
                _logger.LogInformation(
                    "Starting SYNC GPS fetch for dates {StartDate} to {EndDate}",
                    request.StartDate, request.EndDate);

                var jobId = Guid.NewGuid().ToString();

                var command = new FetchAndStoreGpsDataCommand(
                    request.StartDate,
                    request.EndDate,
                    jobId
                );

                var result = await _mediator.Send(command);

                _logger.LogInformation(
                    "SYNC GPS fetch completed: {Message}",
                    result.Message);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in sync GPS data fetch");
                return StatusCode(500, FMSResponse<object>.Failed($"GPS fetch failed: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update (edit) a GPS report entry volume
        /// </summary>
        /// <param name="id">GPS entry ID</param>
        /// <param name="updateDto">Update details with new volume and reason</param>
        /// <returns>Updated entry details</returns>
        [HttpPut("gps-entry/{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateGpsEntry(int id, [FromBody] GpsEntryUpdateDto updateDto)
        {
            try
            {
                var userId = "ec18aed0-2f9d-411c-9bbe-6079084ab2a5"; // TESTING: Hardcoded
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                // Ensure ID matches
                if (updateDto.Id != id)
                {
                    return BadRequest(FMSResponse<object>.ValidationFailed(
                        new List<string> { "ID in URL must match ID in request body" }));
                }

                // Set the user ID from token
                updateDto.ModifiedBy = userId;

                var command = new UpdateGpsEntryCommand(updateDto);
                var result = await _mediator.Send(command);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating GPS entry {id}");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete (soft delete) a GPS report entry
        /// </summary>
        /// <param name="id">GPS entry ID</param>
        /// <param name="deleteDto">Deletion details with reason</param>
        /// <returns>Success confirmation</returns>
        [HttpDelete("gps-entry/{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteGpsEntry(int id, [FromBody] GpsEntryDeleteDto deleteDto)
        {
            try
            {
                var userId = "ec18aed0-2f9d-411c-9bbe-6079084ab2a5"; // TESTING: Hardcoded
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                // Ensure ID matches
                if (deleteDto.Id != id)
                {
                    return BadRequest(FMSResponse<object>.ValidationFailed(
                        new List<string> { "ID in URL must match ID in request body" }));
                }

                // Set the user ID from token
                deleteDto.DeletedBy = userId;

                var command = new DeleteGpsEntryCommand(deleteDto);
                var result = await _mediator.Send(command);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting GPS entry {id}");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user-specific fuel comparison settings
        /// </summary>
        /// <returns>User settings or defaults</returns>
        [HttpGet("settings")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                var userId = GetUserId();
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                var query = new GetUserSettingsQuery(userId.ToString());
                var result = await _mediator.Send(query);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user settings");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update user-specific fuel comparison settings
        /// </summary>
        /// <param name="settingsDto">Updated settings</param>
        /// <returns>Updated settings</returns>
        [HttpPut("settings")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateSettings([FromBody] FuelComparisonSettingsDto settingsDto)
        {
            try
            {
                var userId = GetUserId();
                // Removed user authentication check for testing
                // if (userId == 0)
                // {
                //     return Unauthorized(FMSResponse<object>.Failed("User not authenticated"));
                // }

                // Ensure user can only update their own settings
                if (settingsDto.UserId.ToString() != userId.ToString())
                {
                    return Forbid();
                }

                var command = new UpdateComparisonSettingsCommand(settingsDto);
                var result = await _mediator.Send(command);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user settings");
                return StatusCode(500, FMSResponse<object>.Failed($"Internal server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user ID from JWT token claims
        /// TESTING: Hardcoded to bypass authentication
        /// </summary>
        private int GetUserId()
        {
            // TESTING: Return hardcoded user ID for testing purposes
            // TODO: Remove this hardcoded value and restore authentication check
            var hardcodedGuid = "ec18aed0-2f9d-411c-9bbe-6079084ab2a5";

            // Try to parse GUID as int (using hash code)
            return Math.Abs(Guid.Parse(hardcodedGuid).GetHashCode());
        }
    }
}
