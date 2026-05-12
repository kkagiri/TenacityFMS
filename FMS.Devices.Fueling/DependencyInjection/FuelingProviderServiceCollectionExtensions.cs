/*
 * File:          FuelingProviderServiceCollectionExtensions.cs
 * Purpose:       Registers fueling provider plugins.
 * Dependencies:  Microsoft.Extensions.DependencyInjection, FMS.Devices.Abstractions
 * Last Modified: 2026-05-03
 *
 * Key Functions:
 * - AddFuelingProviders(): Registers Technotrade PTS provider services.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Application.Features.Devices.Fueling.Services;
using FMS.Devices.Fueling.Providers.TechnotradePts;
using FMS.Devices.Fueling.Providers.TechnotradePts.Commands;
using FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FMS.Devices.Fueling.DependencyInjection;

public static class FuelingProviderServiceCollectionExtensions
{
    public static IServiceCollection AddFuelingProviders(this IServiceCollection services)
    {
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IDeviceProvider, TechnotradePtsProvider>());
        services.TryAddScoped<ITechnotradePtsPacketMappingService, TechnotradePtsPacketMappingService>();
        services.TryAddSingleton<ITechnotradePtsCommandMappingService, TechnotradePtsCommandMappingService>();

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, PumpControlCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, ConfigurationCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, ProbeCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, SystemCommandMapper>());

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadPumpTransactionMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadTankMeasurementMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadStatusMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadAlertRecordMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<ICanonicalPtsPacketProcessor, TechnotradePtsCanonicalPacketProcessor>());

        services.AddKeyedSingleton<IPtsPacketMapper, UploadPumpTransactionMapper>("UploadPumpTransaction");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadTankMeasurementMapper>("UploadTankMeasurement");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadStatusMapper>("UploadStatus");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadAlertRecordMapper>("UploadAlertRecord");

        return services;
    }
}
