/*
 * File:          FuelingCapabilities.cs
 * Purpose:       Capability sub-interfaces declared by fueling provider plugins.
 *                A provider implements only the capabilities it supports and lists them
 *                via ProviderCapabilities flags.
 * Dependencies:  Fueling canonical messages, DeviceCommand
 * Last Modified: 2026-04-29
 */
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Abstractions.Fueling.Messages;

namespace FMS.Devices.Abstractions.Fueling.Capabilities;

/// <summary>Send pump-control commands (authorize, close transaction, set price).</summary>
public interface IPumpControlCapability
{
    Task<DeviceCommandResult> AuthorizePumpAsync(DeviceCommand<PumpAuthorizePayload> command, CancellationToken cancellationToken = default);
    Task<DeviceCommandResult> ClosePumpTransactionAsync(DeviceCommand<PumpCloseTransactionPayload> command, CancellationToken cancellationToken = default);
}

/// <summary>Read tank measurement data on demand (where supported by the protocol).</summary>
public interface ITankMeasurementCapability
{
    Task<DeviceCommandResult> RequestTankProbeAsync(DeviceCommand<TankProbeRequestPayload> command, CancellationToken cancellationToken = default);
}

/// <summary>Trigger an upload-status request to a fueling controller.</summary>
public interface IUploadStatusCapability
{
    Task<DeviceCommandResult> RequestUploadStatusAsync(DeviceCommand<UploadStatusRequestPayload> command, CancellationToken cancellationToken = default);
}
