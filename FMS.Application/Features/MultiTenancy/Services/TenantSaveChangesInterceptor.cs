/*
 * File:          TenantSaveChangesInterceptor.cs
 * Purpose:       EF Core SaveChanges interceptor that auto-stamps
 *                TenantId on any inserted ITenantOwned entity that has
 *                not already been assigned a tenant.
 * Dependencies:  EF Core 7+, FMS.Domain
 * Last Modified: 2026-04-26
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FMS.Application.Features.MultiTenancy.Services
{
    /// <summary>
    /// Auto-stamps <c>TenantId</c> on inserted <see cref="ITenantOwned"/>
    /// entities and validates that updates do not change the tenant.
    /// </summary>
    public sealed class TenantSaveChangesInterceptor : SaveChangesInterceptor
    {
        private readonly ITenantContext _tenantContext;

        public TenantSaveChangesInterceptor(ITenantContext tenantContext)
        {
            _tenantContext = tenantContext;
        }

        public override InterceptionResult<int> SavingChanges(
            DbContextEventData eventData,
            InterceptionResult<int> result)
        {
            ApplyTenantStamp(eventData.Context);
            return base.SavingChanges(eventData, result);
        }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            ApplyTenantStamp(eventData.Context);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        private void ApplyTenantStamp(DbContext? context)
        {
            if (context is null) return;
            if (!_tenantContext.HasTenant) return;

            var tenantId = _tenantContext.TenantId;

            foreach (EntityEntry entry in context.ChangeTracker.Entries())
            {
                if (entry.Entity is not ITenantOwned owned) continue;

                switch (entry.State)
                {
                    case EntityState.Added:
                        if (owned.TenantId == Guid.Empty)
                            owned.TenantId = tenantId;
                        break;

                    case EntityState.Modified:
                        // Prevent silent cross-tenant moves.
                        var original = entry.OriginalValues[nameof(ITenantOwned.TenantId)] as Guid?;
                        if (original.HasValue && original.Value != Guid.Empty &&
                            owned.TenantId != original.Value)
                        {
                            throw new InvalidOperationException(
                                "TenantId is immutable. Cross-tenant updates are not permitted.");
                        }
                        break;
                }
            }
        }
    }
}
