/**
 * File:          UploadStatusReceivedHandler.cs
 * Purpose:       Consumes canonical fueling upload-status notifications during the
 *                transitional mapper cutover.
 * Dependencies:  MediatR, FMS.Devices.Abstractions
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Handle(): Runs the existing rich UploadStatus pipeline from canonical status payloads.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.PTSCommand.UploadStatusCommands;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using PtsUploadStatus = FMS.Domain.Entities.PTS.PTSStatus.UploadStatus;

namespace FMS.Application.Features.Devices.Fueling.UploadStatus.Notifications;

public sealed class UploadStatusReceivedHandler : INotificationHandler<UploadStatusReceivedNotification>
{
    private readonly IMediator _mediator;
    private readonly ILogger<UploadStatusReceivedHandler> _logger;

    public UploadStatusReceivedHandler(
        IMediator mediator,
        ILogger<UploadStatusReceivedHandler> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Handle(UploadStatusReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = message.Payload;

        if (string.IsNullOrWhiteSpace(payload.RawPayloadJson))
        {
            _logger.LogWarning("Canonical upload status for provider {Provider}, device {DeviceId} has no raw payload; rich UploadStatus processing skipped.",
                message.ProviderName, message.ExternalDeviceId);
            return;
        }

        var uploadStatus = JsonConvert.DeserializeObject<PtsUploadStatus>(payload.RawPayloadJson);
        if (uploadStatus == null)
        {
            _logger.LogWarning("Canonical upload status for provider {Provider}, device {DeviceId} could not deserialize raw payload.",
                message.ProviderName, message.ExternalDeviceId);
            return;
        }

        var result = await _mediator.Send(new UploadStatusCommand
        {
            DeviceId = message.ExternalDeviceId,
            UploadStatus = uploadStatus
        }, cancellationToken);

        if (result.Success)
        {
            _logger.LogInformation(
                "Canonical upload status processed for provider {Provider}, device {DeviceId}, observed {ObservedAtUtc}, pumps {PumpCount}, probes {ProbeCount}.",
                message.ProviderName,
                message.ExternalDeviceId,
                payload.ObservedAtUtc,
                payload.PumpStatusCount,
                payload.ProbeStatusCount);
            return;
        }

        _logger.LogWarning("Canonical upload status failed for provider {Provider}, device {DeviceId}: {Message}",
            message.ProviderName, message.ExternalDeviceId, result.Message);
    }
}
