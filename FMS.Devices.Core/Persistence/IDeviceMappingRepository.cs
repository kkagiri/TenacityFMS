/*
 * File:          IDeviceMappingRepository.cs
 * Purpose:       Tenant-scoped access to device_provider_mappings.
 *                Lookups by vehicle id (tracking) and by fueling device id (fueling).
 * Dependencies:  FMS.Domain
 * Last Modified: 2026-04-29
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.VehicleTracking;

namespace FMS.Devices.Core.Persistence;

/// <summary>
/// Tenant-aware access to <see cref="VehicleProviderMappingEntity"/> rows.
/// (Class will be renamed to <c>DeviceProviderMappingEntity</c> in T1.9b.)
/// </summary>
public interface IDeviceMappingRepository
{
    Task<VehicleProviderMappingEntity?> GetForVehicleAsync(int vehicleId, CancellationToken cancellationToken = default);
    Task<VehicleProviderMappingEntity?> GetForFuelingDeviceAsync(int fuelingDeviceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VehicleProviderMappingEntity>> ListByProviderAsync(int providerConfigId, CancellationToken cancellationToken = default);
}
