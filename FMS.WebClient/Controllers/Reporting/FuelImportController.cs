using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.FuelImport.Commands;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Application.Features.FuelImport.Queries;
using FMS.Application.Features.FuelImport.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;
using System.Security.Claims;

namespace FMS.WebClient.Controllers.Reporting
{
    [ApiController]
    [Route("api/v1/fuel-import")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Report.VehicleConsumption)]
    public class FuelImportController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<FuelImportController> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly IServiceScopeFactory _scopeFactory;

        /// <summary>
        /// Tracks running import jobs so they can be cancelled.
        /// Key = jobId, Value = CancellationTokenSource for that job.
        /// </summary>
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _runningJobs = new();

        public FuelImportController(
            IMediator mediator,
            ILogger<FuelImportController> logger,
            IHubContext<FrontEndHub> hubContext,
            IServiceScopeFactory scopeFactory)
        {
            _mediator = mediator;
            _logger = logger;
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;
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

        /// <summary>
        /// Trigger on-demand auto-import from network share.
        /// Scans configured directories, detects new/changed files, parses and imports them.
        /// </summary>
        [HttpPost("auto-import")]
        public async Task<IActionResult> AutoImport([FromBody] AutoImportFuelReportsCommand command)
        {
            try
            {
                // Set user from JWT claims
                var userId = User.FindFirst("UserId")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? "SYSTEM";
                command.UserId = userId;

                _logger.LogInformation("Auto-import triggered by user {UserId}. BatchSize: {Batch}, Type: {Type}",
                    userId, command.BatchSize, command.ReportTypeFilter ?? "all");

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering auto-import");
                return StatusCode(500, FMSResponse<object>.Failed($"Auto-import failed: {ex.Message}"));
            }
        }

        /// <summary>
        /// Trigger on-demand auto-import for a specific profile.
        /// Returns 202 Accepted immediately and runs the import in the background.
        /// Progress and results are broadcast via SignalR (FuelImportJobStarted, FuelImportCompleted, FuelImportError).
        /// </summary>
        [HttpPost("auto-import/profile/{profileId}")]
        public IActionResult AutoImportByProfile(string profileId)
        {
            if (string.IsNullOrWhiteSpace(profileId))
                return BadRequest(FMSResponse<object>.Failed("ProfileId is required."));

            var userId = User.FindFirst("UserId")?.Value
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? "SYSTEM";

            var jobId = Guid.NewGuid().ToString();

            _logger.LogInformation("Per-profile auto-import queued. JobId: {JobId}, ProfileId: {ProfileId}, User: {UserId}",
                jobId, profileId, userId);

            _ = Task.Run(async () =>
            {
                var cts = new CancellationTokenSource();
                _runningJobs.TryAdd(jobId, cts);

                using var scope = _scopeFactory.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<FuelImportController>>();

                try
                {
                    await _hubContext.Clients.All.SendAsync("FuelImportJobStarted", new
                    {
                        jobId,
                        profileId,
                        userId,
                        startedAt = DateTime.UtcNow
                    });

                    var command = new AutoImportFuelReportsCommand
                    {
                        ProfileId = profileId,
                        UserId = userId
                    };

                    var result = await mediator.Send(command, cts.Token);

                    await _hubContext.Clients.All.SendAsync("FuelImportCompleted", new
                    {
                        jobId,
                        profileId,
                        userId,
                        completedAt = DateTime.UtcNow,
                        isSuccess = result.IsSuccess,
                        message = result.IsSuccess ? "Import completed successfully" : "Import completed with errors",
                        data = result.Data
                    });

                    logger.LogInformation("Per-profile auto-import completed. JobId: {JobId}, ProfileId: {ProfileId}, Success: {IsSuccess}",
                        jobId, profileId, result.IsSuccess);
                }
                catch (OperationCanceledException)
                {
                    logger.LogInformation("Per-profile auto-import cancelled. JobId: {JobId}, ProfileId: {ProfileId}", jobId, profileId);

                    await _hubContext.Clients.All.SendAsync("FuelImportCancelled", new
                    {
                        jobId,
                        profileId,
                        userId,
                        cancelledAt = DateTime.UtcNow,
                        message = "Import was cancelled by user"
                    });
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Per-profile auto-import failed. JobId: {JobId}, ProfileId: {ProfileId}", jobId, profileId);

                    await _hubContext.Clients.All.SendAsync("FuelImportError", new
                    {
                        jobId,
                        profileId,
                        userId,
                        errorAt = DateTime.UtcNow,
                        message = ex.Message
                    });
                }
                finally
                {
                    _runningJobs.TryRemove(jobId, out _);
                    cts.Dispose();
                }
            });

            return Accepted(FMSResponse<object>.Success(new { jobId, profileId, message = "Import started in background" }));
        }

        /// <summary>
        /// Cancel a running background import job.
        /// </summary>
        [HttpPost("auto-import/{jobId}/cancel")]
        [RequirePermission(Permissions.FuelImport.Manage)]
        public IActionResult CancelImportJob(string jobId)
        {
            if (string.IsNullOrWhiteSpace(jobId))
                return BadRequest(FMSResponse<object>.Failed("JobId is required."));

            if (!_runningJobs.TryGetValue(jobId, out var cts))
                return NotFound(FMSResponse<object>.Failed($"No running import job found with ID '{jobId}'."));

            _logger.LogInformation("Cancel requested for import job {JobId}", jobId);
            cts.Cancel();

            return Ok(FMSResponse<object>.Success(new { jobId, message = "Cancellation requested" }));
        }

        /// <summary>
        /// Import a single file by path (for testing/debugging).
        /// </summary>
        [HttpPost("auto-import/single")]
        public async Task<IActionResult> AutoImportSingle([FromBody] SingleFileImportRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.FilePath))
                    return BadRequest(FMSResponse<object>.Failed("FilePath is required."));

                var userId = User.FindFirst("UserId")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? "SYSTEM";

                var command = new AutoImportFuelReportsCommand
                {
                    SingleFilePath = request.FilePath,
                    UserId = userId
                };

                _logger.LogInformation("Single file auto-import triggered: {FilePath} by {User}",
                    request.FilePath, userId);

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing single file: {FilePath}", request.FilePath);
                return StatusCode(500, FMSResponse<object>.Failed($"Single file import failed: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get file tracker summary statistics.
        /// </summary>
        [HttpGet("auto-import/summary")]
        public async Task<IActionResult> GetAutoImportSummary(
            [FromServices] IFileTrackerService fileTrackerService)
        {
            try
            {
                var summary = await fileTrackerService.GetSummaryAsync();
                return Ok(FMSResponse<FileTrackerSummary>.Success(summary));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching auto-import summary");
                return StatusCode(500, FMSResponse<object>.Failed("Failed to fetch auto-import summary."));
            }
        }

        /// <summary>
        /// Get paginated list of file tracker records with filtering and summary stats.
        /// </summary>
        [HttpGet("auto-import/files")]
        public async Task<IActionResult> GetFileTrackerList(
            [FromQuery] string? status,
            [FromQuery] string? reportType,
            [FromQuery] string? search,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string sortBy = "UpdatedAt",
            [FromQuery] string sortDirection = "desc")
        {
            try
            {
                var query = new GetFileTrackerListQuery
                {
                    Status = status,
                    ReportType = reportType,
                    Search = search,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                    Page = page,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    SortDirection = sortDirection,
                };

                var result = await _mediator.Send(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching file tracker list");
                return StatusCode(500, FMSResponse<object>.Failed("Failed to fetch file tracker list."));
            }
        }

        /// <summary>
        /// Clear (delete) file tracker log records. Excludes records with Processing status.
        /// </summary>
        [HttpDelete("auto-import/files")]
        [RequirePermission(Permissions.FuelImport.Manage)]
        public async Task<IActionResult> ClearFileTrackerLogs(
            [FromQuery] string? status,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo)
        {
            try
            {
                var command = new ClearFileTrackerLogsCommand
                {
                    Status = status,
                    DateFrom = dateFrom,
                    DateTo = dateTo,
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing file tracker logs");
                return StatusCode(500, FMSResponse<object>.Failed("Failed to clear file tracker logs."));
            }
        }

        /// <summary>
        /// Retry a failed file import by tracker ID.
        /// </summary>
        [HttpPost("auto-import/files/{id}/retry")]
        [RequirePermission(Permissions.FuelImport.Manage)]
        public async Task<IActionResult> RetryFileImport(
            int id,
            [FromServices] IFileTrackerService fileTrackerService,
            [FromServices] IFuelAutoImportService autoImportService)
        {
            try
            {
                // Load tracker record by ID
                var tracker = await fileTrackerService.GetByIdAsync(id);
                if (tracker == null)
                    return NotFound(FMSResponse<object>.Failed($"File tracker record {id} not found."));

                if (tracker.Status != "Failed" && tracker.Status != "Skipped")
                    return BadRequest(FMSResponse<object>.Failed($"Only Failed or Skipped files can be retried. Current status: {tracker.Status}"));

                var userId = User.FindFirst("UserId")?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? "SYSTEM";

                _logger.LogInformation("Retry import triggered for file {Id} ({FileName}) by {User}",
                    id, tracker.FileName, userId);

                var result = await autoImportService.ImportSingleFileAsync(tracker.FilePath, userId);
                return Ok(FMSResponse<AutoImportResult>.Success(result,
                    $"Retry completed: {result.FilesSucceeded} succeeded, {result.FilesFailed} failed."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying file import for tracker {Id}", id);
                return StatusCode(500, FMSResponse<object>.Failed($"Retry failed: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get fuel auto-import settings from SystemConfigurations.
        /// </summary>
        [HttpGet("auto-import/settings")]
        [RequirePermission(Permissions.FuelImport.Read)]
        public async Task<IActionResult> GetAutoImportSettings()
        {
            try
            {
                var result = await _mediator.Send(new GetAutoImportSettingsQuery());
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching auto-import settings");
                return StatusCode(500, FMSResponse<object>.Failed("Failed to fetch auto-import settings."));
            }
        }

        /// <summary>
        /// Update fuel auto-import settings in SystemConfigurations.
        /// </summary>
        [HttpPut("auto-import/settings")]
        [RequirePermission(Permissions.FuelImport.Manage)]
        public async Task<IActionResult> UpdateAutoImportSettings(
            [FromBody] FuelAutoImportSettingsDto settings)
        {
            try
            {
                if (settings == null)
                    return BadRequest(FMSResponse<object>.Failed("Settings body is required."));

                var userId = User.FindFirst("UserId")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? "System";

                var command = new UpdateAutoImportSettingsCommand
                {
                    Settings = settings,
                    ModifiedBy = userId
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating auto-import settings");
                return StatusCode(500, FMSResponse<object>.Failed("Failed to update auto-import settings."));
            }
        }
    }

    /// <summary>
    /// Request body for single file import endpoint.
    /// </summary>
    public class SingleFileImportRequest
    {
        public string FilePath { get; set; } = null!;
    }
}
