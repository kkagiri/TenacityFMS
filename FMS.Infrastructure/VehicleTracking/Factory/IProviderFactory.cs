using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Factory
{
    /// <summary>
    /// Factory interface for creating and managing vehicle tracking provider instances
    /// </summary>
    public interface IProviderFactory
    {
        /// <summary>
        /// Create a provider instance by name
        /// </summary>
        /// <param name="providerName">Name of the provider (e.g., "GPSGate", "Geotab")</param>
        /// <returns>Provider instance or null if not found</returns>
        Task<IVehicleTrackingProvider?> CreateProviderAsync(string providerName);

        /// <summary>
        /// Create a provider instance by ID
        /// </summary>
        /// <param name="providerId">Provider configuration ID</param>
        /// <returns>Provider instance or null if not found</returns>
        Task<IVehicleTrackingProvider?> CreateProviderByIdAsync(int providerId);

        /// <summary>
        /// Get the default provider instance
        /// </summary>
        /// <returns>Default provider instance or null if not configured</returns>
        Task<IVehicleTrackingProvider?> GetDefaultProviderAsync();

        /// <summary>
        /// Get the provider instance for a specific vehicle
        /// </summary>
        /// <param name="vehicleId">Vehicle ID</param>
        /// <returns>Provider instance for the vehicle or default provider</returns>
        Task<IVehicleTrackingProvider?> GetProviderForVehicleAsync(int vehicleId);

        /// <summary>
        /// Get all available provider instances
        /// </summary>
        /// <param name="includeDisabled">Include disabled providers</param>
        /// <returns>List of available provider instances</returns>
        Task<IEnumerable<IVehicleTrackingProvider>> GetAllProvidersAsync(bool includeDisabled = false);

        /// <summary>
        /// Get all enabled and healthy provider instances
        /// </summary>
        /// <returns>List of healthy provider instances</returns>
        Task<IEnumerable<IVehicleTrackingProvider>> GetHealthyProvidersAsync();

        /// <summary>
        /// Check if a provider exists and is available
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>True if provider exists and is enabled</returns>
        Task<bool> IsProviderAvailableAsync(string providerName);

        /// <summary>
        /// Reload provider instances (for configuration changes)
        /// </summary>
        Task ReloadProvidersAsync();

        /// <summary>
        /// Dispose a specific provider instance
        /// </summary>
        /// <param name="providerName">Provider name</param>
        Task DisposeProviderAsync(string providerName);

        /// <summary>
        /// Dispose all provider instances
        /// </summary>
        Task DisposeAllProvidersAsync();
    }
}
