/*
 * File:          ProviderConfigRepositoryTenantFilterTests.cs
 * Purpose:       Verifies that ProviderConfigRepository applies the
 *                WHERE TenantId = ITenantScope.TenantId filter on every read
 *                so cross-tenant rows never leak into a request scope.
 *                Anchors PRD §11.1.4 / TASKS T1.11.
 * Dependencies:  EF Core InMemory, FMS.Devices.Core, FMS.Domain
 * Last Modified: 2026-04-30
 */
using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Core.Persistence;
using FMS.Domain.Entities.Devices;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FMS.Testing.Devices;

public sealed class ProviderConfigRepositoryTenantFilterTests : IDisposable
{
    private readonly GpsdataContext _context;
    private static readonly Guid TenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TenantB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public ProviderConfigRepositoryTenantFilterTests()
    {
        var options = new DbContextOptionsBuilder<GpsdataContext>()
            .UseInMemoryDatabase($"ProviderConfigTenantFilter_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new GpsdataContext(options);

        _context.ProviderConfigurations.AddRange(
            new ProviderConfigurationEntity { TenantId = TenantA, Name = "GPSGate-A", DisplayName = "A", DeviceCategory = "Tracking" },
            new ProviderConfigurationEntity { TenantId = TenantA, Name = "GPSWox-A",  DisplayName = "A", DeviceCategory = "Tracking" },
            new ProviderConfigurationEntity { TenantId = TenantB, Name = "GPSGate-B", DisplayName = "B", DeviceCategory = "Tracking" });
        _context.SaveChanges();
    }

    [Fact]
    public async Task ListAsync_returns_only_active_tenant_rows()
    {
        var repo = new ProviderConfigRepository(_context, new FakeTenantScope(TenantA));

        var rows = await repo.ListAsync();

        Assert.Equal(2, rows.Count);
        Assert.All(rows, r => Assert.Equal(TenantA, r.TenantId));
    }

    [Fact]
    public async Task GetByNameAsync_does_not_leak_other_tenant_row()
    {
        var repo = new ProviderConfigRepository(_context, new FakeTenantScope(TenantA));

        var result = await repo.GetByNameAsync("GPSGate-B");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_returns_row_for_owning_tenant_only()
    {
        var tenantBRow = _context.ProviderConfigurations.Single(p => p.Name == "GPSGate-B");
        var repoA = new ProviderConfigRepository(_context, new FakeTenantScope(TenantA));
        var repoB = new ProviderConfigRepository(_context, new FakeTenantScope(TenantB));

        Assert.Null(await repoA.GetByIdAsync(tenantBRow.Id));
        Assert.NotNull(await repoB.GetByIdAsync(tenantBRow.Id));
    }

    [Fact]
    public async Task AddAsync_stamps_active_tenant_even_when_caller_omits_it()
    {
        var repo = new ProviderConfigRepository(_context, new FakeTenantScope(TenantA));
        var entity = new ProviderConfigurationEntity { Name = "NewProvider", DisplayName = "New", DeviceCategory = "Tracking" };

        var id = await repo.AddAsync(entity);
        var saved = _context.ProviderConfigurations.Single(p => p.Id == id);

        Assert.Equal(TenantA, saved.TenantId);
    }

    [Fact]
    public async Task UpdateAsync_blocks_cross_tenant_mutation()
    {
        var tenantBRow = _context.ProviderConfigurations.Single(p => p.Name == "GPSGate-B");
        var repoA = new ProviderConfigRepository(_context, new FakeTenantScope(TenantA));

        await Assert.ThrowsAsync<InvalidOperationException>(() => repoA.UpdateAsync(tenantBRow));
    }

    public void Dispose() => _context.Dispose();

    private sealed class FakeTenantScope : ITenantScope
    {
        public FakeTenantScope(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public bool HasTenant => TenantId != Guid.Empty;
    }
}
