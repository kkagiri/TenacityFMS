using System;
using System.Threading.Tasks;
using FMS.Application.Features.VehicleTracking.Services;
using FMS.Infrastructure.VehicleTracking.Models;
using Microsoft.Extensions.Logging;

namespace FMS.Infrastructure.VehicleTracking.Services
{
    /// <summary>
    /// Adapter that implements Application interface and delegates to Infrastructure implementation
    /// This maintains proper layering: Application -> Infrastructure (no circular dependency)
    /// </summary>
    public class ProviderConfigurationServiceAdapter : Application.Features.VehicleTracking.Services.IProviderConfigurationService
    {
        private readonly IProviderConfigurationService _innerService;
        private readonly ILogger<ProviderConfigurationServiceAdapter> _logger;

        public ProviderConfigurationServiceAdapter(
            IProviderConfigurationService innerService,
            ILogger<ProviderConfigurationServiceAdapter> logger)
        {
            _innerService = innerService ?? throw new ArgumentNullException(nameof(innerService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<ProviderConfigurationDto?> GetByNameAsync(string providerName)
        {
            var result = await _innerService.GetByNameAsync(providerName);
            return result != null ? MapToDto(result) : null;
        }

        public async Task<ProviderConfigurationDto?> GetByIdAsync(int id)
        {
            var result = await _innerService.GetByIdAsync(id);
            return result != null ? MapToDto(result) : null;
        }

        public async Task<bool> MapVehicleToProviderAsync(
            int vehicleId,
            string providerName,
            string? externalDeviceId = null,
            string? deviceIMEI = null,
            string? deviceName = null,
            string? deviceType = null,
            string? metadata = null,
            string? currentUser = null)
        {
            return await _innerService.MapVehicleToProviderAsync(
                vehicleId,
                providerName,
                externalDeviceId,
                deviceIMEI,
                deviceName,
                deviceType,
                metadata,
                currentUser);
        }

        public async Task<bool> UnmapVehicleFromProviderAsync(int vehicleId, string? currentUser = null)
        {
            return await _innerService.UnmapVehicleFromProviderAsync(vehicleId, currentUser);
        }

        private static ProviderConfigurationDto MapToDto(ProviderConfiguration config)
        {
            return new ProviderConfigurationDto
            {
                Id = config.Id,
                Name = config.Name,
                DisplayName = config.DisplayName,
                Description = config.Description,
                IsEnabled = config.IsEnabled,
                IsDefault = config.IsDefault
            };
        }
    }
}
