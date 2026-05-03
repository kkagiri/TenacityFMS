/**
 * File:          PumpTransactionReceivedHandler.cs
 * Purpose:       Consumes canonical fueling pump transaction notifications and delegates
 *                persistence to the existing pump transaction command.
 * Dependencies:  MediatR, FMS.Devices.Abstractions, PTS pump transaction command
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Handle(): Maps PumpTransactionMessage to PumpTransactionDto and sends CreatePumpTransactionCommand.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.PumpTransactionCommand;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Devices.Fueling.PumpTransactions.Notifications;

public sealed class PumpTransactionReceivedHandler : INotificationHandler<PumpTransactionReceivedNotification>
{
    private readonly IMediator _mediator;
    private readonly ILogger<PumpTransactionReceivedHandler> _logger;

    public PumpTransactionReceivedHandler(
        IMediator mediator,
        ILogger<PumpTransactionReceivedHandler> logger)
    {
        _mediator = mediator;
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
}
