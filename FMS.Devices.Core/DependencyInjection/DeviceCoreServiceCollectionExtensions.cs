/*
 * File:          DeviceCoreServiceCollectionExtensions.cs
 * Purpose:       AddDeviceCore() registers the registry, factory, router, health monitor
 *                and tenant-scoped repositories shared by all device hosts.
 *                Provider-specific DI lives in AddTrackingProviders() / AddFuelingProviders().
 * Dependencies:  Microsoft.Extensions.DependencyInjection
 * Last Modified: 2026-04-29
 */
using FMS.Devices.Core.Health;
using FMS.Devices.Core.Persistence;
using FMS.Devices.Core.Registry;
using FMS.Devices.Core.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FMS.Devices.Core.DependencyInjection;

public static class DeviceCoreServiceCollectionExtensions
{
    /// <summary>
    /// Registers the cross-cutting Devices Core services. Call once per host (WebClient,
    /// Tracking.Host, Fueling.Host) before chaining provider registration extensions.
    /// </summary>
    public static IServiceCollection AddDeviceCore(this IServiceCollection services)
    {
        services.TryAddSingleton<IProviderRegistry, ProviderRegistry>();
        services.TryAddScoped<IProviderFactory, ProviderFactory>();
        services.TryAddScoped<IProviderConfigRepository, ProviderConfigRepository>();
        services.TryAddScoped<IDeviceMappingRepository, DeviceMappingRepository>();
        services.TryAddSingleton<IDeviceMessageRouter, DeviceMessageRouter>();
        services.TryAddSingleton<IProviderHealthMonitor, ProviderHealthMonitor>();
        return services;
    }
}
