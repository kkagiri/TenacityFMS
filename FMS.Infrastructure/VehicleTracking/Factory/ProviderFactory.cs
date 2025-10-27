using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Factory
{
    /// <summary>
    /// Factory implementation for creating and managing provider instances
    /// </summary>
    public class ProviderFactory : IProviderFactory, IDisposable
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IProviderRegistry _registry;
        private readonly IProviderConfigurationService _configService;
        private readonly ILogger<ProviderFactory> _logger;
        private readonly ConcurrentDictionary<string, IVehicleTrackingProvider> _providerCache = new();
        private bool _disposed = false;

        public ProviderFactory(
            IServiceProvider serviceProvider,
            IProviderRegistry registry,
            IProviderConfigurationService configService,
            ILogger<ProviderFactory> logger)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _registry = registry ?? throw new ArgumentNullException(nameof(registry));
            _configService = configService ?? throw new ArgumentNullException(nameof(configService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public async Task<IVehicleTrackingProvider?> CreateProviderAsync(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
            {
                _logger.LogWarning("Provider name is null or empty");
                return null;
            }

            try
            {
                // Check cache first
                if (_providerCache.TryGetValue(providerName, out var cachedProvider))
                {
                    _logger.LogDebug("Returning cached provider: {ProviderName}", providerName);
                    return cachedProvider;
                }

                // Get configuration
                var config = await _configService.GetByNameAsync(providerName);
                if (config == null)
                {
                    _logger.LogWarning("Provider configuration not found: {ProviderName}", providerName);
                    return null;
                }

                if (!config.IsEnabled)
                {
                    _logger.LogWarning("Provider is disabled: {ProviderName}", providerName);
                    return null;
                }

                // Get provider type from registry
                var providerType = _registry.GetProviderType(providerName);
                if (providerType == null)
                {
                    _logger.LogWarning(
                        "Provider type not registered: {ProviderName}",
                        providerName);
                    return null;
                }

                // Create instance using DI
                var provider = CreateProviderInstance(providerType, config);
                if (provider == null)
                {
                    _logger.LogError("Failed to create provider instance: {ProviderName}", providerName);
                    return null;
                }

                // Initialize provider
                await provider.InitializeAsync(config);

                // Cache the provider
                _providerCache.TryAdd(providerName, provider);

                _logger.LogInformation(
                    "Created and initialized provider: {ProviderName} (Type: {ProviderType})",
                    providerName, providerType.Name);

                return provider;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating provider: {ProviderName}", providerName);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<IVehicleTrackingProvider?> CreateProviderByIdAsync(int providerId)
        {
            try
            {
                var config = await _configService.GetByIdAsync(providerId);
                if (config == null)
                {
                    _logger.LogWarning("Provider configuration not found: {ProviderId}", providerId);
                    return null;
                }

                return await CreateProviderAsync(config.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating provider by ID: {ProviderId}", providerId);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<IVehicleTrackingProvider?> GetDefaultProviderAsync()
        {
            try
            {
                var config = await _configService.GetDefaultAsync();
                if (config == null)
                {
                    _logger.LogWarning("No default provider configured");
                    return null;
                }

                return await CreateProviderAsync(config.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting default provider");
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<IVehicleTrackingProvider?> GetProviderForVehicleAsync(int vehicleId)
        {
            try
            {
                var config = await _configService.GetForVehicleAsync(vehicleId);
                if (config == null)
                {
                    _logger.LogWarning(
                        "No provider configured for vehicle: {VehicleId}, using default",
                        vehicleId);
                    return await GetDefaultProviderAsync();
                }

                return await CreateProviderAsync(config.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error getting provider for vehicle: {VehicleId}",
                    vehicleId);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<IVehicleTrackingProvider>> GetAllProvidersAsync(bool includeDisabled = false)
        {
            try
            {
                var configs = await _configService.GetAllAsync(includeDisabled);
                var providers = new List<IVehicleTrackingProvider>();

                foreach (var config in configs)
                {
                    var provider = await CreateProviderAsync(config.Name);
                    if (provider != null)
                    {
                        providers.Add(provider);
                    }
                }

                return providers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all providers");
                return Enumerable.Empty<IVehicleTrackingProvider>();
            }
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<IVehicleTrackingProvider>> GetHealthyProvidersAsync()
        {
            try
            {
                var allProviders = await GetAllProvidersAsync(includeDisabled: false);
                var healthyProviders = new List<IVehicleTrackingProvider>();

                foreach (var provider in allProviders)
                {
                    try
                    {
                        var healthResponse = await provider.GetHealthStatusAsync();
                        if (healthResponse.IsSuccess && healthResponse.Data != null)
                        {
                            if (healthResponse.Data.Status == HealthStatus.Healthy ||
                                healthResponse.Data.Status == HealthStatus.Degraded)
                            {
                                healthyProviders.Add(provider);
                            }
                        }
                        else
                        {
                            // If health check fails, assume unhealthy
                            _logger.LogWarning(
                                "Health check failed for provider {ProviderName}: {Message}",
                                provider.ProviderName, healthResponse.Message);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Health check error for provider {ProviderName}, excluding from healthy list",
                            provider.ProviderName);
                    }
                }

                return healthyProviders;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting healthy providers");
                return Enumerable.Empty<IVehicleTrackingProvider>();
            }
        }

        /// <inheritdoc/>
        public async Task<bool> IsProviderAvailableAsync(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return false;

            try
            {
                var config = await _configService.GetByNameAsync(providerName);
                if (config == null || !config.IsEnabled)
                    return false;

                return _registry.IsProviderRegistered(providerName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking provider availability: {ProviderName}", providerName);
                return false;
            }
        }

        /// <inheritdoc/>
        public async Task ReloadProvidersAsync()
        {
            _logger.LogInformation("Reloading all providers");

            try
            {
                // Dispose all cached providers
                await DisposeAllProvidersAsync();

                // Clear cache
                _providerCache.Clear();

                _logger.LogInformation("All providers reloaded");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reloading providers");
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task DisposeProviderAsync(string providerName)
        {
            if (string.IsNullOrWhiteSpace(providerName))
                return;

            if (_providerCache.TryRemove(providerName, out var provider))
            {
                try
                {
                    if (provider is IAsyncDisposable asyncDisposable)
                    {
                        await asyncDisposable.DisposeAsync();
                    }
                    else if (provider is IDisposable disposable)
                    {
                        disposable.Dispose();
                    }

                    _logger.LogInformation("Disposed provider: {ProviderName}", providerName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error disposing provider: {ProviderName}", providerName);
                }
            }
        }

        /// <inheritdoc/>
        public async Task DisposeAllProvidersAsync()
        {
            var tasks = _providerCache.Keys.Select(DisposeProviderAsync).ToList();
            await Task.WhenAll(tasks);
        }

        #region Private Methods

        private IVehicleTrackingProvider? CreateProviderInstance(Type providerType, ProviderConfiguration config)
        {
            try
            {
                // Try to create instance using DI
                var provider = ActivatorUtilities.CreateInstance(_serviceProvider, providerType)
                    as IVehicleTrackingProvider;

                if (provider == null)
                {
                    _logger.LogError(
                        "Failed to create instance of type {ProviderType}",
                        providerType.Name);
                }

                return provider;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error creating provider instance of type {ProviderType}",
                    providerType.Name);
                return null;
            }
        }

        #endregion

        #region IDisposable

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
                return;

            if (disposing)
            {
                // Dispose all cached providers synchronously
                foreach (var provider in _providerCache.Values)
                {
                    try
                    {
                        if (provider is IDisposable disposable)
                        {
                            disposable.Dispose();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error disposing provider");
                    }
                }

                _providerCache.Clear();
            }

            _disposed = true;
        }

        #endregion
    }
}
