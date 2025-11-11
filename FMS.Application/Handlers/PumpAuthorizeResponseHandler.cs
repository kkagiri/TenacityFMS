using System;
using System.Threading.Tasks;
using FMS.Application.Handlers.Interface;
using FMS.Domain.PTSCommon;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Newtonsoft.Json;

namespace FMS.Application.Handlers
{
    /// <summary>
    /// Handles PumpAuthorizeConfirmation response packets from PTS devices.
    /// This handler receives the confirmation and publishes it to Redis for
    /// the waiting CommandExecutor to process, enabling proper timeout handling.
    /// </summary>
    [PacketType("PumpAuthorizeConfirmation")]
    public class PumpAuthorizeConfirmationHandler : IPacketHandler
    {
        private readonly ILogger<PumpAuthorizeConfirmationHandler> _logger;
        private readonly IConnectionMultiplexer _redis;
        private readonly string _confirmationChannel = "pts-pump-authorize-confirmations";

        public PumpAuthorizeConfirmationHandler(
            ILogger<PumpAuthorizeConfirmationHandler> logger,
            IConnectionMultiplexer redis)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _redis = redis ??
                throw new ArgumentNullException(nameof(redis));
        }

        public string PacketType => "PumpAuthorizeConfirmation";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            try
            {
                _logger.LogInformation("Pump authorization confirmation received for device {DeviceId}, packet {PacketId}. Data: {Data}",
                    deviceId, packet.Id, packet.Data?.ToString());

                // Extract pump and transaction info from packet data
                var confirmationData = new
                {
                    DeviceId = deviceId,
                    PacketId = packet.Id,
                    PumpId = packet.Data?["Pump"]?.Value<int>(),
                    TransactionId = packet.Data?["Transaction"]?.Value<int>(),
                    Timestamp = DateTime.UtcNow,
                    RawData = packet.Data
                };

                // Publish to Redis for waiting CommandExecutor
                var subscriber = _redis.GetSubscriber();
                var message = JsonConvert.SerializeObject(confirmationData);
                await subscriber.PublishAsync(_confirmationChannel, message);

                _logger.LogInformation(
                    "Published PumpAuthorizeConfirmation to Redis: Device={DeviceId}, Pump={PumpId}, Transaction={TransactionId}",
                    deviceId, confirmationData.PumpId, confirmationData.TransactionId);

                // Also store in Redis hash for fallback retrieval (expires in 30 seconds)
                var db = _redis.GetDatabase();
                var key = $"device:{deviceId}:pump-auth-confirmation:{packet.Id}";
                await db.StringSetAsync(key, message, TimeSpan.FromSeconds(30));

                // For response packets, we don't send a response back
                // The correlation mechanism handles matching this to the original request
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PumpAuthorizeConfirmation packet {PacketId} for device {DeviceId}",
                    packet.Id, deviceId);

                // Return error response
                return new Packet
                {
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