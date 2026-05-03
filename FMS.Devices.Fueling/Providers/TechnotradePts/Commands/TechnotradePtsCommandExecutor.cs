/*
 * File:          TechnotradePtsCommandExecutor.cs
 * Purpose:       Executes Technotrade PTS commands through provider-owned command mapping
 *                while preserving the Application ICommandExecutor contract.
 * Dependencies:  ICommandExecutor, RedisCommandService, IDeviceHttpCommandPusher,
 *                IDeviceValidator, ITechnotradePtsCommandMappingService
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - ExecuteCommandAsync(): Routes mapped jsonPTS commands through WebSocket/Redis or HTTP.
 */
using System.Text.Json;
using FMS.Application.Command.PTSCommand.Common;
using FMS.Application.Common.Commands;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.Communication.Redis;
using FMS.Application.Communication.Tracker.Common;
using FMS.Application.Features.PTS.Common;
using FMS.Application.Features.PTS.Enum;
using FMS.Application.Infrastructure.ErroCodeHanding.Common;
using FMS.Application.Services;
using FMS.Application.Validation.PTSValidators.Common;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Commands;

public sealed class TechnotradePtsCommandExecutor : ICommandExecutor
{
    private const string WebSocketConnectionHashKey = "device:websocket-connections";

    private readonly IPendingCommandRepository _pendingCommandRepository;
    private readonly IDeviceHttpCommandPusher _httpCommandPusher;
    private readonly IDeviceValidator _deviceValidator;
    private readonly RedisCommandService _redisCommandService;
    private readonly IConnectionMultiplexer _redisConnection;
    private readonly ITechnotradePtsCommandMappingService _commandMappingService;
    private readonly IStaleConnectionDetectionService? _staleConnectionDetectionService;
    private readonly ILogger<TechnotradePtsCommandExecutor> _logger;

    public TechnotradePtsCommandExecutor(
        IPendingCommandRepository pendingCommandRepository,
        IDeviceHttpCommandPusher httpCommandPusher,
        IDeviceValidator deviceValidator,
        RedisCommandService redisCommandService,
        IConnectionMultiplexer redisConnection,
        ITechnotradePtsCommandMappingService commandMappingService,
        ILogger<TechnotradePtsCommandExecutor> logger,
        IStaleConnectionDetectionService? staleConnectionDetectionService = null)
    {
        _pendingCommandRepository = pendingCommandRepository;
        _httpCommandPusher = httpCommandPusher;
        _deviceValidator = deviceValidator;
        _redisCommandService = redisCommandService;
        _redisConnection = redisConnection;
        _commandMappingService = commandMappingService;
        _logger = logger;
        _staleConnectionDetectionService = staleConnectionDetectionService;
    }

    public async Task<CommandResult> ExecuteCommandAsync(string deviceId, string commandType, object commandData)
    {
        try
        {
            var isStale = _staleConnectionDetectionService != null
                ? await _staleConnectionDetectionService.IsDeviceConnectionStale(deviceId)
                : await IsDeviceConnectionStaleAsync(deviceId);

            if (isStale)
            {
                _logger.LogWarning(
                    "Device {DeviceId} connection appears stale; command {CommandType} was not sent.",
                    deviceId,
                    commandType);
                return CommandResult.Failed("Device connection is stale or inactive", 408);
            }

            var validationResult = await _deviceValidator.ValidateDevice(deviceId);
            if (!validationResult.IsAllowed || validationResult.DeviceInfo == null)
            {
                _logger.LogWarning(
                    "Device {DeviceId} validation failed before command {CommandType}: {Message}",
                    deviceId,
                    commandType,
                    validationResult.Message);
                return CommandResult.Failed(validationResult.Message ?? "Device not found", 404);
            }

            var deviceInfo = validationResult.DeviceInfo;
            var mode = await DeterminePreferredCommunicationModeAsync(deviceId, deviceInfo);

            _logger.LogInformation(
                "Executing Technotrade PTS command {CommandType} for device {DeviceId} via {Mode}.",
                commandType,
                deviceId,
                mode);

            return mode == CommunicationMode.WebSocket
                ? await ExecuteWebSocketCommandAsync(deviceId, commandType, commandData)
                : await ExecuteHttpCommandAsync(deviceId, commandType, commandData, deviceInfo);
        }
        catch (Exception ex)
        {
            var (code, message) = ErrorCodeMapper.MapException(ex);
            _logger.LogError(ex, "Error executing Technotrade PTS command {CommandType} for device {DeviceId}.", commandType, deviceId);
            return CommandResult.Failed(message, (int)code);
        }
    }

    private async Task<CommandResult> ExecuteWebSocketCommandAsync(string deviceId, string commandType, object? commandData)
    {
        var mappedCommand = _commandMappingService.Map(commandType, commandData);

        _logger.LogDebug(
            "Mapped WebSocket command {CommandType} to packet {PacketType} for device {DeviceId}.",
            commandType,
            mappedCommand.PacketType,
            deviceId);

        var redisResponse = await _redisCommandService.SendCommandAsync(new RedisPTSCommand
        {
            DeviceId = deviceId,
            CommandType = mappedCommand.PacketType,
            CommandData = mappedCommand.Data ?? new JObject()
        }, CancellationToken.None);

        var ptsMessage = ConvertRedisResponseToPtsMessage(redisResponse);
        return ProcessPtsResponse(ptsMessage, commandType, commandData);
    }

    private async Task<CommandResult> ExecuteHttpCommandAsync(
        string deviceId,
        string commandType,
        object? commandData,
        DeviceInfoDTO deviceInfo)
    {
        if (string.IsNullOrWhiteSpace(deviceInfo.IpAddress) || !deviceInfo.PortNumber.HasValue)
        {
            _logger.LogWarning("Device {DeviceId} does not have valid HTTP address information.", deviceId);
            return CommandResult.Failed("Device does not support HTTP communication", 400);
        }

        var requestMessage = _commandMappingService.BuildMessage(commandType, commandData);
        var expectedPacketId = requestMessage.Packets.FirstOrDefault()?.Id;

        var (success, errorCode, ptsResponse) = await _httpCommandPusher.SendPTSMessageAsync(
            deviceInfo.IpAddress,
            deviceInfo.PortNumber.Value,
            requestMessage);

        if (!success)
        {
            return await HandleFailedHttpPushAsync(deviceId, commandType, commandData, errorCode);
        }

        return ProcessPtsResponse(ptsResponse, commandType, commandData, expectedPacketId);
    }

    private async Task<CommunicationMode> DeterminePreferredCommunicationModeAsync(string deviceId, DeviceInfoDTO deviceInfo)
    {
        if (deviceInfo.WebSocketCapable)
        {
            var db = _redisConnection.GetDatabase();
            if (await IsWebSocketActiveInWindowServiceAsync(deviceId, db))
            {
                return CommunicationMode.WebSocket;
            }
        }

        if (deviceInfo.AllowedForDirectCommands &&
            !string.IsNullOrWhiteSpace(deviceInfo.IpAddress) &&
            deviceInfo.PortNumber.HasValue)
        {
            return CommunicationMode.Http;
        }

        return CommunicationMode.Http;
    }

    private async Task<bool> IsWebSocketActiveInWindowServiceAsync(string deviceId, IDatabase db)
    {
        var serializedInformation = await db.HashGetAsync(WebSocketConnectionHashKey, deviceId);
        if (serializedInformation.IsNullOrEmpty)
        {
            return false;
        }

        try
        {
            var connectionInfo = JsonSerializer.Deserialize<WebSocketConnectionInfo>(serializedInformation!);
            return connectionInfo?.Status == ConnectionStatus.Connected ||
                   connectionInfo?.Status == ConnectionStatus.Active;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deserializing WebSocket connection information for device {DeviceId}.", deviceId);
            return false;
        }
    }

    private CommandResult ProcessPtsResponse(
        PTSMessage? response,
        string commandType,
        object? originalData,
        int? expectedPacketId = null)
    {
        var responsePacket = expectedPacketId.HasValue
            ? response?.Packets.FirstOrDefault(p => p.Id == expectedPacketId.Value)
            : response?.Packets.FirstOrDefault();

        if (responsePacket == null)
        {
            return CommandResult.Failed("No matching response packet found", 500);
        }

        if (responsePacket.Error == true)
        {
            return CommandResult.Failed(responsePacket.Message, responsePacket.Code ?? 500);
        }

        return CommandResult.Succeeded(commandType, responsePacket.Data?.ToObject<object>() ?? originalData!);
    }

    private PTSMessage ConvertRedisResponseToPtsMessage(RedisPTSCommandResponse redisResponse)
    {
        var status = redisResponse.Status?.Trim();
        var error = !string.Equals(status, "Success", StringComparison.OrdinalIgnoreCase);
        var packetId = 0;
        var packetType = string.Empty;
        JToken? actualPacketData = null;

        if (redisResponse.ResponsePayload.HasValue)
        {
            try
            {
                var dataJson = JObject.Parse(redisResponse.ResponsePayload.Value.GetRawText());
                var packetsArray = dataJson["Packets"] as JArray;
                var firstPacket = packetsArray?.FirstOrDefault() as JObject;
                if (firstPacket != null)
                {
                    packetId = firstPacket["Id"]?.Value<int>() ?? 0;
                    packetType = firstPacket["Type"]?.Value<string>() ?? string.Empty;
                    actualPacketData = firstPacket["Data"];
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to parse Redis response payload for correlation ID {CorrelationId}.",
                    redisResponse.CorrelationId);
            }
        }

        return new PTSMessage
        {
            Protocol = "jsonPTS",
            Packets = new List<Packet>
            {
                new()
                {
                    Id = packetId,
                    Type = packetType,
                    Error = error,
                    Message = redisResponse.Message,
                    Data = actualPacketData,
                    Code = error ? 500 : 0
                }
            }
        };
    }

    private async Task<CommandResult> HandleFailedHttpPushAsync(
        string deviceId,
        string commandType,
        object? commandData,
        int? errorCode)
    {
        if (errorCode.HasValue)
        {
            return CommandResult.Failed($"Device returned error code {errorCode}", errorCode.Value);
        }

        _logger.LogWarning(
            "Failed to deliver command {CommandType} to device {DeviceId}; storing pending command.",
            commandType,
            deviceId);

        await _pendingCommandRepository.QueueCommandAsync(deviceId, commandType, commandData ?? new { }, 1, "HTTP_Retry");
        return CommandResult.Failed("HTTP push failed and no error code found", 9999);
    }

    private async Task<bool> IsDeviceConnectionStaleAsync(string deviceId, int staleThresholdMinutes = 5)
    {
        try
        {
            var db = _redisConnection.GetDatabase();
            var now = DateTime.UtcNow;

            var wsConnectionInfo = await GetWebSocketConnectionInfoAsync(deviceId, db);
            if (wsConnectionInfo != null &&
                (now - wsConnectionInfo.LastMessageAt).TotalMinutes <= staleThresholdMinutes)
            {
                return false;
            }

            var httpConnectionInfo = await GetHttpConnectionInfoAsync(deviceId, db);
            if (httpConnectionInfo != null)
            {
                var lastActivity = httpConnectionInfo.LastStatusUpdate > httpConnectionInfo.LastPollTime
                    ? httpConnectionInfo.LastStatusUpdate
                    : httpConnectionInfo.LastPollTime;

                if ((now - lastActivity).TotalMinutes <= staleThresholdMinutes)
                {
                    return false;
                }
            }

            _logger.LogWarning("Device {DeviceId} appears to have stale or no connection data in Redis.", deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking device {DeviceId} connection staleness.", deviceId);
            return true;
        }
    }

    private async Task<WebSocketConnectionInfo?> GetWebSocketConnectionInfoAsync(string deviceId, IDatabase db)
    {
        try
        {
            var serializedInfo = await db.HashGetAsync(WebSocketConnectionHashKey, deviceId);
            return serializedInfo.IsNullOrEmpty
                ? null
                : JsonSerializer.Deserialize<WebSocketConnectionInfo>(serializedInfo!);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deserializing WebSocket connection info for device {DeviceId}.", deviceId);
            return null;
        }
    }

    private async Task<HttpConnectionInfo?> GetHttpConnectionInfoAsync(string deviceId, IDatabase db)
    {
        try
        {
            var serializedInfo = await db.HashGetAsync("device:http-connections", deviceId);
            return serializedInfo.IsNullOrEmpty
                ? null
                : JsonSerializer.Deserialize<HttpConnectionInfo>(serializedInfo!);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error deserializing HTTP connection info for device {DeviceId}.", deviceId);
            return null;
        }
    }
}
