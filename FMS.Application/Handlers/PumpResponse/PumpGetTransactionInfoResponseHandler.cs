//Cursor: Handler for PumpGetTransactionInfo response packets
using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers
{
    /// <summary>
    /// Handles PumpTransactionInformation response packets from PTS devices.
    /// This handler processes transaction data for logging and monitoring purposes.
    /// Note: Redis publishing is handled automatically by RedisPTSCommandProcessor in WindowsService
    /// using correlation IDs, so this handler doesn't need to publish to Redis.
    /// </summary>
    [PacketType("PumpTransactionInformation")]
    public class PumpGetTransactionInfoResponseHandler : IPacketHandler
    {
        private readonly ILogger<PumpGetTransactionInfoResponseHandler> _logger;

        public PumpGetTransactionInfoResponseHandler(
            ILogger<PumpGetTransactionInfoResponseHandler> logger)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
        }

        public string PacketType => "PumpTransactionInformation";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            try
            {
                _logger.LogInformation("PumpTransactionInformation response received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString());

                // Parse transaction info from response
                if (packet.Data is not JObject responseData)
                {
                    _logger.LogWarning("PumpTransactionInformation packet {PacketId} has no data", packet.Id);
                    return null;
                }

                // Extract and log key transaction details
                var pump = responseData.Value<int?>("Pump");
                var transaction = responseData.Value<int?>("Transaction");
                var state = responseData.Value<string>("State");
                var volume = responseData.Value<decimal?>("Volume");
                var amount = responseData.Value<decimal?>("Amount");
                var nozzle = responseData.Value<int?>("Nozzle");
                var fuelGradeName = responseData.Value<string>("FuelGradeName");

                _logger.LogInformation(
                    "Transaction Details - Device={DeviceId}, Pump={Pump}, Transaction={Transaction}, " +
                    "State={State}, Nozzle={Nozzle}, FuelGrade={FuelGrade}, Volume={Volume}L, Amount=${Amount}",
                    deviceId, pump, transaction, state, nozzle, fuelGradeName, volume, amount);

                // For response packets, we don't send a response back
                // The correlation mechanism in RedisPTSCommandProcessor handles matching to the original request
                // and publishes the response to pts-command-responses channel automatically
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PumpTransactionInformation response packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet
                {
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