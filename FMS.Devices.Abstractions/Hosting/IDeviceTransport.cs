/*
 * File:          IDeviceTransport.cs
 * Purpose:       Abstraction over per-vendor inbound transports (WebSocket, TCP, HTTP poll).
 *                Implemented inside provider plugins; consumed by host worker services.
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Devices.Abstractions.Hosting;

/// <summary>
/// Long-running inbound transport managed by a provider plugin.
/// </summary>
public interface IDeviceTransport
{
    string ProviderName { get; }
    Task StartAsync(CancellationToken cancellationToken);
    Task StopAsync(CancellationToken cancellationToken);
}
