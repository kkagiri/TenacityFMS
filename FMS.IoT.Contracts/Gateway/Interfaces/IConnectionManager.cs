using FMS.IoT.Contracts.Gateway.Models;

namespace FMS.IoT.Contracts.Gateway.Interfaces;

/// <summary>
/// Interface for managing device connections
/// </summary>
public interface IConnectionManager {
    /// <summary>
    /// Registers a new device connection
    /// </summary>
    Task RegisterConnectionAsync (string deviceId, IDeviceConnection connection);

    /// <summary>
    /// Unregisters a device connection
    /// </summary>
    Task UnregisterConnectionAsync (string deviceId);

    /// <summary>
    /// Gets a specific device connection
    /// </summary>
    IDeviceConnection? GetConnection (string deviceId);

    /// <summary>
    /// Gets all connected device IDs
    /// </summary>
    IEnumerable<string> GetConnectedDevices ();

    /// <summary>
    /// Checks if a device is currently connected
    /// </summary>
    Task<bool> IsDeviceConnectedAsync (string deviceId);

    /// <summary>
    /// Gets connection statistics
    /// </summary>
    Task<ConnectionStatistics> GetConnectionStatisticsAsync ();

    /// <summary>
    /// Performs health check on all connections
    /// </summary>
    Task<Dictionary<string, bool>> PerformHealthChecksAsync ();

    /// <summary>
    /// Cleanup idle or stale connections
    /// </summary>
    Task<int> CleanupIdleConnectionsAsync (TimeSpan idleThreshold);
}