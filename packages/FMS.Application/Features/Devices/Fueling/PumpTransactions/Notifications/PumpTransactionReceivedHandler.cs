/**
 * File:          PumpTransactionReceivedHandler.cs
 * Purpose:       Consumes canonical fueling pump transaction notifications and delegates
 *                persistence to the existing pump transaction command.
 * Dependencies:  MediatR, FMS.Devices.Abstractions, PTS pump transaction command
 * Last Modified: 2026-05-22
 *
 * Key Functions:
 * - Handle(): Maps PumpTransactionMessage to PumpTransactionDto and sends CreatePumpTransactionCommand.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.Features.Devices.Fueling.UploadStatus.Services;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Devices.Fueling.PumpTransactions.Notifications;

public sealed class PumpTransactionReceivedHandler : INotificationHandler<PumpTransactionReceivedNotification>
{
    private readonly IMediator _mediator;
    private readonly ITransactionContextService _transactionContextService;
    private readonly ILogger<PumpTransactionReceivedHandler> _logger;

    public PumpTransactionReceivedHandler(
        IMediator mediator,
        ITransactionContextService transactionContextService,
        ILogger<PumpTransactionReceivedHandler> logger)
    {
        _mediator = mediator;
        _transactionContextService = transactionContextService;
        _logger = logger;
    }

    public async Task Handle(PumpTransactionReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = message.Payload;

        var dto = new PumpTransactionDto
        {
            PtsId = message.ExternalDeviceId,
            DateTimeStart = payload.StartedAtUtc,
            DateTime = payload.EndedAtUtc,
            Pump = payload.PumpNumber,
            Nozzle = payload.NozzleNumber,
            FuelGradeName = payload.FuelGrade,
            Transaction = TryParseInt(payload.ExternalTransactionId),
            Volume = payload.Volume,
            Amount = payload.Amount,
            Price = payload.UnitPrice,
            Tag = payload.CardCode,
            UserId = payload.DriverCode,
            VehicleName = payload.VehicleCode,
            Odometer = payload.OdometerReading
        };

        await EnrichWithTransactionContextAsync(message.ExternalDeviceId, dto, cancellationToken);

        var result = await _mediator.Send(new CreatePumpTransactionCommand(dto), cancellationToken);
        if (result.Success)
        {
            _logger.LogInformation("Canonical pump transaction processed for provider {Provider}, device {DeviceId}, transaction {TransactionId}.",
                message.ProviderName, message.ExternalDeviceId, payload.ExternalTransactionId);
            return;
        }

        _logger.LogWarning("Canonical pump transaction failed for provider {Provider}, device {DeviceId}, transaction {TransactionId}: {Message}",
            message.ProviderName, message.ExternalDeviceId, payload.ExternalTransactionId, result.Message);
    }

    private static int TryParseInt(string value) =>
        int.TryParse(value, out var parsed) ? parsed : 0;

    private async Task EnrichWithTransactionContextAsync(
        string deviceId,
        PumpTransactionDto transaction,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(deviceId) || transaction.Transaction <= 0)
        {
            _logger.LogWarning("Cannot enrich canonical transaction: deviceId or transactionId missing.");
            return;
        }

        try
        {
            var context = await _transactionContextService.GetTransactionContextAsync(deviceId, transaction.Transaction);
            if (context == null)
            {
                _logger.LogDebug("No Redis transaction context found for canonical transaction {DeviceId}:{TransactionId}.",
                    deviceId, transaction.Transaction);
                return;
            }

            transaction.TankId ??= context.TankId;
            transaction.VehicleId ??= context.VehicleId;
            transaction.Odometer ??= context.Odometer;
            transaction.FuelLevelBefore ??= context.FuelLevelBefore;
            transaction.Tag = string.IsNullOrEmpty(transaction.Tag) ? context.Tag : transaction.Tag;
            transaction.UserId = string.IsNullOrEmpty(transaction.UserId) ? context.UserId : transaction.UserId;
            transaction.ConfigurationId = string.IsNullOrEmpty(transaction.ConfigurationId) ? context.ConfigurationId : transaction.ConfigurationId;
            transaction.FuelGradeId ??= context.FuelGradeId;
            transaction.FuelGradeName = string.IsNullOrEmpty(transaction.FuelGradeName) ? context.FuelGradeName : transaction.FuelGradeName;

            if (transaction.Nozzle <= 0 && context.Nozzle.HasValue)
            {
                transaction.Nozzle = context.Nozzle.Value;
            }

            await _transactionContextService.RemoveTransactionContextAsync(deviceId, transaction.Transaction);

            _logger.LogInformation(
                "Enriched canonical pump transaction from Redis context: Device={DeviceId}, Transaction={TransactionId}, TankId={TankId}, VehicleId={VehicleId}, Odometer={Odometer}, Tag={Tag}, Nozzle={Nozzle}, FuelGradeId={FuelGradeId}.",
                deviceId,
                transaction.Transaction,
                transaction.TankId,
                transaction.VehicleId,
                transaction.Odometer,
                transaction.Tag,
                transaction.Nozzle,
                transaction.FuelGradeId);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Non-critical: failed to enrich canonical pump transaction from Redis for device {DeviceId}.",
                deviceId);
        }
    }
}
