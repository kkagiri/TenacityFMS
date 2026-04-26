/*
 * File:          Tenant.cs
 * Purpose:       Root entity representing a tenant (customer organisation)
 *                in the multi-tenant TenacyFMS deployment. Each
 *                ITenantOwned record carries a foreign key TenantId
 *                back to this table.
 * Dependencies:  None
 * Last Modified: 2026-04-26
 */
using System;

namespace FMS.Domain.Entities.Features.MultiTenancy
{
    /// <summary>
    /// A tenant (customer organisation) in the multi-tenant TenacyFMS
    /// deployment. Tenants themselves are NOT tenant-owned (they are
    /// the root of the isolation tree).
    /// </summary>
    public class Tenant
    {
        public Guid Id { get; set; }

        /// <summary>
        /// Short, URL-safe code (e.g. "acme", "northwind"). Unique.
        /// </summary>
        public string Code { get; set; } = null!;

        /// <summary>
        /// Display name of the tenant organisation.
        /// </summary>
        public string Name { get; set; } = null!;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
