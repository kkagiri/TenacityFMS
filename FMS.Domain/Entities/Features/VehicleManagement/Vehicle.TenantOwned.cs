/*
 * File:          Vehicle.TenantOwned.cs
 * Purpose:       Adds ITenantOwned membership to Vehicle for multi-tenant
 *                row-level isolation via TenantSaveChangesInterceptor and
 *                EF global query filters.
 * Dependencies:  FMS.Domain.Entities.Common.ITenantOwned
 * Last Modified: 2026-04-29
 */
using System;
using FMS.Domain.Entities.Common;

namespace FMS.Domain.Entities;

public partial class Vehicle : ITenantOwned
{
    public Guid TenantId { get; set; }
}
