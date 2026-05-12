/*
 * File:          ProviderConfigRepository.cs
 * Purpose:       Tenant-scoped EF Core implementation of IProviderConfigRepository.
 * Dependencies:  GpsdataContext, ITenantScope
 * Last Modified: 2026-04-29
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Domain.Entities.Devices;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Devices.Core.Persistence;

public sealed class ProviderConfigRepository : IProviderConfigRepository
{
    private readonly GpsdataContext _context;
    private readonly ITenantScope _tenant;

    public ProviderConfigRepository(GpsdataContext context, ITenantScope tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    private IQueryable<ProviderConfigurationEntity> Query() =>
        _context.ProviderConfigurations.Where(p => p.TenantId == _tenant.TenantId);

    public Task<ProviderConfigurationEntity?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        Query().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<ProviderConfigurationEntity?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        Query().FirstOrDefaultAsync(p => p.Name == name, cancellationToken);

    public async Task<IReadOnlyList<ProviderConfigurationEntity>> ListAsync(DeviceCategory? category = null, CancellationToken cancellationToken = default)
    {
        var query = Query();
        if (category.HasValue)
        {
            var categoryName = category.Value.ToString();
            query = query.Where(p => p.DeviceCategory == categoryName);
        }
        return await query.OrderBy(p => p.Priority).ThenBy(p => p.Name).ToListAsync(cancellationToken);
    }

    public async Task<int> AddAsync(ProviderConfigurationEntity entity, CancellationToken cancellationToken = default)
    {
        entity.TenantId = _tenant.TenantId;
        entity.CreatedAt = DateTime.UtcNow;
        _context.ProviderConfigurations.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }

    public async Task UpdateAsync(ProviderConfigurationEntity entity, CancellationToken cancellationToken = default)
    {
        if (entity.TenantId != _tenant.TenantId)
            throw new InvalidOperationException("Cross-tenant update blocked.");
        entity.UpdatedAt = DateTime.UtcNow;
        _context.ProviderConfigurations.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(int id, string? deletedBy, CancellationToken cancellationToken = default)
    {
        var entity = await Query().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (entity is null) return;
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.DeletedBy = deletedBy;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
