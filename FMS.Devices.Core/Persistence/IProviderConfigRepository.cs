/*
 * File:          IProviderConfigRepository.cs
 * Purpose:       Tenant-scoped read/write access to provider_configurations.
 *                Implementations apply WHERE tenant_id = ITenantScope.TenantId automatically.
 * Dependencies:  FMS.Domain
 * Last Modified: 2026-04-29
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Domain.Entities.VehicleTracking;

namespace FMS.Devices.Core.Persistence;

/// <summary>
/// Tenant-aware access to <see cref="ProviderConfigurationEntity"/>.
/// All read operations apply <c>WHERE tenant_id = ITenantScope.TenantId</c>.
/// </summary>
public interface IProviderConfigRepository
{
    Task<ProviderConfigurationEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ProviderConfigurationEntity?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProviderConfigurationEntity>> ListAsync(DeviceCategory? category = null, CancellationToken cancellationToken = default);
    Task<int> AddAsync(ProviderConfigurationEntity entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(ProviderConfigurationEntity entity, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(int id, string? deletedBy, CancellationToken cancellationToken = default);
}
