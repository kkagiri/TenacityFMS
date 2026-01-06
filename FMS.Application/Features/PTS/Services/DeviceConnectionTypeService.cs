using System;
using System.Threading.Tasks;
using FMS.Application.Communication;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTS.Services
{
    /// <summary>
    /// Interface for determining device connection type.
    /// </summary>
    public interface IDeviceConnectionTypeService
    {
        /// <summary>
        /// Determines the connection type for a device (WebSocket, HTTPPolling, etc.).
        /// </summary>
        /// <param name="deviceId">The PTS device ID</param>
        /// <returns>Connection type string</returns>
        Task<string> GetConnectionTypeAsync(string deviceId);
    }

    /// <summary>
    /// Service for determining device connection type.
    /// </summary>
    public class DeviceConnectionTypeService : IDeviceConnectionTypeService
    {
        private readonly DeviceConnectionTracker _deviceConnectionTracker;
        private readonly ILogger<DeviceConnectionTypeService> _logger;

        public DeviceConnectionTypeService(
            DeviceConnectionTracker deviceConnectionTracker,
            ILogger<DeviceConnectionTypeService> logger)
        {
            _deviceConnectionTracker = deviceConnectionTracker;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task<string> GetConnectionTypeAsync(string deviceId)
        {
            try
            {
                // Get WebSocket and HTTP connection info from the device tracker
                var wsConnection = await _deviceConnectionTracker.GetWebSocketConnection(deviceId);
                var httpConnection = await _deviceConnectionTracker.GetHttpConnection(deviceId);

                // Use the static method from DeviceConnectionTracker to determine the connection mode
                var connectionMode = DeviceConnectionTracker.DetermineConnectionMode(wsConnection, httpConnection);

                // Convert the enum to a string for storage
                var connectionType = connectionMode.ToString();

                _logger.LogInformation("Device {DeviceId} connection type determined as: {ConnectionType}",
                    deviceId, connectionType);

                return connectionType;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error determining connection type for device {DeviceId}. Defaulting to 'Unknown'",
                    deviceId);
                return "Unknown";
            }
        }
    }
}
