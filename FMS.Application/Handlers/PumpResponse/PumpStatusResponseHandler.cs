//Cursor: Handler for PumpGetStatus response packets
using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers {
    [PacketType ("PumpGetStatusResponse")]
    public class PumpStatusResponseHandler : IPacketHandler {
        private readonly ILogger<PumpStatusResponseHandler> _logger;

        public PumpStatusResponseHandler (ILogger<PumpStatusResponseHandler> logger) {
            _logger = logger ??
                throw new ArgumentNullException (nameof (logger));
        }

        public string PacketType => "PumpGetStatusResponse";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                _logger.LogInformation ("PumpGetStatus response received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString ());

                // Parse pump status from response
                if (packet.Data is JObject responseData) {
                    var pump = responseData.Value<int?> ("Pump");
                    var statusType = responseData.Value<string> ("Type");

                    _logger.LogDebug ("Pump status - Pump: {Pump}, Type: {StatusType}",
                        pump, statusType);

                    // Log specific status details based on type
                    switch (statusType) {
                        case "PumpIdleStatus":
                            var nozzleUp = responseData.Value<int?> ("NozzleUp");
                            var lastTransaction = responseData.Value<int?> ("LastTransaction");
                            _logger.LogDebug ("Idle status - NozzleUp: {NozzleUp}, LastTransaction: {LastTransaction}",
                                nozzleUp, lastTransaction);
                            break;

                        case "PumpFillingStatus":
                            var volume = responseData.Value<decimal?> ("Volume");
                            var amount = responseData.Value<decimal?> ("Amount");
                            var transaction = responseData.Value<int?> ("Transaction");
                            _logger.LogDebug ("Filling status - Volume: {Volume}L, Amount: ${Amount}, Transaction: {Transaction}",
                                volume, amount, transaction);
                            break;

                        case "PumpEndOfTransactionStatus":
                            var eotVolume = responseData.Value<decimal?> ("Volume");
                            var eotAmount = responseData.Value<decimal?> ("Amount");
                            var eotTransaction = responseData.Value<int?> ("Transaction");
                            _logger.LogDebug ("EndOfTransaction status - Volume: {Volume}L, Amount: ${Amount}, Transaction: {Transaction}",
                                eotVolume, eotAmount, eotTransaction);
                            break;

                        case "PumpOfflineStatus":
                            _logger.LogDebug ("Pump {Pump} is offline", pump);
                            break;
                    }
                }

                // For response packets, we typically don't send a response back
                // The correlation mechanism in PTSDeviceConnection will handle matching this to the original request
                return null;
            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing PumpGetStatus response packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet {
                    Id = packet.Id,
                        Type = packet.Type,
                        Error = true,
                        Code = 500,
                        Message = "Internal error processing pump status response"
                };
            }
        }
    }
}