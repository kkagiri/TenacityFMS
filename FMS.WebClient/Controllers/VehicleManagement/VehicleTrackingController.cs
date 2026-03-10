/// <summary>
/// File: VehicleTrackingController.cs
/// Purpose: Exposes vehicle tracking APIs including live location retrieval and user preference persistence.
/// Dependencies: MediatR, GPS provider services, GpsdataContext, FMSResponse, VehicleTrackingUserPreferenceDto
/// Last Modified: 2026-03-09
///
/// Key Actions:
/// - GetTags(): Retrieves available GPS tracking tags and views.
/// - GetVehiclesByTag(): Retrieves live vehicles for a selected tag.
/// - GetPreferences(): Retrieves persisted vehicle tracking page preferences for the current user.
/// </summary>
using System.Security.Claims;
using FMS.Application.Features.Vehicle.Queries.VehicleTracking;
using FMS.Application.Features.Vehicle.Services;
using FMS.Application.Common;
using FMS.Domain.Entities.Dashboard;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using FMS.Persistence.DataAccess;
using FMS.WebClient.Models.VehicleManagement;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/vehicletracking")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Vehicle.Read)]
    public class VehicleTrackingController : ControllerBase
    {
        private const string VehicleTrackingPreferenceLayoutName = "VehicleTracking.Preference";
        private readonly IMediator _mediator;
        private readonly IGPSService _gpsService;
        private readonly IGPSGateViewsService _viewsService;
        private readonly IGPSGateTracksService _tracksService;
        private readonly GpsdataContext _context;
        private readonly ILogger<VehicleTrackingController> _logger;

        public VehicleTrackingController(
            IMediator mediator,
            IGPSService gpsService,
            IGPSGateViewsService viewsService,
            IGPSGateTracksService tracksService,
            GpsdataContext context,
            ILogger<VehicleTrackingController> logger)
        {
            _mediator = mediator;
            _gpsService = gpsService;
            _viewsService = viewsService;
            _tracksService = tracksService;
            _context = context;
            _logger = logger;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue("userId")
                ?? string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        private string GetCurrentUserIdOrDefault(string fallback = "system")
        {
            return TryGetCurrentUserId(out var userId) ? userId : fallback;
        }

        private string CurrentUserId => GetCurrentUserIdOrDefault(User?.Identity?.Name ?? "system");
        private string CurrentActor => User?.Identity?.Name ?? CurrentUserId;

        /// <summary>
        /// Get vehicle location by ID for dispatch module
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle location data</returns>
        [HttpGet("{vehicleId}/location")]
        public async Task<IActionResult> GetVehicleLocation(int vehicleId)
        {
            try
            {
                var query = new GetVehicleLocationQuery { VehicleId = vehicleId };
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting location for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get vehicle odometer for maintenance module
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle odometer data</returns>
        [HttpGet("{vehicleId}/odometer")]
        public async Task<IActionResult> GetVehicleOdometer(int vehicleId)
        {
            try
            {
                var query = new GetVehicleOdometerQuery { VehicleId = vehicleId };
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting odometer for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all vehicle locations
        /// </summary>
        /// <param name="onlineOnly">Filter to online vehicles only</param>
        /// <param name="gpsEnabledOnly">Filter to GPS-enabled vehicles only</param>
        /// <returns>List of vehicle locations</returns>
        [HttpGet("locations")]
        public async Task<IActionResult> GetAllVehicleLocations(
            [FromQuery] bool onlineOnly = false, [FromQuery] bool gpsEnabledOnly = true)
        {
            try
            {
                var query = new GetAllVehicleLocationsQuery
                {
                    OnlineOnly = onlineOnly,
                    GPSEnabledOnly = gpsEnabledOnly
                };

                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all vehicle locations");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Check if a vehicle is online
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle online status</returns>
        [HttpGet("{vehicleId}/online-status")]
        public async Task<IActionResult> GetVehicleOnlineStatus(int vehicleId)
        {
            try
            {
                var result = await _gpsService.IsVehicleOnlineAsync(vehicleId);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking online status for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Validate GPS connection
        /// </summary>
        /// <returns>Connection status</returns>
        [HttpGet("connection-status")]
        public async Task<IActionResult> GetConnectionStatus()
        {
            try
            {
                var result = await _gpsService.ValidateConnectionAsync();

                return Ok(new
                {
                    Success = result.IsSuccess,
                    IsConnected = result.Data,
                    Message = result.IsSuccess ? "GPS connection is healthy" : result.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating GPS connection");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get GPS-enabled vehicles summary for dashboard
        /// </summary>
        /// <returns>GPS vehicles summary</returns>
        [HttpGet("summary")]
        public async Task<IActionResult> GetGPSVehiclesSummary()
        {
            try
            {
                var allLocationsQuery = new GetAllVehicleLocationsQuery { GPSEnabledOnly = true };
                var result = await _mediator.Send(allLocationsQuery);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                var vehicles = result.Data ?? new List<FMS.Application.Features.Vehicle.DTOs.VehicleLocationDTO>();

                var summary = new
                {
                    TotalGPSVehicles = vehicles.Count,
                    OnlineVehicles = vehicles.Count(v => v.IsOnline),
                    OfflineVehicles = vehicles.Count(v => !v.IsOnline),
                    InTransitVehicles = vehicles.Count(v => v.IsMoving),
                    ParkedVehicles = vehicles.Count(v => v.IsOnline && !v.IsMoving),
                    LastUpdated = DateTime.UtcNow
                };

                return Ok(new
                {
                    Success = true,
                    Data = summary,
                    Message = "GPS vehicles summary retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPS vehicles summary");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get comprehensive GPS information including location and sensor data
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Vehicle GPS information</returns>
        [HttpGet("{vehicleId}/gps-information")]
        public async Task<IActionResult> GetVehicleGPSInformation(int vehicleId)
        {
            try
            {
                var query = new GetVehicleGPSInformationQuery { VehicleId = vehicleId };
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPS information for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all views (vehicle groups) from GPS provider
        /// </summary>
        /// <returns>List of views</returns>
        [HttpGet("views")]
        public async Task<IActionResult> GetViews()
        {
            try
            {
                var result = await _viewsService.GetViewsAsync();

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPS views");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all tags from GPS provider
        /// </summary>
        /// <returns>List of tags</returns>
        [HttpGet("tags")]
        public async Task<IActionResult> GetTags()
        {
            try
            {
                var result = await _viewsService.GetTagsAsync();

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GPS tags");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get persisted vehicle tracking page preferences for the current user.
        /// </summary>
        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferences()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized(FMSResponse<VehicleTrackingUserPreferenceDto>.Unauthorized());
            }

            try
            {
                var entity = await _context.UserDashboardLayouts
                    .AsNoTracking()
                    .FirstOrDefaultAsync(layout => layout.UserId == userId && layout.LayoutName == VehicleTrackingPreferenceLayoutName);

                if (entity == null || string.IsNullOrWhiteSpace(entity.LayoutJson))
                {
                    return Ok(FMSResponse<VehicleTrackingUserPreferenceDto>.Success(new VehicleTrackingUserPreferenceDto(), "Vehicle tracking preferences retrieved successfully"));
                }

                var preferences = JsonConvert.DeserializeObject<VehicleTrackingUserPreferenceDto>(entity.LayoutJson)
                    ?? new VehicleTrackingUserPreferenceDto();

                preferences.UpdatedAtUtc ??= entity.UpdatedAt;

                return Ok(FMSResponse<VehicleTrackingUserPreferenceDto>.Success(preferences, "Vehicle tracking preferences retrieved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle tracking preferences for user {UserId}", userId);
                return StatusCode(500, FMSResponse<VehicleTrackingUserPreferenceDto>.SystemError("Error retrieving vehicle tracking preferences"));
            }
        }

        /// <summary>
        /// Save persisted vehicle tracking page preferences for the current user.
        /// </summary>
        [HttpPut("preferences")]
        public async Task<IActionResult> SavePreferences([FromBody] VehicleTrackingUserPreferenceDto request)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return Unauthorized(FMSResponse<VehicleTrackingUserPreferenceDto>.Unauthorized());
            }

            if (request == null)
            {
                return BadRequest(FMSResponse<VehicleTrackingUserPreferenceDto>.ValidationFailed(new List<string> { "Preference payload is required." }));
            }

            try
            {
                request.UpdatedAtUtc = DateTime.UtcNow;
                var serializedPreference = JsonConvert.SerializeObject(request, Formatting.None);

                var entity = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(layout => layout.UserId == userId && layout.LayoutName == VehicleTrackingPreferenceLayoutName);

                if (entity == null)
                {
                    entity = new UserDashboardLayout
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        LayoutName = VehicleTrackingPreferenceLayoutName,
                        LayoutJson = serializedPreference,
                        IsActive = false,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = CurrentActor,
                        UpdatedBy = CurrentActor,
                    };

                    _context.UserDashboardLayouts.Add(entity);
                }
                else
                {
                    entity.LayoutJson = serializedPreference;
                    entity.UpdatedAt = DateTime.UtcNow;
                    entity.UpdatedBy = CurrentActor;
                }

                await _context.SaveChangesAsync();

                return Ok(FMSResponse<VehicleTrackingUserPreferenceDto>.Success(request, "Vehicle tracking preferences saved successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving vehicle tracking preferences for user {UserId}", userId);
                return StatusCode(500, FMSResponse<VehicleTrackingUserPreferenceDto>.SystemError("Error saving vehicle tracking preferences"));
            }
        }

        /// <summary>
        /// Get vehicles/users by tag ID with their current positions
        /// </summary>
        /// <param name="tagId">Tag ID</param>
        /// <param name="fromIndex">Starting index for pagination</param>
        /// <param name="pageSize">Number of records per page</param>
        /// <returns>List of vehicles with positions</returns>
        [HttpGet("tags/{tagId}/vehicles")]
        public async Task<IActionResult> GetVehiclesByTag(int tagId, [FromQuery] int fromIndex = 0, [FromQuery] int pageSize = 1000)
        {
            try
            {
                var result = await _viewsService.GetUsersByTagAsync(tagId, fromIndex, pageSize);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicles for tag {TagId}", tagId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get all fuel levels throughout the day for a vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="date">Date to get fuel levels for (defaults to today)</param>
        /// <returns>List of fuel level readings with timestamps</returns>
        [HttpGet("{vehicleId}/fuel-levels/day")]
        public async Task<IActionResult> GetVehicleDayFuelLevels(int vehicleId, [FromQuery] DateTime? date = null)
        {
            try
            {
                var targetDate = date ?? DateTime.Today;

                // Get device mapping for the vehicle
                var deviceMapping = await _context.VehicleProviderMappings
                    .Include(m => m.ProviderConfiguration)
                    .Where(m => m.VehicleId == vehicleId
                        && m.IsActive
                        && m.ProviderConfiguration.Name == "GPSGate"
                        && m.ProviderConfiguration.IsEnabled)
                    .FirstOrDefaultAsync();

                if (deviceMapping == null || string.IsNullOrEmpty(deviceMapping.ExternalDeviceId))
                {
                    // Try legacy DeviceId fallback
                    var vehicle = await _context.Vehicles
                        .Where(v => v.VehicleId == vehicleId && v.DeviceId.HasValue)
                        .FirstOrDefaultAsync();

                    if (vehicle?.DeviceId != null)
                    {
                        _logger.LogWarning("Vehicle {VehicleId} using legacy DeviceId. Please migrate to vehicle_provider_mappings.", vehicleId);
                        deviceMapping = new FMS.Domain.Entities.VehicleTracking.VehicleProviderMappingEntity
                        {
                            ExternalDeviceId = vehicle.DeviceId.Value.ToString()
                        };
                    }
                    else
                    {
                        return NotFound(new
                        {
                            Success = false,
                            Message = $"Vehicle {vehicleId} is not configured for GPS tracking"
                        });
                    }
                }

                // Get fuel levels from GPS provider
                var fuelLevels = await _tracksService.GetDayFuelLevelsAsync(
                    deviceMapping.ExternalDeviceId!,
                    targetDate,
                    CancellationToken.None);

                if (fuelLevels == null || !fuelLevels.Any())
                {
                    return Ok(new
                    {
                        Success = true,
                        Data = new List<object>(),
                        Message = $"No fuel level data available for vehicle {vehicleId} on {targetDate:yyyy-MM-dd}"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = fuelLevels,
                    Message = $"Retrieved {fuelLevels.Count} fuel level readings for vehicle {vehicleId}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting day fuel levels for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }
    }
}