/*
 * File:          ITenantContext.cs
 * Purpose:       Ambient context that exposes the current tenant for the
 *                in-flight request. Resolved per-request from JWT claims
 *                by TenantResolutionMiddleware and consumed by EF query
 *                filters and the SaveChanges interceptor.
 * Dependencies:  None
 * Last Modified: 2026-04-26
 */
using System;

namespace FMS.Application.Features.MultiTenancy.Services
{
    /// <summary>
    /// Ambient per-request access to the current tenant.
    /// Implementations must be registered with a Scoped lifetime.
    /// </summary>
    public interface ITenantContext
    {
        /// <summary>
        /// The resolved tenant id, or <c>Guid.Empty</c> when no tenant
        /// has been resolved yet (e.g. anonymous endpoints, background
        /// jobs that have not opted into a tenant scope).
        /// </summary>
        Guid TenantId { get; }

        /// <summary>
        /// True when a non-empty tenant id has been resolved.
        /// </summary>
        bool HasTenant { get; }

        /// <summary>
        /// Manually override the tenant for the lifetime of this scope.
        /// Used by background services to enter a tenant scope.
        /// </summary>
        void SetTenant(Guid tenantId);
    }

    /// <summary>
    /// Default scoped implementation backed by a mutable field.
    /// </summary>
    public sealed class TenantContext : ITenantContext
    {
        private Guid _tenantId;

        public Guid TenantId => _tenantId;

        public bool HasTenant => _tenantId != Guid.Empty;

        public void SetTenant(Guid tenantId) => _tenantId = tenantId;
    }
}
