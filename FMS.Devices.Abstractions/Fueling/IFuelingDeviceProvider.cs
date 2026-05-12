/*
 * File:          IFuelingDeviceProvider.cs
 * Purpose:       Contract implemented by fueling device provider plugins (e.g. TechnotradePts).
 *                Optional capabilities are surfaced via ProviderCapabilities flags and the
 *                capability interfaces in FMS.Devices.Abstractions.Fueling.Capabilities.
 * Dependencies:  IDeviceProvider
 * Last Modified: 2026-04-29
 */
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Abstractions.Fueling;

/// <summary>
/// Marker interface for fueling device providers (pumps, dispensers, integrated tank gauges).
/// Functional surface is declared by <c>I*Capability</c> sub-interfaces; implementations should
/// declare every supported capability via <see cref="IDeviceProvider.Capabilities"/>.
/// </summary>
public interface IFuelingDeviceProvider : IDeviceProvider
{
}
