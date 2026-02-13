using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Features.ATG;
using FMS.Application.Features.PTS.Services; // For TransactionContext
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
    /// <summary>
    ///   important: Do not use this to process pump transactions from redis , it is sent from device.
    /// </summary>
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
                    _logger.LogWarning("Missing transaction data from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                var transactionDto = packet.Data.ToObject<PumpTransactionDto>();
                if (transactionDto == null)
                {
                    _logger.LogWarning("Invalid transaction data format from device {DeviceId}, packet {PacketId}. ACKing to advance device queue.",
                        deviceId, packet.Id);
                    responsePacket.Error = null;
                    responsePacket.Code = null;
                    responsePacket.Message = "OK";
                    return responsePacket;
                }

                if (string.IsNullOrEmpty(transactionDto.PtsId))
                    transactionDto.PtsId = deviceId;

                if (transactionDto.PacketId <= 0)
                    transactionDto.PacketId = packet.Id;

                // **CRITICAL FIX**: Enrich transaction with Redis context BEFORE saving
                // This ensures Odometer, TankId, VehicleId, Tag etc. from authorization are included
                // Use timeout to prevent Redis delays from blocking device acknowledgment
                try
                {
                    var enrichTask = EnrichTransactionWithContextFromRedis(deviceId, transactionDto);
                    var enrichTimeout = Task.Delay(TimeSpan.FromSeconds(2));
                    var completedEnrichTask = await Task.WhenAny(enrichTask, enrichTimeout);

                    if (completedEnrichTask == enrichTimeout)
                    {
                        _logger.LogWarning("Redis enrichment timed out for device {DeviceId}, transaction {TransactionId}. Proceeding without context data.",
                            deviceId, transactionDto.Transaction);
                    }
                    else
                    {
                        await enrichTask; // Ensure any exceptions are observed
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Non-critical: Failed to enrich transaction from Redis for device {DeviceId}. Odometer and other context may be missing.", deviceId);
                }

                // Process transaction with timeout protection
                var commandTask = _mediator.Send(new CreatePumpTransactionCommand(transactionDto));
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
                var completedTask = await Task.WhenAny(commandTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    // Database operation timed out - acknowledge receipt but log error
                    _logger.LogError("Database timeout processing pump transaction for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                        deviceId, transactionDto.Pump, transactionDto.Transaction);

                    responsePacket.Error = null; // ACK so device advances
                    responsePacket.Message = "OK";
                    responsePacket.Code = null;

                    return responsePacket;
                }

                var result = await commandTask;
                // ALWAYS return OK — never block device queue due to server-side issues
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";

                if (result.Success)
                {
                    _logger.LogInformation("Successfully processed pump transaction for device {DeviceId}, pump {PumpId}, transaction {TransactionId}",
                        deviceId, transactionDto.Pump, transactionDto.Transaction);
                }
                else
                {
                    _logger.LogWarning("Failed to process pump transaction for device {DeviceId}, pump {PumpId}: {Message}. ACKing to advance device queue.",
                        deviceId, transactionDto.Pump, result.Message);
                }

                return responsePacket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pump transaction packet for device {DeviceId}. ACKing to advance device queue.", deviceId);
                // NEVER return Error:true — it causes infinite device retry per protocol spec
                responsePacket.Error = null;
                responsePacket.Code = null;
                responsePacket.Message = "OK";
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
                        // Enrich from Redis context only if transaction doesn't already have the value
                        transaction.TankId = transaction.TankId ?? context.TankId;
                        transaction.VehicleId = transaction.VehicleId ?? context.VehicleId;
                        transaction.Odometer = transaction.Odometer ?? context.Odometer;
                        transaction.Tag = string.IsNullOrEmpty(transaction.Tag) ? context.Tag : transaction.Tag;

                        // UserId is now string? (GUID from ASP.NET Identity)
                        if (string.IsNullOrEmpty(transaction.UserId) && !string.IsNullOrEmpty(context.UserId))
                        {
                            transaction.UserId = context.UserId;
                        }

                        transaction.ConfigurationId = string.IsNullOrEmpty(transaction.ConfigurationId) ? context.ConfigurationId : transaction.ConfigurationId;
                        transaction.FuelGradeId = transaction.FuelGradeId ?? context.FuelGradeId;
                        transaction.FuelGradeName = string.IsNullOrEmpty(transaction.FuelGradeName) ? context.FuelGradeName : transaction.FuelGradeName;

                        // Enrich Nozzle if missing (device may not always include it)
                        if (transaction.Nozzle <= 0 && context.Nozzle.HasValue)
                        {
                            transaction.Nozzle = context.Nozzle.Value;
                        }

                        _logger.LogInformation("Enriched transaction with context from Redis: TankId={TankId}, VehicleId={VehicleId}, Odometer={Odometer}, Tag={Tag}, Nozzle={Nozzle}, FuelGradeId={FuelGradeId}",
                            context.TankId, context.VehicleId, context.Odometer, context.Tag, context.Nozzle, context.FuelGradeId);

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
}