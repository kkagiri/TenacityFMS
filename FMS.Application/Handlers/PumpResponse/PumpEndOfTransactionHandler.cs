//Cursor: Handler for PumpEndOfTransaction packets that triggers automatic completion
using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Application.Services;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers {
    [PacketType ("PumpEndOfTransactionStatus")]
    public class PumpEndOfTransactionHandler : IPacketHandler {
        private readonly IAutoTransactionCompletionService _autoCompletionService;
        private readonly ILogger<PumpEndOfTransactionHandler> _logger;

        public PumpEndOfTransactionHandler (
            IAutoTransactionCompletionService autoCompletionService,
            ILogger<PumpEndOfTransactionHandler> logger) {
            _autoCompletionService = autoCompletionService;
            _logger = logger;
        }

        public string PacketType => "PumpEndOfTransactionStatus";

        public async Task<Packet> HandlePacketAsync (string deviceId, Packet packet) {
            try {
                _logger.LogInformation ("EndOfTransaction received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString ());

                if (packet.Data is JObject statusData) {
                    var pump = statusData.Value<int?> ("Pump");
                    var transaction = statusData.Value<int?> ("Transaction");
                    var volume = statusData.Value<decimal?> ("Volume");
                    var amount = statusData.Value<decimal?> ("Amount");

                    if (!pump.HasValue || !transaction.HasValue) {
                        _logger.LogWarning ("EndOfTransaction packet missing pump or transaction data for device {DeviceId}",
                            deviceId);
                        return CreateErrorResponse (packet, "Missing pump or transaction data");
                    }

                    _logger.LogInformation ("Processing EndOfTransaction for device {DeviceId}, pump {Pump}, transaction {Transaction}, volume {Volume}L, amount ${Amount}",
                        deviceId, pump, transaction, volume, amount);

                    // **THIS IS THE KEY: Trigger automatic completion**
                    _ = Task.Run (async () => {
                        try {
                            await _autoCompletionService.ProcessEndOfTransactionAsync (
                                deviceId, pump.Value, transaction.Value, statusData);
                        } catch (Exception ex) {
                            _logger.LogError (ex, "Error in background auto-completion for {DeviceId}:{Transaction}",
                                deviceId, transaction);
                        }
                    });

                    _logger.LogDebug ("EndOfTransaction auto-completion process initiated for {DeviceId}:{Transaction}",
                        deviceId, transaction);
                }

                // Return success response - no specific response data needed
                return new Packet {
                    Id = packet.Id,
                        Type = "PumpEndOfTransactionAck",
                        Data = JObject.FromObject (new {
                            Status = "Acknowledged",
                            ProcessedAt = DateTime.UtcNow
                            })
                };

            } catch (Exception ex) {
                _logger.LogError (ex, "Error processing EndOfTransaction packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                return CreateErrorResponse (packet, "Internal error processing EndOfTransaction");
            }
        }

        private Packet CreateErrorResponse (Packet originalPacket, string errorMessage) {
            return new Packet {
                Id = originalPacket.Id,
                    Type = originalPacket.Type,
                    Error = true,
                    Code = 500,
                    Message = errorMessage
            };
        }
    }
}