using System.Data;
using System.Threading.Tasks;
using FMS.Application.Common.PTSResponse;
using FMS.Application.Communication;
using FMS.Application.Communication.Connection;
using FMS.Application.Communication.HttpPolling;
using FMS.Application.ModelsDTOs.PTS.Common;
using Microsoft.Extensions.Logging;
using MediatR;
using FMS.Application.Validation.PTSValidators;
using System;
using Microsoft.Extensions.Logging.Abstractions;
using FMS.Application.Validation.PTSValidators.Common;
using Google.Protobuf.WellKnownTypes;
using FMS.Application.Helpers;
using MySqlX.XDevAPI.Common;
using FMS.Domain.Entities;
using System.Collections.Generic;
using FMS.Application.Infrastructure.ErroCodeHanding.Common;
using AutoMapper.Configuration.Annotations;
using System.Linq;
using FMS.Application.Infrastructure.ErrorCodes.Common;
using System.Net.Http;
using System.Text.Json;
using FMS.Application.ModelsDTOs.PTS.Enum;
using FMS.Domain.PTSCommon;
using FMS.Application.Communication.Redis;
using FMS.Application.Common.Commands;
using System.Threading;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Command.PTSCommand.Common;

/// <summary>
/// Excute commands for PTS devices.
/// It determines the communication mode (WebSocket or HTTP) and
/// then dispatches the command accordingly.
/// </summary>
public class CommandExecutor : ICommandExecutor
{

    private readonly IDeviceCommunicationService _deviceCommunicationService;
    private readonly IPendingCommandRepository _pendingCommandRepo;
    private readonly IDeviceHttpCommandPusher _httpCommandPusher;
    private readonly ILogger<CommandExecutor> _logger;
    private readonly IDeviceValidator _deviceValidator;
    private readonly RedisCommandService _redisCommandService;

    public CommandExecutor(IDeviceCommunicationService deviceCommunicationService, IPendingCommandRepository pendingCommandRepo, IDeviceHttpCommandPusher httpCommandPusher,
                 IDeviceValidator deviceValidator, ILogger<CommandExecutor> logger, RedisCommandService redisCommandService)
    {
        _deviceCommunicationService = deviceCommunicationService;
        _pendingCommandRepo = pendingCommandRepo;
        _httpCommandPusher = httpCommandPusher;
        _deviceValidator = deviceValidator;
        _logger = logger;
        _redisCommandService = redisCommandService;
    }

    public async Task<CommandResult> ExecuteCommandAsync(string deviceId, string commandType, object commandData = null)
    {
        try
        {
            // var originalPacketId = PacketIdGenerator.GetNextId();
            //     var requestMessage = BuildRequestMessage(commandType, commandData ?? new { }, originalPacketId);

            // Determine preferred mode (WebSocket if active in Windows service, else HTTP)
            var mode = await _deviceCommunicationService.GetPreferredCommunicationMode(deviceId);
            _logger.LogInformation("Device {DeviceId} can push commands. Mode={Mode}", deviceId, mode);

            if (mode == CommunicationMode.WebSocket)
            {
                var redisResponse = await _redisCommandService.SendCommandAsync(new RedisPTSCommand
                {
                    DeviceId = deviceId,
                    CommandType = commandType,
                    CommandData = commandData as JObject
                }, CancellationToken.None);
                // Convert Redis response to PTSMessage
                var ptsMessage = ConvertRedisResponseToPTSMessage(redisResponse);

                return ProcessPTSResponse(ptsMessage, commandType, commandData);
            }
            else
            {
                // HTTP Direct Mode
                int originalPacketId = PacketIdGenerator.GetNextId();
                var requestMessage = BuildRequestMessage(commandType, commandData ?? new { }, originalPacketId);
                var deviceInfo = await GetDeviceInfoForDevice(deviceId);
                if (deviceInfo == null) return CommandResult.Failed("Device not found", 404);

                var (success, errorCode, ptsResponse) = await _httpCommandPusher.SendPTSMessageAsync(deviceInfo.IpAddress, deviceInfo.PortNumber.Value, requestMessage);

                if (!success) return await HandleFailedHttpPush(deviceId, commandType, commandData, errorCode);


                return ProcessPTSResponseHTTP(ptsResponse, originalPacketId, commandType, commandData);
            }
        }
        catch (Exception ex)
        {
            var (code, message) = ErrorCodeMapper.MapException(ex);
            _logger.LogError(ex, "Error executing command for device {DeviceId}", deviceId);
            return CommandResult.Failed(message, (int)code);
        }
    }

    /// <summary>
    /// Overload for HTTP mode where we expect a specific packet ID.
    /// </summary>
    private CommandResult ProcessPTSResponseHTTP(PTSMessage response, int expectedPacketId, string commandType, object originalData)
    {
        var responsePacket = response.Packets.FirstOrDefault(p => p.Id == expectedPacketId);
        if (responsePacket == null)
        {
            return CommandResult.Failed("No matching response packet found", 500);
        }

        if (responsePacket.Error == true)
        {
            return CommandResult.Failed(responsePacket.Message, responsePacket.Code ?? 500);
        }

        return CommandResult.Succeeded(commandType, responsePacket.Data?.ToObject<object>() ?? originalData);
    }

    /// <summary>
    ///   Converts the RedisPTSCommandResponse from the Windows service
    /// back into a PTSMessage so we can reuse ProcessPTSResponse.
    /// </summary>
    /// <param name="redisResponse"></param>
    /// <returns></returns>
    private PTSMessage ConvertRedisResponseToPTSMessage(RedisPTSCommandResponse redisResponse)
    {
        // Create a single Packet that indicates success/failure
        var error = redisResponse.Status.Equals("Error", StringComparison.OrdinalIgnoreCase);

        JObject dataJson = null;
        if (redisResponse.ResponsePayload.HasValue)
        {
            dataJson = JObject.Parse(redisResponse.ResponsePayload.Value.GetRawText());
        }

        var packet = new Packet
        {
            Id = dataJson?["Id"]?.Value<int>() ?? 0,
            Error = error,
            Message = redisResponse.Message,
            Data = dataJson
        };

        return new PTSMessage
        {
            Protocol = "jsonPTS",
            Packets = new List<Packet> { packet }
        };
    }
    /// <summary>
    /// For HTTP mode, builds a PTSMessage including a device-level packet ID.
    /// </summary>

    private PTSMessage BuildRequestMessage(string commandType, object commandData, int packetId)
    {
        return new PTSMessage
        {
            Protocol = "jsonPTS",
            Packets = new List<Packet>
            {
                new Packet
                {
                    Id = packetId,
                    Type = commandType,
                    Data = Newtonsoft.Json.Linq.JObject.FromObject(commandData)
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
    private CommandResult ProcessPTSResponse(PTSMessage response, string commandType, object originalData)
    {
        // For WebSocket mode, we simply take the first packet.
        var responsePacket = response.Packets.FirstOrDefault();
        if (responsePacket == null)
        {
            return CommandResult.Failed("No matching response packet found", 500);
        }

        if (responsePacket.Error == true)
        {
            return CommandResult.Failed(responsePacket.Message, responsePacket.Code ?? 500);
        }

        return CommandResult.Succeeded(commandType, responsePacket.Data?.ToObject<object>() ?? originalData);
    }


    private async Task<CommandResult> HandleFailedHttpPush(string deviceId, string commandType, object commandData, int? errorCode) //TODO: Add Priority
    {
        if (errorCode.HasValue)
        {
            return CommandResult.Failed($"Device returned error code {errorCode}", errorCode.Value);
        }

        _logger.LogWarning("Failed to deliver command {CommandType} to device {DeviceId}, storing pending",
            commandType, deviceId);

        await _pendingCommandRepo.QueueCommandAsync(deviceId, commandType, commandData, 1, "HTTP_Retry");//TODO: Add Priority
        return CommandResult.Failed("HTTP push failed and no error code found", 9999);
    }



    private async Task<DeviceInfoDTO?> GetDeviceInfoForDevice(string deviceId)
    {
        try
        {
            var validationResult = await _deviceValidator.ValidateDevice(deviceId);

            return validationResult.DeviceInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving device info for {DeviceId}", deviceId);
            return null;
        }
    }


}
