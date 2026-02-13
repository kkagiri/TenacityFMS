using System;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.InTankDeliveryCommand;
using FMS.Application.Features.PTS;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers
{
    [PacketType("UploadInTankDelivery")]
    public class UploadInTankDeliveryHandler : IPacketHandler
    {
        private readonly ILogger<UploadInTankDeliveryHandler> _logger;
        private readonly IMediator _mediator;

        public UploadInTankDeliveryHandler(
            ILogger<UploadInTankDeliveryHandler> logger,
            IMediator mediator)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _mediator = mediator ??
                throw new ArgumentNullException(nameof(mediator));
        }

        public string PacketType => "UploadInTankDelivery";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            var responsePacket = new Packet
            {
                Id = packet.Id,
                Type = packet.Type
            };

            try
            {
                if (packet.Data == null)
                {
                    _logger.LogWarning("Missing in-tank delivery data from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                var inTankDeliveryDto = packet.Data.ToObject<InTankDeliveryDto>();
                if (inTankDeliveryDto == null)
                {
                    _logger.LogWarning("Invalid in-tank delivery data format from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                // Enrich SYNCHRONOUSLY before sending command to avoid race condition
                if (string.IsNullOrEmpty(inTankDeliveryDto.PtsId))
                {
                    inTankDeliveryDto.PtsId = deviceId;
                }
                if (inTankDeliveryDto.PacketId <= 0)
                {
                    inTankDeliveryDto.PacketId = packet.Id;
                }

                // Fire-and-forget for non-critical enrichment logging
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await EnrichInTankDeliveryWithContext(deviceId, inTankDeliveryDto, packet.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Non-critical: Failed to enrich in-tank delivery for device {DeviceId}", deviceId);
                    }
                });

                // Process delivery with timeout protection
                var commandTask = _mediator.Send(new CreateInTankDeliveryCommand(inTankDeliveryDto, deviceId));
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
                var completedTask = await Task.WhenAny(commandTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    _logger.LogError("Database timeout processing in-tank delivery for device {DeviceId}, tank {TankId}",
                        deviceId, inTankDeliveryDto.Tank);
                }
                else
                {
                    var result = await commandTask;
                    if (result.IsSuccess)
                    {
                        _logger.LogInformation("Successfully processed in-tank delivery for device {DeviceId}, tank {TankId}, start {StartTime}, end {EndTime}",
                            deviceId, inTankDeliveryDto.Tank, inTankDeliveryDto.StartValues?.DateTime, inTankDeliveryDto.EndValues?.DateTime);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to process in-tank delivery for device {DeviceId}, tank {TankId}: {Message}. ACKing to advance device queue.",
                            deviceId, inTankDeliveryDto.Tank, result.Message);
                    }
                }

                // ALWAYS return OK — never block device queue due to server-side issues
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing in-tank delivery packet for device {DeviceId}. ACKing to advance device queue.", deviceId);
                // NEVER return Error:true — it causes infinite device retry per protocol spec
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";
                return responsePacket;
            }
        }

        //Cursor: Enrich in-tank delivery with device and context information
        private async Task EnrichInTankDeliveryWithContext(string deviceId, InTankDeliveryDto delivery, int packetId)
        {
            try
            {
                //Cursor: Set device context
                if (string.IsNullOrEmpty(delivery.PtsId))
                {
                    delivery.PtsId = deviceId;
                }

                if (delivery.PacketId <= 0)
                {
                    delivery.PacketId = packetId;
                }

                //Cursor: Log in-tank delivery context
                _logger.LogInformation("Enriched in-tank delivery: DeviceId={DeviceId}, Tank={Tank}, FuelGrade={FuelGradeId}, StartVolume={StartVolume}, EndVolume={EndVolume}",
                    deviceId, delivery.Tank, delivery.FuelGradeId, delivery.StartValues?.ProductVolume, delivery.EndValues?.ProductVolume);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enriching in-tank delivery context for device {DeviceId}, tank {Tank}",
                    deviceId, delivery.Tank);
            }
        }
    }
}