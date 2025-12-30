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
using FMS.Application.Communication.Tracker.Common;
using System.Net;
using System.Runtime.Remoting;

namespace FMS.Application.Communication
{
    /// <summary>
    /// This tracker uses Redis as central Repository for connected data
    /// both FMS.WebClient and FMS.PTS.WindowsService share this tracker to get the connected devices
    /// </summary>
    public class DeviceConnectionTracker
    {
        private readonly ILogger<DeviceConnectionTracker> _logger;
        private readonly IHubContext<PTSHub> _hubContext;
        private readonly IDatabase _redisDb;
        private const string WebSocketConnectionHashKey = "device:websocket-connections"; // Hash for WebSocket connections
        private const string HttpConnectionHashKey = "device:http-connections"; // Hash for HTTP connections

        public DeviceConnectionTracker(ILogger<DeviceConnectionTracker> logger, IHubContext<PTSHub> hubContext, IConnectionMultiplexer redisConnection)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _hubContext = hubContext ??
                throw new ArgumentNullException(nameof(hubContext));
            _redisDb = redisConnection.GetDatabase();
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
                if (connectionInfo != null)
                {
                    connectionInfo.Status = DetermineWebSocketStatus(connectionInfo.LastMessageAt);
                }
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

            _logger.LogDebug("UpdateWebSocketConnection for deviceId: '{DeviceId}' (type: {Type}, length: {Length})", deviceId, deviceId.GetType().Name, deviceId.Length);

            var now = DateTime.UtcNow;
            var connectionInfo = new WebSocketConnectionInfo
            {
                DeviceId = deviceId,
                ConnectedAt = now,
                IpAddress = ipAddress,
                LastMessageAt = now,
                Status = DetermineWebSocketStatus(now)
            };

            string serializedInfo = JsonSerializer.Serialize(connectionInfo);
            if (string.IsNullOrEmpty(serializedInfo))
            {
                _logger.LogError("Failed to serialize WebSocket connection info for device {DeviceId}", deviceId);
                return;
            }
            try
            {
                await _redisDb.HashSetAsync(WebSocketConnectionHashKey, deviceId, serializedInfo);
                _logger.LogDebug("Successfully updated WebSocket connection for device {DeviceId} in Redis", deviceId);

                await BroadcastDeviceUpdate(deviceId, connectionInfo.Status.ToString(), "WebSocket", connectionInfo.LastMessageAt, connectionInfo.IpAddress);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update Redis with WebSocket connection for device {DeviceId}. Proceeding with database update.", deviceId);
            }
        }

        public async Task TrackHttpPoll(string deviceId, string ipAddress)
        {
            var now = DateTime.UtcNow;
            HttpConnectionInfo connectionInfo;
            var existingSerialized = await _redisDb.HashGetAsync(HttpConnectionHashKey, deviceId);

            if (!existingSerialized.IsNullOrEmpty)
            {
                try
                {
                    connectionInfo = JsonSerializer.Deserialize<HttpConnectionInfo>(existingSerialized);
                    connectionInfo.LastPollTime = now;
                    connectionInfo.LastKnownIp = ipAddress;
                    connectionInfo.SuccessfulPolls++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to deserialize existing HTTP info for {DeviceId}, creating new.", deviceId);
                    connectionInfo = CreateNewHttpInfo(deviceId, ipAddress, now);
                    connectionInfo.SuccessfulPolls = 1;
                }
            }
            else
            {
                connectionInfo = CreateNewHttpInfo(deviceId, ipAddress, now);
                connectionInfo.SuccessfulPolls = 1;
            }

            try
            {
                string serializedInfo = JsonSerializer.Serialize(connectionInfo);
                await _redisDb.HashSetAsync(HttpConnectionHashKey, deviceId, serializedInfo);
                _logger.LogTrace("Tracked HTTP poll for device {DeviceId} in Redis", deviceId);

                var status = IsHttpConnectionStale(connectionInfo) ? ConnectionStatus.Disconnected : ConnectionStatus.Active;
                var lastActivity = connectionInfo.LastStatusUpdate > connectionInfo.LastPollTime ? connectionInfo.LastStatusUpdate : connectionInfo.LastPollTime;
                await BroadcastDeviceUpdate(deviceId, status.ToString(), "HTTP", lastActivity, connectionInfo.LastKnownIp);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update Redis/broadcast HTTP poll for device {DeviceId}.", deviceId);
            }
        }

        public async Task TrackHttpStatusUpdate(string deviceId, string ipAddress)
        {
            var now = DateTime.UtcNow;
            try
            {
                var existingInfo = await GetHttpConnection(deviceId);
                if (existingInfo != null)
                {
                    existingInfo.LastStatusUpdate = now;
                    existingInfo.LastKnownIp = ipAddress;

                    string serializedInfo = JsonSerializer.Serialize(existingInfo);
                    await _redisDb.HashSetAsync(HttpConnectionHashKey, deviceId, serializedInfo);
                    _logger.LogTrace("Tracked HTTP status update for device {DeviceId} in Redis", deviceId);

                    var status = IsHttpConnectionStale(existingInfo) ? ConnectionStatus.Disconnected : ConnectionStatus.Active;
                    var lastActivity = existingInfo.LastStatusUpdate > existingInfo.LastPollTime ? existingInfo.LastStatusUpdate : existingInfo.LastPollTime;
                    await BroadcastDeviceUpdate(deviceId, status.ToString(), "HTTP", lastActivity, existingInfo.LastKnownIp);
                }
                else
                {
                    _logger.LogWarning("Attempted to update status for non-existent HTTP connection {DeviceId}, tracking as new poll.", deviceId);
                    await TrackHttpPoll(deviceId, ipAddress);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error updating HTTP status for device {DeviceId}.", deviceId);
            }
        }

        private HttpConnectionInfo CreateNewHttpInfo(string deviceId, string ipAddress, DateTime time) => new HttpConnectionInfo
        {
            DeviceId = deviceId,
            LastKnownIp = ipAddress,
            LastPollTime = time,
            LastStatusUpdate = time,
            SuccessfulPolls = 0
        };

        public async Task<DeviceConnectionSummary> GetConnectedDevices()
        {
            return await GetConnectedDevices(autoRemoveStale: false);
        }

        /// <summary>
        /// Gets connected devices with optional automatic removal of stale entries from Redis
        /// </summary>
        /// <param name="autoRemoveStale">If true, automatically removes stale entries from Redis</param>
        /// <returns></returns>
        public async Task<DeviceConnectionSummary> GetConnectedDevices(bool autoRemoveStale)
        {
            try
            {
                var webSocketEntries = await _redisDb.HashGetAllAsync(WebSocketConnectionHashKey);
                var httpEntries = await _redisDb.HashGetAllAsync(HttpConnectionHashKey);

                var webSocketConnections = new List<WebSocketConnectionInfo>();
                var staleWebSocketDevices = new List<string>();

                foreach (var entry in webSocketEntries)
                {
                    try
                    {
                        var wsInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo>(entry.Value);
                        if (wsInfo != null)
                        {
                            wsInfo.Status = DetermineWebSocketStatus(wsInfo.LastMessageAt);
                            if (wsInfo.Status != ConnectionStatus.Disconnected)
                            {
                                webSocketConnections.Add(wsInfo);
                            }
                            else
                            {
                                _logger.LogTrace("Excluding disconnected WS device {DeviceId} from summary.", wsInfo.DeviceId);
                                if (autoRemoveStale)
                                {
                                    staleWebSocketDevices.Add(wsInfo.DeviceId);
                                }
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error deserializing WebSocket entry: {EntryName}", entry.Name);
                        if (autoRemoveStale)
                        {
                            // If we can't deserialize the entry, it's corrupted and should be removed
                            staleWebSocketDevices.Add(entry.Name);
                        }
                    }
                }

                var httpConnections = new List<HttpConnectionInfo>();
                var staleHttpDevices = new List<string>();

                foreach (var entry in httpEntries)
                {
                    try
                    {
                        var httpInfo = JsonSerializer.Deserialize<HttpConnectionInfo>(entry.Value);
                        if (httpInfo != null)
                        {
                            if (!IsHttpConnectionStale(httpInfo))
                            {
                                httpConnections.Add(httpInfo);
                            }
                            else
                            {
                                _logger.LogTrace("Excluding stale HTTP device {DeviceId} from summary.", httpInfo.DeviceId);
                                if (autoRemoveStale)
                                {
                                    staleHttpDevices.Add(httpInfo.DeviceId);
                                }
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogError(ex, "Error deserializing HTTP entry: {EntryName}", entry.Name);
                        if (autoRemoveStale)
                        {
                            // If we can't deserialize the entry, it's corrupted and should be removed
                            staleHttpDevices.Add(entry.Name);
                        }
                    }
                }

                // Remove stale entries if requested
                if (autoRemoveStale)
                {
                    int cleanupCount = 0;

                    foreach (var deviceId in staleWebSocketDevices)
                    {
                        try
                        {
                            await _redisDb.HashDeleteAsync(WebSocketConnectionHashKey, deviceId);
                            cleanupCount++;
                            _logger.LogDebug("Auto-removed stale WebSocket connection for device {DeviceId}", deviceId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error auto-removing stale WebSocket connection for device {DeviceId}", deviceId);
                        }
                    }

                    foreach (var deviceId in staleHttpDevices)
                    {
                        try
                        {
                            await _redisDb.HashDeleteAsync(HttpConnectionHashKey, deviceId);
                            cleanupCount++;
                            _logger.LogDebug("Auto-removed stale HTTP connection for device {DeviceId}", deviceId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error auto-removing stale HTTP connection for device {DeviceId}", deviceId);
                        }
                    }

                    if (cleanupCount > 0)
                    {
                        _logger.LogInformation("Auto-cleaned {Count} stale connection entries from Redis", cleanupCount);
                    }
                }

                var summary = new DeviceConnectionSummary
                {
                    WebSocketConnections = webSocketConnections,
                    HttpConnections = httpConnections,
                    TotalConnectedDevices = webSocketConnections.Count + httpConnections.Count
                };

                summary.WebSocketPercentages = summary.TotalConnectedDevices > 0 ?
                    (int)Math.Round((decimal)summary.WebSocketConnections.Count / summary.TotalConnectedDevices * 100) :
                    0;

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

        private static ConnectionStatus DetermineWebSocketStatus(DateTime lastMessageAt)
        {
            var timeSinceLastMessage = DateTime.UtcNow - lastMessageAt;
            var minutes = timeSinceLastMessage.TotalMinutes;
            return minutes switch
            {
                < 2 => ConnectionStatus.Active,
                < 10 => ConnectionStatus.Connected,
                < 30 => ConnectionStatus.Idle,
                _ => ConnectionStatus.Disconnected
            };
        }

        private static bool IsHttpConnectionStale(HttpConnectionInfo connection)
        {
            const double httpTimeoutMinutes = 15.0;
            var lastActivity = connection.LastStatusUpdate > connection.LastPollTime ?
                connection.LastStatusUpdate :
                connection.LastPollTime;

            return (DateTime.UtcNow - lastActivity).TotalMinutes > httpTimeoutMinutes;
        }

        public static ConnectionMode DetermineConnectionMode(
            WebSocketConnectionInfo? wsInfo,
            HttpConnectionInfo? httpInfo)
        {
            var recentActivityThreshold = TimeSpan.FromMinutes(5);
            var now = DateTime.UtcNow;

            bool hasActiveWebSocket = wsInfo != null && DetermineWebSocketStatus(wsInfo.LastMessageAt) != ConnectionStatus.Disconnected;
            bool hasRecentHttpActivity = httpInfo != null && !IsHttpConnectionStale(httpInfo);

            if (hasActiveWebSocket && hasRecentHttpActivity)
            {
                return ConnectionMode.Mixed;
            }
            else if (hasActiveWebSocket)
            {
                return ConnectionMode.WebSocket;
            }
            else if (hasRecentHttpActivity)
            {
                return (httpInfo?.SuccessfulPolls ?? 0) > 1 ?
                    ConnectionMode.HTTPPolling :
                    ConnectionMode.HTTPDirect;
            }

            return ConnectionMode.Disconnected;
        }

        public async Task UpdateHttpPollSuccessCount(string deviceId)
        {
            try
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
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error updating HTTP poll success count for device {DeviceId}.", deviceId);
            }
        }

        public async Task RemoveWebSocketConnection(string deviceId)
        {
            try
            {
                var deleted = await _redisDb.HashDeleteAsync(WebSocketConnectionHashKey, deviceId);
                _logger.LogInformation("Removed WebSocket connection info for device {DeviceId} from Redis (Deleted: {Deleted})", deviceId, deleted);

                if (deleted)
                {
                    await BroadcastDeviceUpdate(deviceId, ConnectionStatus.Disconnected.ToString(), "WebSocket", DateTime.UtcNow, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error removing WebSocket connection for device {DeviceId}.", deviceId);
            }
        }

        public async Task RemoveHttpConnection(string deviceId)
        {
            try
            {
                var deleted = await _redisDb.HashDeleteAsync(HttpConnectionHashKey, deviceId);
                _logger.LogInformation("Removed HTTP connection info for device {DeviceId} from Redis (Deleted: {Deleted})", deviceId, deleted);

                if (deleted)
                {
                    await BroadcastDeviceUpdate(deviceId, ConnectionStatus.Disconnected.ToString(), "HTTP", DateTime.UtcNow, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error removing HTTP connection for device {DeviceId}.", deviceId);
            }
        }

        public async Task BroadcastDashboardMetrics(object metrics)
        {
            if (_hubContext != null)
            {
                await _hubContext.Clients.All.SendAsync("DashboardMetricsUpdate", metrics);
            }
        }

        /// <summary>
        /// Gets the count of currently connected devices
        /// </summary>
        /// <returns></returns>
        public async Task<int> GetConnectedDeviceCount()
        {
            try
            {
                var summary = await GetConnectedDevices(autoRemoveStale: false);
                return summary.TotalConnectedDevices;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connected device count.");
                return 0;
            }
        }

        /// <summary>
        /// Get the detail status of a specific deveinclud inlcude both websocket and http connection info
        /// </summary>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        ///
        public async Task<object> GetDeviceStatus(string deviceId)
        {
            if (string.IsNullOrEmpty(deviceId))
            {
                _logger.LogWarning("GetDeviceStatus called with empty deviceId.");
                return null;
            }
            try
            {
                var wsInfo = await GetWebSocketConnection(deviceId);
                var httpInfo = await GetHttpConnection(deviceId);
                if (wsInfo == null && httpInfo == null)
                {
                    _logger.LogInformation("No connection info found for device {DeviceId}.", deviceId);
                    return null;
                }

                var connectionMode = DetermineConnectionMode(wsInfo, httpInfo);

                var status = new
                {
                    DeviceId = deviceId,
                    ConnectionMode = connectionMode.ToString(),
                    WebSocketConnection = wsInfo != null ? new
                    {
                        status = wsInfo.Status.ToString(),
                        lastMessageAt = wsInfo.LastMessageAt,
                        ipAddress = wsInfo.IpAddress,
                        connectedAt = wsInfo.ConnectedAt

                    } : null,
                    HttpConnection = httpInfo != null ? new
                    {
                        lastPollTime = httpInfo.LastPollTime,
                        lastStatusUpdate = httpInfo.LastStatusUpdate,
                        lastKnownIp = httpInfo.LastKnownIp,
                        successfulPolls = httpInfo.SuccessfulPolls
                    } : null,
                    lastActivity = GetLastActivityTime(wsInfo, httpInfo)
                };

                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device status for {DeviceId}.", deviceId);
                return null;
            }
        }

        private object GetLastActivityTime(WebSocketConnectionInfo? wsInfo, HttpConnectionInfo? httpInfo)
        {
            DateTime lastActivity = DateTime.MinValue;
            if (wsInfo != null)
            {
                lastActivity = wsInfo.LastMessageAt > lastActivity ? wsInfo.LastMessageAt : lastActivity;
            }
            if (httpInfo != null)
            {
                var httpLastActivity = httpInfo.LastStatusUpdate > httpInfo.LastPollTime
                                   ? httpInfo.LastStatusUpdate
                                   : httpInfo.LastPollTime;

                if (httpLastActivity > lastActivity)
                {
                    lastActivity = httpLastActivity;
                }
            }
            return lastActivity;
        }

        public async Task UpdateWebSocketLastMessageTime(string deviceId)
        {
            if (string.IsNullOrEmpty(deviceId))
            {
                _logger.LogWarning("UpdateWebSocketLastMessageTime called with empty deviceId.");
                return;
            }

            try
            {
                var connectionInfo = await GetWebSocketConnection(deviceId);
                if (connectionInfo != null)
                {
                    var now = DateTime.UtcNow;
                    var previousStatus = connectionInfo.Status;
                    connectionInfo.LastMessageAt = now;
                    var currentStatus = DetermineWebSocketStatus(now);

                    string serializedInfo = JsonSerializer.Serialize(connectionInfo);
                    await _redisDb.HashSetAsync(WebSocketConnectionHashKey, deviceId, serializedInfo);
                    _logger.LogTrace("Updated LastMessageAt for WebSocket device {DeviceId}", deviceId);

                    await BroadcastDeviceUpdate(deviceId, currentStatus.ToString(), "WebSocket", now, connectionInfo.IpAddress);
                }
                else
                {
                    _logger.LogWarning("Attempted to update LastMessageAt for non-existent WebSocket connection: {DeviceId}", deviceId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update LastMessageAt for WebSocket device {DeviceId}", deviceId);
            }
        }

        public async Task<IDatabase> GetRedisDatabase()
        {
            return _redisDb;
        }

        /// <summary>
        /// Gets the cached UploadStatus for a device from Redis
        /// This contains the full pump/probe/reader data that was last received from the device
        /// </summary>
        /// <param name="deviceId">Device ID to get status for</param>
        /// <returns>UploadStatus object or null if not found</returns>
        public async Task<object> GetDeviceUploadStatus(string deviceId)
        {
            if (string.IsNullOrEmpty(deviceId))
            {
                _logger.LogWarning("GetDeviceUploadStatus called with empty deviceId.");
                return null;
            }

            try
            {
                var redisKey = $"device:{deviceId}:status";
                var statusJson = await _redisDb.StringGetAsync(redisKey);

                if (statusJson.IsNullOrEmpty)
                {
                    _logger.LogDebug("No UploadStatus found in Redis for device {DeviceId}", deviceId);
                    return null;
                }

                // Deserialize as dynamic object to preserve the original structure
                var status = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(statusJson);
                _logger.LogDebug("Retrieved UploadStatus from Redis for device {DeviceId}", deviceId);
                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving UploadStatus from Redis for device {DeviceId}", deviceId);
                return null;
            }
        }

        private async Task BroadcastDeviceUpdate(string deviceId, string status, string connectionType, DateTime lastActivity, string ipAddress)
        {
            try
            {
                var updatePayload = new
                {
                    deviceId,
                    status,
                    connectionType,
                    lastActivity,
                    ipAddress
                };
                await _hubContext.Clients.All.SendAsync("DeviceStatusUpdate", updatePayload);
                _logger.LogTrace("Broadcasted single update for Device {DeviceId}: Status={Status}, Type={Type}", deviceId, status, connectionType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast single device status update for {DeviceId}", deviceId);
            }
        }


    }
}