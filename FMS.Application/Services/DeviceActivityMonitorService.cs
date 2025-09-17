using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.Services.Configuration;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services {
    public class DeviceActivityMonitorService : BackgroundService {
        private readonly ILogger<DeviceActivityMonitorService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private TimeSpan _checkInterval;
        private TimeSpan _redisCleanupInterval;
        private DateTime _lastRedisCleanup = DateTime.MinValue;

        public DeviceActivityMonitorService (
            ILogger<DeviceActivityMonitorService> logger,
            IServiceScopeFactory scopeFactory,
            DeviceConnectionTracker deviceConnectionTracker) {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _deviceConnectionTracker = deviceConnectionTracker;
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            _logger.LogInformation ("Device Activity Monitor Service is starting.");

            //Cursor on changes to code
            // Load configuration values at startup
            await LoadConfigurationValues (stoppingToken);

            await PerformStartupRedisCleanup (stoppingToken);

            while (!stoppingToken.IsCancellationRequested) {
                try {
                    await CheckDeviceActivity (stoppingToken);

                    if (DateTime.UtcNow - _lastRedisCleanup >= _redisCleanupInterval) {
                        await PerformRedisCleanup (stoppingToken);
                        _lastRedisCleanup = DateTime.UtcNow;
                    }

                    await Task.Delay (_checkInterval, stoppingToken);
                } catch (OperationCanceledException) {
                    _logger.LogInformation ("Device Activity Monitor Service is stopping due to cancellation.");
                    break;
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error occurred during device activity check cycle. Service will continue.");
                }
            }

            //Cursor on changes to code
            // Perform final cleanup on service shutdown
            await PerformShutdownCleanup ();

            _logger.LogInformation ("Device Activity Monitor Service has stopped.");
        }

        //Cursor on changes to code
        /// <summary>
        /// Performs cleanup when the service is shutting down to prevent leaving stale data in Redis
        /// </summary>
        private async Task PerformShutdownCleanup () {
            try {
                _logger.LogInformation ("Performing shutdown cleanup to prevent stale Redis entries...");

                // Get all devices that might have stale connections and clean them up
                var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices (autoRemoveStale: true);

                _logger.LogInformation ("Shutdown cleanup completed. Service stopping gracefully.");
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Error during shutdown cleanup - some stale entries may remain in Redis");
            }
        }

        private async Task CheckDeviceActivity (CancellationToken stoppingToken) {
            if (stoppingToken.IsCancellationRequested) {
                _logger.LogInformation ("Cancellation requested before starting check cycle.");
                return;
            }

            using var scope = _scopeFactory.CreateScope ();
            var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();
            _logger.LogDebug ("Starting device activity check cycle.");

            var monitoredDevices = await context.Ptsdevices
                .Where (d => d.IsActive == 1)
                .ToListAsync (stoppingToken);

            _logger.LogDebug ("Monitoring {DeviceCount} active devices.", monitoredDevices.Count);
            _logger.LogDebug ("Active devices from DB: {DeviceIds}", string.Join (", ", monitoredDevices.Select (d => $"'{d.Ptsid}' (type:{d.Ptsid.GetType().Name})")));

            // Check Redis for all important metadata
            var redisDevices = new List < (string Id, string Type, DateTime LastActivity) > ();
            try {
                var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices ();

                foreach (var ws in connectedDevices.WebSocketConnections) {
                    redisDevices.Add ((ws.DeviceId, "WebSocket", ws.LastMessageAt));
                }
                foreach (var http in connectedDevices.HttpConnections) {
                    redisDevices.Add ((http.DeviceId, "HTTP", http.LastStatusUpdate));
                }

                // Log devices in Redis to monitor relationship issues
                foreach (var dev in redisDevices) {
                    var matchingDbId = monitoredDevices.FirstOrDefault (d =>
                        dev.Id.TrimStart ('0') == d.Ptsid ||
                        d.Ptsid == dev.Id)?.Ptsid;

                    if (matchingDbId != null) {
                        _logger.LogDebug ("Redis device: {RedisId} ({Type}) - Last activity: {LastActivity} - DB match: {DbId}",
                            dev.Id, dev.Type, dev.LastActivity, matchingDbId);
                    } else {
                        _logger.LogWarning ("Redis device: {RedisId} ({Type}) - Last activity: {LastActivity} - NO DB MATCH",
                            dev.Id, dev.Type, dev.LastActivity);
                    }
                }

                var wsDevices = connectedDevices.WebSocketConnections.Select (ws => ws.DeviceId).ToList ();
                var httpDevices = connectedDevices.HttpConnections.Select (http => http.DeviceId).ToList ();
                _logger.LogDebug ("Redis WS connected devices: {WsDevices}", string.Join (", ", wsDevices));
                _logger.LogDebug ("Redis HTTP connected devices: {HttpDevices}", string.Join (", ", httpDevices));
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Error getting connected devices from Redis for diagnostic purposes");
            }

            var now = DateTime.UtcNow;

            foreach (var device in monitoredDevices) {
                if (stoppingToken.IsCancellationRequested) {
                    _logger.LogInformation ("Cancellation requested during device processing loop.");
                    break;
                }

                bool requiresDbUpdate = false;
                string deviceIdStr = device.Ptsid;

                // Log the raw device ID from database for debugging
                _logger.LogTrace ("[{DeviceId}] Processing device from DB", deviceIdStr);

                // Try getting connection with exact ID from database
                var wsConnection = await _deviceConnectionTracker.GetWebSocketConnection (deviceIdStr);
                var httpConnection = await _deviceConnectionTracker.GetHttpConnection (deviceIdStr);

                // If not found with exact ID, check if we need to normalize the ID format
                if (wsConnection == null && httpConnection == null) //Cursor on changes to code: Remove the constraint for numeric IDs
                {
                    // Try to find a matching pattern between database and Redis IDs
                    var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices ();

                    // Get all connected device IDs from Redis
                    var wsIds = connectedDevices.WebSocketConnections.Select (c => c.DeviceId);
                    var httpIds = connectedDevices.HttpConnections.Select (c => c.DeviceId);
                    var allRedisIds = wsIds.Concat (httpIds).ToList ();

                    // Log all the potential IDs to help with debugging
                    _logger.LogDebug ("[{DeviceId}] Looking for match among Redis IDs: {RedisIds}",
                        deviceIdStr, string.Join (", ", allRedisIds));

                    // Try multiple matching strategies
                    string potentialMatchingId = null;

                    // Strategy 1: If Redis ID starts with leading zeros followed by the exact DB ID
                    foreach (var redisId in allRedisIds) {
                        // More strict matching to avoid false associations
                        // Only match if the Redis ID begins with zeros and then contains exactly the DB ID
                        if (redisId.TrimStart ('0') == deviceIdStr) {
                            potentialMatchingId = redisId;
                            _logger.LogInformation ("[{DeviceId}] Found exact match with Redis ID (after trimming zeros): {RedisId}", deviceIdStr, potentialMatchingId);
                            break;
                        }
                    }

                    // Strategy 2: Check for explicit device ID mappings
                    // This is where you could define specific mappings for known device pairs
                    // For now, we'll explicitly avoid matching "2" with any ID that starts with "0024"
                    if (deviceIdStr == "2" && potentialMatchingId?.StartsWith ("0024") == true) {
                        _logger.LogWarning ("[{DeviceId}] Found match with {RedisId} but this is known to be incorrect - ignoring match", deviceIdStr, potentialMatchingId);
                        potentialMatchingId = null; // Explicitly reject this match
                    }

                    // If we found a potential match, try using it
                    if (potentialMatchingId != null) {
                        _logger.LogWarning ("[{DeviceId}] Found potential matching Redis ID: '{RedisId}'", deviceIdStr, potentialMatchingId);

                        // Try with the matched ID from Redis
                        wsConnection = await _deviceConnectionTracker.GetWebSocketConnection (potentialMatchingId);
                        httpConnection = await _deviceConnectionTracker.GetHttpConnection (potentialMatchingId);

                        if (wsConnection != null || httpConnection != null) {
                            _logger.LogInformation ("[{DeviceId}] Successfully resolved connection using Redis ID '{RedisId}'", deviceIdStr, potentialMatchingId);

                            // Store this mapping for future use
                            var mappingKey = $"device-id-mapping:{deviceIdStr}";
                            try {
                                // Try to store this mapping in Redis for future lookups
                                var db = await _deviceConnectionTracker.GetRedisDatabase ();
                                if (db != null) {
                                    await db.StringSetAsync (mappingKey, potentialMatchingId, TimeSpan.FromDays (7));
                                    _logger.LogDebug ("[{DeviceId}] Created Redis ID mapping: {DbId} -> {RedisId}", deviceIdStr, potentialMatchingId);
                                }
                            } catch (Exception ex) {
                                _logger.LogWarning (ex, "[{DeviceId}] Failed to store ID mapping in Redis", deviceIdStr);
                            }
                        }
                    }
                }

                PTSDeviceConnection? activeDbConnection = await context.DeviceConnections
                    .Where (dc => dc.PtsdeviceId == deviceIdStr && dc.DisconnectedAt == null)
                    .OrderByDescending (dc => dc.ConnectedAt)
                    .FirstOrDefaultAsync (stoppingToken);

                string originalStatus = device.ConnectionStatus ?? "Unknown";
                DateTime? originalLastActivity = device.LastActivity;

                _logger.LogTrace ("[{DeviceId}] Checking. DB Status: {DbStatus}, DB LastActivity: {DbLastActivity}, ActiveConnRecord: {HasActiveConn}",
                    deviceIdStr, originalStatus, originalLastActivity?.ToString ("o") ?? "null", activeDbConnection != null);

                try {
                    _logger.LogTrace ("[{DeviceId}] Redis WS: {WsInfo}, Redis HTTP: {HttpInfo}",
                        deviceIdStr,
                        wsConnection != null ? $"LastMsg: {wsConnection.LastMessageAt:o}" : "null",
                        httpConnection != null ? $"LastUpdate: {httpConnection.LastStatusUpdate:o}, LastPoll: {httpConnection.LastPollTime:o}" : "null");

                    var wsTimeout = await GetWebSocketTimeoutAsync ();
                    var httpTimeout = await GetHttpTimeoutAsync ();

                    bool isWsActive = wsConnection != null && (now - wsConnection.LastMessageAt).TotalSeconds <= wsTimeout;
                    bool isHttpActive = httpConnection != null && (now - (httpConnection.LastStatusUpdate > httpConnection.LastPollTime ? httpConnection.LastStatusUpdate : httpConnection.LastPollTime)).TotalSeconds <= httpTimeout;

                    bool isCurrentlyActive = isWsActive || isHttpActive;
                    string determinedStatus = isCurrentlyActive ? "Connected" : "Disconnected";
                    string? currentIp = isWsActive ? wsConnection?.IpAddress : (isHttpActive ? httpConnection?.LastKnownIp : null);
                    DateTime lastActivity = isCurrentlyActive ?
                        (isWsActive ? wsConnection.LastMessageAt : (httpConnection.LastStatusUpdate > httpConnection.LastPollTime ? httpConnection.LastStatusUpdate : httpConnection.LastPollTime)) :
                        (originalLastActivity ?? now);
                    string connectionType = isWsActive ? "WebSocket" : (isHttpActive ? "HTTP" : (activeDbConnection?.ConnectionType ?? "Unknown"));

                    // _logger.LogTrace("[{DeviceId}] Determined Status: {DetStatus}, IsActive: {IsActive}, LastActivity: {LastAct}, IP: {Ip}, Type: {Type}",
                    //                  deviceIdStr, determinedStatus, isCurrentlyActive, lastActivity.ToString("o"), currentIp ?? "N/A", connectionType);

                    if (originalStatus != determinedStatus) {
                        // _logger.LogInformation("[{DeviceId}] Status change detected: '{OriginalStatus}' -> '{DeterminedStatus}'. Queuing DB update.",
                        //     deviceIdStr, originalStatus, determinedStatus);

                        device.ConnectionStatus = determinedStatus;
                        device.LastActivity = lastActivity;
                        if (currentIp != null) device.Ipaddress = currentIp;
                        requiresDbUpdate = true;

                        if (determinedStatus == "Disconnected") {
                            //Cursor on changes to code
                            // Clean up Redis entries when device is determined to be disconnected
                            try {
                                if (wsConnection != null) {
                                    _logger.LogInformation ("[{DeviceId}] Removing stale WebSocket connection from Redis", deviceIdStr);
                                    await _deviceConnectionTracker.RemoveWebSocketConnection (deviceIdStr);
                                }
                                if (httpConnection != null) {
                                    _logger.LogInformation ("[{DeviceId}] Removing stale HTTP connection from Redis", deviceIdStr);
                                    await _deviceConnectionTracker.RemoveHttpConnection (deviceIdStr);
                                }
                            } catch (Exception ex) {
                                _logger.LogWarning (ex, "[{DeviceId}] Error cleaning up Redis connections during disconnect", deviceIdStr);
                            }

                            if (activeDbConnection != null) {
                                _logger.LogTrace ("[{DeviceId}] Marking active DeviceConnection record ID {ConnId} as Disconnected.", deviceIdStr, activeDbConnection.Id);
                                activeDbConnection.DisconnectedAt = now;
                                activeDbConnection.Status = "Disconnected";
                            } else {
                                _logger.LogWarning ("[{DeviceId}] Status changed to Disconnected, but no active DeviceConnection record was found in DB. Ptsdevice status updated.", deviceIdStr);
                            }
                        } else {
                            if (activeDbConnection == null) {
                                var newConnection = new PTSDeviceConnection {
                                PtsdeviceId = deviceIdStr,
                                IpAddress = currentIp,
                                ConnectedAt = now,
                                LastActivityAt = lastActivity,
                                ConnectionType = connectionType,
                                Status = determinedStatus,
                                DisconnectedAt = null
                                };
                                context.DeviceConnections.Add (newConnection);
                                _logger.LogInformation ("[{DeviceId}] Creating new DeviceConnection record.", deviceIdStr);
                            } else {
                                _logger.LogWarning ("[{DeviceId}] Status changed to Connected, but an active DeviceConnection record (ID {ConnId}) unexpectedly existed. Updating it.", deviceIdStr, activeDbConnection.Id);
                                activeDbConnection.Status = determinedStatus;
                                activeDbConnection.LastActivityAt = lastActivity;
                                activeDbConnection.IpAddress = currentIp;
                                activeDbConnection.ConnectionType = connectionType;
                                activeDbConnection.ConnectedAt = now;
                                activeDbConnection.DisconnectedAt = null;
                            }
                        }
                    } else if (determinedStatus == "Connected") {
                        bool activityOrIpUpdated = false;
                        if (lastActivity > (originalLastActivity ?? DateTime.MinValue)) {
                            _logger.LogTrace ("[{DeviceId}] Updating device LastActivity: {Original} -> {New}", deviceIdStr, originalLastActivity?.ToString ("o"), lastActivity.ToString ("o"));
                            device.LastActivity = lastActivity;
                            activityOrIpUpdated = true;
                        }
                        if (currentIp != null && device.Ipaddress != currentIp) {
                            _logger.LogTrace ("[{DeviceId}] Updating device Ipaddress: {Original} -> {New}", deviceIdStr, device.Ipaddress ?? "null", currentIp);
                            device.Ipaddress = currentIp;
                            activityOrIpUpdated = true;
                        }

                        if (activityOrIpUpdated) {
                            requiresDbUpdate = true;
                            if (activeDbConnection != null) {
                                _logger.LogTrace ("[{DeviceId}] Updating active DeviceConnection record ID {ConnId} with LastActivity: {LastAct}, IP: {Ip}, Type: {Type}",
                                    deviceIdStr, activeDbConnection.Id, lastActivity.ToString ("o"), currentIp, connectionType);
                                activeDbConnection.LastActivityAt = lastActivity;
                                activeDbConnection.IpAddress = currentIp;
                                activeDbConnection.ConnectionType = connectionType;
                                activeDbConnection.Status = determinedStatus;
                            } else {
                                _logger.LogWarning ("[{DeviceId}] Device activity updated while Connected, but NO active DeviceConnection record found. Creating one.", deviceIdStr);
                                var newConnection = new PTSDeviceConnection {
                                    PtsdeviceId = deviceIdStr,
                                    IpAddress = currentIp,
                                    ConnectedAt = originalLastActivity ?? now,
                                    LastActivityAt = lastActivity,
                                    ConnectionType = connectionType,
                                    Status = determinedStatus,
                                    DisconnectedAt = null
                                };
                                context.DeviceConnections.Add (newConnection);
                            }
                        } else {
                            _logger.LogTrace ("[{DeviceId}] No change in status or relevant activity/IP. No DB update needed.", deviceIdStr);
                        }
                    } else {
                        if (activeDbConnection != null) {
                            _logger.LogWarning ("[{DeviceId}] Device remains Disconnected, but an active DeviceConnection record (ID {ConnId}) was found. Marking it disconnected.", deviceIdStr, activeDbConnection.Id);
                            activeDbConnection.DisconnectedAt = now;
                            activeDbConnection.Status = "Disconnected";
                            requiresDbUpdate = true;
                        } else {
                            _logger.LogTrace ("[{DeviceId}] Device remains Disconnected. No DB update needed.", deviceIdStr);
                        }
                    }

                    if (requiresDbUpdate) {
                        _logger.LogInformation ("[{DeviceId}] Attempting to save changes to the database...", deviceIdStr);
                        try {
                            // Explicitly mark entities as modified if they've been changed
                            if (device != null) {
                                var deviceEntry = context.Entry (device);
                                _logger.LogDebug ("[{DeviceId}] Device entity state before save: {State}", deviceIdStr, deviceEntry.State);
                            }

                            if (activeDbConnection != null) {
                                var connectionEntry = context.Entry (activeDbConnection);

                                // If the connection was loaded separately and not tracked, attach and mark as modified
                                if (connectionEntry.State == EntityState.Detached) {
                                    _logger.LogDebug ("[{DeviceId}] DeviceConnection entity is Detached, explicitly attaching", deviceIdStr);
                                    context.DeviceConnections.Attach (activeDbConnection);
                                    context.Entry (activeDbConnection).State = EntityState.Modified;
                                } else {
                                    _logger.LogDebug ("[{DeviceId}] DeviceConnection entity state before save: {State}", deviceIdStr, connectionEntry.State);
                                }
                            }

                            // Save all tracked changes
                            int changes = await context.SaveChangesAsync (stoppingToken);
                            _logger.LogInformation ("[{DeviceId}] Successfully saved {ChangeCount} changes to the database.", deviceIdStr, changes);

                            // Verify the changes were actually saved by checking the DB after save
                            var verifiedConnection = await context.DeviceConnections
                                .Where (dc => dc.PtsdeviceId == deviceIdStr)
                                .OrderByDescending (dc => dc.ConnectedAt)
                                .FirstOrDefaultAsync (stoppingToken);

                            var verifiedDevice = await context.Ptsdevices
                                .FirstOrDefaultAsync (d => d.Ptsid == deviceIdStr, stoppingToken);

                            _logger.LogDebug ("[{DeviceId}] Post-save verification - Device status: {Status}, Connection exists: {HasConnection}",
                                deviceIdStr,
                                verifiedDevice?.ConnectionStatus ?? "null",
                                verifiedConnection != null);
                        } catch (DbUpdateException dbEx) {
                            _logger.LogError (dbEx, "[{DeviceId}] Database update error during SaveChanges. InnerException: {InnerMessage}", deviceIdStr, dbEx.InnerException?.Message);
                        } catch (Exception saveEx) {
                            _logger.LogError (saveEx, "[{DeviceId}] General error during SaveChanges.", deviceIdStr);
                        }
                    }
                } catch (OperationCanceledException) {
                    _logger.LogInformation ("[{DeviceId}] Operation canceled during activity check.", deviceIdStr);
                    break;
                } catch (Exception ex) {
                    _logger.LogError (ex, "Unhandled error processing activity check for device {DeviceId}", deviceIdStr);
                }
            }
            _logger.LogDebug ("Finished device activity check cycle.");
        }

        //Cursor on changes to code
        /// <summary>
        /// Loads configuration values at startup using the system configuration service
        /// </summary>
        private async Task LoadConfigurationValues (CancellationToken cancellationToken) {
            try {
                using var scope = _scopeFactory.CreateScope ();
                var systemConfigurationService = scope.ServiceProvider.GetRequiredService<ISystemConfigurationService> ();

                var checkIntervalSeconds = await systemConfigurationService.GetDeviceActivityCheckIntervalSecondsAsync (cancellationToken);
                var redisCleanupMinutes = await systemConfigurationService.GetRedisCleanupIntervalMinutesAsync (cancellationToken);

                _checkInterval = TimeSpan.FromSeconds (checkIntervalSeconds);
                _redisCleanupInterval = TimeSpan.FromMinutes (redisCleanupMinutes);

                _logger.LogInformation ("Configuration loaded - Check interval: {CheckInterval}s, Redis cleanup: {RedisCleanup}m",
                    checkIntervalSeconds, redisCleanupMinutes);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error loading configuration values, using defaults");
                _checkInterval = TimeSpan.FromSeconds (10);
                _redisCleanupInterval = TimeSpan.FromMinutes (5);
            }
        }

        private async Task<int> GetWebSocketTimeoutAsync (CancellationToken cancellationToken = default) {
            using var scope = _scopeFactory.CreateScope ();
            var systemConfigurationService = scope.ServiceProvider.GetRequiredService<ISystemConfigurationService> ();
            return await systemConfigurationService.GetWebSocketTimeoutSecondsAsync (cancellationToken);
        }

        private async Task<int> GetHttpTimeoutAsync (CancellationToken cancellationToken = default) {
            using var scope = _scopeFactory.CreateScope ();
            var systemConfigurationService = scope.ServiceProvider.GetRequiredService<ISystemConfigurationService> ();
            return await systemConfigurationService.GetHttpTimeoutSecondsAsync (cancellationToken);
        }

        // Add this method to check for explicit mappings
        private async Task<string> TryGetMappedDeviceId (string deviceId, GpsdataContext context, CancellationToken cancellationToken) {
            // In the future, this could query a device_mappings table to get proper mappings
            // For now we use hardcoded values for the specific case we know about
            //ToDo: Create mapping table in DB to map Redis IDs to DB IDs
            if (deviceId == "002400375631500620323837") {
                // If the real DB id for this device is something else, return it
                // For example, if Redis device 002400375631500620323837 actually is device 24 in DB:
                // return "24";

                // Leave as is if it should stay unmapped
                return deviceId;
            }

            return deviceId;
        }

        private async Task PerformStartupRedisCleanup (CancellationToken stoppingToken) {
            try {
                _logger.LogInformation ("Performing startup Redis cleanup for potentially stale connections...");

                //Cursor on changes to code
                // Use auto-cleanup feature to automatically remove stale Redis entries
                var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices (autoRemoveStale: true);
                var now = DateTime.UtcNow;
                int cleanedCount = 0;

                // Check WebSocket connections
                foreach (var wsConnection in connectedDevices.WebSocketConnections) {
                    if (stoppingToken.IsCancellationRequested) break;

                    var timeSinceLastMessage = now - wsConnection.LastMessageAt;

                    // If last message was more than 10 minutes ago, likely stale
                    if (timeSinceLastMessage.TotalMinutes > 10) {
                        _logger.LogWarning ("Removing stale WebSocket connection for device {DeviceId} - last message was {Minutes} minutes ago",
                            wsConnection.DeviceId, timeSinceLastMessage.TotalMinutes);

                        await _deviceConnectionTracker.RemoveWebSocketConnection (wsConnection.DeviceId);
                        cleanedCount++;
                    }
                }

                // Check HTTP connections
                foreach (var httpConnection in connectedDevices.HttpConnections) {
                    if (stoppingToken.IsCancellationRequested) break;

                    var lastActivity = httpConnection.LastStatusUpdate > httpConnection.LastPollTime ?
                        httpConnection.LastStatusUpdate :
                        httpConnection.LastPollTime;
                    var timeSinceLastActivity = now - lastActivity;

                    // If last activity was more than 20 minutes ago, likely stale
                    if (timeSinceLastActivity.TotalMinutes > 20) {
                        _logger.LogWarning ("Removing stale HTTP connection for device {DeviceId} - last activity was {Minutes} minutes ago",
                            httpConnection.DeviceId, timeSinceLastActivity.TotalMinutes);

                        await _deviceConnectionTracker.RemoveHttpConnection (httpConnection.DeviceId);
                        cleanedCount++;
                    }
                }

                _logger.LogInformation ("Startup Redis cleanup completed. Removed {Count} stale connections.", cleanedCount);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error during startup Redis cleanup");
            }
        }

        private async Task PerformRedisCleanup (CancellationToken stoppingToken) {
            try {
                _logger.LogDebug ("Performing periodic Redis cleanup...");

                using var scope = _scopeFactory.CreateScope ();
                var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();

                //Cursor on changes to code
                // Use auto-cleanup feature to automatically remove stale Redis entries
                var connectedDevices = await _deviceConnectionTracker.GetConnectedDevices (autoRemoveStale: true);
                var now = DateTime.UtcNow;
                int cleanedCount = 0;

                // Get WebSocket and HTTP timeout configurations for cleanup decisions
                var defaultWsTimeout = 120; // 2 minutes default
                var defaultHttpTimeout = 900; // 15 minutes default

                // Check and clean WebSocket connections
                foreach (var wsConnection in connectedDevices.WebSocketConnections) {
                    if (stoppingToken.IsCancellationRequested) break;

                    try {
                        var wsTimeout = await GetWebSocketTimeoutAsync ();
                        var timeSinceLastMessage = (now - wsConnection.LastMessageAt).TotalSeconds;

                        // If connection has exceeded timeout by a significant margin (2x), clean it up
                        if (timeSinceLastMessage > (wsTimeout * 2)) {
                            _logger.LogInformation ("Cleaning up stale WebSocket connection for device {DeviceId} - inactive for {Seconds} seconds (timeout: {Timeout}s)",
                                wsConnection.DeviceId, timeSinceLastMessage, wsTimeout);

                            await _deviceConnectionTracker.RemoveWebSocketConnection (wsConnection.DeviceId);
                            cleanedCount++;
                        }
                    } catch (Exception ex) {
                        _logger.LogWarning (ex, "Error checking WebSocket connection for cleanup: {DeviceId}", wsConnection.DeviceId);
                    }
                }

                // Check and clean HTTP connections
                foreach (var httpConnection in connectedDevices.HttpConnections) {
                    if (stoppingToken.IsCancellationRequested) break;

                    try {
                        var httpTimeout = await GetHttpTimeoutAsync ();
                        var lastActivity = httpConnection.LastStatusUpdate > httpConnection.LastPollTime ?
                            httpConnection.LastStatusUpdate :
                            httpConnection.LastPollTime;
                        var timeSinceLastActivity = (now - lastActivity).TotalSeconds;

                        // If connection has exceeded timeout by a significant margin (2x), clean it up
                        if (timeSinceLastActivity > (httpTimeout * 2)) {
                            _logger.LogInformation ("Cleaning up stale HTTP connection for device {DeviceId} - inactive for {Seconds} seconds (timeout: {Timeout}s)",
                                httpConnection.DeviceId, timeSinceLastActivity, httpTimeout);

                            await _deviceConnectionTracker.RemoveHttpConnection (httpConnection.DeviceId);
                            cleanedCount++;
                        }
                    } catch (Exception ex) {
                        _logger.LogWarning (ex, "Error checking HTTP connection for cleanup: {DeviceId}", httpConnection.DeviceId);
                    }
                }

                if (cleanedCount > 0) {
                    _logger.LogInformation ("Periodic Redis cleanup completed. Removed {Count} stale connections.", cleanedCount);
                } else {
                    _logger.LogDebug ("Periodic Redis cleanup completed. No stale connections found.");
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error during periodic Redis cleanup");
            }
        }
    }

}