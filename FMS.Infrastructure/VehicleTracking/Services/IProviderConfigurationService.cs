using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    /// <summary>
    /// Service interface for managing provider configurations
    /// </summary>
    public interface IProviderConfigurationService
    {
        /// <summary>
        /// Get all provider configurations
        /// </summary>
        /// <param name="includeDisabled">Include disabled providers</param>
        /// <returns>List of provider configurations</returns>
        Task<List<ProviderConfiguration>> GetAllAsync(bool includeDisabled = false);

        /// <summary>
        /// Get provider configuration by name
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Provider configuration or null</returns>
        Task<ProviderConfiguration?> GetByNameAsync(string providerName);

        /// <summary>
        /// Get provider configuration by ID
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Provider configuration or null</returns>
        Task<ProviderConfiguration?> GetByIdAsync(int id);

        /// <summary>
        /// Get the default provider configuration
        /// </summary>
        /// <returns>Default provider configuration or null</returns>
        Task<ProviderConfiguration?> GetDefaultAsync();

        /// <summary>
        /// Get provider configuration for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Provider configuration or default provider</returns>
        Task<ProviderConfiguration?> GetForVehicleAsync(int vehicleId);

        /// <summary>
        /// Create a new provider configuration
        /// </summary>
        /// <param name="configuration">Provider configuration</param>
        /// <param name="currentUser">User creating the configuration</param>
        /// <returns>Created configuration ID</returns>
        Task<int> CreateAsync(ProviderConfiguration configuration, string? currentUser = null);

        /// <summary>
        /// Update an existing provider configuration
        /// </summary>
        /// <param name="configuration">Provider configuration</param>
        /// <param name="currentUser">User updating the configuration</param>
        /// <returns>Success status</returns>
        Task<bool> UpdateAsync(ProviderConfiguration configuration, string? currentUser = null);

        /// <summary>
        /// Delete a provider configuration (soft delete)
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <param name="currentUser">User deleting the configuration</param>
        /// <returns>Success status</returns>
        Task<bool> DeleteAsync(int id, string? currentUser = null);

        /// <summary>
        /// Set a provider as the default
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <param name="currentUser">User making the change</param>
        /// <returns>Success status</returns>
        Task<bool> SetDefaultAsync(string providerName, string? currentUser = null);

        /// <summary>
        /// Enable or disable a provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <param name="enabled">Enable/disable flag</param>
        /// <param name="currentUser">User making the change</param>
        /// <returns>Success status</returns>
        Task<bool> SetEnabledAsync(string providerName, bool enabled, string? currentUser = null);

        /// <summary>
        /// Map a vehicle to a specific provider with device metadata
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="providerName">Provider name</param>
        /// <param name="externalDeviceId">External device ID in provider's system</param>
        /// <param name="deviceIMEI">Device IMEI number</param>
        /// <param name="deviceName">Device name from provider</param>
        /// <param name="deviceType">Device type/model</param>
        /// <param name="metadata">Additional device metadata (JSON string)</param>
        /// <param name="currentUser">User creating the mapping</param>
        /// <returns>Success status</returns>
        Task<bool> MapVehicleToProviderAsync(
            int vehicleId,
            string providerName,
            string? externalDeviceId = null,
            string? deviceIMEI = null,
            string? deviceName = null,
            string? deviceType = null,
            string? metadata = null,
            string? currentUser = null);

        /// <summary>
        /// Remove vehicle-to-provider mapping
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <param name="currentUser">User removing the mapping</param>
        /// <returns>Success status</returns>
        Task<bool> UnmapVehicleFromProviderAsync(int vehicleId, string? currentUser = null);

        /// <summary>
        /// Get vehicles mapped to a specific provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>List of vehicle IDs</returns>
        Task<List<int>> GetMappedVehiclesAsync(string providerName);

        /// <summary>
        /// Record provider health status
        /// </summary>
        /// <param name="status">Health status</param>
        /// <returns>Success status</returns>
        Task<bool> RecordHealthStatusAsync(ProviderHealthStatus status);

        /// <summary>
        /// Get health history for a provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <param name="from">Start date</param>
        /// <param name="to">End date</param>
        /// <param name="limit">Maximum number of records</param>
        /// <returns>List of health status records</returns>
        Task<List<ProviderHealthStatus>> GetHealthHistoryAsync(
            string providerName,
            DateTime from,
            DateTime to,
            int limit = 1000);

        /// <summary>
        /// Get latest health status for a provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Latest health status or null</returns>
        Task<ProviderHealthStatus?> GetLatestHealthStatusAsync(string providerName);
    }
}
