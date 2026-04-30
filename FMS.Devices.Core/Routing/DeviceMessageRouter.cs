/*
 * File:          DeviceMessageRouter.cs
 * Purpose:       Publishes canonical DeviceMessage envelopes onto the MediatR notification
 *                pipeline so business handlers in FMS.Application can subscribe by message
 *                type without coupling to the originating provider.
 * Dependencies:  MediatR, FMS.Devices.Abstractions
 * Last Modified: 2026-04-29
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using FMS.Devices.Abstractions.Fueling.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Devices.Core.Routing;

/// <summary>
/// Single entry point for provider plugins to publish canonical messages into the system.
/// Implementations translate to MediatR notifications.
/// </summary>
public interface IDeviceMessageRouter
{
    Task PublishPumpTransactionAsync(DeviceMessage<PumpTransactionMessage> message, CancellationToken cancellationToken = default);
    Task PublishTankMeasurementAsync(DeviceMessage<TankMeasurementMessage> message, CancellationToken cancellationToken = default);
    Task PublishUploadStatusAsync(DeviceMessage<UploadStatusMessage> message, CancellationToken cancellationToken = default);
    Task PublishAlertRecordAsync(DeviceMessage<AlertRecordMessage> message, CancellationToken cancellationToken = default);
}

public sealed class DeviceMessageRouter : IDeviceMessageRouter
{
    private readonly IPublisher _publisher;
    private readonly ILogger<DeviceMessageRouter> _logger;

    public DeviceMessageRouter(IPublisher publisher, ILogger<DeviceMessageRouter> logger)
    {
        _publisher = publisher;
        _logger = logger;
    }

    public Task PublishPumpTransactionAsync(DeviceMessage<PumpTransactionMessage> message, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Routing pump txn from {Provider}/{Device} tenant {Tenant}.",
            message.ProviderName, message.ExternalDeviceId, message.TenantId);
        return _publisher.Publish(new PumpTransactionReceivedNotification(message), cancellationToken);
    }

    public Task PublishTankMeasurementAsync(DeviceMessage<TankMeasurementMessage> message, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Routing tank measurement from {Provider}/{Device} tenant {Tenant}.",
            message.ProviderName, message.ExternalDeviceId, message.TenantId);
        return _publisher.Publish(new TankMeasurementReceivedNotification(message), cancellationToken);
    }

    public Task PublishUploadStatusAsync(DeviceMessage<UploadStatusMessage> message, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Routing upload status from {Provider}/{Device} tenant {Tenant}.",
            message.ProviderName, message.ExternalDeviceId, message.TenantId);
        return _publisher.Publish(new UploadStatusReceivedNotification(message), cancellationToken);
    }

    public Task PublishAlertRecordAsync(DeviceMessage<AlertRecordMessage> message, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Routing alert record from {Provider}/{Device} tenant {Tenant}.",
            message.ProviderName, message.ExternalDeviceId, message.TenantId);
        return _publisher.Publish(new AlertRecordReceivedNotification(message), cancellationToken);
    }
}
