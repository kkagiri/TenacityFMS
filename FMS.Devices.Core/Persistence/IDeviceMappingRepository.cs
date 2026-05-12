/*
 * File:          IDeviceMappingRepository.cs
 * Purpose:       Tenant-scoped access to device_provider_mappings.
 *                Lookups by vehicle id (tracking) and by fueling device id (fueling).
 * Dependencies:  FMS.Domain
 * Last Modified: 2026-05-03
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Devices;

namespace FMS.Devices.Core.Persistence;

/// <summary>
/// Tenant-aware access to <see cref="DeviceProviderMappingEntity"/> rows.
/// </summary>
public interface IDeviceMappingRepository
{
    Task<DeviceProviderMappingEntity?> GetForVehicleAsync(int vehicleId, CancellationToken cancellationToken = default);
    Task<DeviceProviderMappingEntity?> GetForFuelingDeviceAsync(int fuelingDeviceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DeviceProviderMappingEntity>> ListByProviderAsync(int providerConfigId, CancellationToken cancellationToken = default);
}
