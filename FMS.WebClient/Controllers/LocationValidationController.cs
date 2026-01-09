using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.LocationValidation.DTOs;
using FMS.Application.Features.LocationValidation.Queries;
using FMS.Application.Features.LocationValidation.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers;

/// <summary>
/// Controller for viewing location validation logs
/// </summary>
[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class LocationValidationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILocationValidationService _locationValidationService;
    private readonly ILogger<LocationValidationController> _logger;

    public LocationValidationController(
        IMediator mediator,
        ILocationValidationService locationValidationService,
        ILogger<LocationValidationController> logger)
    {
        _mediator = mediator;
        _locationValidationService = locationValidationService;
        _logger = logger;
    }

    /// <summary>
    /// Get paginated list of location validation logs with optional filtering
    /// </summary>
    /// <param name="startDate">Filter by start date</param>
    /// <param name="endDate">Filter by end date</param>
    /// <param name="ptsId">Filter by PTS device ID</param>
    /// <param name="tankId">Filter by tank ID</param>
    /// <param name="vehicleId">Filter by vehicle ID</param>
    /// <param name="isValid">Filter by validation result (true/false)</param>
    /// <param name="validationResult">Filter by validation result type (Passed, Failed, Bypassed, Skipped)</param>
    /// <param name="pageNumber">Page number (default: 1)</param>
    /// <param name="pageSize">Page size (default: 50)</param>
    /// <returns>Paginated list of location validation logs</returns>
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? ptsId = null,
        [FromQuery] int? tankId = null,
        [FromQuery] int? vehicleId = null,
        [FromQuery] bool? isValid = null,
        [FromQuery] string? validationResult = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
    {
        var filter = new LocationValidationLogFilter
        {
            StartDate = startDate,
            EndDate = endDate,
            PtsId = ptsId,
            TankId = tankId,
            VehicleId = vehicleId,
            IsValid = isValid,
            ValidationResult = validationResult,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = await _mediator.Send(new GetLocationValidationLogsQuery(filter));

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Get a single location validation log by ID
    /// </summary>
    /// <param name="id">The log ID</param>
    /// <returns>The location validation log details</returns>
    [HttpGet("logs/{id:int}")]
    public async Task<IActionResult> GetLogById(int id)
    {
        var result = await _mediator.Send(new GetLocationValidationLogByIdQuery(id));

        if (result.IsSuccess)
        {
            return Ok(result);
        }

        if (result.ErrorType == Application.Common.ErrorType.NotFound)
        {
            return NotFound(result);
        }

        return BadRequest(result);
    }

    #region Diagnostic Endpoints

    /// <summary>
    /// Test geofence validation for a given location without actually authorizing fuel.
    /// Use this to diagnose why tankers may be fueling outside allowed geofences.
    /// </summary>
    /// <param name="request">The geofence validation request</param>
    /// <returns>Geofence validation result with detailed diagnostics</returns>
    [HttpPost("diagnostic/geofence")]
    public async Task<IActionResult> TestGeofenceValidation([FromBody] GeofenceValidationRequest request)
    {
        _logger.LogInformation(
            "[DIAGNOSTIC] Testing geofence validation - TankerLat: {TankerLat}, TankerLng: {TankerLng}, VehicleId: {VehicleId}",
            request.TankerLocation?.Latitude,
            request.TankerLocation?.Longitude,
            request.VehicleId);

        var result = await _locationValidationService.ValidateGeofenceAsync(request);

        return Ok(FMSResponse<GeofenceValidationResult>.Success(result,
            result.Outcome == ValidationOutcome.Passed ? "Geofence validation passed" :
            result.Outcome == ValidationOutcome.Failed ? "Geofence validation failed" :
            "Geofence validation skipped"));
    }

    /// <summary>
    /// Get the current location of a tank (for mobile tankers, fetches linked vehicle GPS).
    /// Use this to verify if the system can get the tanker's location.
    /// </summary>
    /// <param name="tankId">Tank ID</param>
    /// <returns>Current tank location with source information</returns>
    [HttpGet("diagnostic/tank/{tankId}/location")]
    public async Task<IActionResult> GetTankLocation(int tankId)
    {
        _logger.LogInformation("[DIAGNOSTIC] Getting tank location for TankId: {TankId}", tankId);

        var (location, source) = await _locationValidationService.GetTankLocationAsync(tankId);

        if (location == null)
        {
            return Ok(FMSResponse<object>.Failed($"Could not get location for tank {tankId}. Source: {source ?? "Unknown"}"));
        }

        return Ok(FMSResponse<object>.Success(new
        {
            TankId = tankId,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Source = source,
            Timestamp = location.Timestamp,
            IsValid = location.IsValid,
            Accuracy = location.Accuracy
        }, $"Tank location retrieved from {source}"));
    }

    /// <summary>
    /// Get the current GPS location of a vehicle.
    /// Use this to verify if the system can get a vehicle's GPS position.
    /// </summary>
    /// <param name="vehicleId">Vehicle ID</param>
    /// <returns>Current vehicle GPS location</returns>
    [HttpGet("diagnostic/vehicle/{vehicleId}/location")]
    public async Task<IActionResult> GetVehicleLocation(int vehicleId)
    {
        _logger.LogInformation("[DIAGNOSTIC] Getting vehicle location for VehicleId: {VehicleId}", vehicleId);

        var location = await _locationValidationService.GetVehicleLocationAsync(vehicleId);

        if (location == null)
        {
            return Ok(FMSResponse<object>.Failed($"Could not get GPS location for vehicle {vehicleId}. Vehicle may not have GPS tracking or device is offline."));
        }

        return Ok(FMSResponse<object>.Success(new
        {
            VehicleId = vehicleId,
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Source = location.Source,
            Timestamp = location.Timestamp,
            IsValid = location.IsValid,
            Accuracy = location.Accuracy,
            IsGPSValid = location.IsGPSValid,
            DeviceActivityTime = location.DeviceActivityTime
        }, "Vehicle GPS location retrieved"));
    }

    /// <summary>
    /// Get all geofence IDs that are currently allowed for fueling (from groups with IsAllowedForFueling=true).
    /// Use this to verify which geofences should be checked during fueling authorization.
    /// </summary>
    /// <returns>List of allowed geofence IDs</returns>
    [HttpGet("diagnostic/geofences/allowed")]
    public async Task<IActionResult> GetAllowedGeofences()
    {
        _logger.LogInformation("[DIAGNOSTIC] Getting allowed fueling geofences");

        // Pass 0 as ruleSetId since global policy now ignores it
        var geofenceIds = await _locationValidationService.GetRuleSetGeofenceIdsAsync(0);

        return Ok(FMSResponse<object>.Success(new
        {
            AllowedGeofenceCount = geofenceIds.Count,
            GeofenceIds = geofenceIds
        }, $"Found {geofenceIds.Count} geofences allowed for fueling"));
    }

    /// <summary>
    /// Check if a specific coordinate point is within any of the allowed fueling geofences.
    /// Use this to test if a location would pass geofence validation.
    /// </summary>
    /// <param name="latitude">Latitude coordinate</param>
    /// <param name="longitude">Longitude coordinate</param>
    /// <returns>Result indicating if point is inside any allowed geofence</returns>
    [HttpGet("diagnostic/geofences/check")]
    public async Task<IActionResult> CheckPointInGeofences(
        [FromQuery] decimal latitude,
        [FromQuery] decimal longitude)
    {
        _logger.LogInformation("[DIAGNOSTIC] Checking if point ({Lat}, {Lng}) is in any allowed geofence",
            latitude, longitude);

        // Get allowed geofence IDs
        var geofenceIds = await _locationValidationService.GetRuleSetGeofenceIdsAsync(0);

        if (geofenceIds.Count == 0)
        {
            return Ok(FMSResponse<object>.Success(new
            {
                IsInGeofence = false,
                Latitude = latitude,
                Longitude = longitude,
                Message = "No geofences are configured as allowed for fueling (no groups with IsAllowedForFueling=true)"
            }, "No allowed geofences configured"));
        }

        var (isInGeofence, matchingId, matchingName) = await _locationValidationService.CheckLocationInGeofencesAsync(
            latitude, longitude, geofenceIds);

        return Ok(FMSResponse<object>.Success(new
        {
            IsInGeofence = isInGeofence,
            Latitude = latitude,
            Longitude = longitude,
            MatchingGeofenceId = matchingId,
            MatchingGeofenceName = matchingName,
            GeofencesChecked = geofenceIds.Count
        }, isInGeofence
            ? $"Point is inside geofence '{matchingName}' (ID: {matchingId})"
            : $"Point is NOT inside any of the {geofenceIds.Count} allowed geofences"));
    }

    #endregion
}
