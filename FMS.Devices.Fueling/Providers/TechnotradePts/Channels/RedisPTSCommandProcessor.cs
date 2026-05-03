using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Common.Commands;
using FMS.Application.Communication.Connection;
using FMS.Devices.Fueling.Providers.TechnotradePts.Commands;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using StackExchange.Redis;

namespace FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling
{
    public class RedisPTSCommandProcessor
    {
        private static readonly HashSet<string> ExpectedTransientCommandTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "PumpCloseTransaction",
            "PumpGetTransactionInformation"
        };

        private readonly IConnectionMultiplexer _redis;
        private readonly IPTSConnectionManager _connectionManager;
        private readonly ITechnotradePtsCommandMappingService _commandMappingService;
        private readonly ILogger<RedisPTSCommandProcessor> _logger;
        private readonly string _responseChannel = "pts-command-responses";
        private readonly string _commandChannel = "pts-commands";

        public RedisPTSCommandProcessor(
            IConnectionMultiplexer redis,
            IPTSConnectionManager connectionManager,
            ITechnotradePtsCommandMappingService commandMappingService,
            ILogger<RedisPTSCommandProcessor> logger)
        {
            _redis = redis ?? throw new ArgumentNullException(nameof(redis));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _connectionManager = connectionManager ?? throw new ArgumentNullException(nameof(connectionManager));
            _commandMappingService = commandMappingService ?? throw new ArgumentNullException(nameof(commandMappingService));
        }

        public async Task Start()
        {
            try
            {
                _logger.LogInformation("Starting Redis PTS Command Processor subscription to channel: {Channel}", _commandChannel);
                var sub = _redis.GetSubscriber();
                await sub.SubscribeAsync(_commandChannel, async (channel, message) =>
                {
                    _logger.LogDebug("Received PTSCommand on channel: {Channel}, Message: {Message}", channel, message);
                    await HandlePTSCommand(message);
                });
                _logger.LogInformation("Successfully subscribed to Redis channel: {Channel}", _commandChannel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Redis PTS Command Processor subscription");
                throw;
            }
        }

        private async Task HandlePTSCommand(RedisValue message)
        {
            try
            {
                var command = JsonConvert.DeserializeObject<RedisPTSCommand>(message);
                if (command == null)
                {
                    _logger.LogWarning("Invalid command received: {Message}", message);
                    return;
                }

                _logger.LogInformation("Processing command: {CommandType} for device: {DeviceId} with correlation ID: {CorrelationId}",
                    command.CommandType, command.DeviceId, command.CorrelationId);

                string deviceId = ExtractDeviceId(command);
                if (string.IsNullOrEmpty(deviceId))
                {
                    _logger.LogWarning("Device ID not found for command: {Command}", command);
                    await PublishErrorResponse(command, "Invalid device ID", "No valid device ID in command payload");
                    return;
                }

                var connectedDevices = _connectionManager.GetConnectedDevices().ToList();
                _logger.LogInformation("Looking for device {DeviceId} among {ConnectedCount} connected devices: [{ConnectedDevices}]",
                    deviceId, connectedDevices.Count, string.Join(", ", connectedDevices));

                var hasActiveConnection = _connectionManager.HasActiveConnection(deviceId);
                var isConnectionValid = hasActiveConnection && await _connectionManager.IsConnectionValid(deviceId);

                if (command.CommandType == "TestConnection")
                {
                    _logger.LogInformation("Received test connection command for device: {DeviceId}", deviceId);
                    var testResponse = new RedisPTSCommandResponse
                    {
                        DeviceId = command.DeviceId,
                        CorrelationId = command.CorrelationId,
                        Status = "Success",
                        Message = $"Test command received. Device {deviceId} has active connection: {hasActiveConnection}. Connection valid: {isConnectionValid}. Connected devices: [{string.Join(", ", connectedDevices)}]",
                        ResponsePayload = null
                    };
                    await PublishResponse(testResponse);
                    return;
                }

                if (!isConnectionValid)
                {
                    _logger.LogWarning("No valid connection to device: {DeviceId}. HasActiveConnection={HasActiveConnection}. Connected devices: [{ConnectedDevices}]",
                        deviceId, hasActiveConnection, string.Join(", ", connectedDevices));
                    await PublishErrorResponse(command, "Device not connected", "Device connection is stale or inactive");
                    return;
                }

                var ptsMessage = BuildPTSMessage(command);
                _logger.LogDebug("Built PTS message with packet ID: {PacketId} for device: {DeviceId}",
                    ptsMessage.Packets.FirstOrDefault()?.Id, deviceId);

                PTSMessage responseMessage;
                try
                {
                    responseMessage = await _connectionManager.SendMessageAsync(deviceId, JsonConvert.SerializeObject(ptsMessage));
                }
                catch (Exception ex) when (IsExpectedTransientConnectionFailure(command.CommandType, ex))
                {
                    _logger.LogWarning(ex,
                        "Transient command dispatch failure for {CommandType} on device {DeviceId}",
                        command.CommandType,
                        deviceId);
                    await PublishErrorResponse(command, "Device not connected", GetConnectionFailureMessage(ex));
                    return;
                }

                if (responseMessage == null)
                {
                    _logger.LogWarning("Received null response from device: {DeviceId}", deviceId);
                    await PublishErrorResponse(command, "Device error", "Device returned null response");
                    return;
                }

                var redisResponse = BuildRedisPTSCommandResponse(command, responseMessage);
                await PublishResponse(redisResponse);

                _logger.LogInformation("Command processed successfully: {CommandType} for device: {DeviceId}",
                    command.CommandType, deviceId);
            }
            catch (Exception ex)
            {
                var command = TryDeserializeCommand(message);
                if (command != null && IsExpectedTransientConnectionFailure(command.CommandType, ex))
                {
                    _logger.LogWarning(ex,
                        "Transient processing failure for command {CommandType}: {Message}",
                        command.CommandType,
                        message);
                    await PublishErrorResponse(command, "Device not connected", GetConnectionFailureMessage(ex));
                    return;
                }

                _logger.LogError(ex, "Error processing command: {Message}", message);

                try
                {
                    command ??= JsonConvert.DeserializeObject<RedisPTSCommand>(message);
                    if (command != null)
                    {
                        await PublishErrorResponse(command, "Processing error", ex.Message);
                    }
                }
                catch (Exception publishEx)
                {
                    _logger.LogError(publishEx, "Failed to publish error response for command: {Message}", message);
                }
            }
        }

        private PTSMessage BuildPTSMessage(RedisPTSCommand command)
        {
            var ptsMessage = _commandMappingService.BuildMessage(
                command.CommandType,
                command.CommandData,
                command.CorrelationId);

            var packet = ptsMessage.Packets.FirstOrDefault();
            _logger.LogDebug(
                "Built PTSMessage for command {CommandType} as packet {PacketType}, DeviceId: {DeviceId}, PacketId: {PacketId}",
                command.CommandType,
                packet?.Type,
                command.DeviceId,
                packet?.Id);

            var serializedMessage = JsonConvert.SerializeObject(ptsMessage, Formatting.None);
            _logger.LogDebug("Serialized PTSMessage: {SerializedMessage}", serializedMessage);

            return ptsMessage;
        }

        private RedisPTSCommandResponse BuildRedisPTSCommandResponse(RedisPTSCommand command, PTSMessage responseMessage)
        {
            try
            {
                var responseJson = JsonConvert.SerializeObject(responseMessage);
                var responseElement = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(responseJson);

                var response = new RedisPTSCommandResponse
                {
                    DeviceId = command.DeviceId,
                    CorrelationId = command.CorrelationId,
                    Status = "Success",
                    Message = "Command executed successfully",
                    ResponsePayload = responseElement
                };

                if (responseMessage?.Packets != null && responseMessage.Packets.Any(p => p.Error == true))
                {
                    var errorPacket = responseMessage.Packets.FirstOrDefault(p => p.Error == true);
                    response.Status = "Error";
                    response.Message = errorPacket?.Message ?? "Unknown device error";

                    _logger.LogWarning("Device {DeviceId} returned error in packet {PacketId}: {ErrorMessage}",
                        command.DeviceId, errorPacket?.Id, errorPacket?.Message);
                }
                else
                {
                    _logger.LogDebug("Built successful Redis response for device {DeviceId}, correlation ID: {CorrelationId}",
                        command.DeviceId, command.CorrelationId);
                }

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building Redis PTS command response for device {DeviceId}", command.DeviceId);
                return new RedisPTSCommandResponse
                {
                    DeviceId = command.DeviceId,
                    CorrelationId = command.CorrelationId,
                    Status = "Error",
                    Message = $"Failed to process device response: {ex.Message}",
                    ResponsePayload = null
                };
            }
        }

        private string ExtractDeviceId(RedisPTSCommand command)
        {
            if (!string.IsNullOrEmpty(command.DeviceId))
            {
                return command.DeviceId;
            }

            if (command.CommandData == null)
            {
                return string.Empty;
            }

            try
            {
                var payloadJson = Newtonsoft.Json.JsonConvert.SerializeObject(command.CommandData);
                var payload = JsonDocument.Parse(payloadJson);
                if (payload.RootElement.TryGetProperty("DeviceId", out var deviceId))
                {
                    return deviceId.GetString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting device ID from command data: {Command}", command);
            }

            return string.Empty;
        }

        private async Task PublishResponse(RedisPTSCommandResponse response)
        {
            var sub = _redis.GetSubscriber();
            var responseJson = System.Text.Json.JsonSerializer.Serialize(response);
            await sub.PublishAsync(_responseChannel, responseJson);
        }

        private async Task PublishErrorResponse(RedisPTSCommand command, string errorType, string errorMessage)
        {
            var response = new RedisPTSCommandResponse
            {
                CorrelationId = command.CorrelationId,
                Status = errorType,
                Message = errorMessage,
                ResponsePayload = null
            };
            await PublishResponse(response);
        }

        private static RedisPTSCommand? TryDeserializeCommand(RedisValue message)
        {
            try
            {
                return JsonConvert.DeserializeObject<RedisPTSCommand>(message);
            }
            catch
            {
                return null;
            }
        }

        private static bool IsExpectedTransientConnectionFailure(string? commandType, Exception ex)
        {
            if (string.IsNullOrWhiteSpace(commandType) || !ExpectedTransientCommandTypes.Contains(commandType))
            {
                return false;
            }

            var root = ex;
            while (root.InnerException != null)
            {
                root = root.InnerException;
            }

            return root is TimeoutException
                || root is OperationCanceledException
                || root is ObjectDisposedException
                || root is InvalidOperationException
                || root.Message.Contains("stale or inactive", StringComparison.OrdinalIgnoreCase)
                || root.Message.Contains("Connection closing", StringComparison.OrdinalIgnoreCase);
        }

        private static string GetConnectionFailureMessage(Exception ex)
        {
            var root = ex;
            while (root.InnerException != null)
            {
                root = root.InnerException;
            }

            if (root.Message.Contains("stale or inactive", StringComparison.OrdinalIgnoreCase)
                || root.Message.Contains("Connection closing", StringComparison.OrdinalIgnoreCase))
            {
                return "Device connection is stale or inactive";
            }

            return root is TimeoutException
                ? "Device did not respond before timeout"
                : root.Message;
        }
    }
}
