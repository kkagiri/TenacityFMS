using System.Net.WebSockets;
using System.Text.Json;
using System.Net.Sockets;
using Newtonsoft.Json;
using FMS.Application.Communication.Connection;
using FMS.Application.Handlers.Interface;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using FMS.Domain.PTSCommon;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers.Common
{
    public class PTSMessageProcessor : IPTSMessageProcessor
    {
        private readonly ILogger<PTSMessageProcessor> _logger;
        private readonly MessageHandlerRegistry _handlerRegistry;

        private readonly IPTSConnectionManager _connectionManager;


        public PTSMessageProcessor(ILogger<PTSMessageProcessor> logger, MessageHandlerRegistry handlerRegistry, IPTSConnectionManager connectionManager)
        {
            _logger = logger;
            _handlerRegistry = handlerRegistry;
            _connectionManager = connectionManager;
        }

        private async Task<PTSMessage> ProcessMessageInternalAsync(string deviceId, PTSMessage message)
        {
            if (message == null)
            {
                throw new ArgumentNullException(nameof(message), "Message cannot be null");
            }
            var responseMessage = new PTSMessage
            {
                Protocol = "jsonPTS",
                PtsId = message.PtsId,
                Packets = new List<Packet>()
            };

            if (message.Packets == null)
            {
                _logger.LogWarning("Message from device {DeviceId} contains no packets", deviceId);
                return responseMessage;
            }

            foreach (var packet in message.Packets)
            {
                if (packet == null)
                {
                    _logger.LogWarning("Null packet encountered in message from device {DeviceId}", deviceId);
                    continue;
                }

                try
                {
                    var originalPacketId = packet.Id;
                    var handler = _handlerRegistry.GetHandler(packet.Type);
                    if (handler == null) throw new NotSupportedException($"No handler found for message type {packet.Type}");

                    // CRITICAL: Use Task.Run with timeout to prevent blocking other packets
                    // This ensures that slow/hung handlers don't block UploadStatus or other critical packets
                    var handlerTask = Task.Run(async () => await handler.HandlePacketAsync(deviceId, packet));
                    var timeoutTask = Task.Delay(TimeSpan.FromSeconds(30)); // 30 second timeout per packet

                    var completedTask = await Task.WhenAny(handlerTask, timeoutTask);

                    Packet responsePacket;
                    if (completedTask == timeoutTask)
                    {
                        // Handler timed out - return error but continue processing other packets
                        _logger.LogError("Handler timeout for packet {PacketId} of type {PacketType} for device {DeviceId}",
                            packet.Id, packet.Type, deviceId);

                        responsePacket = new Packet
                        {
                            Id = originalPacketId,
                            Type = packet.Type,
                            Error = true,
                            Code = 408, // Request Timeout
                            Message = "Handler processing timeout"
                        };
                    }
                    else
                    {
                        responsePacket = await handlerTask;

                        // Correct packet IDs if needed.
                        if (responsePacket.Id != originalPacketId)
                        {
                            _logger.LogError("Handler response ID mismatch. Expected: {ExpectedId}, Actual: {ActualId}", originalPacketId, responsePacket.Id);
                            responsePacket.Id = originalPacketId;
                        }
                        // Optionally remove or modify fields for WebSocket.
                        if (string.IsNullOrEmpty(responsePacket.SetRequestType))
                        {
                            responsePacket.Data = null;  // Will be excluded from serialization
                        }
                    }

                    responseMessage.Packets.Add(responsePacket);

                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error handling packet {PacketId} of type {PacketType} for device {DeviceId}",
                        packet.Id, packet.Type, deviceId);

                    var errorPacket = new Packet
                    {
                        Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = MapExceptionToErrorCode(ex),
                        Message = GetUserFriendlyErrorMessage(ex, packet.Type)
                    };
                    responseMessage.Packets.Add(errorPacket);
                }
            }

            return responseMessage;
        }


        //For HttpEndPoint
        public async Task<PTSMessage> ProcessMessageAsync(string deviceId, PTSMessage message)
        {
            return await ProcessMessageInternalAsync(deviceId, message);
        }


        //For WebSocketEndPoint
        public async Task HandleMessageAsync(string deviceId, PTSMessage message)
        {

            var response = await ProcessMessageInternalAsync(deviceId, message);

            var jObject = JObject.FromObject(response);

            // For each packet, remove fields conditionally based on packet type
            var packets = jObject["Packets"] as JArray;
            if (packets != null)
            {
                foreach (var p in packets)
                {
                    // Always remove these internal fields
                    p["SetRequestType"]?.Parent?.Remove();

                    // Only remove Data if it's null/empty (keep it for responses that need data)
                    var dataToken = p["Data"];
                    if (dataToken == null || dataToken.Type == JTokenType.Null)
                    {
                        dataToken?.Parent?.Remove();
                    }

                    // Keep Error and Code fields for acknowledgment messages
                    // These are required for device to confirm receipt (especially for PumpTransaction)
                    // p["Error"]?.Parent?.Remove();  // Don't remove - device needs this
                    // p["Code"]?.Parent?.Remove();   // Don't remove - device needs this
                }
            }

            var responseJson = jObject.ToString();

            _logger.LogInformation("Response Json:{responseJson}", responseJson);

            await _connectionManager.SendMessageAsync(deviceId, responseJson);
        }

        public async Task HandleErrorAsync(string deviceId, Exception exception)
        {
            var errorCode = MapExceptionToErrorCode(exception);
            var errorMessage = exception.Message;
            _logger.LogError(exception, "Critical error for device {DeviceId} with code {ErrorCode}", deviceId, errorCode);
            // var errorEvent = new DeviceError { DeviceId = deviceId, ErrorCode = errorCode, Message = errorMessage };

            //chatgpt: If publishing events or logging is needed, it goes here.
            await Task.CompletedTask;
        }

        private int MapExceptionToErrorCode(Exception ex)
        {
            return ex switch
            {
                ArgumentException => 400,
                UnauthorizedAccessException => 401,
                NotSupportedException => 415,
                TimeoutException => 408,
                _ => 500
            };
        }

        private string GetUserFriendlyErrorMessage(Exception ex, string packetType)
        {
            // Provide device-friendly error messages without exposing internal details
            return ex switch
            {
                ArgumentException => "Invalid data format",
                UnauthorizedAccessException => "Unauthorized",
                NotSupportedException => $"Packet type '{packetType}' not supported",
                TimeoutException => "Processing timeout",
                _ => "Processing error"
            };
        }


    }


}