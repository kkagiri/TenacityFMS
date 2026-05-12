//Cursor: Handler for PumpCloseTransaction response packets
using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers {
    [PacketType ("PumpCloseTransactionResponse")]
    public class PumpCloseTransactionResponseHandler : IPacketHandler {
        private readonly ILogger<PumpCloseTransactionResponseHandler> _logger;

        public PumpCloseTransactionResponseHandler (ILogger<PumpCloseTransactionResponseHandler> logger) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public string PacketType => "PumpCloseTransactionResponse";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                _logger.LogInformation ("PumpCloseTransaction response received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString ());

                // Device returned an error for this packet. Log and return null — no further processing.
                if (packet.Error == true) {
                    _logger.LogWarning ("PumpCloseTransactionResponse error from device {DeviceId}, packet {PacketId}: Code={Code}, Message={Message}",
                        deviceId, packet.Id, packet.Code, packet.Message);
                    return null;
                }

                // Parse transaction closure confirmation from response
                if (packet.Data is JObject responseData) {
                    var pump = responseData.Value<int?> ("Pump");
                    var transaction = responseData.Value<int?> ("Transaction");
                    var success = responseData.Value<bool?> ("Success") ?? true;

                    if (success) {
                        _logger.LogInformation ("Transaction {Transaction} successfully closed for pump {Pump} on device {DeviceId}",
                            transaction, pump, deviceId);
                    } else {
                        var errorMessage = responseData.Value<string> ("Message") ?? "Unknown error";
                        _logger.LogWarning ("Failed to close transaction {Transaction} for pump {Pump} on device {DeviceId}: {Error}",
                            transaction, pump, deviceId, errorMessage);
                    }
                }

                // For response packets, we typically don't send a response back
                // The correlation mechanism in PTSDeviceConnection will handle matching this to the original request
                return null;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing PumpCloseTransaction response packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet {
                    Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Internal error processing transaction closure response"
                };
            }
        }
    }
}