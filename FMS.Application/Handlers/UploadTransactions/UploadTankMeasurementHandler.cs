using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.TankMeasurementsCommand;
using FMS.Application.Features.ATG;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using MediatR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers
{
    [PacketType("UploadTankMeasurement")]
    public class UploadTankMeasurementHandler : IPacketHandler
    {
        private readonly ILogger<UploadTankMeasurementHandler> _logger;
        private readonly IMediator _mediator;

        public UploadTankMeasurementHandler(
            ILogger<UploadTankMeasurementHandler> logger,
            IMediator mediator)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _mediator = mediator ??
                throw new ArgumentNullException(nameof(mediator));
        }

        public string PacketType => "UploadTankMeasurement";

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
                    _logger.LogWarning("Missing tank measurement data from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                var tankMeasurementDto = packet.Data.ToObject<TankMeasurementDto>();
                if (tankMeasurementDto == null)
                {
                    _logger.LogWarning("Invalid tank measurement data format from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                // IMPROVEMENT: Fire-and-forget enrichment - don't let it delay device response
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await EnrichTankMeasurementWithContext(deviceId, tankMeasurementDto, packet.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Non-critical: Failed to enrich tank measurement for device {DeviceId}", deviceId);
                    }
                });

                // Process measurement with timeout protection
                var commandTask = _mediator.Send(new CreateTankMeasurementCommand(tankMeasurementDto, deviceId));
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
                var completedTask = await Task.WhenAny(commandTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    // Database operation timed out - still ACK to prevent infinite retry
                    _logger.LogError("Database timeout processing tank measurement for device {DeviceId}, tank {TankId}",
                        deviceId, tankMeasurementDto.Tank);

                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK"; // ACK so device advances

                    return responsePacket;
                }

                var result = await commandTask;

                // CRITICAL: Always ACK with "OK" to the device, even on server-side failures.
                // Per protocol spec (section 184): the device retries indefinitely on error responses,
                // and sending Error:true causes the device to disconnect/reconnect in a loop.
                // Server-side issues (validation, DB errors) should be logged but not block the device queue.
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";

                if (!result.IsSuccess)
                {
                    _logger.LogWarning("Server-side processing issue for device {DeviceId}, tank {TankId}: {Message} (ACK still sent to device)",
                        deviceId, packet.Data?.ToObject<TankMeasurementDto>()?.Tank, result.Message);
                }

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Successfully processed tank measurement for device {DeviceId}, tank {TankId}, measurement at {DateTime}",
                        deviceId, tankMeasurementDto.Tank, tankMeasurementDto.DateTime);
                }
                else
                {
                    _logger.LogWarning("Failed to process tank measurement for device {DeviceId}, tank {TankId}: {Message}",
                        deviceId, tankMeasurementDto.Tank, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tank measurement packet for device {DeviceId}", deviceId);
                // CRITICAL: Still ACK with OK - never block device queue due to server errors
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";
                return responsePacket;
            }
        }

        //Cursor: Enrich tank measurement with device and context information
        private async Task EnrichTankMeasurementWithContext(string deviceId, TankMeasurementDto measurement, int packetId)
        {
            try
            {
                //Cursor: Set device context
                if (string.IsNullOrEmpty(measurement.PtsId))
                {
                    measurement.PtsId = deviceId;
                }

                if (measurement.PacketId <= 0)
                {
                    measurement.PacketId = packetId;
                }

                //Cursor: Log tank measurement context
                _logger.LogInformation("Enriched tank measurement: DeviceId={DeviceId}, Tank={Tank}, Status={Status}, ProductVolume={ProductVolume}",
                    deviceId, measurement.Tank, measurement.Status, measurement.ProductVolume);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enriching tank measurement context for device {DeviceId}, tank {Tank}",
                    deviceId, measurement.Tank);
            }
        }
    }
}