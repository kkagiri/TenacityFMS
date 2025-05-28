using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Common.Commands;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.Helpers;
using FMS.Application.Infrastructure.ErroCodeHanding.Common;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using FMS.Application.ModelsDTOs.PTS.Common;
using FMS.Application.ModelsDTOs.PTS.Enum;
using FMS.Application.Services;
using FMS.Application.Validation.PTSValidators;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.Entities;
using FMS.Domain.PTSCommon;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Command.PTSCommand.Common;

/// <summary>
/// Excute commands for PTS devices.
/// It determines the communication mode (WebSocket or HTTP) and
/// then dispatches the command accordingly.
/// </summary>
public class CommandExecutor : ICommandExecutor {

    private readonly IDeviceCommunicationService _deviceCommunicationService;
    private readonly IPendingCommandRepository _pendingCommandRepo;
    private readonly IDeviceHttpCommandPusher _httpCommandPusher;
    private readonly ILogger<CommandExecutor> _logger;
    private readonly IDeviceValidator _deviceValidator;
    private readonly RedisCommandService _redisCommandService;
    private readonly IConnectionMultiplexer _redisConnection;
    private readonly IStaleConnectionDetectionService? _staleConnectionDetectionService;
    private const string WebSocketConnectionHashKey = "device:websocket-connections";

    public CommandExecutor (IDeviceCommunicationService deviceCommunicationService, IPendingCommandRepository pendingCommandRepo, IDeviceHttpCommandPusher httpCommandPusher,
        IDeviceValidator deviceValidator, ILogger<CommandExecutor> logger, RedisCommandService redisCommandService, IConnectionMultiplexer redisConnection,
        IStaleConnectionDetectionService? staleConnectionDetectionService = null) {
        _deviceCommunicationService = deviceCommunicationService;
        _pendingCommandRepo = pendingCommandRepo;
        _httpCommandPusher = httpCommandPusher;
        _deviceValidator = deviceValidator;
        _logger = logger;
        _redisCommandService = redisCommandService;
        _redisConnection = redisConnection;
        _staleConnectionDetectionService = staleConnectionDetectionService;
    }

    public async Task<CommandResult> ExecuteCommandAsync (string deviceId, string commandType, object commandData = null) {
        try {
            // Check if device connection is stale before proceeding
            //Cursor on changes to code
            var isStale = _staleConnectionDetectionService != null ?
                await _staleConnectionDetectionService.IsDeviceConnectionStale (deviceId) :
                await IsDeviceConnectionStale (deviceId);

            if (isStale) {
                _logger.LogWarning ("Device {DeviceId} connection appears stale (>5 min inactive), command execution may fail", deviceId);
                return CommandResult.Failed ("Device connection is stale or inactive", 408); // Request Timeout
            }

            //Cursor: Optimize device validation - validate once and reuse the result
            var deviceValidationResult = await _deviceValidator.ValidateDevice (deviceId);
            if (!deviceValidationResult.IsAllowed || deviceValidationResult.DeviceInfo == null) {
                _logger.LogWarning ("Device {DeviceId} validation failed: {Message}", deviceId, deviceValidationResult.Message);
                return CommandResult.Failed (deviceValidationResult.Message ?? "Device not found", 404);
            }

            var deviceInfo = deviceValidationResult.DeviceInfo;
            _logger.LogInformation ("Device {DeviceId} validated successfully", deviceId);

            // Determine preferred mode using the already validated device info
            var mode = await DeterminePreferredCommunicationModeAsync (deviceId, deviceInfo);
            _logger.LogInformation ("Device {DeviceId} preferred communication mode: {Mode}", deviceId, mode);

            if (mode == CommunicationMode.WebSocket) {
                //Cursor: Ensure CommandData is properly converted to JObject
                JObject commandDataJObject = null;
                if (commandData != null) {
                    commandDataJObject = commandData is JObject jObj ? jObj : JObject.FromObject (commandData);
                }

                //Cursor: Add debugging to see the actual command data structure
                _logger.LogDebug ("Command data before Redis: Type={CommandDataType}, Content={CommandDataContent}",
                    commandData?.GetType ().Name,
                    commandDataJObject?.ToString (Newtonsoft.Json.Formatting.None));

                _logger.LogInformation ("Sending Redis command {CommandType} to device {DeviceId} via WebSocket",
                    commandType, deviceId);

                var redisResponse = await _redisCommandService.SendCommandAsync (new RedisPTSCommand {
                    DeviceId = deviceId,
                        CommandType = commandType,
                        CommandData = commandDataJObject
                }, CancellationToken.None);

                _logger.LogInformation ("Received Redis response for device {DeviceId}: Status={Status}, Message={Message}",
                    deviceId, redisResponse.Status, redisResponse.Message);

                // Convert Redis response to PTSMessage
                var ptsMessage = ConvertRedisResponseToPTSMessage (redisResponse);

                return ProcessPTSResponse (ptsMessage, commandType, commandData);
            } else {
                // HTTP Direct Mode - use the already validated device info
                int originalPacketId = PacketIdGenerator.GetNextId ();
                var requestMessage = BuildRequestMessage (commandType, commandData ?? new { }, originalPacketId);

                if (string.IsNullOrEmpty (deviceInfo.IpAddress) || !deviceInfo.PortNumber.HasValue) {
                    _logger.LogWarning ("Device {DeviceId} does not have valid IP address or port for HTTP communication", deviceId);
                    return CommandResult.Failed ("Device does not support HTTP communication", 400);
                }

                var (success, errorCode, ptsResponse) = await _httpCommandPusher.SendPTSMessageAsync (deviceInfo.IpAddress, deviceInfo.PortNumber.Value, requestMessage);

                if (!success) return await HandleFailedHttpPush (deviceId, commandType, commandData, errorCode);

                return ProcessPTSResponseHTTP (ptsResponse, originalPacketId, commandType, commandData);
            }
        } catch (Exception ex) {
            var (code, message) = ErrorCodeMapper.MapException (ex);
            _logger.LogError (ex, "Error executing command for device {DeviceId}", deviceId);
            return CommandResult.Failed (message, (int) code);
        }
    }

    //Cursor: Improved method to determine communication mode with actual WebSocket status check
    private async Task<CommunicationMode> DeterminePreferredCommunicationModeAsync (string deviceId, DeviceInfoDTO deviceInfo) {
        // Check if device can use WebSocket and if it's actually active
        if (deviceInfo.WebSocketCapable) { //To:Do Add this later   && deviceInfo.AllowedForDirectCommands
            var db = _redisConnection.GetDatabase ();
            var isWebSocketActive = await IsWebSocketActiveInWindowService (deviceId, db);
            if (isWebSocketActive) {
                _logger.LogDebug ("Device {DeviceId} has active WebSocket connection", deviceId);
                return CommunicationMode.WebSocket;
            }
            _logger.LogDebug ("Device {DeviceId} is WebSocket capable but no active connection found", deviceId);
        }

        // Check if device can use HTTP direct communication
        if (deviceInfo.AllowedForDirectCommands &&
            !string.IsNullOrEmpty (deviceInfo.IpAddress) &&
            deviceInfo.PortNumber.HasValue) {
            _logger.LogDebug ("Device {DeviceId} will use HTTP direct communication", deviceId);
            return CommunicationMode.Http;
        }

        // Default to HTTP polling if no direct communication is possible
        _logger.LogDebug ("Device {DeviceId} will use HTTP polling", deviceId);
        return CommunicationMode.Http;
    }

    //Cursor: Method to check if WebSocket is actually active (copied from DeviceCommunicationService)
    private async Task<bool> IsWebSocketActiveInWindowService (string deviceId, IDatabase db) {
        var serializedInformation = await db.HashGetAsync (WebSocketConnectionHashKey, deviceId);
        if (serializedInformation.IsNullOrEmpty) return false;

        try {
            var connectionInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo> (serializedInformation);
            return connectionInfo?.Status == ConnectionStatus.Connected ||
                connectionInfo?.Status == ConnectionStatus.Active;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deserializing WebSocket connection information for device {DeviceId}", deviceId);
            return false;
        }
    }

    /// <summary>
    /// Overload for HTTP mode where we expect a specific packet ID.
    /// </summary>
    private CommandResult ProcessPTSResponseHTTP (PTSMessage response, int expectedPacketId, string commandType, object originalData) {
        var responsePacket = response.Packets.FirstOrDefault (p => p.Id == expectedPacketId);
        if (responsePacket == null) {
            return CommandResult.Failed ("No matching response packet found", 500);
        }

        if (responsePacket.Error == true) {
            return CommandResult.Failed (responsePacket.Message, responsePacket.Code ?? 500);
        }

        return CommandResult.Succeeded (commandType, responsePacket.Data?.ToObject<object> () ?? originalData);
    }

    /// <summary>
    ///   Converts the RedisPTSCommandResponse from the Windows service
    /// back into a PTSMessage so we can reuse ProcessPTSResponse.
    /// </summary>
    /// <param name="redisResponse"></param>
    /// <returns></returns>
    private PTSMessage ConvertRedisResponseToPTSMessage (RedisPTSCommandResponse redisResponse) {
        // Create a single Packet that indicates success/failure
        var error = redisResponse.Status.Equals ("Error", StringComparison.OrdinalIgnoreCase);

        JObject dataJson = null;
        int packetId = 0;
        string packetType = "";
        JObject actualPacketData = null;

        if (redisResponse.ResponsePayload.HasValue) {
            try {
                dataJson = JObject.Parse (redisResponse.ResponsePayload.Value.GetRawText ());
                _logger.LogDebug ("Successfully parsed Redis response payload for correlation ID: {CorrelationId}",
                    redisResponse.CorrelationId);

                //Cursor: Extract the actual packet data from the nested PTSMessage structure
                // The ResponsePayload contains a PTSMessage with Packets array
                var packetsArray = dataJson?["Packets"] as JArray;
                if (packetsArray?.Count > 0) {
                    var firstPacket = packetsArray[0] as JObject;
                    if (firstPacket != null) {
                        packetId = firstPacket["Id"]?.Value<int> () ?? 0;
                        packetType = firstPacket["Type"]?.Value<string> () ?? "";
                        actualPacketData = firstPacket["Data"] as JObject; // This is the actual pump data we need

                        _logger.LogDebug ("Extracted packet data from Redis response: PacketId={PacketId}, Type={Type}, Data={Data}",
                            packetId, packetType, actualPacketData?.ToString ());
                    }
                }
            } catch (Exception ex) {
                _logger.LogWarning (ex, "Failed to parse Redis response payload for correlation ID: {CorrelationId}. Raw text: {RawText}",
                    redisResponse.CorrelationId, redisResponse.ResponsePayload.Value.GetRawText ());
            }
        } else {
            _logger.LogDebug ("Redis response has no payload for correlation ID: {CorrelationId}",
                redisResponse.CorrelationId);
        }

        var packet = new Packet {
            Id = packetId,
            Type = packetType,
            Error = error,
            Message = redisResponse.Message,
            Data = actualPacketData, // Use the extracted packet data, not the entire message
            Code = error ? 500 : 0 // Add appropriate error code
        };

        _logger.LogDebug ("Converted Redis response to PTS packet: Id={PacketId}, Type={Type}, Error={Error}, Message={Message}, HasData={HasData}",
            packet.Id, packet.Type, packet.Error, packet.Message, packet.Data != null);

        return new PTSMessage {
            Protocol = "jsonPTS",
                Packets = new List<Packet> { packet }
        };
    }
    /// <summary>
    /// For HTTP mode, builds a PTSMessage including a device-level packet ID.
    /// </summary>

    private PTSMessage BuildRequestMessage (string commandType, object commandData, int packetId) {
        return new PTSMessage {
            Protocol = "jsonPTS",
                Packets = new List<Packet> {
                    new Packet {
                    Id = packetId,
                    Type = commandType,
                    Data = Newtonsoft.Json.Linq.JObject.FromObject (commandData)
                    }
                    }
        };
    }

    /// <summary>
    /// Process the PTS response and return a CommandResult.
    /// </summary>
    /// <param name="response"></param>
    /// <param name="commandType"></param>
    /// <param name="originalData"></param>
    /// <returns></returns>
    private CommandResult ProcessPTSResponse (PTSMessage response, string commandType, object originalData) {
        // For WebSocket mode, we simply take the first packet.
        var responsePacket = response.Packets.FirstOrDefault ();
        if (responsePacket == null) {
            return CommandResult.Failed ("No matching response packet found", 500);
        }

        if (responsePacket.Error == true) {
            return CommandResult.Failed (responsePacket.Message, responsePacket.Code ?? 500);
        }

        return CommandResult.Succeeded (commandType, responsePacket.Data?.ToObject<object> () ?? originalData);
    }

    private async Task<CommandResult> HandleFailedHttpPush (string deviceId, string commandType, object commandData, int? errorCode) //TODO: Add Priority
    {
        if (errorCode.HasValue) {
            return CommandResult.Failed ($"Device returned error code {errorCode}", errorCode.Value);
        }

        _logger.LogWarning ("Failed to deliver command {CommandType} to device {DeviceId}, storing pending",
            commandType, deviceId);

        await _pendingCommandRepo.QueueCommandAsync (deviceId, commandType, commandData, 1, "HTTP_Retry"); //TODO: Add Priority
        return CommandResult.Failed ("HTTP push failed and no error code found", 9999);
    }

    /// <summary>
    /// Checks if the device connection is stale (inactive for more than the specified threshold)
    /// </summary>
    /// <param name="deviceId">Device ID to check</param>
    /// <param name="staleThresholdMinutes">Threshold in minutes to consider connection stale (default 5)</param>
    /// <returns>True if connection is stale, false if it's active</returns>
    private async Task<bool> IsDeviceConnectionStale (string deviceId, int staleThresholdMinutes = 5) {
        try {
            var db = _redisConnection.GetDatabase ();
            var now = DateTime.UtcNow;

            // Check WebSocket connection
            var wsConnectionInfo = await GetWebSocketConnectionInfo (deviceId, db);
            if (wsConnectionInfo != null) {
                var timeSinceLastMessage = (now - wsConnectionInfo.LastMessageAt).TotalMinutes;
                _logger.LogDebug ("Device {DeviceId} WebSocket last activity: {Minutes} minutes ago", deviceId, timeSinceLastMessage);

                if (timeSinceLastMessage <= staleThresholdMinutes) {
                    return false; // Connection is fresh
                }
            }

            // Check HTTP connection
            var httpConnectionInfo = await GetHttpConnectionInfo (deviceId, db);
            if (httpConnectionInfo != null) {
                var lastActivity = httpConnectionInfo.LastStatusUpdate > httpConnectionInfo.LastPollTime ?
                    httpConnectionInfo.LastStatusUpdate :
                    httpConnectionInfo.LastPollTime;
                var timeSinceLastActivity = (now - lastActivity).TotalMinutes;

                _logger.LogDebug ("Device {DeviceId} HTTP last activity: {Minutes} minutes ago", deviceId, timeSinceLastActivity);

                if (timeSinceLastActivity <= staleThresholdMinutes) {
                    return false; // Connection is fresh
                }
            }

            // If we reach here, either no connection info exists or all connections are stale
            _logger.LogWarning ("Device {DeviceId} appears to have stale or no connection data in Redis", deviceId);
            return true;
        } catch (Exception ex) {
            _logger.LogError (ex, "Error checking device {DeviceId} connection staleness", deviceId);
            // On error, assume connection might be stale to be safe
            return true;
        }
    }

    /// <summary>
    /// Gets WebSocket connection info from Redis
    /// </summary>
    private async Task<WebSocketConnectionInfo?> GetWebSocketConnectionInfo (string deviceId, IDatabase db) {
        try {
            var serializedInfo = await db.HashGetAsync (WebSocketConnectionHashKey, deviceId);
            if (serializedInfo.IsNullOrEmpty) return null;

            return JsonSerializer.Deserialize<WebSocketConnectionInfo> (serializedInfo);
        } catch (Exception ex) {
            _logger.LogWarning (ex, "Error deserializing WebSocket connection info for device {DeviceId}", deviceId);
            return null;
        }
    }

    /// <summary>
    /// Gets HTTP connection info from Redis
    /// </summary>
    private async Task<HttpConnectionInfo?> GetHttpConnectionInfo (string deviceId, IDatabase db) {
        try {
            var serializedInfo = await db.HashGetAsync ("device:http-connections", deviceId);
            if (serializedInfo.IsNullOrEmpty) return null;

            return JsonSerializer.Deserialize<HttpConnectionInfo> (serializedInfo);
        } catch (Exception ex) {
            _logger.LogWarning (ex, "Error deserializing HTTP connection info for device {DeviceId}", deviceId);
            return null;
        }
    }

}