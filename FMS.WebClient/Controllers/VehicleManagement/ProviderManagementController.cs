using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace FMS.WebClient.Controllers.VehicleManagement
{
    /// <summary>
    /// API endpoints for managing vehicle tracking providers
    /// Phase 6: Health monitoring and provider management
    /// </summary>
    [ApiController]
    [Route("api/v1/providers")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ProviderManagementController(
        IVehicleTrackingService trackingService,
        IProviderConfigurationService configService,
        ILogger<ProviderManagementController> logger) : ControllerBase
    {
        private readonly IVehicleTrackingService _trackingService = trackingService;
        private readonly IProviderConfigurationService _configService = configService;
        private readonly ILogger<ProviderManagementController> _logger = logger;

        /// <summary>
        /// Get health status of all providers
        /// </summary>
        /// <returns>Dictionary of provider names to health status</returns>
        [HttpGet("health")]
        public async Task<IActionResult> GetProvidersHealth()
        {
            try
            {
                _logger.LogInformation("Getting health status for all providers");

                Dictionary<string, ProviderHealthStatus> healthStatuses = await _trackingService.GetProvidersHealthAsync();

                var response = healthStatuses.Select(kvp => new
                {
                    ProviderName = kvp.Key,
                    Status = kvp.Value.Status.ToString(),
                    kvp.Value.Message,
                    kvp.Value.ResponseTimeMs,
                    kvp.Value.CheckedAt,
                    IsHealthy = kvp.Value.Status == HealthStatus.Healthy
                }).ToList();

                return Ok(new
                {
                    Success = true,
                    Data = response,
                    TotalProviders = response.Count,
                    HealthyProviders = response.Count(p => p.IsHealthy),
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider health statuses");
                return StatusCode(500, new { Success = false, Message = "Failed to get provider health", Error = ex.Message });
            }
        }

        /// <summary>
        /// Get statistics about provider usage
        /// </summary>
        /// <returns>Provider usage statistics</returns>
        [HttpGet("statistics")]
        public async Task<IActionResult> GetProviderStatistics()
        {
            try
            {
                _logger.LogInformation("Getting provider statistics");

                ProviderUsageStatistics statistics = await _trackingService.GetProviderStatisticsAsync();

                return Ok(new
                {
                    Success = true,
                    Data = new
                    {
                        statistics.TotalRequests,
                        statistics.SuccessfulRequests,
                        statistics.FailedRequests,
                        statistics.FailoverCount,
                        statistics.AverageResponseTimeMs,
                        ProviderStats = statistics.ProviderStats.Select(kvp => new
                        {
                            ProviderName = kvp.Key,
                            kvp.Value.RequestCount,
                            kvp.Value.SuccessCount,
                            kvp.Value.FailureCount,
                            SuccessRate = kvp.Value.RequestCount > 0
                                ? (double)kvp.Value.SuccessCount / kvp.Value.RequestCount * 100
                                : 0,
                            kvp.Value.AverageResponseTimeMs,
                            kvp.Value.LastRequestTime,
                            HealthStatus = kvp.Value.HealthStatus.ToString()
                        }).ToList()
                    },
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider statistics");
                return StatusCode(500, new { Success = false, Message = "Failed to get provider statistics", Error = ex.Message });
            }
        }

        /// <summary>
        /// Get list of all configured providers
        /// </summary>
        /// <returns>List of provider configurations</returns>
        [HttpGet("list")]
        public async Task<IActionResult> GetAllProviders()
        {
            try
            {
                _logger.LogInformation("Getting all provider configurations");

                // Use service contract method
                List<ProviderConfiguration> providers = await _configService.GetAllAsync(includeDisabled: true);

                return Ok(new
                {
                    Success = true,
                    Data = providers.Select(p => new
                    {
                        ProviderId = p.Id,
                        ProviderName = p.Name,
                        p.DisplayName,
                        p.Description,
                        p.IsEnabled,
                        p.IsDefault,
                        PriorityOrder = p.Priority,
                        ConfigurationData = p.Settings,
                        p.CreatedAt,
                        p.UpdatedAt
                    }).ToList(),
                    providers.Count,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider list");
                return StatusCode(500, new { Success = false, Message = "Failed to get provider list", Error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific provider configuration by ID
        /// </summary>
        /// <param name="providerId">Provider ID</param>
        /// <returns>Provider configuration</returns>
        [HttpGet("{providerId}")]
        public async Task<IActionResult> GetProvider(int providerId)
        {
            try
            {
                _logger.LogInformation("Getting provider configuration for ID {ProviderId}", providerId);

                ProviderConfiguration? provider = await _configService.GetByIdAsync(providerId);

                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {providerId} not found" });
                }

                return Ok(new
                {
                    Success = true,
                    Data = new
                    {
                        ProviderId = provider.Id,
                        ProviderName = provider.Name,
                        provider.DisplayName,
                        provider.Description,
                        provider.IsEnabled,
                        provider.IsDefault,
                        PriorityOrder = provider.Priority,
                        ConfigurationData = provider.Settings,
                        provider.CreatedAt,
                        provider.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider {ProviderId}", providerId);
                return StatusCode(500, new { Success = false, Message = "Failed to get provider", Error = ex.Message });
            }
        }

        /// <summary>
        /// Update provider configuration
        /// </summary>
        /// <param name="providerId">Provider ID</param>
        /// <param name="request">Update request</param>
        /// <returns>Updated configuration</returns>
        [HttpPut("{providerId}")]
        public async Task<IActionResult> UpdateProvider(int providerId, [FromBody] UpdateProviderRequest request)
        {
            try
            {
                _logger.LogInformation("Updating provider {ProviderId}", providerId);

                ProviderConfiguration? provider = await _configService.GetByIdAsync(providerId);
                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {providerId} not found" });
                }

                // Update fields
                if (request.DisplayName != null)
                {
                    provider.DisplayName = request.DisplayName;
                }
                if (request.Description != null)
                {
                    provider.Description = request.Description;
                }
                if (request.ConfigurationData != null)
                {
                    provider.Settings = request.ConfigurationData;
                }
                if (request.IsEnabled.HasValue)
                {
                    provider.IsEnabled = request.IsEnabled.Value;
                }
                if (request.IsDefault.HasValue)
                {
                    provider.IsDefault = request.IsDefault.Value;
                }
                if (request.PriorityOrder.HasValue)
                {
                    provider.Priority = request.PriorityOrder.Value;
                }

                // Persist via service contract
                await _configService.UpdateAsync(provider);

                // Reload providers to apply changes
                await _trackingService.ReloadProvidersAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Provider updated successfully",
                    Data = provider
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating provider {ProviderId}", providerId);
                return StatusCode(500, new { Success = false, Message = "Failed to update provider", Error = ex.Message });
            }
        }

        /// <summary>
        /// Test connectivity to a specific provider
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Connection test result</returns>
        [HttpPost("{providerName}/test")]
        public async Task<IActionResult> TestProviderConnection(string providerName)
        {
            try
            {
                _logger.LogInformation("Testing connection to provider {ProviderName}", providerName);

                bool isConnected = await _trackingService.TestProviderConnectivityAsync(providerName);

                return Ok(new
                {
                    Success = true,
                    Data = new
                    {
                        ProviderName = providerName,
                        IsConnected = isConnected,
                        Message = isConnected
                            ? $"Successfully connected to {providerName}"
                            : $"Failed to connect to {providerName}",
                        TestedAt = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing provider {ProviderName}", providerName);
                return Ok(new
                {
                    Success = false,
                    Data = new
                    {
                        ProviderName = providerName,
                        IsConnected = false,
                        Message = $"Error testing connection: {ex.Message}",
                        TestedAt = DateTime.UtcNow
                    }
                });
            }
        }

        /// <summary>
        /// Reload all provider configurations
        /// </summary>
        /// <returns>Reload result</returns>
        [HttpPost("reload")]
        public async Task<IActionResult> ReloadProviders()
        {
            try
            {
                _logger.LogInformation("Reloading all provider configurations");

                await _trackingService.ReloadProvidersAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Providers reloaded successfully",
                    ReloadedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reloading providers");
                return StatusCode(500, new { Success = false, Message = "Failed to reload providers", Error = ex.Message });
            }
        }

        /// <summary>
        /// Get vehicle-to-provider mappings
        /// </summary>
        /// <param name="vehicleId">Optional vehicle ID filter</param>
        /// <returns>List of mappings</returns>
        [HttpGet("mappings")]
        public async Task<IActionResult> GetVehicleProviderMappings([FromQuery] int? vehicleId = null)
        {
            try
            {
                _logger.LogInformation("Getting vehicle-provider mappings");

                if (vehicleId.HasValue)
                {
                    // Single vehicle mapping: return provider name (if any)
                    ProviderConfiguration? config = await _configService.GetForVehicleAsync(vehicleId.Value);
                    List<object> data = config == null
                        ? []
                        : [new { VehicleId = vehicleId.Value, ProviderName = config.Name }];

                    return Ok(new
                    {
                        Success = true,
                        Data = data,
                        data.Count,
                        Timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    // Aggregate: provider -> vehicleIds
                    List<ProviderConfiguration> providers = await _configService.GetAllAsync(includeDisabled: false);
                    List<object> result = [];
                    foreach (ProviderConfiguration p in providers)
                    {
                        List<int> vehicleIds = await _configService.GetMappedVehiclesAsync(p.Name);
                        foreach (int vid in vehicleIds)
                        {
                            result.Add(new { VehicleId = vid, ProviderName = p.Name });
                        }
                    }

                    return Ok(new
                    {
                        Success = true,
                        Data = result,
                        result.Count,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle-provider mappings");
                return StatusCode(500, new { Success = false, Message = "Failed to get mappings", Error = ex.Message });
            }
        }

        /// <summary>
        /// Assign a vehicle to a specific provider
        /// </summary>
        /// <param name="request">Assignment request</param>
        /// <returns>Assignment result</returns>
        [HttpPost("mappings")]
        public async Task<IActionResult> AssignVehicleToProvider([FromBody] VehicleProviderAssignmentRequest request)
        {
            try
            {
                _logger.LogInformation("Assigning vehicle {VehicleId} to provider {ProviderId}",
                    request.VehicleId, request.ProviderId);

                // Look up provider by ID to get its name (service expects providerName)
                ProviderConfiguration? provider = await _configService.GetByIdAsync(request.ProviderId);
                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {request.ProviderId} not found" });
                }

                bool ok = await _configService.MapVehicleToProviderAsync(request.VehicleId, provider.Name);
                if (!ok)
                {
                    return StatusCode(500, new { Success = false, Message = "Failed to assign vehicle" });
                }

                return Ok(new
                {
                    Success = true,
                    Message = $"Vehicle {request.VehicleId} assigned to provider successfully",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning vehicle {VehicleId} to provider {ProviderId}",
                    request.VehicleId, request.ProviderId);
                return StatusCode(500, new { Success = false, Message = "Failed to assign vehicle", Error = ex.Message });
            }
        }
    }

    /// <summary>
    /// Request model for updating provider configuration
    /// </summary>
    public class UpdateProviderRequest
    {
        public string? DisplayName { get; set; }
        public string? Description { get; set; }
        public string? ConfigurationData { get; set; }
        public bool? IsEnabled { get; set; }
        public bool? IsDefault { get; set; }
        public int? PriorityOrder { get; set; }
    }

    /// <summary>
    /// Request model for vehicle-provider assignment
    /// </summary>
    public class VehicleProviderAssignmentRequest
    {
        public int VehicleId { get; set; }
        public int ProviderId { get; set; }
    }
}
