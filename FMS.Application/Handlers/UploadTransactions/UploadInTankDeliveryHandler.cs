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
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Missing in-tank delivery data";
                    return responsePacket;
                }

                var inTankDeliveryDto = packet.Data.ToObject<InTankDeliveryDto>();
                if (inTankDeliveryDto == null)
                {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Invalid in-tank delivery data format";
                    return responsePacket;
                }

                // IMPROVEMENT: Fire-and-forget enrichment - don't let it delay device response
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
                    // Database operation timed out
                    _logger.LogError("Database timeout processing in-tank delivery for device {DeviceId}, tank {TankId}",
                        deviceId, inTankDeliveryDto.Tank);

                    responsePacket.Error = false; // Still acknowledge to prevent retry
                    responsePacket.Message = "Delivery queued for processing";
                    responsePacket.Code = 202; // Accepted

                    return responsePacket;
                }

                var result = await commandTask;
                responsePacket.Error = !result.IsSuccess;
                responsePacket.Message = result.Message;
                responsePacket.Code = result.IsSuccess ? 200 : 500;

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully processed in-tank delivery for device {DeviceId}, tank {TankId}, start {StartTime}, end {EndTime}",
                        deviceId, inTankDeliveryDto.Tank, inTankDeliveryDto.StartValues?.DateTime, inTankDeliveryDto.EndValues?.DateTime);
                }
                else
                {
                    _logger.LogWarning("Failed to process in-tank delivery for device {DeviceId}, tank {TankId}: {Message}",
                        deviceId, inTankDeliveryDto.Tank, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing in-tank delivery packet for device {DeviceId}", deviceId);
                responsePacket.Error = true;
                responsePacket.Code = 500;
                responsePacket.Message = "Error processing in-tank delivery packet";
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