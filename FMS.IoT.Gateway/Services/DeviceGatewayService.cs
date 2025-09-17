using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using FMS.IoT.Contracts.Common;
using FMS.IoT.Contracts.Gateway.Interfaces;
using FMS.IoT.Contracts.Gateway.Models;
using Microsoft.Extensions.Logging;

namespace FMS.IoT.Gateway.Services;

/// <summary>
/// Core IoT Device Gateway implementation
/// </summary>
public class DeviceGatewayService : IDeviceGateway {
    private readonly IConnectionManager _connectionManager;
    private readonly IEnumerable<IProtocolHandler> _protocolHandlers;
    private readonly ILogger<DeviceGatewayService> _logger;
    private readonly ConcurrentQueue<DeviceMessage> _messageQueue;
    private bool _isRunning;

    public DeviceGatewayService (
        IConnectionManager connectionManager,
        IEnumerable<IProtocolHandler> protocolHandlers,
        ILogger<DeviceGatewayService> logger) {
        _connectionManager = connectionManager;
        _protocolHandlers = protocolHandlers;
        _logger = logger;
        _messageQueue = new ConcurrentQueue<DeviceMessage> ();
    }

    public async Task<bool> StartAsync (CancellationToken cancellationToken = default) {
        try {
            _logger.LogInformation ("Starting Device Gateway Service");
            _isRunning = true;
            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to start Device Gateway Service");
            return false;
        }
    }

    public async Task<bool> StopAsync (CancellationToken cancellationToken = default) {
        try {
            _logger.LogInformation ("Stopping Device Gateway Service");
            _isRunning = false;
            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Failed to stop Device Gateway Service");
            return false;
        }
    }

    public async Task<DeviceConnection> AcceptConnectionAsync (string deviceId, string protocol) {
        _logger.LogInformation ("Accepting connection for device {DeviceId} using protocol {Protocol}", deviceId, protocol);

        var connection = new DeviceConnection {
            DeviceId = deviceId,
            Protocol = protocol,
            ConnectedAt = DateTime.UtcNow,
            Status = ConnectionStatus.Connected,
            LastActivity = DateTime.UtcNow
        };

        return connection;
    }

    public async Task<bool> DisconnectDeviceAsync (string deviceId) {
        _logger.LogInformation ("Disconnecting device {DeviceId}", deviceId);
        await _connectionManager.UnregisterConnectionAsync (deviceId);
        return true;
    }

    public async IAsyncEnumerable<DeviceMessage> GetDeviceMessagesAsync ([EnumeratorCancellation] CancellationToken cancellationToken = default) {
        while (_isRunning && !cancellationToken.IsCancellationRequested) {
            if (_messageQueue.TryDequeue (out var message)) {
                yield return message;
            } else {
                await Task.Delay (100, cancellationToken);
            }
        }
    }

    public async Task<bool> SendMessageToDeviceAsync (string deviceId, DeviceMessage message) {
        var connection = _connectionManager.GetConnection (deviceId);
        if (connection == null) {
            _logger.LogWarning ("Device {DeviceId} not found", deviceId);
            return false;
        }

        return await connection.SendMessageAsync (message);
    }

    public async Task<GatewayStatus> GetStatusAsync () {
        var stats = await _connectionManager.GetConnectionStatisticsAsync ();

        return new GatewayStatus {
            IsRunning = _isRunning,
                StartedAt = DateTime.UtcNow, // This should be tracked properly
                ActiveConnections = stats.ActiveConnections,
                Health = _isRunning ? GatewayHealth.Healthy : GatewayHealth.Unhealthy,
                Version = "1.0.0"
        };
    }

    public async Task<IEnumerable<DeviceConnection>> GetConnectedDevicesAsync () {
        var deviceIds = _connectionManager.GetConnectedDevices ();
        var connections = new List<DeviceConnection> ();

        foreach (var deviceId in deviceIds) {
            var connection = _connectionManager.GetConnection (deviceId);
            if (connection != null) {
                connections.Add (new DeviceConnection {
                    DeviceId = connection.DeviceId,
                        Protocol = connection.Protocol,
                        ConnectedAt = connection.ConnectedAt,
                        Status = connection.Status,
                        LastActivity = connection.LastActivity
                });
            }
        }

        return connections;
    }
}