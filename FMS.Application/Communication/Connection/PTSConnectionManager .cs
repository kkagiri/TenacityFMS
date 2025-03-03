using FMS.Application.Communication.webSocket;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FMS.Application.Communication.Connection
{
    /// <summary>
    /// Manages connections to multiple PTS devices.
    /// Implements IPTSConnectionManager interface.
    /// Stores and retrieves PTSDeviceConnection instances,
    /// allowing sending messages to specific devices by their IDs.
    /// </summary>
    public class PTSConnectionManager : IPTSConnectionManager

    {
        private readonly ConcurrentDictionary<string, PTSDeviceConnection> _deviceConnections;
        private readonly ILogger<PTSConnectionManager> _logger;

        public PTSConnectionManager(ILogger<PTSConnectionManager> logger)
        {
            _deviceConnections = new ConcurrentDictionary<string, PTSDeviceConnection>();
            _logger = logger;
        }

        public IEnumerable<string> GetConnectedDevices()
        {
            return _deviceConnections.Keys.ToList();
        }

        public bool HasActiveConnection(string deviceId)
        {
            return _deviceConnections.TryGetValue(deviceId, out var connection) && connection != null;
        }

        public async Task<bool> IsConnectionValid(string deviceId)
        {
            if (!HasActiveConnection(deviceId))
            {
                return false;
            }

            try
            {
                if (_deviceConnections.TryGetValue(deviceId, out var connection))
                {
                    return await connection.HealthCheckAsync();
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking connection health for device {DeviceId}", deviceId);
                return false;
            }
        }

        /// <summary>
        /// Send a message to a device
        /// </summary>
        /// <param name="deviceId"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task<PTSMessage> SendMessageAsync(string deviceId, string message)
        {
            try
            {
                //Get the connection of the device
                if (_deviceConnections.TryGetValue(deviceId, out var connection))
                {
                    var ptsMessage = JsonSerializer.Deserialize<PTSMessage>(message);
                    return await connection.SendPTSMessageAsync(ptsMessage!);
                }

                throw new KeyNotFoundException($"Device {deviceId} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message to device {DeviceId}", deviceId);
                throw new Exception($"Error sending message to device {deviceId}", ex);
            }
        }

        public void AddConnection(string deviceId, PTSDeviceConnection connection)
        {

            if (_deviceConnections.TryGetValue(deviceId, out var existingConnection))
            {
                _logger.LogWarning("Replacing existing connection for device {DeviceId}", deviceId);
                try
                {
                    // Ensure cleanup of existing connection
                    _ = existingConnection.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error disposing existing connection for device {DeviceId}", deviceId);
                }
            }

            _deviceConnections.AddOrUpdate(deviceId, connection, (_, _) => connection);
            _logger.LogInformation("Added/Updated connection for device {DeviceId}", deviceId);
        }

        public void RemoveConnection(string deviceId)
        {
            if (_deviceConnections.TryRemove(deviceId, out var connection))
            {
                _logger.LogInformation("Removed connection for device {DeviceId}", deviceId);
                try
                {
                    // Ensure cleanup
                    _ = connection.DisposeAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error disposing connection for device {DeviceId}", deviceId);
                }
            }
        }
    }
}
