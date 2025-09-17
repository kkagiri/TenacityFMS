using FMS.IoT.Contracts.Gateway.Models;

namespace FMS.IoT.Contracts.Gateway.Interfaces;

/// <summary>
/// Interface representing a single device connection
/// </summary>
public interface IDeviceConnection : IAsyncDisposable {
    string DeviceId { get; }
    string Protocol { get; }
    ConnectionStatus Status { get; }
    DateTime ConnectedAt { get; }
    DateTime LastActivity { get; }

    /// <summary>
    /// Sends a message to the device
    /// </summary>
    Task<bool> SendMessageAsync (DeviceMessage message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Receives messages from the device
    /// </summary>
    IAsyncEnumerable<DeviceMessage> ReceiveMessagesAsync (CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs health check on the connection
    /// </summary>
    Task<bool> HealthCheckAsync ();

    /// <summary>
    /// Closes the connection gracefully
    /// </summary>
    Task CloseAsync (string reason = "Normal closure");

    /// <summary>
    /// Gets connection metadata
    /// </summary>
    Dictionary<string, object> GetMetadata ();

    /// <summary>
    /// Updates connection metadata
    /// </summary>
    Task UpdateMetadataAsync (string key, object value);
}