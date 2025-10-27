# Phase 3 Quick Reference Guide

## Setup (5 minutes)

### 1. Add to DI Container

```csharp
// In Program.cs or Startup.cs
builder.Services.AddVehicleTracking(options =>
{
    options.AutoDiscoverProviders = true;
    options.LocationCacheDurationSeconds = 30;
    options.HealthCacheDurationSeconds = 60;
    options.EnableFailover = true;
    options.MaxFailoverAttempts = 3;
});
```

### 2. Use in Controllers

```csharp
public class VehicleController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;

    public VehicleController(IVehicleTrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    [HttpGet("{id}/location")]
    public async Task<IActionResult> GetLocation(int id)
    {
        var location = await _trackingService.GetVehicleLocationAsync(id);
        return Ok(location);
    }
}
```

## Common Operations

### Get Single Vehicle Location

```csharp
var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
// Returns: VehicleLocation or null
// Cached for 30 seconds
```

### Get Multiple Vehicle Locations

```csharp
var vehicleIds = new[] { 1, 2, 3, 4, 5 };
var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);
// Returns: List<VehicleLocation>
// Parallel execution with failover
```

### Get Location History

```csharp
var history = await _trackingService.GetVehicleLocationHistoryAsync(
    vehicleId: 123,
    from: DateTime.UtcNow.AddDays(-7),
    to: DateTime.UtcNow,
    maxPoints: 1000
);
// Returns: List<VehicleLocation> ordered by timestamp
```

### Check Provider Health

```csharp
var healthStatuses = await _trackingService.GetProvidersHealthAsync();
// Returns: Dictionary<string, ProviderHealthStatus>
// Cached for 60 seconds

foreach (var (providerName, status) in healthStatuses)
{
    if (status.Status == HealthStatus.Unhealthy)
        Console.WriteLine($"⚠️ {providerName} is down!");
}
```

### Get Usage Statistics

```csharp
var stats = await _trackingService.GetProviderStatisticsAsync();

Console.WriteLine($"Total Requests: {stats.TotalRequests}");
Console.WriteLine($"Success Rate: {stats.SuccessfulRequests / (double)stats.TotalRequests:P2}");
Console.WriteLine($"Failovers: {stats.FailoverCount}");

foreach (var (name, providerStats) in stats.ProviderStats)
{
    Console.WriteLine($"\n{name}:");
    Console.WriteLine($"  Requests: {providerStats.RequestCount}");
    Console.WriteLine($"  Success: {providerStats.SuccessCount}");
    Console.WriteLine($"  Avg Response: {providerStats.AverageResponseTimeMs}ms");
}
```

## Creating a New Provider

### 1. Create Provider Class

```csharp
using FMS.Application.Common;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Factory;

[Provider(
    Name = "MyProvider",
    DisplayName = "My Tracking Provider",
    Description = "Integration with my tracking system",
    Version = "1.0.0"
)]
public class MyTrackingProvider : IVehicleTrackingProvider
{
    private readonly ILogger<MyTrackingProvider> _logger;
    private Dictionary<string, string> _config = new();

    public string ProviderName => "MyProvider";

    public MyTrackingProvider(ILogger<MyTrackingProvider> logger)
    {
        _logger = logger;
    }

    public async Task<FMSResponse<bool>> InitializeAsync(
        Dictionary<string, string> configuration)
    {
        try
        {
            _config = configuration;

            // Initialize your connection here
            // e.g., HTTP client, database connection, etc.

            return FMSResponse<bool>.Success(true, "Initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Initialization failed");
            return FMSResponse<bool>.Failure("Initialization failed: " + ex.Message);
        }
    }

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(
        int vehicleId)
    {
        try
        {
            // Call your tracking API
            // var apiResponse = await _httpClient.GetAsync($"/vehicles/{vehicleId}/location");

            var location = new VehicleLocationDTO
            {
                VehicleId = vehicleId,
                Latitude = 40.7128m,  // Get from your API
                Longitude = -74.0060m,
                LastUpdated = DateTime.UtcNow,
                Speed = 60.5m,
                Heading = 180m,
                IsOnline = true,
                Address = "New York, NY"
            };

            return FMSResponse<VehicleLocationDTO>.Success(location);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get location for vehicle {VehicleId}", vehicleId);
            return FMSResponse<VehicleLocationDTO>.Failure(
                $"Failed to get location: {ex.Message}");
        }
    }

    public async Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to)
    {
        try
        {
            // Call your tracking API for history
            var history = new List<VehicleHistoryPoint>();

            // Populate from your API

            return FMSResponse<List<VehicleHistoryPoint>>.Success(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get history for vehicle {VehicleId}", vehicleId);
            return FMSResponse<List<VehicleHistoryPoint>>.Failure(
                $"Failed to get history: {ex.Message}");
        }
    }

    public async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
    {
        try
        {
            // Check your API health
            // var isHealthy = await _httpClient.GetAsync("/health");

            return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
            {
                Status = HealthStatus.Healthy,
                Message = "All systems operational",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
            {
                Status = HealthStatus.Unhealthy,
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public async Task<FMSResponse<bool>> ValidateConnectionAsync()
    {
        try
        {
            // Test your API connection
            return FMSResponse<bool>.Success(true, "Connection valid");
        }
        catch (Exception ex)
        {
            return FMSResponse<bool>.Failure($"Connection failed: {ex.Message}");
        }
    }
}
```

### 2. Add Provider to Database

```sql
INSERT INTO provider_configurations
    (provider_name, display_name, description, is_enabled, is_default, configuration_data)
VALUES
    ('MyProvider', 'My Tracking Provider', 'Custom tracking integration', 1, 0,
     '{"ApiUrl": "https://api.example.com", "ApiKey": "your-key-here"}');
```

### 3. Provider Auto-Discovery

On application startup, the system will:

1. Scan assemblies for classes with `[Provider]` attribute
2. Register them in the ProviderRegistry
3. Make them available for instantiation

No additional registration code needed!

## Configuration Options

```csharp
services.AddVehicleTracking(options =>
{
    // Automatic provider discovery
    options.AutoDiscoverProviders = true;  // Default: true

    // Which assemblies to scan (null = all loaded assemblies)
    options.AssemblyNames = new[] { "FMS.Infrastructure", "MyCustomProviders" };

    // Cache durations
    options.LocationCacheDurationSeconds = 30;  // Default: 30s
    options.HealthCacheDurationSeconds = 60;    // Default: 60s

    // Failover settings
    options.EnableFailover = true;          // Default: true
    options.MaxFailoverAttempts = 3;        // Default: 3
});
```

## Advanced: Manual Provider Management

### Create Provider by Name

```csharp
public class CustomService
{
    private readonly IProviderFactory _factory;

    public async Task UseSpecificProvider()
    {
        var provider = await _factory.CreateProviderAsync("GPSGate");

        if (provider != null)
        {
            var response = await provider.GetVehicleLocationAsync(123);
            if (response.IsSuccess)
            {
                var dto = response.Data;
                // Use DTO
            }
        }
    }
}
```

### Get All Healthy Providers

```csharp
var healthyProviders = await _factory.GetHealthyProvidersAsync();
foreach (var provider in healthyProviders)
{
    Console.WriteLine($"Healthy provider: {provider.ProviderName}");
}
```

### Reload Providers

```csharp
// Reload configurations from database
await _factory.ReloadProvidersAsync();

// Or via tracking service
await _trackingService.ReloadProvidersAsync();
```

## Troubleshooting

### Provider Not Discovered

1. Check [Provider] attribute is present
2. Ensure class implements IVehicleTrackingProvider
3. Verify assembly is loaded at startup
4. Check logs for discovery errors

### Location Returns Null

1. Check provider is configured in database
2. Verify provider is enabled
3. Check provider health status
4. Review provider logs for errors

### Failover Not Working

1. Ensure `EnableFailover = true` in options
2. Check multiple providers are configured
3. Verify health check implementation
4. Check failover statistics

### Performance Issues

1. Adjust cache durations
2. Check provider response times
3. Review statistics for bottlenecks
4. Consider provider pooling

## Key Interfaces

```csharp
// High-level unified service (use this in most cases)
IVehicleTrackingService
    - GetVehicleLocationAsync(int vehicleId)
    - GetVehicleLocationsAsync(IEnumerable<int> vehicleIds)
    - GetVehicleLocationHistoryAsync(...)
    - GetProvidersHealthAsync()
    - GetProviderStatisticsAsync()

// Factory for creating providers (advanced scenarios)
IProviderFactory
    - CreateProviderAsync(string providerName)
    - GetDefaultProviderAsync()
    - GetHealthyProvidersAsync()
    - ReloadProvidersAsync()

// Registry for provider discovery (internal use)
IProviderRegistry
    - DiscoverProvidersAsync(...)
    - GetProviderType(string name)
    - GetProviderMetadata(string name)

// Low-level provider interface (implement for new providers)
IVehicleTrackingProvider
    - InitializeAsync(Dictionary<string, string> configuration)
    - GetVehicleLocationAsync(int vehicleId)
    - GetVehicleHistoryAsync(int vehicleId, DateTime from, DateTime to)
    - GetHealthStatusAsync()
    - ValidateConnectionAsync()
```

## Best Practices

1. **Always use IVehicleTrackingService** in application layer
2. **Let the factory handle provider lifecycle** - don't create manually
3. **Configure caching** based on your data freshness requirements
4. **Monitor statistics** to identify performance issues
5. **Implement health checks** properly in providers
6. **Use FMSResponse** pattern for all provider methods
7. **Log errors** but handle them gracefully
8. **Test failover scenarios** before production

## Quick Start Checklist

- [ ] Add `AddVehicleTracking()` to DI container
- [ ] Inject `IVehicleTrackingService` in controllers
- [ ] Configure at least one provider in database
- [ ] Test location retrieval works
- [ ] Verify caching behavior
- [ ] Check health monitoring
- [ ] Review statistics
- [ ] Test failover if multiple providers

---

**Phase 3 Status**: ✅ Complete and ready for use!
**Next**: Phase 4 - Refactor GPSGate as Plugin
