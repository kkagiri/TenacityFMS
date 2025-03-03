using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Communication.SignalR;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
namespace FMS.Application.Handlers.PacketHandlers.Tags
{


    [PacketType("ReaderTag")]
    public class ReaderTagHandler : IPacketHandler
    {
        public string PacketType => "ReaderTag"; //reduntant as it is already defined in the attribute

        private readonly ILogger<ReaderTagHandler> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;

        public ReaderTagHandler(ILogger<ReaderTagHandler> logger, IHubContext<FrontEndHub> hubContext)
        {
            _logger = logger;
            _hubContext = hubContext;
        }


        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            try
            {
                var data = packet.Data;
                var tagId = data["Tag"]?.ToString();
                var readerId = data["Reader"]?.ToObject<int>() ?? 0;


                if (string.IsNullOrEmpty(tagId))
                {
                    return new Packet
                    {
                        Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 400,
                        Message = "Invalid or missing tag data"
                    };
                }
                _logger.LogInformation("Received TagId '{TagId}' from ReaderId {ReaderId} on device {DeviceId}.", tagId, readerId, deviceId);

                var enrichedData = new
                {
                    DeviceId = deviceId,
                    ReaderId = readerId,
                    TagId = tagId,
                    Timestamp = DateTime.UtcNow
                };


                //broadcast the tag data to the frontend
                await _hubContext.Clients.All.SendAsync("ReceivedTag", enrichedData, CancellationToken.None);


                return new Packet
                {
                    Id = packet.Id,
                    Type = packet.Type,
                    Error = false,
                    Code = 200,
                    Message = "Tag processed successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing tag data from device {DeviceId}", deviceId);
                return new Packet
                {
                    Id = packet.Id,
                    Type = packet.Type,
                    Error = true,
                    Code = 500,
                    Message = "Error processing tag data"
                };


            }
        }
    }
}

