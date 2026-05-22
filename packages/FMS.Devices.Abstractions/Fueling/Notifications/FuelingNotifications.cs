/*
 * File:          FuelingNotifications.cs
 * Purpose:       Strongly-typed MediatR INotification wrappers around canonical fueling messages.
 *                DeviceMessageRouter publishes these; consumers in
 *                FMS.Application/Features/Devices/Fueling subscribe via INotificationHandler<T>.
 * Dependencies:  MediatR, FMS.Devices.Abstractions.Common, FMS.Devices.Abstractions.Fueling.Messages
 * Last Modified: 2026-05-10
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;
using MediatR;

namespace FMS.Devices.Abstractions.Fueling.Notifications;

public sealed record PumpTransactionReceivedNotification(DeviceMessage<PumpTransactionMessage> Message)
    : INotification;

public sealed record TankMeasurementReceivedNotification(DeviceMessage<TankMeasurementMessage> Message)
    : INotification;

public sealed record InTankDeliveryReceivedNotification(DeviceMessage<InTankDeliveryMessage> Message)
    : INotification;

public sealed record UploadStatusReceivedNotification(DeviceMessage<UploadStatusMessage> Message)
    : INotification;

public sealed record AlertRecordReceivedNotification(DeviceMessage<AlertRecordMessage> Message)
    : INotification;

public sealed record PumpResponseReceivedNotification(DeviceMessage<PumpResponseMessage> Message)
    : INotification;
