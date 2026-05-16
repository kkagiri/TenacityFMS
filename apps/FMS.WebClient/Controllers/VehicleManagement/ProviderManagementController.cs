/**
 * File: ProviderManagementController.cs
 * Purpose: Manages tracking-provider configuration, health, and vehicle mapping operations.
 * Dependencies: MediatR, provider services, SignalR hub, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - BulkAssignVehiclesToProvider(): Starts bulk provider assignment jobs.
 * - BulkUnassignVehiclesFromProvider(): Starts bulk unassignment jobs.
 * - AssignVehicleToProvider(): Assigns a single vehicle to a provider.
 */
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.VehicleTracking.Commands.AssignVehicleToProvider;
using FMS.Application.Features.VehicleTracking.Commands.BulkAssignVehiclesToProvider;
using FMS.Application.Features.VehicleTracking.Commands.BulkUnassignVehiclesFromProvider;
using FMS.Application.Features.VehicleTracking.Commands.MapVehicleToDevice;
using FMS.Application.Features.VehicleTracking.Commands.UnassignVehicleFromProvider;
using FMS.Application.Features.VehicleTracking.DTOs;
using FMS.Application.Features.VehicleTracking.Queries.GetVehicleProviderMappings;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Services;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FMS.WebClient.Attributes;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.MultiTenancy.Services;
using FMS.Domain.Entities.Devices;


namespace FMS.WebClient.Controllers.VehicleManagement
{
    /// <summary>
    /// API endpoints for managing vehicle tracking providers
    /// Phase 6: Health monitoring and provider management
    /// </summary>
    [ApiController]
    [Route("api/v1/providers")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RejectCustomerTenant]
    public class ProviderManagementController(
        IMediator mediator,
        IVehicleTrackingService trackingService,
        IProviderConfigurationService configService,
        IProviderFactory providerFactory,
        GpsdataContext context,
        ITenantContext tenantContext,
        ILogger<ProviderManagementController> logger,
        IServiceScopeFactory serviceScopeFactory,
        IHubContext<FrontEndHub> hubContext) : ControllerBase
    {
        private readonly IMediator _mediator = mediator;
        private readonly IVehicleTrackingService _trackingService = trackingService;
        private readonly IProviderConfigurationService _configService = configService;
        private readonly IProviderFactory _providerFactory = providerFactory;
        private readonly GpsdataContext _context = context;
        private readonly ITenantContext _tenantContext = tenantContext;
        private readonly ILogger<ProviderManagementController> _logger = logger;
        private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
        private readonly IHubContext<FrontEndHub> _hubContext = hubContext;

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? string.Empty;

            return Guid.TryParse(userId, out _);
        }

        private IQueryable<ProviderConfigurationEntity> ProviderQuery() =>
            _context.ProviderConfigurations.Where(p => !_tenantContext.HasTenant || _tenantContext.IsCrossTenant || p.TenantId == _tenantContext.TenantId);

        private static object MapProviderResponse(ProviderConfigurationEntity provider) => new
        {
            ProviderId = provider.Id,
            ProviderName = provider.Name,
            provider.DisplayName,
            provider.Description,
            provider.DeviceCategory,
            provider.IsEnabled,
            provider.IsDefault,
            PriorityOrder = provider.Priority,
            ConfigurationData = provider.Settings,
            provider.CreatedAt,
            provider.UpdatedAt
        };

        private static List<string> ValidateProviderRequest(string? providerName, string? displayName, string? deviceCategory)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(providerName))
            {
                errors.Add("Provider name is required.");
            }

            if (string.IsNullOrWhiteSpace(displayName))
            {
                errors.Add("Display name is required.");
            }

            if (string.IsNullOrWhiteSpace(deviceCategory))
            {
                errors.Add("Device category is required.");
            }

            return errors;
        }

        /// <summary>
        /// Get health status of all providers
        /// </summary>
        /// <returns>Dictionary of provider names to health status</returns>
        [HttpGet("health")]
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
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
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
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
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> GetAllProviders()
        {
            try
            {
                _logger.LogInformation("Getting all provider configurations");

                var providers = await ProviderQuery()
                    .AsNoTracking()
                    .OrderBy(p => p.Priority)
                    .ThenBy(p => p.Name)
                    .ToListAsync();

                return Ok(new
                {
                    Success = true,
                    Data = providers.Select(MapProviderResponse).ToList(),
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
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> GetProvider(int providerId)
        {
            try
            {
                _logger.LogInformation("Getting provider configuration for ID {ProviderId}", providerId);

                var provider = await ProviderQuery()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == providerId);

                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {providerId} not found" });
                }

                return Ok(new
                {
                    Success = true,
                    Data = MapProviderResponse(provider)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting provider {ProviderId}", providerId);
                return StatusCode(500, new { Success = false, Message = "Failed to get provider", Error = ex.Message });
            }
        }

        [HttpPost]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> CreateProvider([FromBody] CreateProviderRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(FMSResponse.ValidationFailed(new List<string> { "Provider request is required." }));
                }

                var errors = ValidateProviderRequest(request.ProviderName, request.DisplayName, request.DeviceCategory);
                if (errors.Count > 0)
                {
                    return BadRequest(FMSResponse.ValidationFailed(errors));
                }

                if (!_tenantContext.HasTenant)
                {
                    return BadRequest(FMSResponse.FailedResponse("Tenant context is required.", "TENANT_REQUIRED"));
                }

                var normalizedName = request.ProviderName.Trim();
                var duplicate = await ProviderQuery()
                    .AnyAsync(p => p.Name == normalizedName);

                if (duplicate)
                {
                    return Conflict(FMSResponse.Conflict("DEVICE_PROVIDER_EXISTS", "A provider with this name already exists for this tenant."));
                }

                if (request.IsDefault == true)
                {
                    var existingDefaults = await ProviderQuery()
                        .Where(p => p.DeviceCategory == request.DeviceCategory.Trim() && p.IsDefault)
                        .ToListAsync();

                    foreach (var existingDefault in existingDefaults)
                    {
                        existingDefault.IsDefault = false;
                        existingDefault.UpdatedAt = DateTime.UtcNow;
                    }
                }

                var provider = new ProviderConfigurationEntity
                {
                    TenantId = _tenantContext.TenantId,
                    Name = normalizedName,
                    DisplayName = request.DisplayName.Trim(),
                    Description = request.Description,
                    DeviceCategory = request.DeviceCategory.Trim(),
                    Settings = string.IsNullOrWhiteSpace(request.ConfigurationData) ? "{}" : request.ConfigurationData,
                    IsEnabled = request.IsEnabled ?? true,
                    IsDefault = request.IsDefault ?? false,
                    Priority = request.PriorityOrder ?? 999,
                    Version = string.IsNullOrWhiteSpace(request.Version) ? "1.0.0" : request.Version.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")
                };

                _context.ProviderConfigurations.Add(provider);
                await _context.SaveChangesAsync();
                await _trackingService.ReloadProvidersAsync();

                return CreatedAtAction(
                    nameof(GetProvider),
                    new { providerId = provider.Id },
                    new
                    {
                        Success = true,
                        Message = "Provider created successfully",
                        Data = MapProviderResponse(provider)
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating provider {ProviderName}", request?.ProviderName);
                return StatusCode(500, new { Success = false, Message = "Failed to create provider", Error = ex.Message });
            }
        }

        /// <summary>
        /// Update provider configuration
        /// </summary>
        /// <param name="providerId">Provider ID</param>
        /// <param name="request">Update request</param>
        /// <returns>Updated configuration</returns>
        [HttpPut("{providerId}")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> UpdateProvider(int providerId, [FromBody] UpdateProviderRequest request)
        {
            try
            {
                _logger.LogInformation("Updating provider {ProviderId}", providerId);

                var provider = await ProviderQuery().FirstOrDefaultAsync(p => p.Id == providerId);
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
                if (request.DeviceCategory != null)
                {
                    var category = request.DeviceCategory.Trim();
                    if (string.IsNullOrWhiteSpace(category))
                    {
                        return BadRequest(FMSResponse.ValidationFailed(new List<string> { "Device category is required." }));
                    }

                    provider.DeviceCategory = category;
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

                if (provider.IsDefault)
                {
                    var existingDefaults = await ProviderQuery()
                        .Where(p => p.Id != provider.Id && p.DeviceCategory == provider.DeviceCategory && p.IsDefault)
                        .ToListAsync();

                    foreach (var existingDefault in existingDefaults)
                    {
                        existingDefault.IsDefault = false;
                        existingDefault.UpdatedAt = DateTime.UtcNow;
                    }
                }

                provider.UpdatedAt = DateTime.UtcNow;
                provider.UpdatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

                await _context.SaveChangesAsync();

                // Reload providers to apply changes
                await _trackingService.ReloadProvidersAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Provider updated successfully",
                    Data = MapProviderResponse(provider)
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
        [RequirePermission(Permissions.DeviceProvider.Manage)]
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
        /// Comprehensive diagnostic test for provider
        /// Tests configuration, initialization, and API connectivity
        /// GET /api/v1/providers/{providerName}/diagnose
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Detailed diagnostic information</returns>
        [HttpGet("{providerName}/diagnose")]
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> DiagnoseProvider(string providerName)
        {
            var diagnostics = new Dictionary<string, object>
            {
                ["providerName"] = providerName,
                ["timestamp"] = DateTime.UtcNow,
                ["tests"] = new List<Dictionary<string, object>>()
            };

            var tests = (List<Dictionary<string, object>>)diagnostics["tests"];

            try
            {
                // Test 1: Configuration exists
                _logger.LogInformation("DIAGNOSTIC: Checking provider configuration");
                ProviderConfiguration config;
                try
                {
                    var configs = await _configService.GetAllAsync(includeDisabled: true);
                    config = configs.FirstOrDefault(c => c.Name.Equals(providerName, StringComparison.OrdinalIgnoreCase));

                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "1. Configuration Exists",
                        ["status"] = config != null ? "✓ PASS" : "✗ FAIL",
                        ["details"] = config != null
                            ? $"Found config ID: {config.Id}, Enabled: {config.IsEnabled}, Settings: {config.Settings?.Length ?? 0} chars"
                            : "Configuration not found in database"
                    });

                    if (config == null)
                    {
                        return Ok(new { success = false, message = "Provider configuration not found", diagnostics });
                    }
                }
                catch (Exception ex)
                {
                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "1. Configuration Exists",
                        ["status"] = "⚠ ERROR",
                        ["error"] = ex.Message
                    });
                    return Ok(new { success = false, diagnostics });
                }

                // Test 2: Parse settings
                _logger.LogInformation("DIAGNOSTIC: Parsing settings");
                try
                {
                    var apiKey = config.GetValue<string>("ApiKey");
                    var baseUrl = config.GetValue<string>("BaseUrl");
                    var appId = config.GetValue<string>("ApplicationId");

                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "2. Configuration Parsing",
                        ["status"] = "✓ PASS",
                        ["details"] = $"ApiKey: {(string.IsNullOrEmpty(apiKey) ? "Missing!" : $"{apiKey.Length} chars")}, BaseUrl: {baseUrl}, AppId: {appId}"
                    });
                }
                catch (Exception ex)
                {
                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "2. Configuration Parsing",
                        ["status"] = "⚠ ERROR",
                        ["error"] = $"{ex.GetType().Name}: {ex.Message}"
                    });
                }

                // Test 3: Create provider
                _logger.LogInformation("DIAGNOSTIC: Creating provider instance");
                try
                {
                    var provider = await _providerFactory.CreateProviderAsync(providerName);

                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "3. Provider Instance",
                        ["status"] = provider != null ? "✓ PASS" : "✗ FAIL",
                        ["details"] = provider != null ? $"{provider.ProviderName} v{provider.ProviderVersion}" : "Null"
                    });

                    if (provider != null)
                    {
                        // Test 4: Initialize
                        try
                        {
                            var initResult = await provider.InitializeAsync(config);

                            tests.Add(new Dictionary<string, object>
                            {
                                ["test"] = "4. Initialize Provider",
                                ["status"] = initResult.IsSuccess ? "✓ PASS" : "✗ FAIL",
                                ["details"] = initResult.Message
                            });

                            if (initResult.IsSuccess)
                            {
                                // Test 5: Validate connection
                                try
                                {
                                    var connResult = await provider.ValidateConnectionAsync();
                                    tests.Add(new Dictionary<string, object>
                                    {
                                        ["test"] = "5. Connection Validation",
                                        ["status"] = connResult.IsSuccess ? "✓ PASS" : "✗ FAIL",
                                        ["details"] = connResult.Message
                                    });
                                }
                                catch (Exception ex)
                                {
                                    tests.Add(new Dictionary<string, object>
                                    {
                                        ["test"] = "5. Connection Validation",
                                        ["status"] = "⚠ ERROR",
                                        ["error"] = ex.Message
                                    });
                                }

                                // Test 6: Get devices
                                try
                                {
                                    var devicesResult = await provider.GetAllDevicesAsync();
                                    tests.Add(new Dictionary<string, object>
                                    {
                                        ["test"] = "6. Fetch Devices",
                                        ["status"] = devicesResult.IsSuccess ? "✓ PASS" : "✗ FAIL",
                                        ["details"] = devicesResult.IsSuccess
                                            ? $"Found {devicesResult.Data?.Count ?? 0} devices"
                                            : devicesResult.Message,
                                        ["sampleDevices"] = devicesResult.Data?.Take(3).Select(d => new { d.Id, d.Name, d.Username, d.IsOnline })
                                    });
                                }
                                catch (Exception ex)
                                {
                                    tests.Add(new Dictionary<string, object>
                                    {
                                        ["test"] = "6. Fetch Devices",
                                        ["status"] = "⚠ ERROR",
                                        ["error"] = $"{ex.GetType().Name}: {ex.Message}"
                                    });
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            tests.Add(new Dictionary<string, object>
                            {
                                ["test"] = "4. Initialize Provider",
                                ["status"] = "⚠ ERROR",
                                ["error"] = $"{ex.GetType().Name}: {ex.Message}",
                                ["details"] = ex.StackTrace?.Split('\n').Take(5)
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    tests.Add(new Dictionary<string, object>
                    {
                        ["test"] = "3. Provider Instance",
                        ["status"] = "⚠ ERROR",
                        ["error"] = ex.Message
                    });
                }

                var passCount = tests.Count(t => t["status"].ToString().Contains("PASS"));
                var failCount = tests.Count(t => t["status"].ToString().Contains("FAIL"));
                var errorCount = tests.Count(t => t["status"].ToString().Contains("ERROR"));

                diagnostics["summary"] = new
                {
                    total = tests.Count,
                    passed = passCount,
                    failed = failCount,
                    errors = errorCount,
                    status = errorCount > 0 ? "⚠ ERRORS" : (failCount > 0 ? "✗ FAILED" : "✓ SUCCESS")
                };

                return Ok(new { success = passCount > 0 && errorCount == 0, diagnostics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DIAGNOSTIC: Unexpected error");
                diagnostics["fatalError"] = ex.Message;
                return Ok(new { success = false, diagnostics });
            }
        }

        /// <summary>
        /// Reload all provider configurations
        /// </summary>
        /// <returns>Reload result</returns>
        [HttpPost("reload")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
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
        /// Get vehicle-to-provider mappings with device information
        /// </summary>
        /// <param name="vehicleId">Optional vehicle ID filter</param>
        /// <returns>List of mappings with device details</returns>
        [HttpGet("mappings")]
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> GetVehicleProviderMappings([FromQuery] int? vehicleId = null)
        {
            try
            {
                _logger.LogInformation("Getting vehicle-provider mappings{Filter}",
                    vehicleId.HasValue ? $" for vehicle {vehicleId}" : "");

                var query = new GetVehicleProviderMappingsQuery { VehicleId = vehicleId };
                var result = await _mediator.Send(query);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                return Ok(new
                {
                    Success = true,
                    Data = result.Data,
                    Count = result.Data?.Count ?? 0,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting vehicle-provider mappings");
                return StatusCode(500, new { Success = false, Message = "Failed to get mappings", Error = ex.Message });
            }
        }

        /// <summary>
        /// Bulk assign multiple vehicles to a provider (async job)
        /// </summary>
        /// <param name="request">Bulk assignment request</param>
        /// <returns>Job initiation result with job ID</returns>
        [HttpPost("mappings/bulk")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> BulkAssignVehiclesToProvider([FromBody] BulkAssignmentRequestDTO request)
        {
            try
            {
                _logger.LogInformation("Initiating bulk assignment of {Count} vehicles to provider {ProviderId}",
                    request.VehicleIds.Count, request.ProviderId);

                if (!TryGetCurrentUserId(out var userId))
                {
                    return BadRequest("Invalid User ID");
                }

                var command = new BulkAssignVehiclesToProviderCommand
                {
                    ProviderId = request.ProviderId,
                    VehicleIds = request.VehicleIds,
                    Assignments = request.Assignments,
                    UserId = userId
                };

                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return BadRequest(result);
                }

                // Return immediately with job ID
                return Accepted(new
                {
                    Success = true,
                    Message = result.Message,
                    JobId = result.Data,
                    VehicleCount = request.Assignments?.Count > 0 ? request.Assignments.Count : request.VehicleIds.Count,
                    EstimatedSeconds = (request.Assignments?.Count > 0 ? request.Assignments.Count : request.VehicleIds.Count) * 0.5,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating bulk assignment to provider {ProviderId}", request.ProviderId);
                return StatusCode(500, new { Success = false, Message = "Failed to start bulk assignment job", Error = ex.Message });
            }
        }

        /// <summary>
        /// Bulk unassign multiple vehicles from their providers (async job)
        /// </summary>
        /// <param name="request">Bulk unassignment request</param>
        /// <returns>Job initiation result with job ID</returns>
        [HttpPost("mappings/bulk/unassign")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> BulkUnassignVehiclesFromProvider([FromBody] BulkVehicleUnassignmentRequest request)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                {
                    return BadRequest("Invalid User ID");
                }

                // Use MediatR command
                var command = new BulkUnassignVehiclesFromProviderCommand(
                    request.VehicleIds,
                    userId);

                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = result.Message
                    });
                }

                // Return immediately with job ID
                return Accepted(new
                {
                    Success = true,
                    Message = result.Message,
                    JobId = result.Data,
                    VehicleCount = request.VehicleIds.Count,
                    EstimatedSeconds = request.VehicleIds.Count * 0.3, // Unassign is faster
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating bulk unassignment");
                return StatusCode(500, new { Success = false, Message = "Failed to start bulk unassignment job", Error = ex.Message });
            }
        }

        /// <summary>
        /// Assign a vehicle to a provider with device metadata
        /// </summary>
        /// <param name="request">Device mapping request</param>
        /// <returns>Assignment result</returns>
        [HttpPost("mappings/device")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> MapVehicleToDevice([FromBody] DeviceMappingRequest request)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

                // Use MediatR command
                var command = new MapVehicleToDeviceCommand
                {
                    VehicleId = request.VehicleId,
                    ProviderId = request.ProviderId,
                    ProviderName = request.ProviderName,
                    ExternalDeviceId = request.ExternalDeviceId ?? string.Empty,
                    DeviceIMEI = request.DeviceIMEI,
                    DeviceName = request.DeviceName,
                    DeviceType = request.DeviceType,
                    Metadata = request.Metadata,
                    UserId = userId
                };

                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = result.Message
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = result.Message,
                    Data = new
                    {
                        VehicleId = request.VehicleId,
                        ExternalDeviceId = request.ExternalDeviceId,
                        DeviceIMEI = request.DeviceIMEI,
                        DeviceName = request.DeviceName,
                        DeviceType = request.DeviceType
                    },
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping vehicle {VehicleId} to device", request.VehicleId);
                return StatusCode(500, new { Success = false, Message = "Failed to map vehicle to device", Error = ex.Message });
            }
        }

        /// <summary>
        /// Assign a vehicle to a specific provider
        /// </summary>
        /// <param name="request">Assignment request</param>
        /// <returns>Assignment result</returns>
        [HttpPost("mappings")]
        [RequirePermission(Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> AssignVehicleToProvider([FromBody] VehicleProviderAssignmentRequest request)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

                // Use MediatR command
                var command = new AssignVehicleToProviderCommand
                {
                    VehicleId = request.VehicleId,
                    ProviderId = request.ProviderId,
                    ExternalDeviceId = request.ExternalDeviceId,
                    UserId = userId
                };

                var result = await _mediator.Send(command);

                if (!result.IsSuccess)
                {
                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = result.Message
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = result.Message,
                    Data = result.Data,
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

        /// <summary>
        /// Get all GPS devices from the tracking provider
        /// Used for mapping devices to vehicles
        /// </summary>
        /// <param name="providerName">Provider name (optional, defaults to active provider)</param>
        /// <returns>List of GPS devices with mapping status</returns>
        [HttpGet("devices")]
        [RequirePermission(Permissions.DeviceProvider.Read, Permissions.DeviceProvider.Manage)]
        public async Task<IActionResult> GetAllProviderDevices([FromQuery] string? providerName = null)
        {
            try
            {
                _logger.LogInformation("Getting all devices from provider: {ProviderName}", providerName ?? "default");

                // Get provider configuration
                ProviderConfiguration? providerConfig = string.IsNullOrEmpty(providerName)
                    ? await _configService.GetDefaultAsync()
                    : await _configService.GetByNameAsync(providerName);

                if (providerConfig == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = string.IsNullOrEmpty(providerName)
                            ? "No default provider configured"
                            : $"Provider '{providerName}' not found"
                    });
                }

                // Get provider instance from factory
                var provider = await _providerFactory.CreateProviderAsync(providerConfig.Name);
                if (provider == null)
                {
                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = $"Failed to initialize provider '{providerConfig.Name}'"
                    });
                }

                // Get devices from provider
                var devicesResult = await provider.GetAllDevicesAsync();

                if (!devicesResult.IsSuccess)
                {
                    return StatusCode(500, new
                    {
                        Success = false,
                        Message = devicesResult.Message
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = devicesResult.Data,
                    TotalDevices = devicesResult.Data?.Count ?? 0,
                    MappedDevices = devicesResult.Data?.Count(d => d.IsMapped) ?? 0,
                    UnmappedDevices = devicesResult.Data?.Count(d => !d.IsMapped) ?? 0,
                    ProviderName = provider.ProviderName,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting devices from provider: {ProviderName}", providerName);
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Failed to get devices from provider",
                    Error = ex.Message
                });
            }
        }
    }

    /// <summary>
    /// Request model for device mapping with metadata
    /// </summary>
    public class DeviceMappingRequest
    {
        public int VehicleId { get; set; }
        public int? ProviderId { get; set; }
        public string? ProviderName { get; set; }
        public string? ExternalDeviceId { get; set; }
        public string? DeviceIMEI { get; set; }
        public string? DeviceName { get; set; }
        public string? DeviceType { get; set; }
        public string? Metadata { get; set; }
    }

    /// <summary>
    /// Request model for creating provider configuration
    /// </summary>
    public class CreateProviderRequest
    {
        public string ProviderName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DeviceCategory { get; set; } = "Tracking";
        public string? Version { get; set; }
        public string? ConfigurationData { get; set; }
        public bool? IsEnabled { get; set; }
        public bool? IsDefault { get; set; }
        public int? PriorityOrder { get; set; }
    }

    /// <summary>
    /// Request model for updating provider configuration
    /// </summary>
    public class UpdateProviderRequest
    {
        public string? DisplayName { get; set; }
        public string? Description { get; set; }
        public string? DeviceCategory { get; set; }
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
        public string ExternalDeviceId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for bulk vehicle-provider unassignment
    /// </summary>
    public class BulkVehicleUnassignmentRequest
    {
        public List<int> VehicleIds { get; set; } = [];
    }
}
