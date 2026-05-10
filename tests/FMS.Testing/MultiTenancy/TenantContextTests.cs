/*
 * File:          TenantContextTests.cs
 * Purpose:       Unit tests for TenantContext (the scoped per-request
 *                multi-tenancy ambient context). Covers the cross-tenant
 *                escape-hatch invariant: only platform operator users may
 *                enter cross-tenant scope.
 * Last Modified: 2026-05-10
 */
using System;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using Xunit;

namespace FMS.Testing.MultiTenancy
{
    public class TenantContextTests
    {
        [Fact]
        public void Default_state_has_no_tenant_and_no_cross_tenant()
        {
            var ctx = new TenantContext();

            Assert.Equal(Guid.Empty, ctx.TenantId);
            Assert.False(ctx.HasTenant);
            Assert.Equal(TenantKind.Client, ctx.TenantKind);
            Assert.False(ctx.IsPlatformOperator);
            Assert.False(ctx.IsCrossTenant);
        }

        [Fact]
        public void SetTenant_legacy_overload_only_sets_id()
        {
            var ctx = new TenantContext();
            var id = Guid.NewGuid();

            ctx.SetTenant(id);

            Assert.Equal(id, ctx.TenantId);
            Assert.True(ctx.HasTenant);
            // Kind and operator flag remain at safe defaults.
            Assert.Equal(TenantKind.Client, ctx.TenantKind);
            Assert.False(ctx.IsPlatformOperator);
        }

        [Fact]
        public void SetTenant_full_overload_sets_all_three_fields()
        {
            var ctx = new TenantContext();
            var id = Guid.NewGuid();

            ctx.SetTenant(id, TenantKind.System, isPlatformOperator: true);

            Assert.Equal(id, ctx.TenantId);
            Assert.Equal(TenantKind.System, ctx.TenantKind);
            Assert.True(ctx.IsPlatformOperator);
            Assert.False(ctx.IsCrossTenant);  // not entered yet
        }

        [Fact]
        public void EnterCrossTenantScope_succeeds_for_platform_operator()
        {
            var ctx = new TenantContext();
            ctx.SetTenant(Guid.NewGuid(), TenantKind.System, isPlatformOperator: true);

            ctx.EnterCrossTenantScope();

            Assert.True(ctx.IsCrossTenant);
        }

        [Fact]
        public void EnterCrossTenantScope_throws_for_client_user()
        {
            var ctx = new TenantContext();
            ctx.SetTenant(Guid.NewGuid(), TenantKind.Client, isPlatformOperator: false);

            var ex = Assert.Throws<InvalidOperationException>(() => ctx.EnterCrossTenantScope());
            Assert.Contains("platform operator", ex.Message, StringComparison.OrdinalIgnoreCase);
            Assert.False(ctx.IsCrossTenant);
        }

        [Fact]
        public void EnterCrossTenantScope_throws_for_customer_user()
        {
            var ctx = new TenantContext();
            ctx.SetTenant(Guid.NewGuid(), TenantKind.Customer, isPlatformOperator: false);

            Assert.Throws<InvalidOperationException>(() => ctx.EnterCrossTenantScope());
            Assert.False(ctx.IsCrossTenant);
        }

        [Fact]
        public void EnterCrossTenantScope_throws_when_no_tenant_resolved()
        {
            var ctx = new TenantContext();

            Assert.Throws<InvalidOperationException>(() => ctx.EnterCrossTenantScope());
            Assert.False(ctx.IsCrossTenant);
        }

        [Fact]
        public void TenantContext_implements_ITenantQueryContext_for_persistence_layer()
        {
            // Persistence depends on the read-only Domain abstraction, not
            // the full Application interface. This test pins the layering.
            var ctx = new TenantContext();
            ctx.SetTenant(Guid.NewGuid(), TenantKind.Client, isPlatformOperator: false);

            FMS.Domain.Entities.Common.ITenantQueryContext queryCtx = ctx;

            Assert.Equal(ctx.TenantId, queryCtx.TenantId);
            Assert.Equal(ctx.HasTenant, queryCtx.HasTenant);
            Assert.Equal(ctx.IsCrossTenant, queryCtx.IsCrossTenant);
        }
    }
}
