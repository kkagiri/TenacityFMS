using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication.Tracker.Common;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Services {
    //Cursor on changes to code
    /// <summary>
    /// Service for detecting stale device connections based on Redis activity data
    /// </summary>
    public interface IStaleConnectionDetectionService {
        Task<bool> IsDeviceConnectionStale (string deviceId, int thresholdMinutes = 5);
        Task<DeviceActivityStatus> GetDeviceActivityStatus (string deviceId);
        Task<List<string>> GetStaleDevices (int thresholdMinutes = 5);
        Task<bool> IsDeviceRecentlyActive (string deviceId, int thresholdMinutes = 2);
    }

    //Cursor on changes to code
    /// <summary>
    /// Represents the activity status of a device
    /// </summary>
    public class DeviceActivityStatus {
        public string DeviceId { get; set; }
        public bool HasWebSocketConnection { get; set; }
        public bool HasHttpConnection { get; set; }
        public DateTime? LastWebSocketActivity { get; set; }
        public DateTime? LastHttpActivity { get; set; }
        public DateTime? MostRecentActivity { get; set; }
        public double MinutesSinceLastActivity { get; set; }
        public bool IsStale { get; set; }
        public ConnectionMode PrimaryConnectionMode { get; set; }
    }

    //Cursor on changes to code
    /// <summary>
    /// Service implementation for detecting stale device connections
    /// </summary>
    public class StaleConnectionDetectionService : IStaleConnectionDetectionService {
        private readonly ILogger<StaleConnectionDetectionService> _logger;
        private readonly IConnectionMultiplexer _redisConnection;
        private readonly IDatabase _redisDb;
        private const string WebSocketConnectionHashKey = "device:websocket-connections";
        private const string HttpConnectionHashKey = "device:http-connections";

        public StaleConnectionDetectionService (
            ILogger<StaleConnectionDetectionService> logger,
            IConnectionMultiplexer redisConnection) {
            _logger = logger;
            _redisConnection = redisConnection;
            _redisDb = redisConnection.GetDatabase ();
        }

        public async Task<bool> IsDeviceConnectionStale (string deviceId, int thresholdMinutes = 5) {
            try {
                var activityStatus = await GetDeviceActivityStatus (deviceId);
                return activityStatus.IsStale || activityStatus.MinutesSinceLastActivity > thresholdMinutes;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error checking if device {DeviceId} connection is stale", deviceId);
                return true; // Assume stale on error for safety
            }
        }

        public async Task<DeviceActivityStatus> GetDeviceActivityStatus (string deviceId) {
            var status = new DeviceActivityStatus {
                DeviceId = deviceId,
                PrimaryConnectionMode = ConnectionMode.Disconnected
            };

            try {
                var now = DateTime.UtcNow;

                // Check WebSocket connection
                var wsInfo = await GetWebSocketConnectionInfo (deviceId);
                if (wsInfo != null) {
                    status.HasWebSocketConnection = true;
                    status.LastWebSocketActivity = wsInfo.LastMessageAt;
                }

                // Check HTTP connection
                var httpInfo = await GetHttpConnectionInfo (deviceId);
                if (httpInfo != null) {
                    status.HasHttpConnection = true;
                    var lastHttpActivity = httpInfo.LastStatusUpdate > httpInfo.LastPollTime ?
                        httpInfo.LastStatusUpdate :
                        httpInfo.LastPollTime;
                    status.LastHttpActivity = lastHttpActivity;
                }

                // Determine most recent activity
                var activities = new List<DateTime?> { status.LastWebSocketActivity, status.LastHttpActivity }
                    .Where (d => d.HasValue)
                    .Select (d => d.Value)
                    .ToList ();

                if (activities.Any ()) {
                    status.MostRecentActivity = activities.Max ();
                    status.MinutesSinceLastActivity = (now - status.MostRecentActivity.Value).TotalMinutes;

                    // Determine primary connection mode
                    if (status.HasWebSocketConnection &&
                        (status.LastWebSocketActivity == status.MostRecentActivity ||
                            (now - status.LastWebSocketActivity.Value).TotalMinutes <= 10)) {
                        status.PrimaryConnectionMode = ConnectionMode.WebSocket;
                    } else if (status.HasHttpConnection) {
                        status.PrimaryConnectionMode = httpInfo?.SuccessfulPolls > 1 ?
                            ConnectionMode.HTTPPolling :
                            ConnectionMode.HTTPDirect;
                    }
                } else {
                    status.MinutesSinceLastActivity = double.MaxValue;
                    status.IsStale = true;
                }

                _logger.LogDebug ("Device {DeviceId} activity status: WS={HasWS}, HTTP={HasHTTP}, LastActivity={LastActivity}, Minutes={Minutes}",
                    deviceId, status.HasWebSocketConnection, status.HasHttpConnection,
                    status.MostRecentActivity?.ToString ("o") ?? "None", status.MinutesSinceLastActivity);

                return status;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting device {DeviceId} activity status", deviceId);
                status.IsStale = true;
                status.MinutesSinceLastActivity = double.MaxValue;
                return status;
            }
        }

        public async Task<List<string>> GetStaleDevices (int thresholdMinutes = 5) {
            var staleDevices = new List<string> ();

            try {
                // Get all WebSocket connections
                var wsEntries = await _redisDb.HashGetAllAsync (WebSocketConnectionHashKey);
                var httpEntries = await _redisDb.HashGetAllAsync (HttpConnectionHashKey);

                var allDeviceIds = new HashSet<string> ();

                // Collect all device IDs
                foreach (var entry in wsEntries) {
                    try {
                        var wsInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo> (entry.Value);
                        if (wsInfo != null) allDeviceIds.Add (wsInfo.DeviceId);
                    } catch (Exception ex) {
                        _logger.LogWarning (ex, "Error deserializing WebSocket entry for stale detection");
                    }
                }

                foreach (var entry in httpEntries) {
                    try {
                        var httpInfo = JsonSerializer.Deserialize<HttpConnectionInfo> (entry.Value);
                        if (httpInfo != null) allDeviceIds.Add (httpInfo.DeviceId);
                    } catch (Exception ex) {
                        _logger.LogWarning (ex, "Error deserializing HTTP entry for stale detection");
                    }
                }

                // Check each device for staleness
                foreach (var deviceId in allDeviceIds) {
                    if (await IsDeviceConnectionStale (deviceId, thresholdMinutes)) {
                        staleDevices.Add (deviceId);
                    }
                }

                _logger.LogDebug ("Found {Count} stale devices out of {Total} total devices", staleDevices.Count, allDeviceIds.Count);
                return staleDevices;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting stale devices list");
                return staleDevices;
            }
        }

        public async Task<bool> IsDeviceRecentlyActive (string deviceId, int thresholdMinutes = 2) {
            var status = await GetDeviceActivityStatus (deviceId);
            return !status.IsStale && status.MinutesSinceLastActivity <= thresholdMinutes;
        }

        private async Task<WebSocketConnectionInfo?> GetWebSocketConnectionInfo (string deviceId) {
            try {
                var serializedInfo = await _redisDb.HashGetAsync (WebSocketConnectionHashKey, deviceId);
                if (serializedInfo.IsNullOrEmpty) return null;

                return JsonSerializer.Deserialize<WebSocketConnectionInfo> (serializedInfo);
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Error getting WebSocket connection info for device {DeviceId}", deviceId);
                return null;
            }
        }

        private async Task<HttpConnectionInfo?> GetHttpConnectionInfo (string deviceId) {
            try {
                var serializedInfo = await _redisDb.HashGetAsync (HttpConnectionHashKey, deviceId);
                if (serializedInfo.IsNullOrEmpty) return null;

                return JsonSerializer.Deserialize<HttpConnectionInfo> (serializedInfo);
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Error getting HTTP connection info for device {DeviceId}", deviceId);
                return null;
            }
        }
    }
}