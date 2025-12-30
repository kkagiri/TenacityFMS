//
// File: PumpController.cs
// Purpose: API endpoints for PTS pump operations; maps FMSResponse.ErrorType to appropriate HTTP status codes
// Dependencies: MediatR, FMSResponse<T>, ASP.NET Core MVC, JWT Auth
// Last Modified: 2025-11-05
//
// Key Endpoints:
// - POST /api/pump/authorize: Authorize pump; returns typed FMSResponse
// - GET /api/pump/{deviceId}/{pumpId}/state: Fetch pump state
// - POST /api/pump/{deviceId}/{pumpId}/stop: Stop pump transaction
// - GET /api/pump/{deviceId}/diagnostics: Device diagnostics

using System.Linq;
using System.Security.Claims;
using FMS.Application.Command.PTSCommand.PumpCommands;
using FMS.Application.Common;
using FMS.Application.Communication.Redis;
using FMS.Application.Features.PTS.Queries;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Application.Features.PTSDevice.DTOs;
using FMS.Application.Infrastructure.DistCacheTracker;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.WebClient.Controllers.PTSController
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public class PumpController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<PumpController> _logger;
        private readonly RedisCommandService _redisCommandService;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly IAuthorizationStateTracker _authTracker;

        public PumpController(
            IMediator mediator,
            ILogger<PumpController> logger,
            IConnectionMultiplexer redisConnection,
            IAuthorizationStateTracker authTracker)
        {
            _mediator = mediator;
            _logger = logger;
            _redisConnection = redisConnection;
            _authTracker = authTracker;
        }

        /// <summary>
        /// Authorizes a pump for refueling
        /// </summary>
        [HttpPost("authorize")]
        public async Task<ActionResult<FMSResponse<PumpAuthorizeConfirmation>>> AuthorizePump([FromBody] PumpAuthorizeCommand command)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var modelErrors = ModelState
                        .Where(ms => ms.Value.Errors.Count > 0)
                        .SelectMany(ms => ms.Value.Errors.Select(e => $"{ms.Key}: {e.ErrorMessage}"))
                        .ToList();

                    _logger.LogWarning("Model binding failed for pump authorization: {Errors}", string.Join("; ", modelErrors));
                    return BadRequest(FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(modelErrors));
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(FMSResponse<PumpAuthorizeConfirmation>.Failed("User not authenticated"));
                }

                command = command with { UserId = userId };

                var result = await _mediator.Send(command);
                if (!result.IsSuccess)
                {
                    //Cursor: Return appropriate HTTP status based on error type
                    return result.ErrorType
                    switch
                    {
                        ErrorType.Validation => BadRequest(result),
                        ErrorType.NetworkError => StatusCode(503, result), // Service Unavailable
                        ErrorType.SystemError => StatusCode(500, result), // Internal Server Error
                        ErrorType.DeviceError => BadRequest(result), // Bad Request for device-specific issues
                        _ => BadRequest(result)
                    };
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in pump authorization controller: {Message}", ex.Message);
                return StatusCode(500, FMSResponse<PumpAuthorizeConfirmation>.SystemError($"Unexpected server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Authorizes a pump for tank-to-tank transfer (NOT vehicle fueling)
        /// </summary>
        [HttpPost("authorize-transfer")]
        public async Task<ActionResult<FMSResponse<PumpAuthorizeConfirmation>>> AuthorizeTransfer([FromBody] PumpAuthorizeTransferCommand command)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var modelErrors = ModelState
                        .Where(ms => ms.Value.Errors.Count > 0)
                        .SelectMany(ms => ms.Value.Errors.Select(e => $"{ms.Key}: {e.ErrorMessage}"))
                        .ToList();

                    _logger.LogWarning("Model binding failed for tank transfer authorization: {Errors}", string.Join("; ", modelErrors));
                    return BadRequest(FMSResponse<PumpAuthorizeConfirmation>.ValidationFailed(modelErrors));
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(FMSResponse<PumpAuthorizeConfirmation>.Failed("User not authenticated"));
                }

                command = command with { UserId = userId };

                _logger.LogInformation(
                    "[API] Tank transfer authorization request: Device {DeviceId}, Pump {PumpId}, Source {SourceTank} -> Dest {DestTank}, Volume {Volume} L",
                    command.DeviceId, command.PumpId, command.SourceTankId, command.DestinationTankId, command.Volume);

                var result = await _mediator.Send(command);
                if (!result.IsSuccess)
                {
                    return result.ErrorType
                    switch
                    {
                        ErrorType.Validation => BadRequest(result),
                        ErrorType.NetworkError => StatusCode(503, result),
                        ErrorType.SystemError => StatusCode(500, result),
                        ErrorType.DeviceError => BadRequest(result),
                        _ => BadRequest(result)
                    };
                }

                _logger.LogInformation(
                    "[API] Tank transfer authorized successfully: Transaction {TransactionId}",
                    result.Data?.Transaction);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in tank transfer authorization controller: {Message}", ex.Message);
                return StatusCode(500, FMSResponse<PumpAuthorizeConfirmation>.SystemError($"Unexpected server error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Gets the current state of a pump
        /// </summary>
        [HttpGet("{deviceId}/{pumpId}/state")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<string>> GetPumpState(string deviceId, int pumpId)
        {
            try
            {
                var command = new PumpStatusCommand(deviceId, pumpId);
                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pump state");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Stops an ongoing transaction
        /// </summary>
        [HttpPost("{deviceId}/{pumpId}/stop")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> StopPump(string deviceId, int pumpId)
        {
            try
            {
                var command = new PumpStopCommand(deviceId, pumpId);
                var result = await _mediator.Send(command);
                if (!result.Success)
                {
                    return BadRequest(result);
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping pump");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Gets device configuration for fueling process
        /// </summary>
        [HttpGet("{deviceId}/config")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<PtsDeviceConfigDto>> GetDeviceConfig(string deviceId)
        {
            try
            {
                var query = new GetPTSDeviceConfigQuery(deviceId);
                var result = await _mediator.Send(query);
                if (result == null)
                {
                    return NotFound(new { message = $"Device {deviceId} not found" });
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device configuration for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get the current nozzle state for a pump (lifted/down)
        /// Used by frontend to validate nozzle is up before authorizing
        /// </summary>
        [HttpGet("{deviceId}/{pumpId}/nozzle-state")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<FMSResponse<FMS.Application.Features.PTS.Queries.PumpNozzleStateDto>>> GetNozzleState(
            string deviceId,
            int pumpId)
        {
            try
            {
                var query = new FMS.Application.Features.PTS.Queries.GetPumpNozzleStateQuery(deviceId, pumpId);
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting nozzle state for device {DeviceId}, pump {PumpId}", deviceId, pumpId);
                return StatusCode(500, FMS.Application.Common.FMSResponse<FMS.Application.Features.PTS.Queries.PumpNozzleStateDto>
                    .SystemError("Error getting nozzle state"));
            }
        }

        /// <summary>
        /// Get detailed transaction information from PTS device
        /// </summary>
        [HttpGet("{deviceId}/{pumpId}/transaction/{transactionId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult<FMSResponse<Pumptransaction>>> GetPumpTransactionInfo(
            string deviceId,
            int pumpId,
            int transactionId)
        {
            try
            {
                var command = new GetPumpTransactionInfoQuery
                {
                    PTSDeviceId = deviceId,
                    PumpId = pumpId,
                    TransactionId = transactionId
                };

                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return result.ErrorType switch
                    {
                        ErrorType.Validation => BadRequest(result),
                        ErrorType.NetworkError => StatusCode(503, result),
                        ErrorType.SystemError => StatusCode(500, result),
                        ErrorType.DeviceError => BadRequest(result),
                        _ => BadRequest(result)
                    };
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting transaction info for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                    deviceId, pumpId, transactionId);
                return StatusCode(500, FMSResponse<Pumptransaction>.SystemError("Error retrieving transaction information"));
            }
        }

        //Cursor: Add diagnostic endpoint for troubleshooting device issues
        /// <summary>
        /// Diagnostic endpoint to check device status and connectivity
        /// </summary>
        [HttpGet("{deviceId}/diagnostics")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> GetDeviceDiagnostics(string deviceId)
        {
            try
            {
                var deviceQuery = new GetPTSDeviceConfigQuery(deviceId);
                var device = await _mediator.Send(deviceQuery);

                if (device == null)
                {
                    return NotFound(new
                    {
                        message = $"Device {deviceId} not found in database",
                        deviceId = deviceId,
                        timestamp = DateTime.UtcNow
                    });
                }

                var diagnostics = new
                {
                    DeviceId = deviceId,
                    IsActive = device.IsActive,
                    IsAuthenticated = device.IsAuthenticated,
                    ConnectionStatus = device.ConnectionStatus,
                    SiteId = device.SiteId,
                    AutoAssignUserMasterTag = device.AutoAssignUserMasterTag,
                    Timestamp = DateTime.UtcNow,
                    TroubleshootingSteps = new[] {
                    "1. Verify device is powered on and connected to network",
                    "2. Check device IP address and network connectivity",
                    "3. Verify device authentication credentials",
                    "4. Ensure pump configuration is correct on device",
                    "5. Check device logs for specific error messages",
                    "6. Verify device firmware is up to date"
                    }
                };

                return Ok(diagnostics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device diagnostics for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        //Cursor: **EMERGENCY CLEANUP ENDPOINT** - Manually clear stuck transactions
        /// <summary>
        /// EMERGENCY: Manually clear stuck transaction for a specific pump
        /// Use when transactions are stuck and blocking new authorizations
        /// </summary>
        [HttpDelete("{deviceId}/stuck-transactions")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> ClearStuckTransactions(string deviceId, [FromQuery] int? pumpId = null)
        {
            try
            {
                var db = _redisConnection.GetDatabase();
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints()[0]);

                var clearedTransactions = new List<object>();
                var pattern = pumpId.HasValue
                    ? $"device:{deviceId}:pump:{pumpId.Value}:*"
                    : $"device:{deviceId}:transaction:*";

                _logger.LogWarning("[EMERGENCY CLEANUP] Clearing stuck transactions for device {DeviceId}, pump {PumpId}, pattern: {Pattern}",
                    deviceId, pumpId, pattern);

                // Find all matching transaction keys
                var keys = server.Keys(pattern: pattern).ToList();

                foreach (var key in keys)
                {
                    try
                    {
                        var value = await db.StringGetAsync(key);
                        if (!value.IsNullOrEmpty)
                        {
                            clearedTransactions.Add(new
                            {
                                Key = key.ToString(),
                                Value = value.ToString().Substring(0, Math.Min(100, value.ToString().Length)) + "..."
                            });
                        }

                        await db.KeyDeleteAsync(key);
                        _logger.LogWarning("[EMERGENCY CLEANUP] Deleted Redis key: {Key}", key);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[EMERGENCY CLEANUP] Error deleting key {Key}", key);
                    }
                }

                // Clear authorization states for specific pump or all pumps
                if (pumpId.HasValue)
                {
                    await _authTracker.ClearAuthorization(deviceId, pumpId.Value);
                    _logger.LogWarning("[EMERGENCY CLEANUP] Cleared authorization for device {DeviceId}, pump {PumpId}",
                        deviceId, pumpId.Value);
                }
                else
                {
                    // Clear all pumps (1-8 typical range)
                    for (int i = 1; i <= 8; i++)
                    {
                        try
                        {
                            await _authTracker.ClearAuthorization(deviceId, i);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogDebug("Could not clear pump {PumpId}: {Error}", i, ex.Message);
                        }
                    }
                    _logger.LogWarning("[EMERGENCY CLEANUP] Cleared all pump authorizations for device {DeviceId}", deviceId);
                }

                return Ok(new
                {
                    Message = $"Cleared {clearedTransactions.Count} stuck transaction(s)",
                    DeviceId = deviceId,
                    PumpId = pumpId,
                    ClearedKeys = clearedTransactions,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EMERGENCY CLEANUP] Error clearing stuck transactions for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = $"Error during cleanup: {ex.Message}" });
            }
        }

        //Cursor: **DIAGNOSTIC ENDPOINT** - List all active transactions
        /// <summary>
        /// Diagnostic: List all active transactions in Redis for a device
        /// </summary>
        [HttpGet("{deviceId}/active-transactions")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<ActionResult> GetActiveTransactions(string deviceId)
        {
            try
            {
                var db = _redisConnection.GetDatabase();
                var server = _redisConnection.GetServer(_redisConnection.GetEndPoints()[0]);

                var activeTransactions = new List<object>();
                var pattern = $"device:{deviceId}:transaction:*";

                var keys = server.Keys(pattern: pattern).ToList();

                foreach (var key in keys)
                {
                    try
                    {
                        var value = await db.StringGetAsync(key);
                        var ttl = await db.KeyTimeToLiveAsync(key);

                        if (!value.IsNullOrEmpty)
                        {
                            activeTransactions.Add(new
                            {
                                Key = key.ToString(),
                                Data = value.ToString(),
                                ExpiresIn = ttl?.ToString() ?? "No expiration"
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug("Error reading key {Key}: {Error}", key, ex.Message);
                    }
                }

                return Ok(new
                {
                    DeviceId = deviceId,
                    ActiveTransactionCount = activeTransactions.Count,
                    Transactions = activeTransactions,
                    Timestamp = DateTime.UtcNow
                });
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active transactions for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
    }
}