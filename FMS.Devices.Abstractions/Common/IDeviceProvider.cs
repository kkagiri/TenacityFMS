/*
 * File:          IDeviceProvider.cs
 * Purpose:       Common base contract that every provider plugin (tracking, fueling, atg)
 *                implements. Carries metadata, capabilities, and lifecycle hooks.
 * Dependencies:  ProviderMetadata, ProviderCapabilities
 * Last Modified: 2026-04-29
 */
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Base contract for every device provider plugin.
/// </summary>
public interface IDeviceProvider
{
    /// <summary>Static metadata exposed to the registry and admin UI.</summary>
    ProviderMetadata Metadata { get; }

    /// <summary>Bit flags describing which optional features this provider implements.</summary>
    ProviderCapabilities Capabilities { get; }

    /// <summary>Lightweight liveness check used by ProviderHealthMonitor.</summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}
