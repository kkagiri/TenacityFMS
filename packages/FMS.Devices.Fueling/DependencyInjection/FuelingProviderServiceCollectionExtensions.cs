/*
 * File:          FuelingProviderServiceCollectionExtensions.cs
 * Purpose:       Registers fueling provider plugins.
 * Dependencies:  Microsoft.Extensions.DependencyInjection, FMS.Devices.Abstractions
 * Last Modified: 2026-05-22
 *
 * Key Functions:
 * - AddFuelingProviders(): Registers Technotrade PTS provider services.
 */
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Fueling.Providers.TechnotradePts;
using FMS.Devices.Fueling.Providers.TechnotradePts.Commands;
using FMS.Devices.Fueling.Providers.TechnotradePts.Mapping;
using FMS.Devices.Fueling.Providers.TechnotradePts.Transport;
using FMS.Application.Handlers.Interface;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FMS.Devices.Fueling.DependencyInjection;

public static class FuelingProviderServiceCollectionExtensions
{
    public static IServiceCollection AddFuelingProviders(this IServiceCollection services)
    {
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IDeviceProvider, TechnotradePtsProvider>());
        services.TryAddScoped<ITechnotradePtsPacketMappingService, TechnotradePtsPacketMappingService>();
        services.TryAddScoped<IPTSMessageProcessor, TechnotradePtsMessageProcessor>();
        services.TryAddSingleton<ITechnotradePtsCommandMappingService, TechnotradePtsCommandMappingService>();

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, PumpControlCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, ConfigurationCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, ProbeCommandMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsCommandMapper, SystemCommandMapper>());

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadPumpTransactionMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadTankMeasurementMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadInTankDeliveryMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadStatusMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, UploadAlertRecordMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpAuthorizeResponseMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpAuthorizeConfirmationMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpCloseTransactionMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpCloseTransactionResponseMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpEndOfTransactionStatusMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpGetStatusResponseMapper>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IPtsPacketMapper, PumpTransactionInformationMapper>());
        services.AddKeyedSingleton<IPtsPacketMapper, UploadPumpTransactionMapper>("UploadPumpTransaction");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadTankMeasurementMapper>("UploadTankMeasurement");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadInTankDeliveryMapper>("UploadInTankDelivery");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadStatusMapper>("UploadStatus");
        services.AddKeyedSingleton<IPtsPacketMapper, UploadAlertRecordMapper>("UploadAlertRecord");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpAuthorizeResponseMapper>("PumpAuthorize");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpAuthorizeConfirmationMapper>("PumpAuthorizeConfirmation");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpCloseTransactionMapper>("PumpCloseTransaction");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpCloseTransactionResponseMapper>("PumpCloseTransactionResponse");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpEndOfTransactionStatusMapper>("PumpEndOfTransactionStatus");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpGetStatusResponseMapper>("PumpGetStatusResponse");
        services.AddKeyedSingleton<IPtsPacketMapper, PumpTransactionInformationMapper>("PumpTransactionInformation");

        return services;
    }
}
