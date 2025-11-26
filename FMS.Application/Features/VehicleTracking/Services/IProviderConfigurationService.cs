using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FMS.Application.Features.VehicleTracking.Services
{
    /// <summary>
    /// Service interface for managing provider configurations
    /// </summary>
    public interface IProviderConfigurationService
    {
        /// <summary>
        /// Get provider configuration by name
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Provider configuration or null</returns>
        Task<ProviderConfigurationDto?> GetByNameAsync(string providerName);

        /// <summary>
        /// Get provider configuration by ID
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Provider configuration or null</returns>
        Task<ProviderConfigurationDto?> GetByIdAsync(int id);

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
    }

    /// <summary>
    /// Minimal DTO for provider configuration to avoid Infrastructure dependency
    /// </summary>
    public class ProviderConfigurationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsEnabled { get; set; }
        public bool IsDefault { get; set; }
    }
}
