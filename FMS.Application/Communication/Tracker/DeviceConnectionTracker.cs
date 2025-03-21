using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using static FMS.Application.Communication.DeviceConnectionTracker;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.Command.DatabaseCommand.PTSDeviceCommands;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace FMS.Application.Communication
{
    /// <summary>
    /// This tracker uses Redis as central Repository for connected data
    /// both FMS.WebClient and FMS.PTS.WindowsService share this tracker to get the connected devices
    /// </summary>
    public class DeviceConnectionTracker
    {
        private readonly ILogger<DeviceConnectionTracker> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly IDatabase _redisDb;
        private readonly IServiceScopeFactory _scopeFactory;
        private const string WebSocketConnectionHashKey = "device:websocket-connections"; // Hash for WebSocket connections
        private const string HttpConnectionHashKey = "device:http-connections";       // Hash for HTTP connections


        public DeviceConnectionTracker(ILogger<DeviceConnectionTracker> logger, IHubContext<FrontEndHub> hubContext, IConnectionMultiplexer redisConnection, IServiceScopeFactory scopeFactory)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _redisDb = redisConnection.GetDatabase();
            _hubContext = hubContext;
            _scopeFactory = scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));
            _logger.LogInformation("DeviceConnectionTracker initialized with Redis");
        }

        public async Task BroadCastConnectedDevices()
        {
            var onlineDevices = await GetConnectedDevices();
            await _hubContext.Clients.All.SendAsync("ConnectedDevicesStatus", onlineDevices);
        }

        public async Task<WebSocketConnectionInfo?> GetWebSocketConnection(string deviceId)
        {
            var serializedInfo = await _redisDb.HashGetAsync(WebSocketConnectionHashKey, deviceId);
            if (serializedInfo.IsNullOrEmpty)
            {
                _logger.LogDebug("No WebSocket connection info found for device {DeviceId} in Redis", deviceId);
                return null;
            }
            try
            {
                var connectionInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo>(serializedInfo);
                return connectionInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize WebSocket connection info for device {DeviceId} from Redis", deviceId);
                return null;
            }
        }

        public async Task<HttpConnectionInfo?> GetHttpConnection(string deviceId)
        {
            var serializedInfo = await _redisDb.HashGetAsync(HttpConnectionHashKey, deviceId);
            if (serializedInfo.IsNullOrEmpty)
            {
                _logger.LogDebug("No HTTP connection info found for device {DeviceId} in Redis", deviceId);
                return null;
            }
            try
            {
                var connectionInfo = JsonSerializer.Deserialize<HttpConnectionInfo>(serializedInfo);
                return connectionInfo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize HTTP connection info for device {DeviceId} from Redis", deviceId);
                return null;
            }
        }


        public async Task UpdateWebSocketConnection(string deviceId, string ipAddress)
        {
            if (string.IsNullOrEmpty(deviceId) || string.IsNullOrEmpty(ipAddress))
            {
                _logger.LogError("UpdateWebSocketConnection called with an empty deviceId or ipAddress.");
                throw new ArgumentNullException(nameof(deviceId));
            }



            var connectionInfo = new WebSocketConnectionInfo
            {
                DeviceId = deviceId,
                ConnectedAt = DateTime.UtcNow,
                IpAddress = ipAddress,
                Status = ConnectionStatus.Connected,
                LastMessageAt = DateTime.UtcNow
            };

            string serializedInfo = JsonSerializer.Serialize(connectionInfo);
            if (string.IsNullOrEmpty(serializedInfo))
            {
                _logger.LogError("Failed to serialize WebSocket connection info for device {DeviceId}", deviceId);
                return;
            }
            await _redisDb.HashSetAsync(WebSocketConnectionHashKey, deviceId, serializedInfo);
            await BroadCastConnectedDevices();

            //TODO: uncomment this when the database is ready
            // using (var scope = _scopeFactory.CreateScope())
            // {
            //     var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            //     // Save to database
            //     var saveResponse = await mediator.Send(new SaveDeviceConnectionCommand
            //     {
            //         DeviceId = deviceId,
            //         IpAddress = ipAddress,
            //         ConnectedAt = connectionInfo.ConnectedAt,
            //         LastActivityAt = connectionInfo.LastMessageAt,
            //         ConnectionType = "WebSocket",
            //         Status = connectionInfo.Status.ToString()
            //     });

            //     if (!saveResponse.Success)
            //     {
            //         _logger.LogError("Error saving device connection to database for device {DeviceId}: {ErrorMessage}", deviceId, saveResponse.Message);
            //     }
            // }

            _logger.LogDebug("Successfully updated WebSocket connection for device {DeviceId} in Redis and database", deviceId);
        }


        public async Task TrackHttpPoll(string deviceId, string ipAddress)
        {
            var connectionInfo = new HttpConnectionInfo
            {
                DeviceId = deviceId,
                LastKnownIp = ipAddress,
                LastPollTime = DateTime.UtcNow,
                SuccessfulPolls = 1,
                LastStatusUpdate = DateTime.UtcNow
            };

            string serializedInfo = JsonSerializer.Serialize(connectionInfo);
            await _redisDb.HashSetAsync(HttpConnectionHashKey, deviceId, serializedInfo);

            //TODO: uncomment this when the database is ready
            // using (var scope = _scopeFactory.CreateScope())
            // {
            //     var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

            //     // Save to database
            //     await mediator.Send(new SaveDeviceConnectionCommand
            //     {
            //         DeviceId = deviceId,
            //         IpAddress = ipAddress,
            //         ConnectedAt = connectionInfo.LastPollTime,
            //         LastActivityAt = connectionInfo.LastPollTime,
            //         ConnectionType = "HTTP",
            //         Status = "Connected"
            //     });
            // }

            _logger.LogTrace("Tracked HTTP poll for device {DeviceId} in Redis and database", deviceId);
        }

        /// <summary>
        /// Track the HTTP status update for a device
        /// </summary>
        /// <param name="deviceId">The device ID</param>
        /// <param name="ipAddress">The IP address of the device</param>
        /// <returns>A task representing the asynchronous operation</returns>

        public async Task TrackHttpStatusUpdate(string deviceId, string ipAddress)
        {
            var existingInfo = await GetHttpConnection(deviceId);
            if (existingInfo != null)
            {
                existingInfo.LastStatusUpdate = DateTime.UtcNow;
                existingInfo.LastKnownIp = ipAddress; // Update IP on status update as well

                string serializedInfo = JsonSerializer.Serialize(existingInfo);
                await _redisDb.HashSetAsync(HttpConnectionHashKey, deviceId, serializedInfo);
                _logger.LogTrace("Tracked HTTP status update for device {DeviceId} in Redis", deviceId);
            }
            else
            {
                _logger.LogWarning("Attempted to update status for non-existent HTTP connection for device {DeviceId}", deviceId);
                await TrackHttpPoll(deviceId, ipAddress); // If no existing, treat as initial poll+status
            }
        }

        public async Task<DeviceConnectionSummary> GetConnectedDevices()
        {
            try
            {
                // Log Redis connection state
                _logger.LogDebug("Attempting to fetch connected devices from Redis. Database: {Database}", _redisDb?.Database);

                // Fetch entries with logging
                _logger.LogDebug("Fetching WebSocket entries from Redis hash: {Key}", WebSocketConnectionHashKey);
                var webSocketEntries = await _redisDb.HashGetAllAsync(WebSocketConnectionHashKey);
                _logger.LogDebug("Retrieved {Count} WebSocket entries", webSocketEntries.Length);

                _logger.LogDebug("Fetching HTTP entries from Redis hash: {Key}", HttpConnectionHashKey);
                var httpEntries = await _redisDb.HashGetAllAsync(HttpConnectionHashKey);
                _logger.LogDebug("Retrieved {Count} HTTP entries", httpEntries.Length);

                var webSocketConnections = new List<WebSocketConnectionInfo>();
                foreach (var entry in webSocketEntries)
                {
                    try
                    {
                        _logger.LogTrace("Processing WebSocket entry for key: {Key}", entry.Name);
                        var wsInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo>(entry.Value);
                        if (wsInfo != null)
                        {
                            UpdateConnectionStatus(wsInfo);
                            if (wsInfo.Status != ConnectionStatus.Disconnected)
                            {
                                webSocketConnections.Add(wsInfo);
                                _logger.LogTrace("Added active WebSocket connection for device: {DeviceId}", wsInfo.DeviceId);
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error deserializing WebSocket entry: {EntryName}", entry.Name);
                    }
                }

                var httpConnections = new List<HttpConnectionInfo>();
                foreach (var entry in httpEntries)
                {
                    try
                    {
                        _logger.LogTrace("Processing HTTP entry for key: {Key}", entry.Name);
                        var httpInfo = JsonSerializer.Deserialize<HttpConnectionInfo>(entry.Value);
                        if (httpInfo != null && !IsConnectionStale(httpInfo))
                        {
                            httpConnections.Add(httpInfo);
                            _logger.LogTrace("Added active HTTP connection for device: {DeviceId}", httpInfo.DeviceId);
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error deserializing HTTP entry: {EntryName}", entry.Name);
                    }
                }

                var summary = new DeviceConnectionSummary
                {
                    WebSocketConnections = webSocketConnections,
                    HttpConnections = httpConnections,
                    TotalConnectedDevices = webSocketConnections.Count + httpConnections.Count
                };

                summary.WebSocketPercentages = summary.TotalConnectedDevices > 0
                    ? (int)Math.Round((decimal)summary.WebSocketConnections.Count / summary.TotalConnectedDevices * 100)
                    : 0;

                _logger.LogInformation(
                    "Generated summary: {WebSocketCount} WebSocket, {HttpCount} HTTP connections, {TotalCount} total",
                    webSocketConnections.Count,
                    httpConnections.Count,
                    summary.TotalConnectedDevices);

                return summary;
            }
            catch (RedisConnectionException ex)
            {
                _logger.LogError(ex, "Redis connection error while fetching connected devices");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while fetching connected devices");
                throw;
            }

        }


        private void UpdateConnectionStatus(WebSocketConnectionInfo connection)
        {
            var timeSinceLastMessage = DateTime.UtcNow - connection.LastMessageAt;

            // Update status based on activity
            connection.Status = timeSinceLastMessage.TotalMinutes switch
            {
                < 1 => ConnectionStatus.Active,
                < 5 => ConnectionStatus.Connected,
                < 15 => ConnectionStatus.Idle,
                _ => ConnectionStatus.Disconnected
            };

            _logger.LogDebug(
                 "Updated WebSocket connection status for device {DeviceId} to {Status}. " +
                 "Last message was {TimeSinceLastMessage} minutes ago.",
                 connection.DeviceId,
                 connection.Status,
                 timeSinceLastMessage.TotalMinutes);
        }

        private bool IsConnectionStale(HttpConnectionInfo connection)
        {
            // Consider HTTP connections stale after 5 minutes of no activity
            var lastActivity = connection.LastStatusUpdate > connection.LastPollTime
                ? connection.LastStatusUpdate
                : connection.LastPollTime;

            return (DateTime.UtcNow - lastActivity).TotalMinutes > 5;
        }

        // Helper method to determine primary connection mode (can be moved to DeviceConnectionDetails if needed)
        public static ConnectionMode DetermineConnectionMode(
            WebSocketConnectionInfo? wsInfo,
            HttpConnectionInfo? httpInfo)
        {
            // First, let's establish time thresholds for recent activity
            var recentActivityThreshold = TimeSpan.FromMinutes(5);
            var now = DateTime.UtcNow;

            // Check if we have an active WebSocket connection
            bool hasActiveWebSocket = wsInfo != null &&
                (wsInfo.Status == ConnectionStatus.Active ||
                 wsInfo.Status == ConnectionStatus.Connected);

            // Check if we have recent HTTP activity
            bool hasRecentHttpActivity = httpInfo != null &&
                (now - httpInfo.LastPollTime < recentActivityThreshold ||
                 now - httpInfo.LastStatusUpdate < recentActivityThreshold);

            // Now we can determine the mode based on activity patterns
            if (hasActiveWebSocket && hasRecentHttpActivity)
            {
                // Device is using both communication methods
                return ConnectionMode.Mixed;
            }
            else if (hasActiveWebSocket)
            {
                // Device is primarily using WebSocket
                return ConnectionMode.WebSocket;
            }
            else if (hasRecentHttpActivity)
            {
                // Determine if it's direct HTTP or polling based on pattern
                return httpInfo.SuccessfulPolls > 0
                    ? ConnectionMode.HTTPPolling
                    : ConnectionMode.HTTPDirect;
            }

            // No recent activity in any mode
            return ConnectionMode.Disconnected;
        }

        public async Task UpdateHttpPollSuccessCount(string deviceId)
        {
            var existingInfo = await GetHttpConnection(deviceId);
            if (existingInfo != null)
            {
                existingInfo.SuccessfulPolls++;
                existingInfo.LastPollTime = DateTime.UtcNow;
                string serializedInfo = JsonSerializer.Serialize(existingInfo);
                await _redisDb.HashSetAsync(HttpConnectionHashKey, deviceId, serializedInfo);
                _logger.LogTrace("Incremented successful HTTP poll count for device {DeviceId} in Redis", deviceId);
            }
            else
            {
                _logger.LogWarning("Attempted to increment poll count for non-existent HTTP connection for device {DeviceId}", deviceId);
            }
        }

        public async Task RemoveWebSocketConnection(string deviceId)
        {
            await _redisDb.HashDeleteAsync(WebSocketConnectionHashKey, deviceId);
            _logger.LogInformation("Removed WebSocket connection info for device {DeviceId} from Redis", deviceId);
        }

        public async Task RemoveHttpConnection(string deviceId)
        {
            await _redisDb.HashDeleteAsync(HttpConnectionHashKey, deviceId);
            _logger.LogInformation("Removed HTTP connection info for device {DeviceId} from Redis", deviceId);
        }

        public async Task BroadcastDashboardMetrics(object metrics)
        {
            if (_hubContext != null)
            {
                await _hubContext.Clients.All.SendAsync("DashboardMetricsUpdate", metrics);
            }
        }

    }
}