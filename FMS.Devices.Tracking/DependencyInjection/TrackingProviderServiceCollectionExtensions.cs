/*
 * File:          TrackingProviderServiceCollectionExtensions.cs
 * Purpose:       Registers tracking provider plugins, GPSGate API clients, and tracking channels.
 * Dependencies:  Microsoft.Extensions.DependencyInjection, GPSGate provider services
 * Last Modified: 2026-04-30
 *
 * Key Functions:
 * - AddTrackingProviders(): Registers tracking provider plugins and optional background channels.
 */
using FMS.Application.CommonInterface;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Devices.Abstractions.Common;
using FMS.Devices.Tracking.Providers.GpsGate;
using FMS.Devices.Tracking.Providers.GpsGate.Channels;
using FMS.Devices.Tracking.Providers.GpsWox;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace FMS.Devices.Tracking.DependencyInjection;

public static class TrackingProviderServiceCollectionExtensions
{
    public static IServiceCollection AddTrackingProviders(
        this IServiceCollection services,
        Action<TrackingProviderOptions>? configureOptions = null)
    {
        var options = new TrackingProviderOptions();
        configureOptions?.Invoke(options);
        services.TryAddSingleton(options);

        services.AddHttpClient<GPSGateProvider>();
        services.AddSingleton<IDeviceProvider, GpsWoxProvider>();
        services.AddSingleton<IDeviceProvider, GpsGateDeviceProvider>();

        services.AddHttpClient<IGPSGateConfigurationProvider, GPSGateConfigurationProvider>();
        services.TryAddScoped<IGPSGateConfigurationProvider, GPSGateConfigurationProvider>();

        services.AddHttpClient<IGPSGateLocationService, GPSGateLocationService>();
        services.TryAddScoped<IGPSGateLocationService, GPSGateLocationService>();

        services.AddHttpClient<IGPSGateTracksService, GPSGateTracksService>();
        services.TryAddScoped<IGPSGateTracksService, GPSGateTracksService>();
        services.AddHttpClient<ITrackingTracksService, GPSGateTracksService>();

        services.AddHttpClient<IGPSGateTrackInfoService, GPSGateTrackInfoService>();
        services.TryAddScoped<IGPSGateTrackInfoService, GPSGateTrackInfoService>();

        services.AddHttpClient<IGPSGateSensorService, GPSGateSensorService>();
        services.TryAddScoped<IGPSGateSensorService, GPSGateSensorService>();

        services.AddHttpClient<IGPSGateGeofenceService, GPSGateGeofenceService>();
        services.TryAddScoped<IGPSGateGeofenceService, GPSGateGeofenceService>();
        services.AddHttpClient<ITrackingGeofenceService, GPSGateGeofenceService>();

        services.AddHttpClient<IGPSGateEventService, GPSGateEventService>();
        services.TryAddScoped<IGPSGateEventService, GPSGateEventService>();

        services.AddHttpClient<IGPSGateHealthService, GPSGateHealthService>();
        services.TryAddScoped<IGPSGateHealthService, GPSGateHealthService>();

        services.AddHttpClient<IGPSGateGeocodingService, GPSGateGeocodingService>();
        services.TryAddScoped<IGPSGateGeocodingService, GPSGateGeocodingService>();

        services.AddHttpClient<IGPSGateViewsService, GPSGateViewsService>();
        services.TryAddScoped<IGPSGateViewsService, GPSGateViewsService>();
        services.AddHttpClient<ITrackingViewsService, GPSGateViewsService>();

        services.AddHttpClient<IGpsGateTagManagementService, GpsGateTagManagementService>();
        services.TryAddScoped<IGpsGateTagManagementService, GpsGateTagManagementService>();
        services.TryAddScoped<ITrackingTagTransferService, GpsGateTagTransferServiceAdapter>();

        services.AddHttpClient<IFuelAuditGPSService, FuelAuditGPSService>();
        services.TryAddScoped<IFuelAuditGPSService, FuelAuditGPSService>();

        services.AddHttpClient<GPSGateService>();
        services.TryAddScoped<GPSGateService>();

        if (options.EnableGpsGateRabbitMqConsumer)
        {
            services.AddHostedService<GPSGateRabbitMQConsumerService>();
        }

        return services;
    }
}

public sealed class TrackingProviderOptions
{
    public bool EnableGpsGateRabbitMqConsumer { get; set; } = true;
}
