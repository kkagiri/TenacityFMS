using System.Runtime.CompilerServices;
using FMS.IoT.Contracts.Gateway.Models;

namespace FMS.IoT.Contracts.Gateway.Interfaces;

/// <summary>
/// Core interface for IoT device gateway functionality
/// Handles device connections, message routing, and protocol management
/// </summary>
public interface IDeviceGateway {
    /// <summary>
    /// Starts the gateway service
    /// </summary>
    Task<bool> StartAsync (CancellationToken cancellationToken = default);

    /// <summary>
    /// Stops the gateway service
    /// </summary>
    Task<bool> StopAsync (CancellationToken cancellationToken = default);

    /// <summary>
    /// Accepts a new device connection
    /// </summary>
    Task<DeviceConnection> AcceptConnectionAsync (string deviceId, string protocol);

    /// <summary>
    /// Disconnects a device
    /// </summary>
    Task<bool> DisconnectDeviceAsync (string deviceId);

    /// <summary>
    /// Gets device messages as an async stream
    /// </summary>
    IAsyncEnumerable<DeviceMessage> GetDeviceMessagesAsync ([EnumeratorCancellation] CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a message to a specific device
    /// </summary>
    Task<bool> SendMessageToDeviceAsync (string deviceId, DeviceMessage message);

    /// <summary>
    /// Gets gateway status and health information
    /// </summary>
    Task<GatewayStatus> GetStatusAsync ();

    /// <summary>
    /// Gets all connected devices
    /// </summary>
    Task<IEnumerable<DeviceConnection>> GetConnectedDevicesAsync ();
}