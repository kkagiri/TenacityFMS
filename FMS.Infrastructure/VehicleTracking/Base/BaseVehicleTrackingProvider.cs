using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Base
{
    /// <summary>
    /// Base abstract class for vehicle tracking providers
    /// Provides common functionality and default implementations
    /// </summary>
    public abstract class BaseVehicleTrackingProvider : IVehicleTrackingProvider
    {
        protected readonly ILogger _logger;
        protected ProviderConfiguration? _configuration;
        protected bool _isInitialized;
        protected DateTime _initializationTime;

        #region Provider Metadata (Must be implemented by derived classes)

        public abstract string ProviderName { get; }
        public abstract string ProviderVersion { get; }
        public abstract ProviderCapabilities Capabilities { get; }
        public abstract ProviderMetadata Metadata { get; }

        #endregion

        protected BaseVehicleTrackingProvider(ILogger logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _isInitialized = false;
        }

        #region Lifecycle Management

        public virtual async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
        {
            try
            {
                _logger.LogInformation("Initializing provider: {ProviderName}", ProviderName);

                // Validate configuration
                var validationResult = await ValidateConfigurationAsync(configuration);
                if (!validationResult.IsSuccess)
                {
                    return validationResult;
                }

                _configuration = configuration;

                // Call provider-specific initialization
                var result = await OnInitializeAsync(configuration);

                if (result.IsSuccess)
                {
                    _isInitialized = true;
                    _initializationTime = DateTime.UtcNow;
                    _logger.LogInformation("Provider {ProviderName} initialized successfully", ProviderName);
                }
                else
                {
                    _logger.LogError("Provider {ProviderName} initialization failed: {Message}",
                        ProviderName, result.Message);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing provider {ProviderName}", ProviderName);
                return FMSResponse<bool>.Failed($"Initialization error: {ex.Message}");
            }
        }

        public virtual async Task<FMSResponse<bool>> ShutdownAsync()
        {
            try
            {
                _logger.LogInformation("Shutting down provider: {ProviderName}", ProviderName);

                // Call provider-specific shutdown
                var result = await OnShutdownAsync();

                _isInitialized = false;
                _configuration = null;

                _logger.LogInformation("Provider {ProviderName} shut down successfully", ProviderName);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error shutting down provider {ProviderName}", ProviderName);
                return FMSResponse<bool>.Failed($"Shutdown error: {ex.Message}");
            }
        }

        public virtual async Task<FMSResponse<bool>> ValidateConfigurationAsync(ProviderConfiguration configuration)
        {
            if (configuration == null)
            {
                return FMSResponse<bool>.Failed("Configuration cannot be null");
            }

            if (string.IsNullOrWhiteSpace(configuration.Name))
            {
                return FMSResponse<bool>.Failed("Provider name is required");
            }

            if (configuration.Name != ProviderName)
            {
                return FMSResponse<bool>.Failed($"Configuration is for {configuration.Name}, but this is {ProviderName}");
            }

            // Call provider-specific validation
            return await OnValidateConfigurationAsync(configuration);
        }

        #endregion

        #region Core Vehicle Tracking Operations (Must be implemented by derived classes)

        public abstract Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);
        public abstract Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
            bool onlineOnly = false,
            bool gpsEnabledOnly = true);
        public abstract Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);
        public abstract Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);

        #endregion

        #region Advanced Features (Optional - default implementations)

        public virtual Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
            int vehicleId,
            DateTime from,
            DateTime to)
        {
            if (!Capabilities.SupportsHistoricalData)
            {
                return Task.FromResult(FMSResponse<List<VehicleHistoryPoint>>.Failed(
                    $"Provider {ProviderName} does not support historical data"));
            }

            throw new NotImplementedException($"Historical data is not implemented for {ProviderName}");
        }

        public virtual Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync()
        {
            if (!Capabilities.SupportsGeofencing)
            {
                return Task.FromResult(FMSResponse<List<GeofenceDTO>>.Failed(
                    $"Provider {ProviderName} does not support geofencing"));
            }

            throw new NotImplementedException($"Geofencing is not implemented for {ProviderName}");
        }

        public virtual Task<FMSResponse<bool>> SubscribeToEventsAsync(IEventHandler eventHandler)
        {
            if (!Capabilities.SupportsEvents)
            {
                return Task.FromResult(FMSResponse<bool>.Failed(
                    $"Provider {ProviderName} does not support real-time events"));
            }

            throw new NotImplementedException($"Real-time events are not implemented for {ProviderName}");
        }

        public virtual Task<FMSResponse<bool>> UnsubscribeFromEventsAsync()
        {
            if (!Capabilities.SupportsEvents)
            {
                return Task.FromResult(FMSResponse<bool>.Failed(
                    $"Provider {ProviderName} does not support real-time events"));
            }

            throw new NotImplementedException($"Real-time events are not implemented for {ProviderName}");
        }

        #endregion

        #region Health & Monitoring

        public virtual async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
        {
            try
            {
                var health = new ProviderHealthStatus
                {
                    ProviderName = ProviderName,
                    Status = _isInitialized ? HealthStatus.Healthy : HealthStatus.Unknown,
                    CheckedAt = DateTime.UtcNow
                };

                if (_isInitialized)
                {
                    // Test connectivity
                    var connectionTest = await ValidateConnectionAsync();
                    if (!connectionTest.IsSuccess)
                    {
                        health.Status = HealthStatus.Unhealthy;
                        health.Message = connectionTest.Message;
                        health.ErrorCount++;
                    }
                }

                return FMSResponse<ProviderHealthStatus>.Success(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking health for provider {ProviderName}", ProviderName);

                var errorHealth = new ProviderHealthStatus
                {
                    ProviderName = ProviderName,
                    Status = HealthStatus.Unhealthy,
                    CheckedAt = DateTime.UtcNow,
                    Message = ex.Message,
                    ErrorCount = 1
                };

                return FMSResponse<ProviderHealthStatus>.Success(errorHealth);
            }
        }

        public virtual async Task<FMSResponse<bool>> ValidateConnectionAsync()
        {
            if (!_isInitialized)
            {
                return FMSResponse<bool>.Failed("Provider is not initialized");
            }

            // Call provider-specific connection validation
            return await OnValidateConnectionAsync();
        }

        #endregion

        #region Protected Helper Methods

        /// <summary>
        /// Ensure provider is initialized before executing operations
        /// </summary>
        protected void EnsureInitialized()
        {
            if (!_isInitialized)
            {
                throw new ProviderNotInitializedException(ProviderName);
            }
        }

        /// <summary>
        /// Get configuration value with type checking
        /// </summary>
        protected T? GetConfigValue<T>(string key, T? defaultValue = default)
        {
            if (_configuration == null)
            {
                return defaultValue;
            }

            return _configuration.GetValue(key, defaultValue);
        }

        /// <summary>
        /// Log and wrap exceptions in FMSResponse
        /// </summary>
        protected FMSResponse<T> HandleException<T>(Exception ex, string operation)
        {
            _logger.LogError(ex, "Error in {ProviderName}.{Operation}: {Message}",
                ProviderName, operation, ex.Message);

            return FMSResponse<T>.Failed($"{operation} failed: {ex.Message}");
        }

        #endregion

        #region Virtual Methods for Provider-Specific Implementation

        /// <summary>
        /// Provider-specific initialization logic
        /// </summary>
        protected virtual Task<FMSResponse<bool>> OnInitializeAsync(ProviderConfiguration configuration)
        {
            return Task.FromResult(FMSResponse<bool>.Success(true));
        }

        /// <summary>
        /// Provider-specific shutdown logic
        /// </summary>
        protected virtual Task<FMSResponse<bool>> OnShutdownAsync()
        {
            return Task.FromResult(FMSResponse<bool>.Success(true));
        }

        /// <summary>
        /// Provider-specific configuration validation
        /// </summary>
        protected virtual Task<FMSResponse<bool>> OnValidateConfigurationAsync(ProviderConfiguration configuration)
        {
            return Task.FromResult(FMSResponse<bool>.Success(true));
        }

        /// <summary>
        /// Provider-specific connection validation
        /// </summary>
        protected virtual Task<FMSResponse<bool>> OnValidateConnectionAsync()
        {
            return Task.FromResult(FMSResponse<bool>.Success(true));
        }

        #endregion
    }
}
