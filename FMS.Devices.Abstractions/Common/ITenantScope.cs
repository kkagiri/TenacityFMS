/*
 * File:          ITenantScope.cs
 * Purpose:       Minimal tenant context contract consumed by FMS.Devices.* repositories.
 *                Adapter in FMS.Application/WebClient bridges this to ITenantContext at startup.
 * Dependencies:  None
 * Last Modified: 2026-04-29
 */
using System;

namespace FMS.Devices.Abstractions.Common;

/// <summary>
/// Per-request ambient tenant id. Implementations must be registered as Scoped.
/// Repositories in FMS.Devices.Core apply <c>WHERE TenantId = TenantId</c>
/// on every read.
/// </summary>
public interface ITenantScope
{
    /// <summary>The current tenant id, or <see cref="Guid.Empty"/> if no tenant has been resolved.</summary>
    Guid TenantId { get; }

    /// <summary>True when a non-empty tenant has been resolved.</summary>
    bool HasTenant { get; }
}
