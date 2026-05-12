using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using FMS.Domain.PTSCommon;
using FMS.Application.Handlers.Interface;
using FMS.Domain.Entities.PTS.PTSStatus;
using FMS.Application.Command.PTSCommand.UploadStatusCommands;

namespace FMS.Application.Handlers
{
    [PacketType("UploadStatus")]
    public class UploadStatusHandler : IPacketHandler
    {
        public string PacketType => "UploadStatus";
        private readonly ILogger<UploadStatusHandler> _logger;
        private readonly IMediator _mediator;


        public UploadStatusHandler(
            IMediator mediator,
            ILogger<UploadStatusHandler> logger
           )
        {
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            try
            {
                var originalPacketId = packet.Id;
                // Deserializes the upload status from the packet
                var uploadStatus = packet.Data?.ToObject<UploadStatus>();
                if (uploadStatus == null)
                {
                    return new Packet
                    {
                        Id = originalPacketId,
                        Type = packet.Type,
                        Error = true,
                        Code = 400,
                        Message = "Invalid or missing upload status data"
                    };
                }

                // Creates and sends command through MediatR
                var command = new UploadStatusCommand
                {
                    DeviceId = deviceId,
                    UploadStatus = uploadStatus
                };

                try
                {
                    var result = await _mediator.Send(command);
                    var responsePacket = new Packet
                    {
                        Id = originalPacketId,
                        Type = packet.Type,
                        Error = result.Success ? null : true,
                        Message = result.Success ? "OK" : result.Message
                    };
                    // Important: Checks if there's a pending command in the response
                    if (result.Success && !string.IsNullOrEmpty(result.CommandType) && result.CommandData != null)
                    {
                        responsePacket.SetRequestType = result.CommandType;
                        responsePacket.Data = Newtonsoft.Json.Linq.JObject.FromObject(result.CommandData);
                        _logger.LogInformation("Command {CommandType} created for device {DeviceId}", result.CommandType, deviceId);
                    }

                    return responsePacket;
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Database error handling upload status packet for device {DeviceId}", deviceId);
                    return new Packet
                    {
                        Id = originalPacketId,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Database error processing upload status"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling upload status packet for device {DeviceId}", deviceId);
                return new Packet
                {
                    Id = packet.Id,
                    Type = packet.Type,
                    Error = true,
                    Code = 500,
                    Message = "Error handling upload status"
                };
            }
        }
    }
}