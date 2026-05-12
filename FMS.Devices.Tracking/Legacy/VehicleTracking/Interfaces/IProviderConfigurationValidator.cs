using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Infrastructure.VehicleTracking.Models;

namespace FMS.Infrastructure.VehicleTracking.Interfaces
{
    /// <summary>
    /// Service for validating provider configurations
    /// </summary>
    public interface IProviderConfigurationValidator
    {
        /// <summary>
        /// Validate a provider configuration
        /// </summary>
        /// <param name="configuration">Configuration to validate</param>
        /// <returns>Validation result with any errors</returns>
        Task<FMSResponse<bool>> ValidateAsync(ProviderConfiguration configuration);

        /// <summary>
        /// Validate configuration schema (structure and required fields)
        /// </summary>
        /// <param name="configuration">Configuration to validate</param>
        /// <returns>Validation result</returns>
        FMSResponse<bool> ValidateSchema(ProviderConfiguration configuration);

        /// <summary>
        /// Validate configuration values (test connection, validate credentials)
        /// </summary>
        /// <param name="configuration">Configuration to validate</param>
        /// <returns>Validation result</returns>
        Task<FMSResponse<bool>> ValidateValuesAsync(ProviderConfiguration configuration);

        /// <summary>
        /// Get validation errors for a configuration
        /// </summary>
        /// <param name="configuration">Configuration to check</param>
        /// <returns>List of validation errors</returns>
        List<string> GetValidationErrors(ProviderConfiguration configuration);

        /// <summary>
        /// Check if a configuration is valid
        /// </summary>
        /// <param name="configuration">Configuration to check</param>
        /// <returns>True if valid, false otherwise</returns>
        bool IsValid(ProviderConfiguration configuration);
    }
}
