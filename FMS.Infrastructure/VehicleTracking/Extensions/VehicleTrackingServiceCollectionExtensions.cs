using System;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Infrastructure.VehicleTracking.Services;
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
                throw new ArgumentNullException(nameof(services));

            // Configure options
            var options = new VehicleTrackingOptions();
            configureOptions?.Invoke(options);

            // Register core services
            services.TryAddSingleton<IProviderRegistry, ProviderRegistry>();
            services.TryAddSingleton<IProviderFactory, ProviderFactory>();
            services.TryAddScoped<IProviderConfigurationService, ProviderConfigurationService>();
            services.TryAddScoped<IVehicleTrackingService, VehicleTrackingService>();

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
                throw new ArgumentNullException(nameof(services));

            if (string.IsNullOrWhiteSpace(providerName))
                throw new ArgumentException("Provider name cannot be null or empty", nameof(providerName));

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
    internal class ProviderDiscoveryHostedService : Microsoft.Extensions.Hosting.IHostedService
    {
        private readonly IProviderRegistry _registry;
        private readonly VehicleTrackingOptions _options;
        private readonly Microsoft.Extensions.Logging.ILogger<ProviderDiscoveryHostedService> _logger;

        public ProviderDiscoveryHostedService(
            IProviderRegistry registry,
            VehicleTrackingOptions options,
            Microsoft.Extensions.Logging.ILogger<ProviderDiscoveryHostedService> logger)
        {
            _registry = registry ?? throw new ArgumentNullException(nameof(registry));
            _options = options ?? throw new ArgumentNullException(nameof(options));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async System.Threading.Tasks.Task StartAsync(System.Threading.CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting automatic provider discovery");

            try
            {
                var count = await _registry.DiscoverProvidersAsync(_options.AssemblyNames ?? Array.Empty<string>());
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
