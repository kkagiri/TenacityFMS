/*
 * File:          TenantContextScopeAdapter.cs
 * Purpose:       Adapter that bridges FMS.Devices.Abstractions.ITenantScope
 *                onto the existing FMS.Application ITenantContext, so device
 *                provider repositories can apply per-tenant filters without
 *                FMS.Devices.* taking a dependency on FMS.Application.
 *                Registered Scoped — same lifetime as ITenantContext.
 * Dependencies:  FMS.Devices.Abstractions, FMS.Application.Features.MultiTenancy
 * Last Modified: 2026-04-30
 */
using System;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Devices.Abstractions.Common;

namespace FMS.WebClient.Extensions;

/// <summary>
/// Bridges the device-layer <see cref="ITenantScope"/> contract onto the
/// application-layer <see cref="ITenantContext"/>. This lets
/// FMS.Devices.Core repositories apply <c>WHERE TenantId = ...</c> filters
/// using the same per-request tenant resolved by TenantResolutionMiddleware.
/// </summary>
internal sealed class TenantContextScopeAdapter : ITenantScope
{
    private readonly ITenantContext _tenantContext;

    public TenantContextScopeAdapter(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public Guid TenantId => _tenantContext.TenantId;

    public bool HasTenant => _tenantContext.HasTenant;
}
