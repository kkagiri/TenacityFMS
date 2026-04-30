/*
 * File:          SystemTenantScope.cs
 * Purpose:       Provides a system-tenant scope for standalone tracking host background work.
 * Dependencies:  ITenantScope
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - TenantId: Returns the system tenant used for legacy provider rows until tenant-aware host execution lands.
 */
using FMS.Devices.Abstractions.Common;

namespace FMS.Devices.Tracking.Host;

internal sealed class SystemTenantScope : ITenantScope
{
    public Guid TenantId { get; } = Guid.Empty;
    public bool HasTenant => true;
}
