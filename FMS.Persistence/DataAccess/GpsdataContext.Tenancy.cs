/*
 * File:          GpsdataContext.Tenancy.cs
 * Purpose:       Multi-tenancy partial extension for GpsdataContext.
 *                Adds the Tenant DbSet and applies the entity
 *                configuration. Per-entity global query filters for
 *                ITenantOwned should be added in OnModelCreatingPartial
 *                as each entity is migrated to multi-tenant.
 * Dependencies:  EF Core, FMS.Domain
 * Last Modified: 2026-04-26
 */
using FMS.Domain.Entities.Features.MultiTenancy;
using FMS.Persistence.EntityConfigurations.Features.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace FMS.Persistence.DataAccess
{
    /// <summary>
    /// Partial class extension for the MultiTenancy module.
    /// </summary>
    public partial class GpsdataContext
    {
        public virtual DbSet<Tenant> Tenants { get; set; }
    }
}
