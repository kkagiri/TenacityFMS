/*
 * File:          Site.TenantOwned.cs
 * Purpose:       Adds ITenantOwned membership to Site for multi-tenant
 *                row-level isolation.
 * Dependencies:  FMS.Domain.Entities.Common.ITenantOwned
 * Last Modified: 2026-04-29
 */
using System;
using FMS.Domain.Entities.Common;

namespace FMS.Domain.Entities;

public partial class Site : ITenantOwned
{
    public Guid TenantId { get; set; }
}
