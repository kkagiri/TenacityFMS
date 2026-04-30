/*
 * File:          FuelingProviderServiceCollectionExtensions.cs
 * Purpose:       Registers fueling provider plugins and persistence sinks.
 * Dependencies:  Microsoft.Extensions.DependencyInjection, FMS.Devices.Abstractions
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - AddFuelingProviders(): Registers Technotrade PTS and Nafta ATG provider shells.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Fueling.Providers.NaftaAtg;
using FMS.Devices.Fueling.Providers.TechnotradePts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FMS.Devices.Fueling.DependencyInjection;

public static class FuelingProviderServiceCollectionExtensions
{
    public static IServiceCollection AddFuelingProviders(this IServiceCollection services)
    {
        services.TryAddSingleton<IDeviceProvider, TechnotradePtsProvider>();
        services.TryAddSingleton<IDeviceProvider, NaftaAtgProvider>();

        return services;
    }
}
