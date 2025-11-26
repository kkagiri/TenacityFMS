using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers {
    [PacketType ("PumpAuthorize")]
    public class PumpAuthorizeErrorHandler : IPacketHandler {
        private readonly ILogger<PumpAuthorizeErrorHandler> _logger;

        public PumpAuthorizeErrorHandler (ILogger<PumpAuthorizeErrorHandler> logger) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public string PacketType => "PumpAuthorize";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                //Cursor: Handle PumpAuthorize error response packets
                if (packet.Error == true) {
                    _logger.LogWarning ("Pump authorization failed for device {DeviceId}, packet {PacketId}: Code={Code}, Message={Message}",
                        deviceId, packet.Id, packet.Code, packet.Message);
                } else {
                    _logger.LogInformation ("Pump authorization response received for device {DeviceId}, packet {PacketId}",
                        deviceId, packet.Id);
                }

                // For response packets, we typically don't send a response back
                // The correlation mechanism in PTSDeviceConnection will handle matching this to the original request
                return null;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing PumpAuthorize error packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet {
                    Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Internal error processing pump authorize error response"
                };
            }
        }
    }
}