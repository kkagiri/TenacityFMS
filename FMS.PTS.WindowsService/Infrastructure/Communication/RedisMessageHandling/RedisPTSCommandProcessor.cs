using System.Text.Json;
using FMS.Application.Common.Commands;
using FMS.Application.Communication.Connection;
using FMS.Application.Helpers;
using FMS.Domain.PTSCommon;
using StackExchange.Redis;

namespace FMS.PTS.WindowsService.Infrastructure.Communication.RedisMessageHandling
{
    public class RedisPTSCommandProcessor
    {

        private readonly IConnectionMultiplexer _redis;
        private readonly IPTSConnectionManager _connectionManager;

        private readonly ILogger<RedisPTSCommandProcessor> _logger;

        private readonly string _responseChannel = "pts-command-responses";
        private readonly string _commandChannel = "pts-commands";

        public RedisPTSCommandProcessor(IConnectionMultiplexer redis, IPTSConnectionManager connectionManager, ILogger<RedisPTSCommandProcessor> logger)
        {
            _redis = redis ?? throw new ArgumentNullException(nameof(redis));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _connectionManager = connectionManager ?? throw new ArgumentNullException(nameof(connectionManager));
        }

        public async Task Start()
        {
            var sub = _redis.GetSubscriber();
            await sub.SubscribeAsync(_commandChannel, (channel, message) =>
            {
                _logger.LogInformation("Received PTSCommand: {Message} on channel: {Channel}", message, channel);
                HandlePTSCommand(message);
            });
        }

        private async Task HandlePTSCommand(RedisValue message)
        {
            try
            {
                //1. Deserialize the message
                var command = JsonSerializer.Deserialize<RedisPTSCommand>(message);
                if (command == null)
                {
                    _logger.LogWarning("Invalid command received: {Message}", message);
                    return;
                }

                _logger.LogInformation("Processing command: {Command}", command);


                //find the device based on the command.DeviceId
                string deviceId = ExtractDeviceId(command);
                if (string.IsNullOrEmpty(deviceId))
                {
                    _logger.LogWarning("Device ID not found for command: {Command}", command);
                    await PublishErrorResponse(command, "Invalid device ID", "No valid in command Payload");
                    return;
                }


                //check if active connectoin to that device .
                if (!_connectionManager.HasActiveConnection(deviceId))
                {
                    _logger.LogWarning("No active connection to device: {DeviceId}", deviceId);
                    await PublishErrorResponse(command, "Device not connected", "No active connection to device");
                    return;
                }

                var ptsMessage = BuildPTSMessage(command);


                //send the message to the device
                var responseMessage = await _connectionManager.SendMessageAsync(deviceId, JsonSerializer.Serialize(ptsMessage));



                //convert device response to PTSCommandResponse
                var redisResponse = BuildRedisPTSCommandResponse(command, responseMessage);


                //publish the response to the response channel
                await PublishResponse(redisResponse);

                _logger.LogInformation("Command processed successfully: {Command}", command);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing command: {message}", message);
            }
        }




        private PTSMessage BuildPTSMessage(RedisPTSCommand command)
        {
            var packetId = PacketIdGenerator.GetNextId();
            return new PTSMessage
            {
                PtsId = command.CorrelationId,
                Protocol = "jsonPTS",
                Packets = new List<Packet>
                {
                    new Packet
                    {
                        Id = packetId,
                        Type = command.CommandType,
                        Data = command.CommandData
                    }
                }
            };
        }


        private RedisPTSCommandResponse BuildRedisPTSCommandResponse(RedisPTSCommand command, PTSMessage responseMessage)
        {
            var response = new RedisPTSCommandResponse
            {
                CorrelationId = command.CorrelationId,
                Status = "Success",
                Message = "Command executed successfully",
                ResponsePayload = JsonSerializer.SerializeToElement(responseMessage)
            };

            //if there is an error in the responseMessage, set the status to error
            if (responseMessage.Packets.Any(p => p.Error == true))
            {
                response.Status = "Error";
                response.Message = responseMessage.Packets.FirstOrDefault(p => p.Error == true)?.Message ?? "Unknown error";
            }

            return response;
        }

        private string ExtractDeviceId(RedisPTSCommand command)
        {
            if (command.CommandData == null)
                return string.Empty;
            try
            {
                // Serialize the CommandData JObject to JSON
                var payloadJson = Newtonsoft.Json.JsonConvert.SerializeObject(command.CommandData);
                // Parse the JSON into a JsonDocument for easier property access
                var payload = JsonDocument.Parse(payloadJson);
                // Attempt to retrieve the "DeviceId" property from the payload
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

        /// <summary>
        /// Publish the response to the response channel
        /// </summary>
        /// <param name="response"></param>
        /// <returns></returns>
        private async Task PublishResponse(RedisPTSCommandResponse response)
        {
            var sub = _redis.GetSubscriber();
            var responseJson = JsonSerializer.Serialize(response);
            await sub.PublishAsync(_responseChannel, responseJson);
        }

        /// <summary>
        /// Publish the error response to the response channel
        /// </summary>
        /// <param name="command"></param>
        /// <param name="errorType"></param>
        /// <param name="errorMessage"></param>
        /// <returns> </returns>
        private async Task PublishErrorResponse(RedisPTSCommand command, string errorType, string errorMessage)
        {
            //TODO: Bind Error Type to a PTS Error Enum

            var response = new RedisPTSCommandResponse
            {
                CorrelationId = command.CorrelationId,
                Status = errorType,
                Message = errorMessage,
                ResponsePayload = null
            };
            await PublishResponse(response);
        }

    }
}

