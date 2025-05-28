//Cursor: Handler for PumpGetTransactionInfo response packets
using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers {
    [PacketType ("PumpGetTransactionInfoResponse")]
    public class PumpGetTransactionInfoResponseHandler : IPacketHandler {
        private readonly ILogger<PumpGetTransactionInfoResponseHandler> _logger;

        public PumpGetTransactionInfoResponseHandler (ILogger<PumpGetTransactionInfoResponseHandler> logger) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public string PacketType => "PumpGetTransactionInfoResponse";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                _logger.LogInformation ("PumpGetTransactionInfo response received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString ());

                // Parse transaction info from response
                if (packet.Data is JObject responseData) {
                    var pump = responseData.Value<int?> ("Pump");
                    var transaction = responseData.Value<int?> ("Transaction");
                    var volume = responseData.Value<decimal?> ("Volume");
                    var amount = responseData.Value<decimal?> ("Amount");

                    _logger.LogDebug ("Transaction info - Pump: {Pump}, Transaction: {Transaction}, Volume: {Volume}L, Amount: ${Amount}",
                        pump, transaction, volume, amount);
                }

                // For response packets, we typically don't send a response back
                // The correlation mechanism in PTSDeviceConnection will handle matching this to the original request
                return null;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing PumpGetTransactionInfo response packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet {
                    Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Internal error processing transaction info response"
                };
            }
        }
    }
}