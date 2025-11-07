using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Features.ATG;
using FMS.Application.Handlers.Interface;
using FMS.Domain.Entities;
using FMS.Domain.Entities.PTS;
using FMS.Domain.PTSCommon;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using StackExchange.Redis;

namespace FMS.Application.Handlers
{
    [PacketType("UploadPumpTransaction")]
    public class UploadPumpTransactionHandler : IPacketHandler
    {

        private readonly ILogger<UploadPumpTransactionHandler> _logger;
        private readonly IMediator _mediator;
        private readonly IDatabase _redisDb;

        public UploadPumpTransactionHandler(
            ILogger<UploadPumpTransactionHandler> logger,
            IMediator mediator,
            IConnectionMultiplexer redisConnection)
        {
            _logger = logger ??
                throw new ArgumentNullException(nameof(logger));
            _mediator = mediator ??
                throw new ArgumentNullException(nameof(mediator));
            _redisDb = redisConnection?.GetDatabase() ??
                throw new ArgumentNullException(nameof(redisConnection));
        }

        public string PacketType => "UploadPumpTransaction";

        public async Task<Packet> HandlePacketAsync(string deviceId, Packet packet)
        {
            var responsePacket = new Packet
            {
                Id = packet.Id,
                Type = packet.Type
            };

            try
            {
                if (packet.Data == null)
                {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Missing transaction data";
                    return responsePacket;
                }

                var transactionDto = packet.Data.ToObject<PumpTransactionDto>();
                if (transactionDto == null)
                {
                    responsePacket.Error = true;
                    responsePacket.Code = 400;
                    responsePacket.Message = "Invalid transaction data format";
                    return responsePacket;
                }

                if (string.IsNullOrEmpty(transactionDto.PtsId))
                    transactionDto.PtsId = deviceId;

                if (transactionDto.PacketId <= 0)
                    transactionDto.PacketId = packet.Id;

                // IMPROVEMENT: Fire-and-forget Redis enrichment - don't let it block the response
                // Use Task.Run to prevent Redis delays from blocking device acknowledgment
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await EnrichTransactionWithContextFromRedis(deviceId, transactionDto);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Non-critical: Failed to enrich transaction from Redis for device {DeviceId}", deviceId);
                    }
                });

                // Process transaction with timeout protection
                var commandTask = _mediator.Send(new CreatePumpTransactionCommand(transactionDto));
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
                var completedTask = await Task.WhenAny(commandTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    // Database operation timed out - acknowledge receipt but log error
                    _logger.LogError("Database timeout processing pump transaction for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                        deviceId, transactionDto.Pump, transactionDto.Transaction);

                    responsePacket.Error = false; // Still acknowledge to device to prevent retry storm
                    responsePacket.Message = "Transaction queued for processing";
                    responsePacket.Code = 202; // Accepted (will process later)

                    return responsePacket;
                }

                var result = await commandTask;
                responsePacket.Error = !result.Success;
                responsePacket.Message = result.Message;
                responsePacket.Code = result.Success ? 200 : 500;

                if (result.Success)
                {
                    _logger.LogInformation("Successfully processed pump transaction for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                        deviceId, transactionDto.Pump, transactionDto.Transaction);
                }
                else
                {
                    _logger.LogWarning("Failed to process pump transaction for device {DeviceId}, pump {PumpId}: {Message}",
                        deviceId, transactionDto.Pump, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pump transaction packet for device {DeviceId}", deviceId);
                responsePacket.Error = true;
                responsePacket.Code = 500;
                responsePacket.Message = "Error processing pump transaction packet";
                return responsePacket;
            }
        }

        private async Task EnrichTransactionWithContextFromRedis(string deviceId, PumpTransactionDto transaction)
        {
            try
            {
                if (string.IsNullOrEmpty(deviceId) || transaction.Transaction <= 0)
                {
                    _logger.LogWarning("Cannot retrieve transaction context: deviceId or transactionId missing");
                    return;
                }

                var redisKey = $"device:{deviceId}:transaction:{transaction.Transaction}";
                var contextJson = await _redisDb.StringGetAsync(redisKey);

                if (contextJson.IsNullOrEmpty)
                {
                    _logger.LogInformation("No transaction context found in Redis for device {DeviceId}, transaction {TransactionId}",
                        deviceId, transaction.Transaction);
                    return;
                }

                try
                {
                    var context = JsonSerializer.Deserialize<TransactionContext>(contextJson);

                    if (context != null)
                    {
                        transaction.TankId = context.TankId;
                        transaction.VehicleId = context.VehicleId;

                        _logger.LogInformation("Enriched transaction with context from Redis: TankId={TankId}, VehicleId={VehicleId}",
                            context.TankId, context.VehicleId);

                        await _redisDb.KeyDeleteAsync(redisKey);
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Error deserializing transaction context from Redis for device {DeviceId}, transaction {TransactionId}",
                        deviceId, transaction.Transaction);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving transaction context from Redis for device {DeviceId}, transaction {TransactionId}",
                    deviceId, transaction.Transaction);
            }
        }
    }

    internal class TransactionContext
    {
        public string DeviceId { get; set; }
        public int TransactionId { get; set; }
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public DateTime AuthorizedAt { get; set; }
    }
}