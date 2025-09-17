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

namespace FMS.Application.Handlers {
    [PacketType ("UploadTankMeasurement")]
    public class UploadTankMeasurementHandler : IPacketHandler {
        private readonly ILogger<UploadTankMeasurementHandler> _logger;
        private readonly IMediator _mediator;

        public UploadTankMeasurementHandler (
            ILogger<UploadTankMeasurementHandler> logger,
            IMediator mediator) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
            _mediator = mediator ??
                throw new ArgumentNullException (nameof (mediator));
        }

        public string PacketType => "UploadTankMeasurement";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            var responsePacket = new Packet {
                Id = packet.Id,
                Type = packet.Type
            };

            try {
                if (packet.Data == null) {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Missing tank measurement data";
                    return responsePacket;
                }

                var tankMeasurementDto = packet.Data.ToObject<TankMeasurementDto> ();
                if (tankMeasurementDto == null) {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Invalid tank measurement data format";
                    return responsePacket;
                }

                //Cursor: Enrich tank measurement with device context
                await EnrichTankMeasurementWithContext (deviceId, tankMeasurementDto, packet.Id);

                var command = new CreateTankMeasurementCommand (tankMeasurementDto, deviceId);
                var result = await _mediator.Send (command);

                responsePacket.Error = !result.IsSuccess;
                responsePacket.Message = result.Message;
                responsePacket.Code = result.IsSuccess ? 200 : 500;

                if (result.IsSuccess) {
                    _logger.LogInformation ("Successfully processed tank measurement for device {DeviceId}, tank {TankId}, measurement at {DateTime}",
                        deviceId, tankMeasurementDto.Tank, tankMeasurementDto.DateTime);
                } else {
                    _logger.LogWarning ("Failed to process tank measurement for device {DeviceId}, tank {TankId}: {Message}",
                        deviceId, tankMeasurementDto.Tank, result.Message);
                }

                return responsePacket;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing tank measurement packet for device {DeviceId}", deviceId);
                responsePacket.Error = true;
                responsePacket.Code = 500;
                responsePacket.Message = "Error processing tank measurement packet";
                return responsePacket;
            }
        }

        //Cursor: Enrich tank measurement with device and context information
        private async Task EnrichTankMeasurementWithContext (string deviceId, TankMeasurementDto measurement, int packetId) {
            try {
                //Cursor: Set device context
                if (string.IsNullOrEmpty (measurement.PtsId)) {
                    measurement.PtsId = deviceId;
                }

                if (measurement.PacketId <= 0) {
                    measurement.PacketId = packetId;
                }

                //Cursor: Log tank measurement context
                _logger.LogInformation ("Enriched tank measurement: DeviceId={DeviceId}, Tank={Tank}, Status={Status}, ProductVolume={ProductVolume}",
                    deviceId, measurement.Tank, measurement.Status, measurement.ProductVolume);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error enriching tank measurement context for device {DeviceId}, tank {Tank}",
                    deviceId, measurement.Tank);
            }
        }
    }
}