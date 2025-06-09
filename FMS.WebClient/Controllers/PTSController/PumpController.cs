using System.Linq;
using System.Security.Claims;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Communication.Redis;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Application.Features.PTSDevice.DTOs;
using FMS.Domain.Entities.PTS;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers.PTSController {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public class PumpController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly ILogger<PumpController> _logger;
        private readonly RedisCommandService _redisCommandService;

        public PumpController (IMediator mediator, ILogger<PumpController> logger) {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Authorizes a pump for refueling
        /// </summary>
        [HttpPost ("authorize")]
        public async Task<ActionResult<FMSResponse<PumpAuthorizeConfirmation>>> AuthorizePump ([FromBody] PumpAuthorizeCommand command) {
            try {
                if (!ModelState.IsValid) {
                    var modelErrors = ModelState
                        .Where (ms => ms.Value.Errors.Count > 0)
                        .SelectMany (ms => ms.Value.Errors.Select (e => $"{ms.Key}: {e.ErrorMessage}"))
                        .ToList ();

                    _logger.LogWarning ("Model binding failed for pump authorization: {Errors}", string.Join ("; ", modelErrors));
                    return BadRequest (FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed (modelErrors));
                }

                var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty (userId)) {
                    return Unauthorized (FMSResponse<PumpAuthorizeConfirmation>.Failed ("User not authenticated"));
                }

                command = command with { UserId = userId };

                var result = await _mediator.Send (command);
                if (!result.IsSuccess) {
                    //Cursor: Return appropriate HTTP status based on error type
                    return result.ErrorType
                    switch {
                        ErrorType.Validation => BadRequest (result),
                            ErrorType.Network => StatusCode (503, result), // Service Unavailable
                            ErrorType.SystemError => StatusCode (500, result), // Internal Server Error
                            ErrorType.DeviceError => BadRequest (result), // Bad Request for device-specific issues
                            _ => BadRequest (result)
                    };
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Unexpected error in pump authorization controller: {Message}", ex.Message);
                return StatusCode (500, FMSResponse<PumpAuthorizeConfirmation>.SystemError ($"Unexpected server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Gets the current state of a pump
        /// </summary>
        [HttpGet ("{deviceId}/{pumpId}/state")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<string>> GetPumpState (string deviceId, int pumpId) {
            try {
                var command = new PumpStatusCommand (deviceId, pumpId);
                var result = await _mediator.Send (command);
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting pump state");
                return StatusCode (500, "Internal server error");
            }
        }

        /// <summary>
        /// Stops an ongoing transaction
        /// </summary>
        [HttpPost ("{deviceId}/{pumpId}/stop")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> StopPump (string deviceId, int pumpId) {
            try {
                var command = new PumpStopCommand (deviceId, pumpId);
                var result = await _mediator.Send (command);
                if (!result.Success) {
                    return BadRequest (result);
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error stopping pump");
                return StatusCode (500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets device configuration for fueling process
        /// </summary>
        [HttpGet ("{deviceId}/config")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<PtsDeviceConfigDto>> GetDeviceConfig (string deviceId) {
            try {
                var query = new GetPTSDeviceConfigQuery (deviceId);
                var result = await _mediator.Send (query);
                if (result == null) {
                    return NotFound (new { message = $"Device {deviceId} not found" });
                }
                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting device configuration for device {DeviceId}", deviceId);
                return StatusCode (500, new { message = "Internal server error" });
            }
        }

        //Cursor: Add diagnostic endpoint for troubleshooting device issues
        /// <summary>
        /// Diagnostic endpoint to check device status and connectivity
        /// </summary>
        [HttpGet ("{deviceId}/diagnostics")]
        [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> GetDeviceDiagnostics (string deviceId) {
            try {
                var deviceQuery = new GetPTSDeviceConfigQuery (deviceId);
                var device = await _mediator.Send (deviceQuery);

                if (device == null) {
                    return NotFound (new {
                        message = $"Device {deviceId} not found in database",
                            deviceId = deviceId,
                            timestamp = DateTime.UtcNow
                    });
                }

                var diagnostics = new {
                    DeviceId = deviceId,
                    IsActive = device.IsActive,
                    IsAuthenticated = device.IsAuthenticated,
                    ConnectionStatus = device.ConnectionStatus,
                    SiteId = device.SiteId,
                    AutoAssignUserMasterTag = device.AutoAssignUserMasterTag,
                    Timestamp = DateTime.UtcNow,
                    TroubleshootingSteps = new [] {
                    "1. Verify device is powered on and connected to network",
                    "2. Check device IP address and network connectivity",
                    "3. Verify device authentication credentials",
                    "4. Ensure pump configuration is correct on device",
                    "5. Check device logs for specific error messages",
                    "6. Verify device firmware is up to date"
                    }
                };

                return Ok (diagnostics);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting device diagnostics for device {DeviceId}", deviceId);
                return StatusCode (500, new { message = "Internal server error" });
            }
        }
    }
}