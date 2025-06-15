using System.Text.Json;
using FMS.Application.Common.Commands;
using FMS.Application.Communication.Connection;
using FMS.Application.Helpers;
using FMS.Domain.PTSCommon;
using Newtonsoft.Json;
using StackExchange.Redis;

namespace FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling {
    public class RedisPTSCommandProcessor {

        private readonly IConnectionMultiplexer _redis;
        private readonly IPTSConnectionManager _connectionManager;

        private readonly ILogger<RedisPTSCommandProcessor> _logger;

        private readonly string _responseChannel = "pts-command-responses";
        private readonly string _commandChannel = "pts-commands";

        public RedisPTSCommandProcessor (IConnectionMultiplexer redis, IPTSConnectionManager connectionManager, ILogger<RedisPTSCommandProcessor> logger) {
            _redis = redis ??
                throw new ArgumentNullException (nameof (redis));
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
            _connectionManager = connectionManager ??
                throw new ArgumentNullException (nameof (connectionManager));
        }

        public async Task Start () {
            try {
                _logger.LogInformation ("Starting Redis PTS Command Processor subscription to channel: {Channel}", _commandChannel);
                var sub = _redis.GetSubscriber ();
                await sub.SubscribeAsync (_commandChannel, async (channel, message) => {
                    _logger.LogDebug ("Received PTSCommand on channel: {Channel}, Message: {Message}", channel, message);
                    await HandlePTSCommand (message);
                });
                _logger.LogInformation ("Successfully subscribed to Redis channel: {Channel}", _commandChannel);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to start Redis PTS Command Processor subscription");
                throw;
            }
        }

        private async Task HandlePTSCommand (RedisValue message) {
            try {
                //1. Deserialize the message using Newtonsoft.Json to properly handle JObject
                var command = JsonConvert.DeserializeObject<RedisPTSCommand> (message);
                if (command == null) {
                    _logger.LogWarning ("Invalid command received: {Message}", message);
                    return;
                }

                _logger.LogInformation ("Processing command: {CommandType} for device: {DeviceId} with correlation ID: {CorrelationId}",
                    command.CommandType, command.DeviceId, command.CorrelationId);

                //find the device based on the command.DeviceId
                string deviceId = ExtractDeviceId (command);
                if (string.IsNullOrEmpty (deviceId)) {
                    _logger.LogWarning ("Device ID not found for command: {Command}", command);
                    await PublishErrorResponse (command, "Invalid device ID", "No valid device ID in command payload");
                    return;
                }

                //Cursor: Add diagnostic logging for device connections
                var connectedDevices = _connectionManager.GetConnectedDevices ().ToList ();
                _logger.LogInformation ("Looking for device {DeviceId} among {ConnectedCount} connected devices: [{ConnectedDevices}]",
                    deviceId, connectedDevices.Count, string.Join (", ", connectedDevices));

                //Cursor: Handle test commands differently for diagnostics
                if (command.CommandType == "TestConnection") {
                    _logger.LogInformation ("Received test connection command for device: {DeviceId}", deviceId);
                    var testResponse = new RedisPTSCommandResponse {
                        DeviceId = command.DeviceId,
                        CorrelationId = command.CorrelationId,
                        Status = "Success",
                        Message = $"Test command received. Device {deviceId} has active connection: {_connectionManager.HasActiveConnection(deviceId)}. Connected devices: [{string.Join(", ", connectedDevices)}]",
                        ResponsePayload = null
                    };
                    await PublishResponse (testResponse);
                    return;
                }

                //check if active connection to that device .
                if (!_connectionManager.HasActiveConnection (deviceId)) {
                    _logger.LogWarning ("No active connection to device: {DeviceId}. Connected devices: [{ConnectedDevices}]",
                        deviceId, string.Join (", ", connectedDevices));
                    await PublishErrorResponse (command, "Device not connected", "No active connection to device");
                    return;
                }

                var ptsMessage = BuildPTSMessage (command);
                _logger.LogDebug ("Built PTS message with packet ID: {PacketId} for device: {DeviceId}",
                    ptsMessage.Packets.FirstOrDefault ()?.Id, deviceId);

                //send the message to the device
                var responseMessage = await _connectionManager.SendMessageAsync (deviceId, JsonConvert.SerializeObject (ptsMessage));

                if (responseMessage == null) {
                    _logger.LogWarning ("Received null response from device: {DeviceId}", deviceId);
                    await PublishErrorResponse (command, "Device error", "Device returned null response");
                    return;
                }

                //convert device response to PTSCommandResponse
                var redisResponse = BuildRedisPTSCommandResponse (command, responseMessage);

                //publish the response to the response channel
                await PublishResponse (redisResponse);

                _logger.LogInformation ("Command processed successfully: {CommandType} for device: {DeviceId}",
                    command.CommandType, deviceId);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing command: {Message}", message);

                // Try to deserialize the command again to get correlation ID for error response
                try {
                    var command = JsonConvert.DeserializeObject<RedisPTSCommand> (message);
                    if (command != null) {
                        await PublishErrorResponse (command, "Processing error", ex.Message);
                    }
                } catch (Exception publishEx) {
                    _logger.LogError (publishEx, "Failed to publish error response for command: {Message}", message);
                }
            }
        }

        private PTSMessage BuildPTSMessage (RedisPTSCommand command) {
            var packetId = PacketIdGenerator.GetNextId ();

            //Cursor: Add logging to debug PTSMessage construction
            _logger.LogDebug ("Building PTSMessage for command {CommandType}, DeviceId: {DeviceId}, PacketId: {PacketId}",
                command.CommandType, command.DeviceId, packetId);

            var ptsMessage = new PTSMessage {
                PtsId = command.CorrelationId,
                Protocol = "jsonPTS",
                Packets = new List<Packet> {
                new Packet {
                Id = packetId,
                Type = command.CommandType,
                Data = command.CommandData
                }
                }
            };

            //Cursor: Log the serialized message to verify structure
            var serializedMessage = JsonConvert.SerializeObject (ptsMessage, Formatting.None);
            _logger.LogDebug ("Serialized PTSMessage: {SerializedMessage}", serializedMessage);

            return ptsMessage;
        }

        private RedisPTSCommandResponse BuildRedisPTSCommandResponse (RedisPTSCommand command, PTSMessage responseMessage) {
            try {
                //Cursor: Use Newtonsoft.Json for consistent serialization instead of System.Text.Json
                // System.Text.Json doesn't handle JObject properly, causing data corruption
                var responseJson = JsonConvert.SerializeObject (responseMessage);
                var responseElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement> (responseJson);

                var response = new RedisPTSCommandResponse {
                    DeviceId = command.DeviceId,
                    CorrelationId = command.CorrelationId,
                    Status = "Success",
                    Message = "Command executed successfully",
                    ResponsePayload = responseElement
                };

                //if there is an error in the responseMessage, set the status to error
                if (responseMessage?.Packets != null && responseMessage.Packets.Any (p => p.Error == true)) {
                    var errorPacket = responseMessage.Packets.FirstOrDefault (p => p.Error == true);
                    response.Status = "Error";
                    response.Message = errorPacket?.Message ?? "Unknown device error";

                    _logger.LogWarning ("Device {DeviceId} returned error in packet {PacketId}: {ErrorMessage}",
                        command.DeviceId, errorPacket?.Id, errorPacket?.Message);
                } else {
                    _logger.LogDebug ("Built successful Redis response for device {DeviceId}, correlation ID: {CorrelationId}",
                        command.DeviceId, command.CorrelationId);
                }

                return response;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error building Redis PTS command response for device {DeviceId}", command.DeviceId);

                // Return error response if serialization fails
                return new RedisPTSCommandResponse {
                    DeviceId = command.DeviceId,
                        CorrelationId = command.CorrelationId,
                        Status = "Error",
                        Message = $"Failed to process device response: {ex.Message}",
                        ResponsePayload = null
                };
            }
        }

        private string ExtractDeviceId (RedisPTSCommand command) {
            // First try to get DeviceId directly from the command (this is the correct approach)
            if (!string.IsNullOrEmpty (command.DeviceId)) {
                return command.DeviceId;
            }

            // Fallback: try to extract from CommandData for backward compatibility
            if (command.CommandData == null)
                return string.Empty;

            try {
                // Serialize the CommandData JObject to JSON
                var payloadJson = Newtonsoft.Json.JsonConvert.SerializeObject (command.CommandData);
                // Parse the JSON into a JsonDocument for easier property access
                var payload = JsonDocument.Parse (payloadJson);
                // Attempt to retrieve the "DeviceId" property from the payload
                if (payload.RootElement.TryGetProperty ("DeviceId", out var deviceId)) {
                    return deviceId.GetString ();
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error extracting device ID from command data: {Command}", command);
            }
            return string.Empty;
        }

        /// <summary>
        /// Publish the response to the response channel
        /// </summary>
        /// <param name="response"></param>
        /// <returns></returns>
        private async Task PublishResponse (RedisPTSCommandResponse response) {
            var sub = _redis.GetSubscriber ();
            var responseJson = System.Text.Json.JsonSerializer.Serialize (response);
            await sub.PublishAsync (_responseChannel, responseJson);
        }

        /// <summary>
        /// Publish the error response to the response channel
        /// </summary>
        /// <param name="command"></param>
        /// <param name="errorType"></param>
        /// <param name="errorMessage"></param>
        /// <returns> </returns>
        private async Task PublishErrorResponse (RedisPTSCommand command, string errorType, string errorMessage) {
            //TODO: Bind Error Type to a PTS Error Enum

            var response = new RedisPTSCommandResponse {
                CorrelationId = command.CorrelationId,
                Status = errorType,
                Message = errorMessage,
                ResponsePayload = null
            };
            await PublishResponse (response);
        }

    }
}