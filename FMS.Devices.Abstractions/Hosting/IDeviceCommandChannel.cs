/*
 * File:          IDeviceCommandChannel.cs
 * Purpose:       Abstraction over outbound device-command channels (Redis, RabbitMQ, SignalR).
 *                Implemented per-provider; consumed by FMS.Application/Features/Devices.
 * Dependencies:  DeviceCommand
 * Last Modified: 2026-04-29
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Abstractions.Hosting;

/// <summary>
/// Sends a typed <see cref="DeviceCommand{TPayload}"/> to a device through the provider's
/// preferred transport.
/// </summary>
public interface IDeviceCommandChannel
{
    string ProviderName { get; }

    Task<DeviceCommandResult> SendAsync<TPayload>(
        DeviceCommand<TPayload> command,
        CancellationToken cancellationToken = default)
        where TPayload : class;
}
