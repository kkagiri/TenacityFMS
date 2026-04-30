/*
 * File:          IFuelingPersistenceSink.cs
 * Purpose:       Sink contract for non-protocol fueling persistence targets such as Nafta ATG.
 *                Subscribes to canonical fueling MediatR notifications and writes to a
 *                downstream schema. NOT a peer-protocol provider.
 * Dependencies:  IDeviceProvider
 * Last Modified: 2026-04-29
 */
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Abstractions.Fueling;

/// <summary>
/// Persistence sink that consumes canonical fueling notifications and writes to a downstream
/// schema (e.g. Nafta ATG). Implementations register MediatR notification handlers internally.
/// </summary>
public interface IFuelingPersistenceSink : IDeviceProvider
{
}
