using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace FMS.Application.Handlers.PumpResponse
{
    /// <summary>
    /// Handles PumpCloseTransaction packets sent by the device.
    /// These are typically device-side error responses (e.g. JSONPTS_ERROR_COULD_NOT_GET_PUMP_NUMBER)
    /// indicating the device could not process a close transaction command.
    /// </summary>
    [PacketType("PumpCloseTransaction")]
    public class PumpCloseTransactionHandler : IPacketHandler
    {
        private readonly ILogger<PumpCloseTransactionHandler> _logger;

        public PumpCloseTransactionHandler(ILogger<PumpCloseTransactionHandler> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public string PacketType => "PumpCloseTransaction";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            try
            {
                if (packet.Error == true)
                {
                    _logger.LogWarning(
                        "PumpCloseTransaction error from device {DeviceId}, packet {PacketId}: Code={Code}, Message={Message}",
                        deviceId, packet.Id, packet.Code, packet.Message);
                    return null;
                }

                // Non-error PumpCloseTransaction — log the data for diagnostics
                if (packet.Data is JObject data)
                {
                    var pump = data.Value<int?>("Pump");
                    var transaction = data.Value<int?>("Transaction");
                    _logger.LogInformation(
                        "PumpCloseTransaction received for device {DeviceId}, pump {Pump}, transaction {Transaction}",
                        deviceId, pump, transaction);
                }
                else
                {
                    _logger.LogInformation(
                        "PumpCloseTransaction received for device {DeviceId}, packet {PacketId} (no data)",
                        deviceId, packet.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error processing PumpCloseTransaction packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                return new Packet
                {
                    Id = packet.Id,
                    Type = packet.Type,
                    Error = true,
                    Code = 500,
                    Message = "Internal error processing PumpCloseTransaction"
                };
            }
        }
    }
}
