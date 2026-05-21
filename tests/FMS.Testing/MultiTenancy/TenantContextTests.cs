/*
 * File:          TenantContextTests.cs
 * Purpose:       Unit tests for TenantContext (the scoped per-request
 *                multi-tenancy ambient context). Covers the cross-tenant
 *                escape-hatch invariant: only platform operator users may
 *                enter cross-tenant scope.
 * Last Modified: 2026-05-20
 */
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.WebClient.Middleware;
using Microsoft.AspNetCore.Http;
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
        public void EnterCrossTenantScope_throws_for_system_user_without_operator_flag()
        {
            var ctx = new TenantContext();
            ctx.SetTenant(Guid.NewGuid(), TenantKind.System, isPlatformOperator: false);

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

        [Fact]
        public async Task TenantResolutionMiddleware_rejects_customer_tenant_kind_claim()
        {
            var nextCalled = false;
            var middleware = new TenantResolutionMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var httpContext = CreateAuthenticatedHttpContext("customer");
            var tenantContext = new TenantContext();

            await middleware.InvokeAsync(httpContext, tenantContext);

            Assert.False(nextCalled);
            Assert.Equal(StatusCodes.Status401Unauthorized, httpContext.Response.StatusCode);
            Assert.False(tenantContext.HasTenant);
        }

        [Fact]
        public async Task TenantResolutionMiddleware_accepts_client_tenant_kind_claim()
        {
            var nextCalled = false;
            var middleware = new TenantResolutionMiddleware(_ =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            });
            var tenantId = Guid.NewGuid();
            var httpContext = CreateAuthenticatedHttpContext("client", tenantId);
            var tenantContext = new TenantContext();

            await middleware.InvokeAsync(httpContext, tenantContext);

            Assert.True(nextCalled);
            Assert.Equal(tenantId, tenantContext.TenantId);
            Assert.Equal(TenantKind.Client, tenantContext.TenantKind);
        }

        private static DefaultHttpContext CreateAuthenticatedHttpContext(string tenantKind, Guid? tenantId = null)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim("tenant_id", (tenantId ?? Guid.NewGuid()).ToString()),
                new Claim("tenant_kind", tenantKind),
            };

            return new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            };
        }
    }
}
