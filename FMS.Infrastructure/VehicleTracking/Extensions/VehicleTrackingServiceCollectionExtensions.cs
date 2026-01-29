using System;
using FMS.Application.CommonInterface;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Application.Features.Vehicle.Services;
using FMS.Infrastructure.ExternalServices.GPS.GPSGate.Services;
using FMS.Infrastructure.Services;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Infrastructure.VehicleTracking.Services;
using FMS.Infrastructure.VehicleTracking.Services.GPSGate;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Extensions
{
    /// <summary>
    /// Extension methods for registering vehicle tracking services in DI container
    /// </summary>
    public static class VehicleTrackingServiceCollectionExtensions
    {
        /// <summary>
        /// Add vehicle tracking services to the service collection
        /// </summary>
        /// <param name="services">Service collection</param>
        /// <param name="configureOptions">Optional configuration action</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddVehicleTracking(
            this IServiceCollection services,
            Action<VehicleTrackingOptions>? configureOptions = null)
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            // Configure options and register as DI singleton for consumers
            VehicleTrackingOptions options = new();
            configureOptions?.Invoke(options);
            services.AddSingleton(options);

            // Register core services
            services.TryAddSingleton<IProviderRegistry, ProviderRegistry>();
            // ProviderFactory consumes scoped services (IProviderConfigurationService), so it must be Scoped
            services.TryAddScoped<IProviderFactory, ProviderFactory>();

            // Register Infrastructure service (internal interface)
            services.TryAddScoped<IProviderConfigurationService, ProviderConfigurationService>();

            // Register Application service adapter (Application layer interface)
            services.TryAddScoped<Application.Features.VehicleTracking.Services.IProviderConfigurationService, ProviderConfigurationServiceAdapter>();

            services.TryAddScoped<IVehicleTrackingService, VehicleTrackingService>();

            // Register shared GPSGate configuration provider (used by all GPSGate services)
            // Needs HttpClient to authenticate with GPSGate API
            services.AddHttpClient<IGPSGateConfigurationProvider, GPSGateConfigurationProvider>();
            services.TryAddScoped<IGPSGateConfigurationProvider, GPSGateConfigurationProvider>();

            // Register GPS domain-specific services (Phase 2 refactoring)
            // GPSGate services organized by domain for better separation of concerns
            services.AddHttpClient<IGPSGateLocationService, GPSGateLocationService>();
            services.TryAddScoped<IGPSGateLocationService, GPSGateLocationService>();

            services.AddHttpClient<IGPSGateSensorService, GPSGateSensorService>();
            services.TryAddScoped<IGPSGateSensorService, GPSGateSensorService>();

            services.AddHttpClient<FMS.Application.CommonInterface.IGPSGateGeofenceService, GPSGateGeofenceService>();
            services.TryAddScoped<FMS.Application.CommonInterface.IGPSGateGeofenceService, GPSGateGeofenceService>();

            // Geofence sync job processor for background sync operations
            services.TryAddScoped<FMS.Application.Features.Geofence.Commands.IGeofenceSyncJobProcessor,
                FMS.Application.Features.Geofence.Commands.GeofenceSyncJobProcessor>();

            services.AddHttpClient<IGPSGateEventService, GPSGateEventService>();
            services.TryAddScoped<IGPSGateEventService, GPSGateEventService>();

            services.AddHttpClient<IGPSGateHealthService, GPSGateHealthService>();
            services.TryAddScoped<IGPSGateHealthService, GPSGateHealthService>();

            services.AddHttpClient<IGPSGateGeocodingService, GPSGateGeocodingService>();
            services.TryAddScoped<IGPSGateGeocodingService, GPSGateGeocodingService>();

            services.AddHttpClient<IGPSGateViewsService, GPSGateViewsService>();
            services.TryAddScoped<IGPSGateViewsService, GPSGateViewsService>();

            // Register GPSGate Tag Management Service for vehicle transfer tag updates
            services.AddHttpClient<IGpsGateTagManagementService, GpsGateTagManagementService>();
            services.TryAddScoped<IGpsGateTagManagementService, GpsGateTagManagementService>();

            // Register GPSGate Tag Transfer Service adapter for Application layer integration
            services.TryAddScoped<FMS.Application.Features.VehicleTransfer.Commands.IGpsGateTagTransferService, GpsGateTagTransferServiceAdapter>();

            services.AddHttpClient<IGPSGateAccumulatorService, GPSGateAccumulatorService>();
            services.TryAddScoped<IGPSGateAccumulatorService, GPSGateAccumulatorService>();

            // Register GPSGate DriverName Service for updating driver name custom field during fueling
            services.AddHttpClient<IGPSGateDriverNameService, GPSGateDriverNameService>();
            services.TryAddScoped<IGPSGateDriverNameService, GPSGateDriverNameService>();

            // Register Odometer Sync service for bidirectional sync between GPS and fueling data
            services.TryAddScoped<IOdometerSyncService, OdometerSyncService>();

            // Register Fuel Audit GPS Service for fetching GPS-based fuel data
            services.AddHttpClient<IFuelAuditGPSService, FuelAuditGPSService>();
            services.TryAddScoped<IFuelAuditGPSService, FuelAuditGPSService>();

            // Register Vehicle Health Monitoring service
            services.TryAddScoped<IVehicleHealthMonitorService, VehicleHealthMonitorService>();

            // Add memory cache if not already registered
            services.AddMemoryCache();

            // Auto-discover providers if enabled
            if (options.AutoDiscoverProviders)
            {
                services.AddHostedService<ProviderDiscoveryHostedService>();
            }

            return services;
        }

        /// <summary>
        /// Add a specific provider implementation to the DI container
        /// </summary>
        /// <typeparam name="TProvider">Provider implementation type</typeparam>
        /// <param name="services">Service collection</param>
        /// <param name="providerName">Unique provider name</param>
        /// <param name="lifetime">Service lifetime (default: Scoped)</param>
        /// <returns>Service collection for chaining</returns>
        public static IServiceCollection AddVehicleTrackingProvider<TProvider>(
            this IServiceCollection services,
            string providerName,
            ServiceLifetime lifetime = ServiceLifetime.Scoped)
            where TProvider : class, Interfaces.IVehicleTrackingProvider
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            if (string.IsNullOrWhiteSpace(providerName))
            {
                throw new ArgumentException("Provider name cannot be null or empty", nameof(providerName));
            }

            // Register the provider type
            services.Add(new ServiceDescriptor(typeof(TProvider), typeof(TProvider), lifetime));

            // The provider will be discovered automatically by the registry
            return services;
        }
    }

    /// <summary>
    /// Configuration options for vehicle tracking services
    /// </summary>
    public class VehicleTrackingOptions
    {
        /// <summary>
        /// Whether to automatically discover providers on startup
        /// </summary>
        public bool AutoDiscoverProviders { get; set; } = true;

        /// <summary>
        /// Assembly names to scan for providers (null = scan all)
        /// </summary>
        public string[]? AssemblyNames { get; set; }

        /// <summary>
        /// Cache duration for vehicle locations in seconds
        /// </summary>
        public int LocationCacheDurationSeconds { get; set; } = 30;

        /// <summary>
        /// Cache duration for provider health status in seconds
        /// </summary>
        public int HealthCacheDurationSeconds { get; set; } = 60;

        /// <summary>
        /// Enable automatic failover to backup providers
        /// </summary>
        public bool EnableFailover { get; set; } = true;

        /// <summary>
        /// Maximum number of failover attempts
        /// </summary>
        public int MaxFailoverAttempts { get; set; } = 3;
    }

    /// <summary>
    /// Hosted service for automatic provider discovery on startup
    /// </summary>
    internal class ProviderDiscoveryHostedService(
        IProviderRegistry registry,
        VehicleTrackingOptions options,
        ILogger<ProviderDiscoveryHostedService> logger) : Microsoft.Extensions.Hosting.IHostedService
    {
        private readonly IProviderRegistry _registry = registry ?? throw new ArgumentNullException(nameof(registry));
        private readonly VehicleTrackingOptions _options = options ?? throw new ArgumentNullException(nameof(options));
        private readonly ILogger<ProviderDiscoveryHostedService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        public async System.Threading.Tasks.Task StartAsync(System.Threading.CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting automatic provider discovery");

            try
            {
                int count = await _registry.DiscoverProvidersAsync(_options.AssemblyNames ?? []);
                _logger.LogInformation("Provider discovery completed. Discovered {ProviderCount} providers", count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during provider discovery");
            }
        }

        public System.Threading.Tasks.Task StopAsync(System.Threading.CancellationToken cancellationToken)
        {
            _logger.LogInformation("Provider discovery service stopped");
            return System.Threading.Tasks.Task.CompletedTask;
        }
    }
}
