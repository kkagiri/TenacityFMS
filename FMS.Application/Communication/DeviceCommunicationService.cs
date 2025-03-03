using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.ModelsDTOs.PTS.Common;
using FMS.Application.ModelsDTOs.PTS.Enum;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FMS.Application.Communication
{
    /// <summary>
    /// Determines the communication mode (WebSocket or HTTP) for a device
    /// </summary>
    public class DeviceCommunicationService : IDeviceCommunicationService
    {
        private readonly ILogger<DeviceCommunicationService> _logger;
        private readonly IDeviceValidator _deviceValidator;
        private readonly IPTSConnectionManager _connectionManager;
        private readonly IConnectionMultiplexer _redisConnection;
        private const string WebSocketConnectionHashKey = "device:websocket-connections";

        public DeviceCommunicationService(
            IDeviceValidator deviceValidator,
            IPTSConnectionManager connectionManager,
            ILogger<DeviceCommunicationService> logger,
            IConnectionMultiplexer redisConnection)
        {
            _deviceValidator = deviceValidator;
            _connectionManager = connectionManager;
            _logger = logger;
            _redisConnection = redisConnection;
        }

        public async Task<bool> CanPushCommandsToDevice(string deviceId)
        {
            var validationResult = await _deviceValidator.ValidateDevice(deviceId);
            if (!validationResult.IsAllowed || validationResult.DeviceInfo == null)
            {
                return false;
            }

            var deviceInfo = validationResult.DeviceInfo;
            bool canPushViaWebSocket = false;

            if (deviceInfo.WebSocketCapable && deviceInfo.AllowedForDirectCommands)
            {
                var db = _redisConnection.GetDatabase();
                canPushViaWebSocket = await IsWebSocketActiveInWindowService(deviceId, db);
            }

            bool canPushViaHttp
                = !deviceInfo.WebSocketCapable
                && deviceInfo.AllowedForDirectCommands
                && !string.IsNullOrEmpty(deviceInfo.IpAddress)
                && deviceInfo.PortNumber.HasValue;

            return canPushViaWebSocket || canPushViaHttp;
        }

        /// <summary>
        /// Returns the preferred communication mode for the device
        /// </summary>
        /// <param name="deviceId"></param>
        /// <returns></returns>
        public async Task<CommunicationMode> GetPreferredCommunicationMode(string deviceId)
        {
            var canPush = await CanPushCommandsToDevice(deviceId);
            return canPush ? CommunicationMode.WebSocket : CommunicationMode.Http;
        }

        public async Task<List<string>> GetNextRequestTypes(string deviceId, PTSMessage currentMessage)
        {
            var canPush = await CanPushCommandsToDevice(deviceId);

            // If we can push commands immediately (via WebSocket or direct IP-based HTTP),
            // we don't need to rely on the device to poll again, so no next requests are needed.
            if (canPush)
            {
                return new List<string>();
            }
            // For HTTP scenario without direct push capabilities, determine next requests.
            return DetermineNextRequests(currentMessage);
        }

        private List<string> DetermineNextRequests(PTSMessage currentMessage)
        {
            //To:Do
            // Implement your logic to determine what requests should be made next
            // based on the current message content
            var requests = new List<string>();
            //To:Do Add logic here
            return requests;
        }

        private async Task<bool> IsWebSocketActiveInWindowService(string deviceId, IDatabase db)
        {
            var serializedInformation = await db.HashGetAsync(WebSocketConnectionHashKey, deviceId);
            if (serializedInformation.IsNullOrEmpty) return false;

            try
            {
                var connectionInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo>(serializedInformation);
                return connectionInfo?.Status == ConnectionStatus.Connected
                    || connectionInfo?.Status == ConnectionStatus.Active;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deserializing WebSocket connection information for device {DeviceId}", deviceId);
                return false;
            }
        }
    }
}