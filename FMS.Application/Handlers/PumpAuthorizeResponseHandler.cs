using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers {
    [PacketType ("PumpAuthorizeConfirmation")]
    public class PumpAuthorizeConfirmationHandler : IPacketHandler {
        private readonly ILogger<PumpAuthorizeConfirmationHandler> _logger;

        public PumpAuthorizeConfirmationHandler (ILogger<PumpAuthorizeConfirmationHandler> logger) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public string PacketType => "PumpAuthorizeConfirmation";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                //Cursor: Handle PumpAuthorizeConfirmation response packets
                _logger.LogInformation ("Pump authorization confirmation received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString ());

                // For response packets, we typically don't send a response back
                // The correlation mechanism in PTSDeviceConnection will handle matching this to the original request
                return null;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing PumpAuthorizeConfirmation packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet {
                    Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Internal error processing pump authorize confirmation"
                };
            }
        }
    }
}