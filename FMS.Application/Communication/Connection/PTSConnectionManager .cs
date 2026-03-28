/**
 * File: PTSConnectionManager.cs
 * Purpose: Tracks active PTS device connections and routes commands to the correct device connection.
 * Dependencies: PTSDeviceConnection, Newtonsoft.Json, Microsoft.Extensions.Logging
 * Last Modified: 2026-03-24
 *
 * Key Functions:
 * - SendMessageAsync(): Validates and forwards a PTS command to the target device.
 * - IsConnectionValid(): Verifies the underlying WebSocket connection is still usable.
 * - AddConnection(): Replaces any existing device connection with the latest instance.
 */
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Communication.webSocket;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

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
            if (!_deviceConnections.TryGetValue(deviceId, out var connection) || connection == null)
            {
                return false;
            }

            try
            {
                var isHealthy = await connection.HealthCheckAsync();
                if (!isHealthy)
                {
                    _logger.LogWarning("Detected stale or inactive connection for device {DeviceId}; removing it from the connection manager", deviceId);
                    RemoveConnection(deviceId);
                }

                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking connection health for device {DeviceId}", deviceId);
                RemoveConnection(deviceId);
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
            PTSDeviceConnection connection = null;
            try
            {
                //Get the connection of the device
                if (!_deviceConnections.TryGetValue(deviceId, out connection) || connection == null)
                {
                    throw new KeyNotFoundException($"Device {deviceId} not found");
                }

                if (!await IsConnectionValid(deviceId))
                {
                    throw new InvalidOperationException($"Device connection is stale or inactive for device {deviceId}");
                }

                //Cursor: Add logging to debug JSON serialization
                _logger.LogDebug("Deserializing message for device {DeviceId}: {Message}", deviceId, message);

                var ptsMessage = JsonConvert.DeserializeObject<PTSMessage>(message);
                if (ptsMessage == null)
                {
                    throw new InvalidOperationException("Failed to deserialize PTSMessage - result was null");
                }

                _logger.LogDebug("Successfully deserialized PTSMessage for device {DeviceId} with {PacketCount} packets",
                    deviceId, ptsMessage.Packets?.Count ?? 0);

                return await connection.SendPTSMessageAsync(ptsMessage);
            }
            catch (Exception ex)
            {
                if (ex is InvalidOperationException || ex is ObjectDisposedException || ex is OperationCanceledException)
                {
                    // Only remove the connection if it is still the same instance we used.
                    // A new connection may have been registered via AddConnection while we were waiting,
                    // and removing it would leave the device with no connection at all.
                    if (connection != null
                        && _deviceConnections.TryGetValue(deviceId, out var currentConnection)
                        && ReferenceEquals(currentConnection, connection))
                    {
                        RemoveConnection(deviceId);
                    }
                    else
                    {
                        _logger.LogInformation(
                            "Skipping connection removal for device {DeviceId} — connection was already replaced",
                            deviceId);
                    }
                }

                _logger.LogError(ex, "Error sending message to device {DeviceId}", deviceId);
                throw new Exception($"Error sending message to device {deviceId}", ex);
            }
        }

        public void AddConnection(string deviceId, PTSDeviceConnection connection)
        {
            // Atomically register the new connection and capture any existing one.
            // The new connection MUST be in the dictionary before the old one is disposed,
            // so that SendMessageAsync's ReferenceEquals guard works correctly.
            PTSDeviceConnection existingConnection = null;
            _deviceConnections.AddOrUpdate(
                deviceId,
                connection,
                (_, existing) =>
                {
                    existingConnection = existing;
                    return connection;
                });

            if (existingConnection != null)
            {
                _logger.LogWarning("Replacing existing connection for device {DeviceId}", deviceId);
                // Dispose in background — the new connection is already registered
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await existingConnection.DisposeAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error disposing replaced connection for device {DeviceId}", deviceId);
                    }
                });
            }

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