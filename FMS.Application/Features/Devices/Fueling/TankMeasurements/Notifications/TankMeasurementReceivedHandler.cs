/**
 * File:          TankMeasurementReceivedHandler.cs
 * Purpose:       Consumes canonical fueling tank measurement notifications and delegates
 *                persistence to the existing tank measurement command.
 * Dependencies:  MediatR, FMS.Devices.Abstractions, PTS tank measurement command
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Handle(): Maps TankMeasurementMessage to TankMeasurementDto and sends CreateTankMeasurementCommand.
 */
using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.PTSCommands.TankMeasurementsCommand;
using FMS.Application.ModelsDTOs.PTS;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Devices.Fueling.TankMeasurements.Notifications;

public sealed class TankMeasurementReceivedHandler : INotificationHandler<TankMeasurementReceivedNotification>
{
    private readonly IMediator _mediator;
    private readonly ILogger<TankMeasurementReceivedHandler> _logger;

    public TankMeasurementReceivedHandler(
        IMediator mediator,
        ILogger<TankMeasurementReceivedHandler> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Handle(TankMeasurementReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = message.Payload;

        var dto = new TankMeasurementDto
        {
            PtsId = message.ExternalDeviceId,
            DateTime = payload.ReadingAtUtc,
            Tank = payload.TankNumber,
            Status = "Canonical",
            FuelGradeName = payload.FuelGrade,
            ProductVolume = ToDouble(payload.VolumeLitres),
            ProductUllage = ToDouble(payload.UllageLitres),
            ProductHeight = ToDouble(payload.ProductLevelMm),
            WaterHeight = ToDouble(payload.WaterLevelMm),
            Temperature = ToDouble(payload.TemperatureCelsius),
            ProductDensity = ToDouble(payload.DensityKgPerM3),
            ConfigurationId = message.Headers != null && message.Headers.TryGetValue("configurationId", out var configurationId)
                ? configurationId
                : string.Empty
        };

        var result = await _mediator.Send(new CreateTankMeasurementCommand(dto, message.ExternalDeviceId), cancellationToken);
        if (result.IsSuccess)
        {
            _logger.LogInformation("Canonical tank measurement processed for provider {Provider}, device {DeviceId}, tank {TankNumber}.",
                message.ProviderName, message.ExternalDeviceId, payload.TankNumber);
            return;
        }

        _logger.LogWarning("Canonical tank measurement failed for provider {Provider}, device {DeviceId}, tank {TankNumber}: {Message}",
            message.ProviderName, message.ExternalDeviceId, payload.TankNumber, result.Message);
    }

    private static double? ToDouble(decimal? value) =>
        value.HasValue ? Convert.ToDouble(value.Value) : null;
}
