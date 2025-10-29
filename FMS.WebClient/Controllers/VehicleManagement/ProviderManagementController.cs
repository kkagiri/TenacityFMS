using FMS.Application.Communication.SignalR;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Services;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;


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
        IProviderFactory providerFactory,
        ILogger<ProviderManagementController> logger,
        IServiceScopeFactory serviceScopeFactory,
        IHubContext<FrontEndHub> hubContext) : ControllerBase
    {
        private readonly IVehicleTrackingService _trackingService = trackingService;
        private readonly IProviderConfigurationService _configService = configService;
        private readonly IProviderFactory _providerFactory = providerFactory;
        private readonly ILogger<ProviderManagementController> _logger = logger;
        private readonly IServiceScopeFactory _serviceScopeFactory = serviceScopeFactory;
        private readonly IHubContext<FrontEndHub> _hubContext = hubContext;

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
        /// Comprehensive diagnostic test for provider
        /// Tests configuration, initialization, and API connectivity
        /// GET /api/v1/providers/{providerName}/diagnose
        /// </summary>
        /// <param name="providerName">Provider name</param>
        /// <returns>Detailed diagnostic information</returns>
        [HttpGet("{providerName}/diagnose")]
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
        public async Task<IActionResult> GetVehicleProviderMappings([FromQuery] int? vehicleId = null)
        {
            try
            {
                _logger.LogInformation("Getting vehicle-provider mappings with device info");

                if (vehicleId.HasValue)
                {
                    // Single vehicle mapping with full details
                    ProviderConfiguration? config = await _configService.GetForVehicleAsync(vehicleId.Value);

                    // Get full mapping details from database
                    using var scope = _serviceScopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                    var mapping = await context.VehicleProviderMappings
                        .Include(m => m.ProviderConfiguration)
                        .Include(m => m.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                        .Where(m => m.VehicleId == vehicleId.Value && m.IsActive)
                        .FirstOrDefaultAsync();

                    if (mapping == null)
                    {
                        return Ok(new
                        {
                            Success = true,
                            Data = new List<object>(),
                            Count = 0,
                            Timestamp = DateTime.UtcNow
                        });
                    }

                    var data = new
                    {
                        VehicleId = mapping.VehicleId,
                        VehicleName = mapping.Vehicle?.HyoungNo,
                        NumberPlate = mapping.Vehicle?.NumberPlate,
                        VehicleType = mapping.Vehicle?.VehicleType?.Name,
                        ProviderId = mapping.ProviderConfigId,
                        ProviderName = mapping.ProviderConfiguration?.Name,
                        ExternalDeviceId = mapping.ExternalDeviceId,
                        DeviceIMEI = mapping.DeviceIMEI,
                        DeviceName = mapping.DeviceName,
                        DeviceType = mapping.DeviceType,
                        IsActive = mapping.IsActive,
                        MappedAt = mapping.CreatedAt,
                        MappedBy = mapping.CreatedBy
                    };

                    return Ok(new
                    {
                        Success = true,
                        Data = new[] { data },
                        Count = 1,
                        Timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    // All mappings with full details
                    using var scope = _serviceScopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

                    var mappings = await context.VehicleProviderMappings
                        .Include(m => m.ProviderConfiguration)
                        .Include(m => m.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                        .Where(m => m.IsActive)
                        .ToListAsync();

                    var result = mappings.Select(m => new
                    {
                        VehicleId = m.VehicleId,
                        VehicleName = m.Vehicle?.HyoungNo,
                        NumberPlate = m.Vehicle?.NumberPlate,
                        VehicleType = m.Vehicle?.VehicleType?.Name,
                        ProviderId = m.ProviderConfigId,
                        ProviderName = m.ProviderConfiguration?.Name,
                        ExternalDeviceId = m.ExternalDeviceId,
                        DeviceIMEI = m.DeviceIMEI,
                        DeviceName = m.DeviceName,
                        DeviceType = m.DeviceType,
                        IsActive = m.IsActive,
                        MappedAt = m.CreatedAt,
                        MappedBy = m.CreatedBy
                    }).ToList();

                    return Ok(new
                    {
                        Success = true,
                        Data = result,
                        Count = result.Count,
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
        /// Bulk assign multiple vehicles to a provider (async job)
        /// </summary>
        /// <param name="request">Bulk assignment request</param>
        /// <returns>Job initiation result with job ID</returns>
        [HttpPost("mappings/bulk")]
        public async Task<IActionResult> BulkAssignVehiclesToProvider([FromBody] BulkVehicleProviderAssignmentRequest request)
        {
            try
            {
                _logger.LogInformation("Initiating bulk assignment of {Count} vehicles to provider {ProviderId}",
                    request.VehicleIds.Count, request.ProviderId);

                System.Security.Claims.Claim? userIdClaim = User.Claims.FirstOrDefault(c =>
                            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                            Guid.TryParse(c.Value, out _));

                if (userIdClaim == null)
                {
                    return BadRequest("Invalid User ID");
                }

                // Look up provider by ID
                ProviderConfiguration? provider = await _configService.GetByIdAsync(request.ProviderId);
                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {request.ProviderId} not found" });
                }

                // Generate job ID
                string jobId = Guid.NewGuid().ToString("N");

                // Start background task (fire and forget) with proper scoping
                _ = Task.Run(async () =>
                {
                    int successCount = 0;
                    int failCount = 0;
                    List<string> errors = [];

                    try
                    {
                        // Create a new scope for this background task
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedConfigService = scope.ServiceProvider.GetRequiredService<IProviderConfigurationService>();
                        var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<ProviderManagementController>>();

                        var startTime = DateTime.UtcNow;

                        foreach (int vehicleId in request.VehicleIds)
                        {
                            try
                            {
                                bool ok = await scopedConfigService.MapVehicleToProviderAsync(vehicleId, provider.Name, userIdClaim.Value);
                                if (ok)
                                {
                                    successCount++;
                                }
                                else
                                {
                                    failCount++;
                                    errors.Add($"Vehicle {vehicleId}: Mapping failed");
                                }

                                var processedCount = successCount + failCount;

                                // Broadcast progress every 50 vehicles or on completion
                                if (processedCount % 50 == 0 || processedCount == request.VehicleIds.Count)
                                {
                                    var progressPercentage = (int)Math.Round((double)processedCount / request.VehicleIds.Count * 100);
                                    var elapsed = (DateTime.UtcNow - startTime).TotalSeconds;
                                    var rate = processedCount / elapsed;
                                    var remainingSeconds = (int)Math.Ceiling((request.VehicleIds.Count - processedCount) / rate);

                                    await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                                    {
                                        JobId = jobId,
                                        Operation = "BulkAssign",
                                        ProviderId = request.ProviderId,
                                        ProviderName = provider.DisplayName,
                                        TotalVehicles = request.VehicleIds.Count,
                                        ProcessedVehicles = processedCount,
                                        SuccessCount = successCount,
                                        FailCount = failCount,
                                        ProgressPercentage = progressPercentage,
                                        EstimatedRemainingSeconds = remainingSeconds,
                                        IsComplete = processedCount == request.VehicleIds.Count,
                                        Timestamp = DateTime.UtcNow
                                    });

                                    scopedLogger.LogInformation(
                                        "Job {JobId}: Processed {Count}/{Total} vehicles ({SuccessCount} succeeded, {FailCount} failed) - {Percentage}% complete",
                                        jobId, processedCount, request.VehicleIds.Count, successCount, failCount, progressPercentage);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                errors.Add($"Vehicle {vehicleId}: {ex.Message}");
                                scopedLogger.LogError(ex, "Job {JobId}: Error assigning vehicle {VehicleId} to provider {ProviderName}",
                                    jobId, vehicleId, provider.Name);
                            }
                        }

                        scopedLogger.LogInformation("Job {JobId} completed: {SuccessCount} succeeded, {FailCount} failed",
                            jobId, successCount, failCount);

                        // Send final completion message
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkAssign",
                            ProviderId = request.ProviderId,
                            ProviderName = provider.DisplayName,
                            TotalVehicles = request.VehicleIds.Count,
                            ProcessedVehicles = request.VehicleIds.Count,
                            SuccessCount = successCount,
                            FailCount = failCount,
                            ProgressPercentage = 100,
                            EstimatedRemainingSeconds = 0,
                            IsComplete = true,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Job {JobId}: Fatal error during bulk assignment", jobId);

                        // Send error notification
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkAssign",
                            ProviderId = request.ProviderId,
                            ProviderName = provider.DisplayName,
                            TotalVehicles = request.VehicleIds.Count,
                            ProcessedVehicles = successCount + failCount,
                            SuccessCount = successCount,
                            FailCount = failCount,
                            ProgressPercentage = 0,
                            EstimatedRemainingSeconds = 0,
                            IsComplete = true,
                            Error = ex.Message,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                });

                // Return immediately with job ID
                return Accepted(new
                {
                    Success = true,
                    Message = $"Bulk assignment job started for {request.VehicleIds.Count} vehicles",
                    JobId = jobId,
                    VehicleCount = request.VehicleIds.Count,
                    ProviderName = provider.DisplayName,
                    EstimatedSeconds = request.VehicleIds.Count * 0.5, // Rough estimate
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
        public async Task<IActionResult> BulkUnassignVehiclesFromProvider([FromBody] BulkVehicleUnassignmentRequest request)
        {
            try
            {
                _logger.LogInformation("Initiating bulk unassignment of {Count} vehicles from providers",
                    request.VehicleIds.Count);

                System.Security.Claims.Claim? userIdClaim = User.Claims.FirstOrDefault(c =>
                            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                            Guid.TryParse(c.Value, out _));

                if (userIdClaim == null)
                {
                    return BadRequest("Invalid User ID");
                }

                // Generate job ID
                string jobId = Guid.NewGuid().ToString("N");

                // Start background task (fire and forget) with proper scoping
                _ = Task.Run(async () =>
                {
                    int successCount = 0;
                    int failCount = 0;

                    try
                    {
                        // Create a new scope for this background task
                        using var scope = _serviceScopeFactory.CreateScope();
                        var scopedConfigService = scope.ServiceProvider.GetRequiredService<IProviderConfigurationService>();
                        var scopedLogger = scope.ServiceProvider.GetRequiredService<ILogger<ProviderManagementController>>();

                        var startTime = DateTime.UtcNow;

                        foreach (int vehicleId in request.VehicleIds)
                        {
                            try
                            {
                                // Remove mapping by setting to inactive
                                bool ok = await scopedConfigService.UnmapVehicleFromProviderAsync(vehicleId, userIdClaim.Value);
                                if (ok)
                                {
                                    successCount++;
                                }
                                else
                                {
                                    failCount++;
                                }

                                var processedCount = successCount + failCount;

                                // Broadcast progress every 50 vehicles or on completion
                                if (processedCount % 50 == 0 || processedCount == request.VehicleIds.Count)
                                {
                                    var progressPercentage = (int)Math.Round((double)processedCount / request.VehicleIds.Count * 100);
                                    var elapsed = (DateTime.UtcNow - startTime).TotalSeconds;
                                    var rate = processedCount / elapsed;
                                    var remainingSeconds = (int)Math.Ceiling((request.VehicleIds.Count - processedCount) / rate);

                                    await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                                    {
                                        JobId = jobId,
                                        Operation = "BulkUnassign",
                                        ProviderId = (int?)null,
                                        ProviderName = "None",
                                        TotalVehicles = request.VehicleIds.Count,
                                        ProcessedVehicles = processedCount,
                                        SuccessCount = successCount,
                                        FailCount = failCount,
                                        ProgressPercentage = progressPercentage,
                                        EstimatedRemainingSeconds = remainingSeconds,
                                        IsComplete = processedCount == request.VehicleIds.Count,
                                        Timestamp = DateTime.UtcNow
                                    });

                                    scopedLogger.LogInformation(
                                        "Job {JobId}: Unassigned {Count}/{Total} vehicles ({SuccessCount} succeeded, {FailCount} failed) - {Percentage}% complete",
                                        jobId, processedCount, request.VehicleIds.Count, successCount, failCount, progressPercentage);
                                }
                            }
                            catch (Exception ex)
                            {
                                failCount++;
                                scopedLogger.LogError(ex, "Job {JobId}: Error unassigning vehicle {VehicleId}",
                                    jobId, vehicleId);
                            }
                        }

                        scopedLogger.LogInformation("Job {JobId} completed: {SuccessCount} unassigned, {FailCount} failed",
                            jobId, successCount, failCount);

                        // Send final completion message
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkUnassign",
                            ProviderId = (int?)null,
                            ProviderName = "None",
                            TotalVehicles = request.VehicleIds.Count,
                            ProcessedVehicles = request.VehicleIds.Count,
                            SuccessCount = successCount,
                            FailCount = failCount,
                            ProgressPercentage = 100,
                            EstimatedRemainingSeconds = 0,
                            IsComplete = true,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Job {JobId}: Fatal error during bulk unassignment", jobId);

                        // Send error notification
                        await _hubContext.Clients.All.SendAsync("BulkProviderAssignmentProgress", new
                        {
                            JobId = jobId,
                            Operation = "BulkUnassign",
                            ProviderId = (int?)null,
                            ProviderName = "None",
                            TotalVehicles = request.VehicleIds.Count,
                            ProcessedVehicles = successCount + failCount,
                            SuccessCount = successCount,
                            FailCount = failCount,
                            ProgressPercentage = 0,
                            EstimatedRemainingSeconds = 0,
                            IsComplete = true,
                            Error = ex.Message,
                            Timestamp = DateTime.UtcNow
                        });
                    }
                });

                // Return immediately with job ID
                return Accepted(new
                {
                    Success = true,
                    Message = $"Bulk unassignment job started for {request.VehicleIds.Count} vehicles",
                    JobId = jobId,
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
        public async Task<IActionResult> MapVehicleToDevice([FromBody] DeviceMappingRequest request)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c =>
                       c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                       Guid.TryParse(c.Value, out _));

                if (userIdClaim == null) return BadRequest("Invalid User ID");

                // Look up provider by ID or name
                ProviderConfiguration? provider = request.ProviderId.HasValue
                    ? await _configService.GetByIdAsync(request.ProviderId.Value)
                    : await _configService.GetByNameAsync(request.ProviderName ?? "");

                if (provider == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = request.ProviderId.HasValue
                            ? $"Provider {request.ProviderId} not found"
                            : $"Provider '{request.ProviderName}' not found"
                    });
                }

                // Map with device metadata
                bool ok = await _configService.MapVehicleToProviderAsync(
                    request.VehicleId,
                    provider.Name,
                    request.ExternalDeviceId,
                    request.DeviceIMEI,
                    request.DeviceName,
                    request.DeviceType,
                    request.Metadata,
                    userIdClaim.Value);

                if (!ok)
                {
                    return StatusCode(500, new { Success = false, Message = "Failed to map vehicle to device" });
                }

                return Ok(new
                {
                    Success = true,
                    Message = $"Vehicle {request.VehicleId} mapped to device {request.ExternalDeviceId} successfully",
                    Data = new
                    {
                        VehicleId = request.VehicleId,
                        ProviderName = provider.Name,
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
        public async Task<IActionResult> AssignVehicleToProvider([FromBody] VehicleProviderAssignmentRequest request)
        {
            try
            {
                var userIdClaim = User.Claims.FirstOrDefault(c =>
                       c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                       Guid.TryParse(c.Value, out _));

                if (userIdClaim == null) return BadRequest("Invalid User ID");

                // Look up provider by ID to get its name (service expects providerName)
                ProviderConfiguration? provider = await _configService.GetByIdAsync(request.ProviderId);
                if (provider == null)
                {
                    return NotFound(new { Success = false, Message = $"Provider {request.ProviderId} not found" });
                }

                bool ok = await _configService.MapVehicleToProviderAsync(request.VehicleId, provider.Name, currentUser: userIdClaim.Value);
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

        /// <summary>
        /// Get all GPS devices from the tracking provider
        /// Used for mapping devices to vehicles
        /// </summary>
        /// <param name="providerName">Provider name (optional, defaults to active provider)</param>
        /// <returns>List of GPS devices with mapping status</returns>
        [HttpGet("devices")]
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

    /// <summary>
    /// Request model for bulk vehicle-provider assignment
    /// </summary>
    public class BulkVehicleProviderAssignmentRequest
    {
        public List<int> VehicleIds { get; set; } = [];
        public int ProviderId { get; set; }
    }

    /// <summary>
    /// Request model for bulk vehicle-provider unassignment
    /// </summary>
    public class BulkVehicleUnassignmentRequest
    {
        public List<int> VehicleIds { get; set; } = [];
    }
}
