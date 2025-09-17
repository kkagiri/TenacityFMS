using System.Runtime.CompilerServices;
using FMS.IoT.Contracts.Common;
using FMS.IoT.Contracts.Gateway.Interfaces;
using FMS.IoT.Contracts.Gateway.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.Gateway.Connection;

/// <summary>
/// WebSocket device connection implementation
/// </summary>
public class WebSocketDeviceConnection : IDeviceConnection {
    private readonly ILogger<WebSocketDeviceConnection> _logger;
    private readonly Dictionary<string, object> _metadata;

    public string DeviceId { get; }
    public string Protocol { get; } = IoTConstants.Protocols.WebSocket;
    public ConnectionStatus Status { get; private set; }
    public DateTime ConnectedAt { get; }
    public DateTime LastActivity { get; private set; }

    public WebSocketDeviceConnection (string deviceId, ILogger<WebSocketDeviceConnection> logger) {
        DeviceId = deviceId;
        _logger = logger;
        _metadata = new Dictionary<string, object> ();
        ConnectedAt = DateTime.UtcNow;
        LastActivity = DateTime.UtcNow;
        Status = ConnectionStatus.Connected;
    }

    public async Task<bool> SendMessageAsync (DeviceMessage message, CancellationToken cancellationToken = default) {
        try {
            // TODO: Implement actual WebSocket message sending
            _logger.LogInformation ("Sending message to device {DeviceId}", DeviceId);
            LastActivity = DateTime.UtcNow;
            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to send message to device {DeviceId}", DeviceId);
            return false;
        }
    }

    public async IAsyncEnumerable<DeviceMessage> ReceiveMessagesAsync ([EnumeratorCancellation] CancellationToken cancellationToken = default) {
        while (Status == ConnectionStatus.Connected && !cancellationToken.IsCancellationRequested) {
            // TODO: Implement actual WebSocket message receiving
            await Task.Delay (1000, cancellationToken);

            yield return new DeviceMessage {
                MessageId = Guid.NewGuid ().ToString (),
                    DeviceId = DeviceId,
                    Protocol = Protocol,
                    Timestamp = DateTime.UtcNow,
                    MessageType = IoTConstants.MessageTypes.Telemetry
            };
        }
    }

    public async Task<bool> HealthCheckAsync () {
        try {
            // TODO: Implement actual health check (ping/pong)
            return Status == ConnectionStatus.Connected;
        } catch {
            return false;
        }
    }

    public async Task CloseAsync (string reason = "Normal closure") {
        _logger.LogInformation ("Closing connection for device {DeviceId}: {Reason}", DeviceId, reason);
        Status = ConnectionStatus.Disconnected;
        // TODO: Implement actual WebSocket close
        await Task.CompletedTask;
    }

    public Dictionary<string, object> GetMetadata () {
        return new Dictionary<string, object> (_metadata);
    }

    public async Task UpdateMetadataAsync (string key, object value) {
        _metadata[key] = value;
        await Task.CompletedTask;
    }

    public async ValueTask DisposeAsync () {
        await CloseAsync ("Connection disposed");
        GC.SuppressFinalize (this);
    }
}