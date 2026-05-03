/**
 * File:          UploadStatusReceivedHandler.cs
 * Purpose:       Consumes canonical fueling upload-status notifications during the
 *                transitional mapper cutover.
 * Dependencies:  MediatR, FMS.Devices.Abstractions
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - Handle(): Logs canonical upload-status heartbeat receipt.
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Devices.Fueling.UploadStatus.Notifications;

public sealed class UploadStatusReceivedHandler : INotificationHandler<UploadStatusReceivedNotification>
{
    private readonly ILogger<UploadStatusReceivedHandler> _logger;

    public UploadStatusReceivedHandler(ILogger<UploadStatusReceivedHandler> logger)
    {
        _logger = logger;
    }

    public Task Handle(UploadStatusReceivedNotification notification, CancellationToken cancellationToken)
    {
        var message = notification.Message;
        var payload = message.Payload;

        _logger.LogInformation("Canonical upload status received for provider {Provider}, device {DeviceId}, status {StatusCode}, observed {ObservedAtUtc}.",
            message.ProviderName, message.ExternalDeviceId, payload.StatusCode, payload.ObservedAtUtc);

        return Task.CompletedTask;
    }
}
