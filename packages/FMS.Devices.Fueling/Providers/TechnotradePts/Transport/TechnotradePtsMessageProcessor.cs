using FMS.Application.Handlers.Interface;
using FMS.Application.Communication.Connection;
using FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Devices.Fueling.Providers.TechnotradePts.Transport;

public sealed class TechnotradePtsMessageProcessor : IPTSMessageProcessor
{
    private static readonly HashSet<string> AckAlwaysPacketTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "UploadPumpTransaction",
        "UploadTankMeasurement",
        "UploadInTankDelivery",
        "UploadAlertRecord"
    };

    private static readonly HashSet<string> NoResponsePacketTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "PumpAuthorize",
        "PumpAuthorizeConfirmation",
        "PumpCloseTransaction",
        "PumpCloseTransactionResponse",
        "PumpGetStatusResponse",
        "PumpTransactionInformation"
    };

    private readonly ILogger<TechnotradePtsMessageProcessor> _logger;
    private readonly ITechnotradePtsPacketMappingService _mappingService;
    private readonly IPTSConnectionManager _connectionManager;

    public TechnotradePtsMessageProcessor(
        ILogger<TechnotradePtsMessageProcessor> logger,
        ITechnotradePtsPacketMappingService mappingService,
        IPTSConnectionManager connectionManager)
    {
        _logger = logger;
        _mappingService = mappingService;
        _connectionManager = connectionManager;
    }

    public async Task<PTSMessage> ProcessMessageAsync(string deviceId, PTSMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

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

        foreach (var packet in message.Packets.Where(packet => packet != null))
        {
            var responsePacket = await ProcessPacketAsync(deviceId, packet);
            if (responsePacket != null)
            {
                responseMessage.Packets.Add(responsePacket);
            }
        }

        return responseMessage;
    }

    public async Task HandleMessageAsync(string deviceId, PTSMessage message)
    {
        var response = await ProcessMessageAsync(deviceId, message);
        var jObject = JObject.FromObject(response);
        var packets = jObject["Packets"] as JArray;
        if (packets != null)
        {
            foreach (var packet in packets)
            {
                packet["SetRequestType"]?.Parent?.Remove();

                var dataToken = packet["Data"];
                if (dataToken == null || dataToken.Type == JTokenType.Null)
                {
                    dataToken?.Parent?.Remove();
                }
            }
        }

        await _connectionManager.SendMessageAsync(deviceId, jObject.ToString());
    }

    public Task HandleErrorAsync(string deviceId, Exception exception)
    {
        _logger.LogError(exception, "Critical Technotrade PTS processing error for device {DeviceId}", deviceId);
        return Task.CompletedTask;
    }

    private async Task<Packet?> ProcessPacketAsync(string deviceId, Packet packet)
    {
        try
        {
            if (packet.Error == true)
            {
                _logger.LogWarning(
                    "Technotrade PTS packet error from device {DeviceId}, packet {PacketId}, type {PacketType}: Code={Code}, Message={Message}",
                    deviceId,
                    packet.Id,
                    packet.Type,
                    packet.Code,
                    packet.Message);

                await _mappingService.TryMapAndPublishAsync(deviceId, packet);
                return NoResponsePacketTypes.Contains(packet.Type) ? null : CreateOkAck(packet);
            }

            if (string.Equals(packet.Type, "UploadStatus", StringComparison.OrdinalIgnoreCase)
                && packet.Data == null)
            {
                return CreateError(packet, 400, "Invalid or missing upload status data");
            }

            var mapped = await _mappingService.TryMapAndPublishAsync(deviceId, packet);
            if (!mapped)
            {
                _logger.LogWarning("No Technotrade PTS canonical mapper found for packet {PacketId} of type {PacketType} from device {DeviceId}.",
                    packet.Id, packet.Type, deviceId);
                return CreateError(packet, 415, $"Packet type '{packet.Type}' not supported");
            }

            if (NoResponsePacketTypes.Contains(packet.Type))
            {
                return null;
            }

            if (string.Equals(packet.Type, "PumpEndOfTransactionStatus", StringComparison.OrdinalIgnoreCase))
            {
                return new Packet
                {
                    Id = packet.Id,
                    Type = "PumpEndOfTransactionAck",
                    Data = JObject.FromObject(new
                    {
                        Status = "Acknowledged",
                        ProcessedAt = DateTime.UtcNow
                    })
                };
            }

            return CreateOkAck(packet);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Technotrade PTS packet {PacketId} of type {PacketType} for device {DeviceId}.",
                packet.Id, packet.Type, deviceId);

            return AckAlwaysPacketTypes.Contains(packet.Type)
                ? CreateOkAck(packet)
                : CreateError(packet, 500, $"Error processing {packet.Type}");
        }
    }

    private static Packet CreateOkAck(Packet packet) =>
        new()
        {
            Id = packet.Id,
            Type = packet.Type,
            Error = null,
            Code = null,
            Message = "OK"
        };

    private static Packet CreateError(Packet packet, int code, string message) =>
        new()
        {
            Id = packet.Id,
            Type = packet.Type,
            Error = true,
            Code = code,
            Message = message
        };
}
