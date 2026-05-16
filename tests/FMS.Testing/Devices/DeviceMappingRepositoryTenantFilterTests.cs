/*
 * File:          DeviceMappingRepositoryTenantFilterTests.cs
 * Purpose:       Verifies device-provider mappings stay scoped to the active tenant.
 * Dependencies:  EF Core InMemory, FMS.Devices.Core, FMS.Domain
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - GetForVehicleAsync_returns_only_active_tenant_mapping(): Pins vehicle mapping isolation.
 * - ListByProviderAsync_returns_only_active_tenant_mappings(): Pins provider mapping isolation.
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

public sealed class DeviceMappingRepositoryTenantFilterTests : IDisposable
{
    private readonly GpsdataContext _context;
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    public DeviceMappingRepositoryTenantFilterTests()
    {
        var options = new DbContextOptionsBuilder<GpsdataContext>()
            .UseInMemoryDatabase($"DeviceMappingTenantFilter_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new GpsdataContext(options);
        _context.ProviderConfigurations.AddRange(
            new ProviderConfigurationEntity { Id = 1, TenantId = TenantA, Name = "GPSGate-A", DisplayName = "A", DeviceCategory = "Tracking" },
            new ProviderConfigurationEntity { Id = 2, TenantId = TenantB, Name = "GPSGate-B", DisplayName = "B", DeviceCategory = "Tracking" });
        _context.DeviceProviderMappings.AddRange(
            new DeviceProviderMappingEntity { TenantId = TenantA, ProviderConfigId = 1, VehicleId = 10, ExternalDeviceId = "A-10", IsActive = true },
            new DeviceProviderMappingEntity { TenantId = TenantB, ProviderConfigId = 2, VehicleId = 10, ExternalDeviceId = "B-10", IsActive = true },
            new DeviceProviderMappingEntity { TenantId = TenantA, ProviderConfigId = 1, VehicleId = 11, ExternalDeviceId = "A-11", IsActive = false });
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetForVehicleAsync_returns_only_active_tenant_mapping()
    {
        var repo = new DeviceMappingRepository(_context, new FakeTenantScope(TenantA));

        var mapping = await repo.GetForVehicleAsync(10);

        Assert.NotNull(mapping);
        Assert.Equal(TenantA, mapping.TenantId);
        Assert.Equal("A-10", mapping.ExternalDeviceId);
    }

    [Fact]
    public async Task ListByProviderAsync_returns_only_active_tenant_mappings()
    {
        var repo = new DeviceMappingRepository(_context, new FakeTenantScope(TenantA));

        var rows = await repo.ListByProviderAsync(1);

        var row = Assert.Single(rows);
        Assert.Equal(TenantA, row.TenantId);
        Assert.True(row.IsActive);
    }

    public void Dispose() => _context.Dispose();

    private sealed class FakeTenantScope : ITenantScope
    {
        public FakeTenantScope(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public bool HasTenant => TenantId != Guid.Empty;
    }
}
