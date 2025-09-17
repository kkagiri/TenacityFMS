using System.Collections.Concurrent;
using FMS.IoT.Contracts.Gateway.Interfaces;
using FMS.IoT.Contracts.Gateway.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.Gateway.Connection;

/// <summary>
/// Device connection manager implementation
/// </summary>
public class ConnectionManager : IConnectionManager {
    private readonly ConcurrentDictionary<string, IDeviceConnection> _connections;
    private readonly ILogger<ConnectionManager> _logger;

    public ConnectionManager (ILogger<ConnectionManager> logger) {
        _connections = new ConcurrentDictionary<string, IDeviceConnection> ();
        _logger = logger;
    }

    public async Task RegisterConnectionAsync (string deviceId, IDeviceConnection connection) {
        _connections.AddOrUpdate (deviceId, connection, (key, oldValue) => connection);
        _logger.LogInformation ("Device {DeviceId} connection registered", deviceId);
        await Task.CompletedTask;
    }

    public async Task UnregisterConnectionAsync (string deviceId) {
        if (_connections.TryRemove (deviceId, out var connection)) {
            await connection.DisposeAsync ();
            _logger.LogInformation ("Device {DeviceId} connection unregistered", deviceId);
        }
    }

    public IDeviceConnection? GetConnection (string deviceId) {
        _connections.TryGetValue (deviceId, out var connection);
        return connection;
    }

    public IEnumerable<string> GetConnectedDevices () {
        return _connections.Keys;
    }

    public async Task<bool> IsDeviceConnectedAsync (string deviceId) {
        var connection = GetConnection (deviceId);
        if (connection == null) return false;

        return await connection.HealthCheckAsync ();
    }

    public async Task<ConnectionStatistics> GetConnectionStatisticsAsync () {
        var totalConnections = _connections.Count;
        var activeConnections = 0;
        var connectionsByProtocol = new Dictionary<string, int> ();

        foreach (var kvp in _connections) {
            var connection = kvp.Value;
            if (connection.Status == ConnectionStatus.Active || connection.Status == ConnectionStatus.Connected) {
                activeConnections++;
            }

            if (connectionsByProtocol.ContainsKey (connection.Protocol)) {
                connectionsByProtocol[connection.Protocol]++;
            } else {
                connectionsByProtocol[connection.Protocol] = 1;
            }
        }

        return new ConnectionStatistics {
            TotalConnections = totalConnections,
                ActiveConnections = activeConnections,
                ConnectionsByProtocol = connectionsByProtocol,
                LastUpdated = DateTime.UtcNow
        };
    }

    public async Task<Dictionary<string, bool>> PerformHealthChecksAsync () {
        var results = new Dictionary<string, bool> ();

        foreach (var kvp in _connections) {
            try {
                var isHealthy = await kvp.Value.HealthCheckAsync ();
                results[kvp.Key] = isHealthy;
            } catch (Exception ex) {
                _logger.LogError (ex, "Health check failed for device {DeviceId}", kvp.Key);
                results[kvp.Key] = false;
            }
        }

        return results;
    }

    public async Task<int> CleanupIdleConnectionsAsync (TimeSpan idleThreshold) {
        var idleConnections = new List<string> ();
        var cutoffTime = DateTime.UtcNow - idleThreshold;

        foreach (var kvp in _connections) {
            if (kvp.Value.LastActivity < cutoffTime) {
                idleConnections.Add (kvp.Key);
            }
        }

        foreach (var deviceId in idleConnections) {
            await UnregisterConnectionAsync (deviceId);
        }

        _logger.LogInformation ("Cleaned up {Count} idle connections", idleConnections.Count);
        return idleConnections.Count;
    }
}