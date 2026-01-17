/**
 * File: PTSDeviceController.cs
 * Purpose: API endpoints for PTS device management and reporting
 * Dependencies: MediatR, DeviceConnectionTracker, FMSResponse
 * Last Modified: 2026-01-17
 *
 * Key Endpoints:
 * - GetOfflineReport(): Returns daily offline summary for PTS devices
 */

using System;
using System.Reflection;
using FMS.Application.Features.PTSDevice.Commands;
using FMS.Application.Communication;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.Tracker;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.Common;
using FMS.Application.Features.PTSDevice.DTOs;
using FMS.Application.Features.PTSDevice.Queries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using FMS.Application.Communication.SignalR;
using StackExchange.Redis;

namespace FMS.WebClient.Controllers
{

    [ApiController]
    [Route("api/v1/[controller]")]
    public class PTSDeviceController : ControllerBase
    {

        private readonly ILogger<PTSDeviceController> _logger;
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly IMediator _mediator;
        private readonly RedisCommandService _redisCommandService;
        private readonly IHubContext<PTSHub> _hubContext;

        public PTSDeviceController(
            ILogger<PTSDeviceController> logger,
            IMediator mediator,
            DeviceConnectionTracker deviceConnectionTracker,
            RedisCommandService redisCommandService,
            IHubContext<PTSHub> hubContext)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger)); // Null check for logger
            _mediator = mediator ??
                throw new ArgumentNullException(nameof(mediator)); // Null check for mediator
            _deviceConnectionTracker = deviceConnectionTracker ??
                throw new ArgumentNullException(nameof(deviceConnectionTracker)); // Null check for tracker
            _redisCommandService = redisCommandService ??
                throw new ArgumentNullException(nameof(redisCommandService)); //Cursor: Add null check
            _hubContext = hubContext ??
                throw new ArgumentNullException(nameof(hubContext)); // Add null check for hub context
        }

        /// <summary>
        /// API endpoint to get a list of all PTS devices From the database
        /// </summary>
        /// <returns></returns>
        [HttpGet]

        public async Task<IActionResult> GetDeviceList()
        {
            var devices = await _mediator.Send(new GetPTSDeviceListQuery());
            return Ok(devices);
        }

        /// <summary>
        /// API endpoint to get PTS devices filtered by site ID
        /// </summary>
        /// <param name="siteId">The site ID to filter devices by</param>
        /// <returns>List of PTS devices for the specified site</returns>
        [HttpGet("site/{siteId:int}")]
        public async Task<IActionResult> GetDevicesBySite(int siteId)
        {
            try
            {
                var devices = await _mediator.Send(new GetPTSDevicesBySiteQuery(siteId));
                return Ok(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching PTS devices for site {SiteId}", siteId);
                return StatusCode(500, "Error fetching devices for site");
            }
        }

        /// <summary>
        /// API endpoint to get a summary of the device connections
        /// </summary>
        /// <returns></returns>

        [HttpGet("summary")]

        public async Task<IActionResult> GetDeviceSummary()
        {
            try
            {
                // Test Redis connection
                var redisField = _deviceConnectionTracker.GetType()
                    .GetField("_redisDb", BindingFlags.NonPublic | BindingFlags.Instance);
                var redisDb = redisField?.GetValue(_deviceConnectionTracker) as IDatabase;

                if (redisDb == null)
                {
                    _logger.LogError("Redis database connection is null");
                    return StatusCode(500, "Redis connection error");
                }

                _logger.LogInformation("Fetching device summary...");
                var summary = await _deviceConnectionTracker.GetConnectedDevices();
                _logger.LogInformation("Retrieved summary with {Count} total devices", summary.TotalConnectedDevices);

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device summary");
                return StatusCode(500, "Error getting device summary");
            }
        }

        [HttpGet("Device/{deviceId}")]
        public async Task<IActionResult> GetDeviceStatus(string deviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId))
                {
                    return BadRequest("Device Id is required");
                }

                var websocketInfo = await _deviceConnectionTracker.GetWebSocketConnection(deviceId);
                var httpInfo = await _deviceConnectionTracker.GetHttpConnection(deviceId);

                var connectionDetails = new DeviceConnectionDetails
                {
                    DeviceId = deviceId,
                    WebSocketStatus = websocketInfo?.Status ?? ConnectionStatus.Disconnected,
                    LastWebSocketMessage = websocketInfo?.LastMessageAt,
                    LastHttpPoll = httpInfo?.LastPollTime,
                    LastStatusUpdate = httpInfo?.LastStatusUpdate,
                    CurrentConnectionMode = DeviceConnectionDetails.DetermineConnectionMode(websocketInfo, httpInfo)
                };

                _logger.LogInformation(connectionDetails.GetConnectionSummary());
                return Ok(connectionDetails);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device status for device {DeviceId}", deviceId); // DeviceId in log
                return StatusCode(500, "Error getting device status");
            }
        }

        /// <summary>
        /// API endpoint to get daily offline report for PTS devices
        /// </summary>
        /// <param name="startDate">Start date (inclusive)</param>
        /// <param name="endDate">End date (inclusive)</param>
        /// <param name="deviceId">Optional device ID filter</param>
        [HttpGet("offline-report")]
        public async Task<ActionResult<FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>>> GetOfflineReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] string? deviceId = null)
        {
            try
            {
                if (startDate == default || endDate == default)
                {
                    return BadRequest(FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Failed(
                        "StartDate and EndDate are required."));
                }

                var result = await _mediator.Send(
                    new GetPtsDeviceOfflineReportQuery(startDate, endDate, deviceId));

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting PTS offline report");
                return StatusCode(500, FMSResponse<List<PtsDeviceOfflineDailySummaryDto>>.Failed(
                    "Internal server error while generating offline report"));
            }
        }

        /// <summary>
        /// API endpoint to get a list of active WebSocket connections
        /// </summary>
        /// <returns></returns>
        [HttpGet("ActiveWebSockets")]
        public async Task<IActionResult> GetActiveWebSockets()
        {
            try
            {
                var summary = await _deviceConnectionTracker.GetConnectedDevices();
                // Filter to only devices in a non-disconnected state
                var activeDevices = summary.WebSocketConnections; // Already filtered in GetConnectedDevices now
                return Ok(activeDevices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active WebSocket connections");
                return StatusCode(500, "Error getting active WebSocket connections");
            }
        }

        /// <summary>
        /// Manually broadcast the device summary to all connected clients for Admin Dashboard only
        /// </summary>
        /// <returns></returns>
        [HttpGet("broadcast")]
        public async Task<IActionResult> BroadcastDeviceSummary()
        {
            try
            {
                await _deviceConnectionTracker.BroadCastConnectedDevices();
                return Ok("Device summary broadcast initiated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting device summary");
                return StatusCode(500, "Error broadcasting device summary");
            }
        }

        // New endpoint to get dashboard metrics by comparing DB devices and online connections
        [HttpGet("dashboard-metrics")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            try
            {
                _logger.LogInformation("Starting to fetch dashboard metrics...");

                // Get list of devices from the database using the mediator query
                _logger.LogInformation("Fetching devices from database...");
                var devices = await _mediator.Send(new GetPTSDeviceListQuery());
                if (devices == null)
                {
                    _logger.LogError("Failed to retrieve devices from database");
                    return StatusCode(500, "Failed to retrieve devices from database");
                }
                _logger.LogInformation("Successfully retrieved {count} devices from database", devices.Count);

                // Get online device connections summary from the tracker
                _logger.LogInformation("Fetching device connection summary...");
                var summary = await _deviceConnectionTracker.GetConnectedDevices();
                if (summary == null)
                {
                    _logger.LogError("Failed to retrieve device connection summary");
                    return StatusCode(500, "Failed to retrieve device connection summary");
                }
                _logger.LogInformation("Successfully retrieved device connection summary");

                if (summary.WebSocketConnections == null || summary.HttpConnections == null)
                {
                    _logger.LogError("Connection lists in device summary are null. WebSocketConnections: {webSocket}, HttpConnections: {http}",
                        summary.WebSocketConnections == null ? "null" : "not null",
                        summary.HttpConnections == null ? "null" : "not null");
                    return StatusCode(500, "Invalid device connection data");
                }

                // Combine online device IDs from both WebSocket and HTTP connections
                var onlineDevices = summary.WebSocketConnections.Select(x => x.DeviceId)
                    .Concat(summary.HttpConnections.Select(x => x.DeviceId))
                    .Where(id => !string.IsNullOrEmpty(id)) // Filter out null or empty device IDs
                    .Distinct()
                    .ToList();

                // Create a set of registered device IDs from the database
                var registeredDeviceIds = new HashSet<string>(
                    devices.Where(d => d.Ptsid != null)
                    .Select(d => d.Ptsid.ToString())
                );

                // Count validated online connections (registered devices that are online)
                int validatedOnline = onlineDevices.Count(id => registeredDeviceIds.Contains(id));

                // Count unknown online devices (online devices not found in the registered list)
                int unknownOnline = onlineDevices.Count - validatedOnline;

                // Calculate offline devices (registered devices not online)
                int totalRegistered = devices.Count;
                int offlineRegistered = totalRegistered - validatedOnline;

                var result = new
                {
                    totalRegistered,
                    validatedOnline,
                    unknownOnline,
                    offlineRegistered,
                    totalOnline = onlineDevices.Count,
                    webSocketDevicesCount = summary.WebSocketConnections.Count,
                    httpDevicesCount = summary.HttpConnections.Count
                };

                await BroadcastDashboardMetrics(); // Broadcast after getting metrics
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard metrics. Exception details: {Message}, StackTrace: {StackTrace}",
                    ex.Message,
                    ex.StackTrace);
                return StatusCode(500, $"Error getting dashboard metrics: {ex.Message}");
            }
        }

        // Add this method to broadcast dashboard metrics
        private async Task BroadcastDashboardMetrics()
        {
            try
            {
                var devices = await _mediator.Send(new GetPTSDeviceListQuery());
                var summary = await _deviceConnectionTracker.GetConnectedDevices();

                if (devices != null && summary?.WebSocketConnections != null && summary?.HttpConnections != null)
                {
                    var onlineDevices = summary.WebSocketConnections.Select(x => x.DeviceId)
                        .Concat(summary.HttpConnections.Select(x => x.DeviceId))
                        .Where(id => !string.IsNullOrEmpty(id))
                        .Distinct()
                        .ToList();

                    var registeredDeviceIds = new HashSet<string>(
                        devices.Where(d => d.Ptsid != null)
                        .Select(d => d.Ptsid.ToString())
                    );

                    int validatedOnline = onlineDevices.Count(id => registeredDeviceIds.Contains(id));
                    int unknownOnline = onlineDevices.Count - validatedOnline;
                    int totalRegistered = devices.Count;
                    int offlineRegistered = totalRegistered - validatedOnline;

                    var metrics = new
                    {
                        totalRegistered,
                        validatedOnline,
                        unknownOnline,
                        offlineRegistered,
                        totalOnline = onlineDevices.Count,
                        webSocketDevicesCount = summary.WebSocketConnections.Count,
                        httpDevicesCount = summary.HttpConnections.Count,
                        timestamp = DateTime.UtcNow
                    };

                    // Broadcast via SignalR to all connected clients
                    await _hubContext.Clients.All.SendAsync("DashboardMetricsUpdate", metrics);
                    _logger.LogTrace("Broadcasted dashboard metrics via SignalR");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting dashboard metrics");
            }
        }

        /// <summary>
        /// API endpoint to create a new PTS device in the database
        /// </summary>
        /// <param name="ptsDevice"></param>
        /// <returns></returns>
        [HttpPost("create")]
        public async Task<IActionResult> CreatePTSDevice([FromBody] CreatePTSDeviceDTO ptsDevice)
        {
            try
            {
                var result = await _mediator.Send(new CreatePTSDeviceCommand(ptsDevice));
                if (result.Success)
                    return Ok(result);
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PTS device");
                return StatusCode(500, "Error creating PTS device");
            }
        }

        /// <summary>
        /// API endpoint to update a PTS device by ID in the database
        /// </summary>
        /// <param name="deviceId"></param>
        /// <param name="ptsDevice"></param>
        /// <returns></returns>
        [HttpPut("update/{deviceId}")]
        public async Task<IActionResult> UpdatePTSDevice(string deviceId, [FromBody] Ptsdevice ptsDevice)
        {
            try
            {
                var result = await _mediator.Send(new UpdatePTSDeviceCommand(deviceId, ptsDevice));
                if (result.Success)
                    return Ok(result);
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating PTS device");
                return StatusCode(500, "Error updating PTS device");
            }
        }

        /// <summary>
        /// API endpoint to delete a PTS device by ID from the database
        /// </summary>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        [HttpDelete("delete/{deviceId}")]
        public async Task<IActionResult> DeletePTSDevice(string deviceId)
        {
            try
            {
                var result = await _mediator.Send(new DeletePTSDeviceCommand(deviceId));
                if (result.Success)
                    return Ok(result);
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting PTS device");
                return StatusCode(500, "Error deleting PTS device");
            }
        }

        /// <summary>
        /// API endpoint to get a PTS device by ID
        /// </summary>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        [HttpGet("GetById/{deviceId}")]
        public async Task<IActionResult> GetPTSDeviceById(string deviceId)
        {
            try
            {
                var ptsDevice = await _mediator.Send(new GetPTSDeviceByIdQuery(deviceId));
                if (ptsDevice == null)
                    return NotFound();
                return Ok(ptsDevice);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PTS device with id {DeviceId}", deviceId);
                return StatusCode(500, "Error retrieving PTS device");
            }
        }

        //Cursor: Test endpoint to verify device connectivity through Redis commands
        /// <summary>
        /// API endpoint to test device connectivity through Redis command processing
        /// </summary>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        [HttpPost("test-connection/{deviceId}")]
        public async Task<IActionResult> TestDeviceConnection(string deviceId)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId))
                {
                    return BadRequest("Device Id is required");
                }

                _logger.LogInformation("Testing connection for device {DeviceId}", deviceId);

                var response = await _redisCommandService.TestDeviceConnectionAsync(deviceId);

                return Ok(new
                {
                    DeviceId = deviceId,
                    Status = response.Status,
                    Message = response.Message,
                    CorrelationId = response.CorrelationId,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing device connection for device {DeviceId}", deviceId);
                return StatusCode(500, "Error testing device connection");
            }
        }

    }
}