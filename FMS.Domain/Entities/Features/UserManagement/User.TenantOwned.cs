/*
 * File:          User.TenantOwned.cs
 * Purpose:       Adds ITenantOwned membership to User for multi-tenant
 *                row-level isolation.
 * Dependencies:  FMS.Domain.Entities.Common.ITenantOwned
 * Last Modified: 2026-04-29
 */
using System;
using FMS.Domain.Entities.Common;

namespace FMS.Domain.Entities;

public partial class User : ITenantOwned
{
    public Guid TenantId { get; set; }
}
