//Cursor: API Controller for System-wide Configuration CRUD operations
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands;
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using FMS.Application.Queries.Database.SystemConfigurationQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.ATGAdmin)]
    public class SystemConfigurationController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<SystemConfigurationController> _logger;

        public SystemConfigurationController(
            IMediator mediator,
            ILogger<SystemConfigurationController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get all system configurations
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 50)</param>
        /// <param name="category">Filter by category</param>
        /// <param name="dataType">Filter by data type</param>
        /// <param name="isEditable">Filter by editable status</param>
        /// <param name="isActive">Filter by active status</param>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of system configurations</returns>
        [HttpGet]
        public async Task<ActionResult<FMSResponse<IEnumerable<SystemConfigurationDto>>>> GetConfigurations(
            [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? category = null, [FromQuery] string? dataType = null, [FromQuery] string? isEditable = null, [FromQuery] string? isActive = null, [FromQuery] string? searchTerm = null)
        {
            try
            {
                // Parse boolean parameters safely
                bool? isEditableParsed = null;
                bool? isActiveParsed = null;

                if (!string.IsNullOrEmpty(isEditable) && !isEditable.Equals("null", StringComparison.OrdinalIgnoreCase))
                {
                    if (bool.TryParse(isEditable, out bool editableValue))
                    {
                        isEditableParsed = editableValue;
                    }
                }

                if (!string.IsNullOrEmpty(isActive) && !isActive.Equals("null", StringComparison.OrdinalIgnoreCase))
                {
                    if (bool.TryParse(isActive, out bool activeValue))
                    {
                        isActiveParsed = activeValue;
                    }
                }

                var query = new GetSystemConfigurationsListQuery(page, pageSize)
                {
                    Category = category,
                    DataType = dataType,
                    IsEditable = isEditableParsed,
                    IsActive = isActiveParsed,
                    SearchTerm = searchTerm
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
                _logger.LogError(ex, "Error retrieving system configurations");
                return StatusCode(500, new FMSResponse<IEnumerable<SystemConfigurationDto>>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get a specific system configuration by ID
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Configuration details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<FMSResponse<SystemConfigurationDto>>> GetConfiguration(int id)
        {
            try
            {
                var query = new GetSystemConfigurationQuery(id);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving system configuration {ConfigId}", id);
                return StatusCode(500, new FMSResponse<SystemConfigurationDto>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Create a new system configuration
        /// </summary>
        /// <param name="createDto">Configuration data</param>
        /// <returns>Created configuration</returns>
        [HttpPost]
        public async Task<ActionResult<FMSResponse<SystemConfigurationDto>>> CreateConfiguration(
            [FromBody] CreateSystemConfigurationDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
                var command = new CreateSystemConfigurationCommand(createDto, currentUser);
                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(
                    nameof(GetConfiguration),
                    new { id = result.Data.Id },
                    result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating system configuration");
                return StatusCode(500, new FMSResponse<SystemConfigurationDto>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Update an existing system configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <param name="updateDto">Updated configuration data</param>
        /// <returns>Updated configuration</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<FMSResponse<SystemConfigurationDto>>> UpdateConfiguration(
            int id, [FromBody] UpdateSystemConfigurationDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (id != updateDto.Id)
                {
                    return BadRequest(new FMSResponse<SystemConfigurationDto>(
                        false, "ID mismatch", null));
                }

                var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
                var command = new UpdateSystemConfigurationCommand(updateDto, currentUser);
                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating system configuration {ConfigId}", id);
                return StatusCode(500, new FMSResponse<SystemConfigurationDto>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Delete a system configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Success/failure result</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<FMSResponse>> DeleteConfiguration(int id)
        {
            try
            {
                var command = new DeleteSystemConfigurationCommand(id);
                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting system configuration {ConfigId}", id);
                return StatusCode(500, new FMSResponse(false, "Internal server error"));
            }
        }

        /// <summary>
        /// Get current system configuration (active configuration)
        /// </summary>
        /// <returns>Active system configuration</returns>
        [HttpGet("current")]
        public async Task<ActionResult<FMSResponse<SystemConfigurationDto>>> GetCurrentConfiguration()
        {
            try
            {
                var query = new GetCurrentSystemConfigurationQuery();
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return NotFound(new FMSResponse<SystemConfigurationDto>(
                        false, "No active system configuration found", null));
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current system configuration");
                return StatusCode(500, new FMSResponse<SystemConfigurationDto>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get a specific system configuration by key
        /// </summary>
        /// <param name="key">Configuration key (e.g., "GoogleMaps.ApiKey")</param>
        /// <returns>Configuration details</returns>
        [HttpGet("by-key/{key}")]
        [AllowAnonymous] // Allow anonymous access for public configurations like API keys
        public async Task<ActionResult<FMSResponse<SystemConfigurationDto>>> GetConfigurationByKey(string key)
        {
            try
            {
                var query = new GetSystemConfigurationByKeyQuery(key);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving system configuration by key {ConfigKey}", key);
                return StatusCode(500, new FMSResponse<SystemConfigurationDto>(
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get mobile location validation settings for the mobile app
        /// Returns all settings needed for GPS location validation during fueling authorization
        /// </summary>
        /// <returns>Mobile location validation settings</returns>
        [HttpGet("mobile-location-settings")]
        public async Task<ActionResult<FMSResponse<MobileLocationSettingsDto>>> GetMobileLocationSettings()
        {
            try
            {
                var settings = new MobileLocationSettingsDto();

                // Fetch all relevant configuration keys
                var keys = new[]
                {
                    "FuelingRules.RequireMobileLocation",
                    "FuelingRules.MaxMobileLocationAgeSeconds",
                    "FuelingRules.MaxMobileLocationAccuracyMeters",
                    "FuelingRules.RejectCachedMobileLocation",
                    "FuelingRules.RequireOperatorInGeofence",
                    "FuelingRules.BypassOnGPSFailure"
                };

                foreach (var key in keys)
                {
                    try
                    {
                        var query = new GetSystemConfigurationByKeyQuery(key);
                        var result = await _mediator.Send(query);

                        if (result.IsSuccess && result.Data != null)
                        {
                            var value = result.Data.ConfigurationValue;

                            switch (key)
                            {
                                case "FuelingRules.RequireMobileLocation":
                                    settings.RequireMobileLocation = bool.TryParse(value, out var reqMobile) && reqMobile;
                                    break;
                                case "FuelingRules.MaxMobileLocationAgeSeconds":
                                    settings.MaxLocationAgeSeconds = int.TryParse(value, out var age) ? age : 60;
                                    break;
                                case "FuelingRules.MaxMobileLocationAccuracyMeters":
                                    settings.MaxLocationAccuracyMeters = int.TryParse(value, out var acc) ? acc : 500;
                                    break;
                                case "FuelingRules.RejectCachedMobileLocation":
                                    settings.RejectCachedLocation = !bool.TryParse(value, out var reject) || reject;
                                    break;
                                case "FuelingRules.RequireOperatorInGeofence":
                                    settings.RequireOperatorInGeofence = bool.TryParse(value, out var opGeo) && opGeo;
                                    break;
                                case "FuelingRules.BypassOnGPSFailure":
                                    settings.BypassOnGPSFailure = bool.TryParse(value, out var bypass) && bypass;
                                    break;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error fetching config key {Key}, using default", key);
                    }
                }

                _logger.LogDebug("Mobile location settings retrieved: RequireMobile={Require}, MaxAge={MaxAge}s, MaxAccuracy={MaxAcc}m, RejectCached={RejectCached}",
                    settings.RequireMobileLocation, settings.MaxLocationAgeSeconds,
                    settings.MaxLocationAccuracyMeters, settings.RejectCachedLocation);

                return Ok(new FMSResponse<MobileLocationSettingsDto>(true, "Settings retrieved successfully", settings));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving mobile location settings");
                return StatusCode(500, new FMSResponse<MobileLocationSettingsDto>(
                    false, "Internal server error", null));
            }
        }
    }

    /// <summary>
    /// DTO for mobile location validation settings
    /// </summary>
    public class MobileLocationSettingsDto
    {
        /// <summary>
        /// Whether mobile location is required for fueling authorization
        /// </summary>
        public bool RequireMobileLocation { get; set; } = true;

        /// <summary>
        /// Maximum age of mobile location in seconds before rejection
        /// </summary>
        public int MaxLocationAgeSeconds { get; set; } = 60;

        /// <summary>
        /// Maximum acceptable GPS accuracy in meters
        /// </summary>
        public int MaxLocationAccuracyMeters { get; set; } = 500;

        /// <summary>
        /// Whether to reject cached/stale locations
        /// </summary>
        public bool RejectCachedLocation { get; set; } = true;

        /// <summary>
        /// Whether operator must be within a geofence
        /// </summary>
        public bool RequireOperatorInGeofence { get; set; } = false;

        /// <summary>
        /// Whether to bypass location validation on GPS failure
        /// </summary>
        public bool BypassOnGPSFailure { get; set; } = true;
    }
}