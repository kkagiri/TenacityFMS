using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    /// <summary>
    /// Unified vehicle tracking service implementation with multi-provider support,
    /// automatic failover, and health-aware routing
    /// </summary>
    public class VehicleTrackingService : IVehicleTrackingService
    {
        private readonly IProviderFactory _providerFactory;
        private readonly IProviderConfigurationService _configService;
        private readonly IMemoryCache _cache;
        private readonly ILogger<VehicleTrackingService> _logger;
        private readonly ConcurrentDictionary<string, ProviderStatistics> _statistics = new();

        // Use fields instead of properties for Interlocked operations
        private long _totalRequestsField = 0;
        private long _successfulRequestsField = 0;
        private long _failedRequestsField = 0;
        private long _failoverCountField = 0;

        // Public properties for read access
        private long TotalRequests => _totalRequestsField;
        private long SuccessfulRequests => _successfulRequestsField;
        private long FailedRequests => _failedRequestsField;
        private long FailoverCount => _failoverCountField;

        // Cache settings
        private readonly TimeSpan _locationCacheDuration = TimeSpan.FromSeconds(30);
        private readonly TimeSpan _providerHealthCacheDuration = TimeSpan.FromMinutes(1);

        public VehicleTrackingService(
            IProviderFactory providerFactory,
            IProviderConfigurationService configService,
            IMemoryCache cache,
            ILogger<VehicleTrackingService> logger)
        {
            _providerFactory = providerFactory ?? throw new ArgumentNullException(nameof(providerFactory));
            _configService = configService ?? throw new ArgumentNullException(nameof(configService));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc/>
        public async Task<VehicleLocation?> GetVehicleLocationAsync(int vehicleId)
        {
            System.Threading.Interlocked.Increment(ref _totalRequestsField);

            try
            {
                // Check cache first
                var cacheKey = $"location_{vehicleId}";
                if (_cache.TryGetValue<VehicleLocation>(cacheKey, out var cachedLocation))
                {
                    _logger.LogDebug("Returning cached location for vehicle: {VehicleId}", vehicleId);
                    System.Threading.Interlocked.Increment(ref _successfulRequestsField);
                    return cachedLocation;
                }

                // Get provider for this vehicle
                var provider = await GetProviderForVehicleWithFailoverAsync(vehicleId);
                if (provider == null)
                {
                    _logger.LogWarning("No provider available for vehicle: {VehicleId}", vehicleId);
                    System.Threading.Interlocked.Increment(ref _failedRequestsField);
                    return null;
                }

                // Get location from provider
                var stopwatch = Stopwatch.StartNew();
                var response = await provider.GetVehicleLocationAsync(vehicleId);
                stopwatch.Stop();

                if (!response.IsSuccess || response.Data == null)
                {
                    _logger.LogWarning("Failed to get location for vehicle {VehicleId}: {Message}",
                        vehicleId, response.Message);
                    UpdateProviderStatistics(provider.ProviderName, false, stopwatch.ElapsedMilliseconds);
                    System.Threading.Interlocked.Increment(ref _failedRequestsField);
                    return null;
                }

                // Map DTO to model
                var location = MapDtoToLocation(response.Data);

                // Update statistics
                UpdateProviderStatistics(provider.ProviderName, true, stopwatch.ElapsedMilliseconds);

                if (location != null)
                {
                    // Cache the location
                    _cache.Set(cacheKey, location, _locationCacheDuration);
                    System.Threading.Interlocked.Increment(ref _successfulRequestsField);
                }
                else
                {
                    System.Threading.Interlocked.Increment(ref _failedRequestsField);
                }

                return location;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting location for vehicle: {VehicleId}", vehicleId);
                System.Threading.Interlocked.Increment(ref _failedRequestsField);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<Dictionary<int, VehicleLocation>> GetVehicleLocationsAsync(IEnumerable<int> vehicleIds)
        {
            var locations = new Dictionary<int, VehicleLocation>();
            var tasks = new List<Task<(int VehicleId, VehicleLocation? Location)>>();

            foreach (var vehicleId in vehicleIds)
            {
                tasks.Add(GetVehicleLocationWithIdAsync(vehicleId));
            }

            var results = await Task.WhenAll(tasks);

            foreach (var (vehicleId, location) in results)
            {
                if (location != null)
                {
                    locations[vehicleId] = location;
                }
            }

            return locations;
        }

        /// <inheritdoc/>
        public async Task<List<VehicleLocation>> GetVehicleLocationHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to,
            int maxPoints = 1000)
        {
            System.Threading.Interlocked.Increment(ref _totalRequestsField);

            try
            {
                // Get provider for this vehicle
                var provider = await GetProviderForVehicleWithFailoverAsync(vehicleId);
                if (provider == null)
                {
                    _logger.LogWarning("No provider available for vehicle: {VehicleId}", vehicleId);
                    System.Threading.Interlocked.Increment(ref _failedRequestsField);
                    return new List<VehicleLocation>();
                }

                // Get history from provider
                var stopwatch = Stopwatch.StartNew();
                var response = await provider.GetVehicleHistoryAsync(vehicleId, from, to);
                stopwatch.Stop();

                if (!response.IsSuccess || response.Data == null)
                {
                    _logger.LogWarning("Failed to get history for vehicle {VehicleId}: {Message}",
                        vehicleId, response.Message);
                    UpdateProviderStatistics(provider.ProviderName, false, stopwatch.ElapsedMilliseconds);
                    System.Threading.Interlocked.Increment(ref _failedRequestsField);
                    return new List<VehicleLocation>();
                }

                // Map history points to locations
                var locations = response.Data
                    .Take(maxPoints)
                    .Select(point => new VehicleLocation
                    {
                        VehicleId = vehicleId,
                        Latitude = (double)point.Latitude,
                        Longitude = (double)point.Longitude,
                        Altitude = (double?)point.Altitude,
                        Speed = (double?)point.Speed,
                        Heading = (double?)point.Heading,
                        Timestamp = point.Timestamp,
                        ProviderName = provider.ProviderName
                    })
                    .ToList();

                // Update statistics
                UpdateProviderStatistics(provider.ProviderName, true, stopwatch.ElapsedMilliseconds);
                System.Threading.Interlocked.Increment(ref _successfulRequestsField);

                return locations;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error getting location history for vehicle: {VehicleId}",
                    vehicleId);
                System.Threading.Interlocked.Increment(ref _failedRequestsField);
                return new List<VehicleLocation>();
            }
        }

        /// <inheritdoc/>
        public async Task<string?> GetProviderForVehicleAsync(int vehicleId)
        {
            try
            {
                var config = await _configService.GetForVehicleAsync(vehicleId);
                return config?.Name;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider for vehicle: {VehicleId}", vehicleId);
                return null;
            }
        }

        /// <inheritdoc/>
        public async Task<Dictionary<string, ProviderHealthStatus>> GetProvidersHealthAsync()
        {
            var cacheKey = "providers_health";

            // Check cache
            if (_cache.TryGetValue<Dictionary<string, ProviderHealthStatus>>(cacheKey, out var cachedHealth))
            {
                return cachedHealth;
            }

            var healthStatuses = new Dictionary<string, ProviderHealthStatus>();

            try
            {
                var providers = await _providerFactory.GetAllProvidersAsync(includeDisabled: false);

                foreach (var provider in providers)
                {
                    try
                    {
                        var response = await provider.GetHealthStatusAsync();
                        if (response.IsSuccess && response.Data != null)
                        {
                            healthStatuses[provider.ProviderName] = response.Data;
                        }
                        else
                        {
                            healthStatuses[provider.ProviderName] = new ProviderHealthStatus
                            {
                                ProviderName = provider.ProviderName,
                                Status = HealthStatus.Unknown,
                                Message = "Health check unavailable",
                                CheckedAt = DateTime.UtcNow
                            };
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Health check failed for provider: {ProviderName}",
                            provider.ProviderName);

                        healthStatuses[provider.ProviderName] = new ProviderHealthStatus
                        {
                            ProviderName = provider.ProviderName,
                            Status = HealthStatus.Unhealthy,
                            Message = $"Health check error: {ex.Message}",
                            CheckedAt = DateTime.UtcNow
                        };
                    }
                }

                // Cache the health statuses
                _cache.Set(cacheKey, healthStatuses, _providerHealthCacheDuration);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider health statuses");
            }

            return healthStatuses;
        }

        /// <inheritdoc/>
        public async Task<bool> TestProviderConnectivityAsync(string providerName)
        {
            try
            {
                var provider = await _providerFactory.CreateProviderAsync(providerName);
                if (provider == null)
                {
                    return false;
                }

                var response = await provider.ValidateConnectionAsync();
                return response.IsSuccess && response.Data == true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing provider connectivity: {ProviderName}", providerName);
                return false;
            }
        }

        /// <inheritdoc/>
        public async Task ReloadProvidersAsync()
        {
            _logger.LogInformation("Reloading providers and clearing cache");

            try
            {
                // Clear location cache
                // Note: IMemoryCache doesn't have a Clear method, so we rely on expiration

                // Reload providers in factory
                await _providerFactory.ReloadProvidersAsync();

                _logger.LogInformation("Providers reloaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reloading providers");
                throw;
            }
        }

        /// <inheritdoc/>
        public Task<ProviderUsageStatistics> GetProviderStatisticsAsync()
        {
            var statistics = new ProviderUsageStatistics
            {
                TotalRequests = TotalRequests,
                SuccessfulRequests = SuccessfulRequests,
                FailedRequests = FailedRequests,
                FailoverCount = FailoverCount,
                AverageResponseTimeMs = CalculateOverallAverageResponseTime(),
                ProviderStats = _statistics.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value)
            };

            return Task.FromResult(statistics);
        }

        #region Private Helper Methods

        private VehicleLocation? MapDtoToLocation(Application.Features.Vehicle.DTOs.VehicleLocationDTO dto)
        {
            if (dto == null)
                return null;

            return new VehicleLocation
            {
                VehicleId = dto.VehicleId,
                Latitude = (double)dto.Latitude,
                Longitude = (double)dto.Longitude,
                Altitude = dto.Altitude.HasValue ? (double)dto.Altitude.Value : null,
                Speed = dto.Speed.HasValue ? (double)dto.Speed.Value : null,
                Heading = dto.Heading.HasValue ? (double)dto.Heading.Value : null,
                Timestamp = dto.LastUpdated,
                IsMoving = dto.IsMoving,
                Address = dto.Address,
                ExternalDeviceId = dto.DeviceId?.ToString()
            };
        }

        private async Task<(int VehicleId, VehicleLocation? Location)> GetVehicleLocationWithIdAsync(int vehicleId)
        {
            var location = await GetVehicleLocationAsync(vehicleId);
            return (vehicleId, location);
        }

        private async Task<IVehicleTrackingProvider?> GetProviderForVehicleWithFailoverAsync(int vehicleId)
        {
            // Try to get the configured provider for this vehicle
            var provider = await _providerFactory.GetProviderForVehicleAsync(vehicleId);

            if (provider != null)
            {
                // Check if provider is healthy
                if (await IsProviderHealthyAsync(provider))
                {
                    return provider;
                }

                _logger.LogWarning(
                    "Provider unhealthy for vehicle {VehicleId}, attempting failover",
                    vehicleId);
                System.Threading.Interlocked.Increment(ref _failoverCountField);
            }

            // Failover: Try to get any healthy provider
            var healthyProviders = await _providerFactory.GetHealthyProvidersAsync();
            var healthyProvider = healthyProviders.FirstOrDefault();

            if (healthyProvider != null)
            {
                _logger.LogInformation(
                    "Failover successful for vehicle {VehicleId} to provider {ProviderName}",
                    vehicleId, healthyProvider.ProviderName);
                return healthyProvider;
            }

            // Last resort: Try default provider
            var defaultProvider = await _providerFactory.GetDefaultProviderAsync();
            if (defaultProvider != null)
            {
                _logger.LogWarning(
                    "Using default provider for vehicle {VehicleId} after failover",
                    vehicleId);
                return defaultProvider;
            }

            return null;
        }

        private async Task<bool> IsProviderHealthyAsync(IVehicleTrackingProvider provider)
        {
            try
            {
                var response = await provider.GetHealthStatusAsync();
                if (!response.IsSuccess || response.Data == null)
                    return false;

                return response.Data.Status == HealthStatus.Healthy ||
                       response.Data.Status == HealthStatus.Degraded;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Error checking provider health: {ProviderName}",
                    provider.ProviderName);
                return false;
            }
        }
        private void UpdateProviderStatistics(string providerName, bool success, long responseTimeMs)
        {
            var stats = _statistics.GetOrAdd(providerName, _ => new ProviderStatistics
            {
                ProviderName = providerName
            });

            System.Threading.Interlocked.Increment(ref stats.RequestCountField);

            if (success)
            {
                System.Threading.Interlocked.Increment(ref stats.SuccessCountField);
            }
            else
            {
                System.Threading.Interlocked.Increment(ref stats.FailureCountField);
            }

            // Update average response time (simple moving average)
            var totalResponseTime = stats.AverageResponseTimeMs * (stats.RequestCount - 1);
            stats.AverageResponseTimeMs = (totalResponseTime + responseTimeMs) / stats.RequestCount;
            stats.LastRequestTime = DateTime.UtcNow;
        }

        private double CalculateOverallAverageResponseTime()
        {
            if (_statistics.IsEmpty)
                return 0;

            var totalRequests = _statistics.Values.Sum(s => s.RequestCount);
            if (totalRequests == 0)
                return 0;

            var weightedSum = _statistics.Values
                .Sum(s => s.AverageResponseTimeMs * s.RequestCount);

            return weightedSum / totalRequests;
        }

        #endregion
    }
}
