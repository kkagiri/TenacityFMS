/*
 * File:          DeviceMappingRepository.cs
 * Purpose:       Tenant-scoped EF Core implementation of IDeviceMappingRepository.
 * Dependencies:  GpsdataContext, ITenantScope
 * Last Modified: 2026-04-29
 */
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Domain.Entities.VehicleTracking;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Devices.Core.Persistence;

public sealed class DeviceMappingRepository : IDeviceMappingRepository
{
    private readonly GpsdataContext _context;
    private readonly ITenantScope _tenant;

    public DeviceMappingRepository(GpsdataContext context, ITenantScope tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    private IQueryable<VehicleProviderMappingEntity> Query() =>
        _context.VehicleProviderMappings.Where(m => m.TenantId == _tenant.TenantId && m.IsActive);

    public Task<VehicleProviderMappingEntity?> GetForVehicleAsync(int vehicleId, CancellationToken cancellationToken = default) =>
        Query().FirstOrDefaultAsync(m => m.VehicleId == vehicleId, cancellationToken);

    public Task<VehicleProviderMappingEntity?> GetForFuelingDeviceAsync(int fuelingDeviceId, CancellationToken cancellationToken = default) =>
        Query().FirstOrDefaultAsync(m => m.FuelingDeviceId == fuelingDeviceId, cancellationToken);

    public async Task<IReadOnlyList<VehicleProviderMappingEntity>> ListByProviderAsync(int providerConfigId, CancellationToken cancellationToken = default) =>
        await Query().Where(m => m.ProviderConfigId == providerConfigId).ToListAsync(cancellationToken);
}
