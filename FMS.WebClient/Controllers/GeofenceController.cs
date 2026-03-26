/**
 * File: GeofenceController.cs
 * Purpose: Manages geofence data, sync jobs, and location validation bypass operations.
 * Dependencies: MediatR geofence commands/queries, JWT claims, logging.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - StartSyncJob(): Starts asynchronous geofence synchronization jobs.
 * - UpdateGroupAllowedForFueling(): Updates global allowed-group settings.
 * - EnableTemporaryBypass(): Enables temporary location validation bypass.
 */
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.Commands;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Geofence.Queries;
using FMS.Application.Features.LocationValidation.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers;

/// <summary>
/// Controller for managing geofences, geofence groups, and location validation settings
/// </summary>
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[ApiController]
[Route("api/v1/[controller]")]
[RequirePermission(Permissions.Geofence.Read)]
public class GeofenceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<GeofenceController> _logger;

    public GeofenceController(IMediator mediator, ILogger<GeofenceController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    private bool TryGetCurrentUserId(out string userId)
    {
        userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? string.Empty;

        return !string.IsNullOrWhiteSpace(userId);
    }

    private string GetCurrentUserId()
    {
        return TryGetCurrentUserId(out var userId) ? userId : "system";
    }

    private string GetCurrentUserName()
    {
        return User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("name") ?? GetCurrentUserId();
    }

    #region Geofences

    /// <summary>
    /// Get all cached geofences
    /// </summary>
    [HttpGet("geofences")]
    public async Task<IActionResult> GetGeofences([FromQuery] bool onlyActive = true)
    {
        var result = await _mediator.Send(new GetGeofenceListQuery(onlyActive));
        return Ok(FMSResponse<object>.Success(result, $"Retrieved {result.Count} geofences"));
    }

    /// <summary>
    /// Get a geofence by ID
    /// </summary>
    [HttpGet("geofences/{id}")]
    public async Task<IActionResult> GetGeofenceById(int id)
    {
        var result = await _mediator.Send(new GetGeofenceByIdQuery(id));
        if (result == null)
        {
            return NotFound(FMSResponse<object>.Failed($"Geofence with ID {id} not found"));
        }
        return Ok(FMSResponse<GpsGeofenceDTO>.Success(result, "Geofence retrieved successfully"));
    }

    /// <summary>
    /// Sync geofences from GPSGate (synchronous - blocks until complete)
    /// For long-running syncs, use the async endpoint POST /geofences/sync-jobs instead
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPost("geofences/sync")]
    public async Task<IActionResult> SyncGeofences([FromBody] SyncGeofencesRequestDTO? request)
    {
        var command = new SyncGeofencesCommand
        {
            ForceFullSync = request?.ForceFullSync ?? false
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new GPSGate geofence and sync it into the local cache.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPost("geofences")]
    public async Task<IActionResult> CreateGeofence([FromBody] CreateGeofenceRequestDTO request)
    {
        var result = await _mediator.Send(new CreateGeofenceCommand { Request = request });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a synced GPSGate geofence and mark it inactive locally.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpDelete("geofences/{id}")]
    public async Task<IActionResult> DeleteGeofence(int id)
    {
        var result = await _mediator.Send(new DeleteGeofenceCommand { LocalGeofenceId = id });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing GPSGate geofence and sync it into the local cache.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPut("geofences/{id}")]
    public async Task<IActionResult> UpdateGeofence(int id, [FromBody] CreateGeofenceRequestDTO request)
    {
        var result = await _mediator.Send(new UpdateGeofenceCommand { GeofenceId = id, Request = request });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update the operational classification of a geofence (Parking, Load, Dump, Fuel, Workshop).
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPatch("geofences/{id}/classification")]
    public async Task<IActionResult> UpdateGeofenceClassification(int id, [FromBody] UpdateGeofenceClassificationRequestDTO request)
    {
        var result = await _mediator.Send(new UpdateGeofenceClassificationCommand
        {
            LocalGeofenceId = id,
            Classification = request.Classification
        });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Async Sync Jobs

    /// <summary>
    /// Start an asynchronous geofence sync job
    /// Returns immediately with a job ID that can be used to poll for status.
    /// If GroupIds are provided, only those specific groups will be synced (selective sync).
    /// If GroupIds are not provided, all geofences and groups will be synced (full sync).
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPost("sync-jobs")]
    public async Task<IActionResult> StartSyncJob([FromBody] SyncGeofencesRequestDTO? request)
    {
        var command = new StartGeofenceSyncJobCommand
        {
            ForceFullSync = request?.ForceFullSync ?? false,
            InitiatedBy = GetCurrentUserName(),
            GroupIds = request?.GroupIds
        };

        var result = await _mediator.Send(command);

        if (result.IsSuccess)
        {
            // Return 202 Accepted for async operations
            return AcceptedAtAction(
                nameof(GetSyncJobStatus),
                new { jobId = result.Data?.JobId },
                result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Get the status of a sync job by ID
    /// </summary>
    [HttpGet("sync-jobs/{jobId}")]
    public async Task<IActionResult> GetSyncJobStatus(string jobId)
    {
        var result = await _mediator.Send(new GetGeofenceSyncJobStatusQuery(jobId));

        if (!result.IsSuccess)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get recent sync job history
    /// </summary>
    [HttpGet("sync-jobs")]
    public async Task<IActionResult> GetSyncJobHistory([FromQuery] int limit = 10)
    {
        if (limit < 1 || limit > 100)
        {
            limit = 10;
        }

        var result = await _mediator.Send(new GetGeofenceSyncJobHistoryQuery(limit));
        return Ok(result);
    }

    #endregion

    #region Geofence Groups

    /// <summary>
    /// Get available geofence groups directly from GPSGate.
    /// This is a lightweight call that returns groups with their sync status.
    /// Use this to show users which groups are available to sync.
    /// </summary>
    [HttpGet("available-groups")]
    public async Task<IActionResult> GetAvailableGeofenceGroups()
    {
        var result = await _mediator.Send(new GetAvailableGeofenceGroupsQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all cached geofence groups
    /// </summary>
    [HttpGet("groups")]
    public async Task<IActionResult> GetGeofenceGroups([FromQuery] bool onlyActive = true, [FromQuery] bool includeGeofences = false)
    {
        var result = await _mediator.Send(new GetGeofenceGroupListQuery(onlyActive, includeGeofences));
        return Ok(FMSResponse<object>.Success(result, $"Retrieved {result.Count} geofence groups"));
    }

    /// <summary>
    /// Get a geofence group by ID with its geofences
    /// </summary>
    [HttpGet("groups/{id}")]
    public async Task<IActionResult> GetGeofenceGroupById(int id)
    {
        var result = await _mediator.Send(new GetGeofenceGroupByIdQuery(id));
        if (result == null)
        {
            return NotFound(FMSResponse<object>.Failed($"Geofence group with ID {id} not found"));
        }
        return Ok(FMSResponse<GpsGeofenceGroupDTO>.Success(result, "Geofence group retrieved successfully"));
    }

    /// <summary>
    /// Create a GPSGate geofence group and sync it into local cache.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPost("groups")]
    public async Task<IActionResult> CreateGeofenceGroup([FromBody] CreateGeofenceGroupRequestDTO request)
    {
        var result = await _mediator.Send(new CreateGeofenceGroupCommand { Request = request });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a synced GPSGate geofence group.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPut("groups/{id}")]
    public async Task<IActionResult> UpdateGeofenceGroup(int id, [FromBody] UpdateGeofenceGroupRequestDTO request)
    {
        var result = await _mediator.Send(new UpdateGeofenceGroupCommand
        {
            LocalGroupId = id,
            Request = request
        });

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a synced GPSGate geofence group.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpDelete("groups/{id}")]
    public async Task<IActionResult> DeleteGeofenceGroup(int id)
    {
        var result = await _mediator.Send(new DeleteGeofenceGroupCommand { LocalGroupId = id });
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add an existing synced geofence to an existing synced group.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPost("groups/{id}/geofences")]
    public async Task<IActionResult> AddGeofenceToGroup(int id, [FromBody] GeofenceGroupMembershipRequestDTO request)
    {
        var result = await _mediator.Send(new AddGeofenceToGroupCommand
        {
            LocalGroupId = id,
            LocalGeofenceId = request.GeofenceId
        });

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a synced geofence from a synced group.
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpDelete("groups/{groupId}/geofences/{geofenceId}")]
    public async Task<IActionResult> RemoveGeofenceFromGroup(int groupId, int geofenceId)
    {
        var result = await _mediator.Send(new RemoveGeofenceFromGroupCommand
        {
            LocalGroupId = groupId,
            LocalGeofenceId = geofenceId
        });

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a geofence group's IsAllowedForFueling flag
    /// This is part of the global geofence policy - when enabled, fueling is allowed within this group's geofences
    /// </summary>
    [RequirePermission(Permissions.Geofence.Manage)]
    [HttpPatch("groups/{id}/allowed-for-fueling")]
    public async Task<IActionResult> UpdateGroupAllowedForFueling(int id, [FromBody] UpdateGroupAllowedForFuelingRequestDTO request)
    {
        // Optional validation: if GroupId is provided in body, it should match URL
        if (request.GroupId.HasValue && request.GroupId.Value != id)
        {
            return BadRequest(FMSResponse<object>.Failed("Group ID in request body does not match URL parameter"));
        }

        var command = new UpdateGroupAllowedForFuelingCommand
        {
            GroupId = id,
            IsAllowedForFueling = request.IsAllowedForFueling,
            UpdatedBy = GetCurrentUserName()
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Temporary Location Bypass

    /// <summary>
    /// Get the current temporary bypass status
    /// </summary>
    [HttpGet("validation/temporary-bypass")]
    public async Task<IActionResult> GetTemporaryBypassStatus()
    {
        var result = await _mediator.Send(new GetTemporaryBypassStatusQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Enable temporary location validation bypass.
    /// Supports system-wide, vehicle-specific, and user-specific bypasses.
    /// </summary>
    /// <param name="request">Bypass configuration including type, duration, and target IDs</param>
    /// <returns>The bypass status including active bypasses</returns>
    [RequirePermission(Permissions.Geofence.ManageBypass)]
    [HttpPost("validation/temporary-bypass")]
    public async Task<IActionResult> EnableTemporaryBypass([FromBody] EnableTemporaryBypassRequestDTO request)
    {
        var command = new EnableTemporaryBypassCommand
        {
            DurationMinutes = request.DurationMinutes,
            Reason = request.Reason,
            EnabledBy = GetCurrentUserName(),
            BypassType = request.BypassType,
            VehicleIds = request.VehicleIds,
            UserIds = request.UserIds
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel the current temporary bypass
    /// </summary>
    [RequirePermission(Permissions.Geofence.ManageBypass)]
    [HttpDelete("validation/temporary-bypass")]
    public async Task<IActionResult> CancelTemporaryBypass()
    {
        var command = new CancelTemporaryBypassCommand
        {
            CancelledBy = GetCurrentUserName()
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel a specific bypass by its ID
    /// </summary>
    /// <param name="bypassId">The ID of the bypass to cancel</param>
    [RequirePermission(Permissions.Geofence.ManageBypass)]
    [HttpDelete("validation/temporary-bypass/{bypassId}")]
    public async Task<IActionResult> CancelBypassById(int bypassId)
    {
        var command = new CancelBypassByIdCommand
        {
            BypassId = bypassId,
            CancelledBy = GetCurrentUserName()
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get location bypass history with filtering and pagination
    /// </summary>
    /// <param name="bypassType">Filter by type: 'All', 'Vehicle', 'User' (optional)</param>
    /// <param name="vehicleId">Filter by vehicle ID (optional)</param>
    /// <param name="userId">Filter by user ID (optional)</param>
    /// <param name="isActive">Filter by active status (optional)</param>
    /// <param name="startDate">Filter by start date (optional)</param>
    /// <param name="endDate">Filter by end date (optional)</param>
    /// <param name="enabledBy">Filter by who enabled the bypass (optional)</param>
    /// <param name="pageNumber">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    [HttpGet("validation/bypass-history")]
    public async Task<IActionResult> GetBypassHistory(
        [FromQuery] string? bypassType = null,
        [FromQuery] int? vehicleId = null,
        [FromQuery] string? userId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? enabledBy = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = new GetLocationBypassHistoryQuery
        {
            BypassType = bypassType,
            VehicleId = vehicleId,
            UserId = userId,
            IsActive = isActive,
            StartDate = startDate,
            EndDate = endDate,
            EnabledBy = enabledBy,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _mediator.Send(query);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get location settings overview showing:
    /// - Users with mobile bypass settings
    /// - PTS devices with location validation settings
    /// - Vehicles with GPS settings
    /// </summary>
    [HttpGet("validation/settings-overview")]
    public async Task<IActionResult> GetLocationSettingsOverview()
    {
        var result = await _mediator.Send(new GetLocationSettingsOverviewQuery());
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Deprecated Endpoints - To Be Removed

    /// <summary>
    /// [DEPRECATED] Get geofence configuration for a fueling rule set
    /// NOTE: Geofence validation is now a GLOBAL policy. Use the Allowed Groups feature instead.
    /// </summary>
    [Obsolete("Geofence validation is now a global policy. Per-ruleset configuration is no longer supported.")]
    [HttpGet("rulesets/{ruleSetId}/config")]
    public IActionResult GetRuleSetGeofenceConfig(int ruleSetId)
    {
        return BadRequest(FMSResponse<object>.Failed(
            "This endpoint is deprecated. Geofence validation is now a global policy managed via the 'Allowed Groups' feature. " +
            "Use GET /groups to see which groups are allowed for fueling."));
    }

    /// <summary>
    /// [DEPRECATED] Update geofence configuration for a fueling rule set
    /// NOTE: Geofence validation is now a GLOBAL policy. Use the Allowed Groups feature instead.
    /// </summary>
    [Obsolete("Geofence validation is now a global policy. Per-ruleset configuration is no longer supported.")]
    [HttpPut("rulesets/{ruleSetId}/config")]
    public IActionResult UpdateRuleSetGeofenceConfig(int ruleSetId, [FromBody] object request)
    {
        return BadRequest(FMSResponse<object>.Failed(
            "This endpoint is deprecated. Geofence validation is now a global policy managed via the 'Allowed Groups' feature. " +
            "Use PATCH /groups/{id}/allowed-for-fueling to enable/disable groups."));
    }

    /// <summary>
    /// [DEPRECATED] Fixed location vehicles feature has been removed.
    /// Use geofences in GPSGate to define valid fueling areas for stationary equipment.
    /// </summary>
    [Obsolete("Fixed location vehicles feature has been removed. Use GPSGate geofences instead.")]
    [HttpGet("vehicles/fixed-locations")]
    public IActionResult GetFixedLocationVehicles()
    {
        return BadRequest(FMSResponse<object>.Failed(
            "This endpoint is deprecated. The fixed location vehicles feature has been removed. " +
            "Use geofences in GPSGate to define valid fueling areas for stationary equipment."));
    }

    #endregion
}

/// <summary>
/// Request DTO for assigning a geofence
/// </summary>
public class AssignGeofenceRequest
{
    public int GeofenceId { get; set; }
}

/// <summary>
/// Request DTO for assigning a geofence group
/// </summary>
public class AssignGeofenceGroupRequest
{
    public int GeofenceGroupId { get; set; }
}

