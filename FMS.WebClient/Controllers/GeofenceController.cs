using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Geofence.Commands;
using FMS.Application.Features.Geofence.DTOs;
using FMS.Application.Features.Geofence.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers;

/// <summary>
/// Controller for managing geofences, geofence groups, and location validation settings
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class GeofenceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<GeofenceController> _logger;

    public GeofenceController(IMediator mediator, ILogger<GeofenceController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "system";
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
    /// Sync geofences from GPSGate
    /// </summary>
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

    #endregion

    #region Geofence Groups

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
    /// Update a geofence group's IsAllowedForFueling flag
    /// This is part of the global geofence policy - when enabled, fueling is allowed within this group's geofences
    /// </summary>
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
    /// Enable temporary location validation bypass
    /// WARNING: This will disable ALL location validation for the specified duration
    /// </summary>
    [HttpPost("validation/temporary-bypass")]
    public async Task<IActionResult> EnableTemporaryBypass([FromBody] EnableTemporaryBypassRequestDTO request)
    {
        var command = new EnableTemporaryBypassCommand
        {
            DurationMinutes = request.DurationMinutes,
            Reason = request.Reason,
            EnabledBy = GetCurrentUserName()
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel the current temporary bypass
    /// </summary>
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

