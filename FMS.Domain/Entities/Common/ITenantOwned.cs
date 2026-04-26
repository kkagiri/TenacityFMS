/*
 * File:          ITenantOwned.cs
 * Purpose:       Marker interface implemented by every entity that
 *                belongs to a single tenant. Used by EF global query
 *                filters and the tenant SaveChanges interceptor to
 *                enforce row-level isolation in the multi-tenant FMS.
 * Dependencies:  None
 * Last Modified: 2026-04-26
 */
using System;

namespace FMS.Domain.Entities.Common
{
    /// <summary>
    /// Marks an entity as belonging to a specific tenant.
    /// All queries are filtered by <see cref="TenantId"/> via a global
    /// EF query filter, and the value is auto-stamped on insert by
    /// <c>TenantSaveChangesInterceptor</c>.
    /// </summary>
    public interface ITenantOwned
    {
        Guid TenantId { get; set; }
    }
}
