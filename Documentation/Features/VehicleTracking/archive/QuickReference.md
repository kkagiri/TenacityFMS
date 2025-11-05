# Vehicle Tracking Plugin Architecture - Quick Reference

## Phase 1 Status: ✅ COMPLETED

### Files Created (10 total)

#### Interfaces (4 files)

```
FMS.Infrastructure/VehicleTracking/Interfaces/
├── IVehicleTrackingProvider.cs          # Main provider contract
├── IProviderFactory.cs                  # Factory pattern
├── IProviderHealthMonitor.cs            # Health monitoring
└── IProviderConfigurationValidator.cs   # Config validation
```

#### Models (4 files)

```
FMS.Infrastructure/VehicleTracking/Models/
├── ProviderCapabilities.cs             # Feature flags
├── ProviderConfiguration.cs            # JSON config storage
├── ProviderHealthStatus.cs             # Health metrics
└── ProviderMetadata.cs                 # Provider info
```

#### Base Classes (2 files)

```
FMS.Infrastructure/VehicleTracking/Base/
├── BaseVehicleTrackingProvider.cs      # Abstract base
└── ProviderExceptions.cs               # Exception hierarchy
```

---

## Quick Start: Implementing a New Provider

### 1. Create Provider Class

```csharp
using FMS.Infrastructure.VehicleTracking.Base;
using FMS.Infrastructure.VehicleTracking.Models;

public class MyGPSProvider : BaseVehicleTrackingProvider
{
    private HttpClient _httpClient;

    public MyGPSProvider(ILogger<MyGPSProvider> logger)
        : base(logger) { }

    // Required metadata
    public override string ProviderName => "MyGPS";
    public override string ProviderVersion => "1.0.0";

    public override ProviderCapabilities Capabilities => new()
    {
        SupportsRealTimeLocation = true,
        SupportsOdometer = true,
        SupportsGeofencing = false,
        Priority = 1,
        RateLimitPerMinute = 100
    };

    public override ProviderMetadata Metadata => new()
    {
        ProviderName = ProviderName,
        DisplayName = "My GPS Tracker",
        Description = "Custom GPS tracking provider",
        Version = ProviderVersion,
        Author = "Your Company",
        Website = "https://example.com"
    };

    // Initialize with configuration
    protected override async Task<FMSResponse<bool>> OnInitializeAsync(
        ProviderConfiguration configuration)
    {
        var apiUrl = GetConfigValue<string>("ApiUrl");
        var apiKey = GetConfigValue<string>("ApiKey");

        _httpClient = new HttpClient();
        _httpClient.BaseAddress = new Uri(apiUrl);
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        return FMSResponse<bool>.Success(true);
    }

    // Required: Implement core methods
    public override async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        EnsureInitialized();

        try
        {
            // Get vehicle's external ID from database
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

            if (vehicle?.GpsDeviceId == null)
                return FMSResponse<VehicleLocationDTO>.Failed("Vehicle has no GPS device");

            // Call external API
            var response = await _httpClient.GetAsync($"/vehicles/{vehicle.GpsDeviceId}/location");
            response.EnsureSuccessStatusCode();

            var apiData = await response.Content.ReadFromJsonAsync<MyGPSLocationResponse>();

            // Map to FMS DTO
            var location = new VehicleLocationDTO
            {
                VehicleId = vehicleId,
                Latitude = apiData.Latitude,
                Longitude = apiData.Longitude,
                Speed = apiData.Speed,
                Heading = apiData.Heading,
                Timestamp = apiData.Timestamp,
                IsOnline = true
            };

            return FMSResponse<VehicleLocationDTO>.Success(location);
        }
        catch (HttpRequestException ex)
        {
            return HandleException<VehicleLocationDTO>(ex, "GetVehicleLocation");
        }
    }

    public override async Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(
        bool onlineOnly = false,
        bool gpsEnabledOnly = true)
    {
        EnsureInitialized();

        try
        {
            var query = _context.Vehicles.AsQueryable();

            if (gpsEnabledOnly)
                query = query.Where(v => v.GpsEnable == true);

            var vehicles = await query.ToListAsync();
            var locations = new List<VehicleLocationDTO>();

            foreach (var vehicle in vehicles)
            {
                var locationResult = await GetVehicleLocationAsync(vehicle.VehicleId);
                if (locationResult.IsSuccess)
                {
                    if (!onlineOnly || locationResult.Data.IsOnline)
                        locations.Add(locationResult.Data);
                }
            }

            return FMSResponse<List<VehicleLocationDTO>>.Success(locations);
        }
        catch (Exception ex)
        {
            return HandleException<List<VehicleLocationDTO>>(ex, "GetAllVehicleLocations");
        }
    }

    public override async Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId)
    {
        // Similar implementation
    }

    public override async Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId)
    {
        var locationResult = await GetVehicleLocationAsync(vehicleId);
        return FMSResponse<bool>.Success(locationResult.IsSuccess && locationResult.Data.IsOnline);
    }
}
```

### 2. Configuration Example

```csharp
var config = new ProviderConfiguration
{
    Name = "MyGPS",
    DisplayName = "My GPS Tracker",
    IsEnabled = true,
    IsDefault = false
};

config.SetValue("ApiUrl", "https://api.mygps.com");
config.SetValue("ApiKey", "your_api_key_here");
config.SetValue("TimeoutSeconds", 30.0);
config.SetValue("RetryAttempts", 3);

// Initialize provider
var provider = new MyGPSProvider(logger);
var initResult = await provider.InitializeAsync(config);

if (initResult.IsSuccess)
{
    // Use provider
    var location = await provider.GetVehicleLocationAsync(123);
}
```

### 3. Using the Provider

```csharp
// Get location
var locationResult = await provider.GetVehicleLocationAsync(vehicleId);
if (locationResult.IsSuccess)
{
    var lat = locationResult.Data.Latitude;
    var lng = locationResult.Data.Longitude;
    Console.WriteLine($"Vehicle at: {lat}, {lng}");
}
else
{
    Console.WriteLine($"Error: {locationResult.Message}");
}

// Check capabilities before calling
if (provider.Capabilities.SupportsGeofencing)
{
    var geofences = await provider.GetGeofencesAsync();
}

// Health check
var health = await provider.GetHealthStatusAsync();
if (health.Data.Status == HealthStatus.Healthy)
{
    // Provider is working well
}
```

---

## Common Patterns

### Pattern 1: Configuration Validation

```csharp
protected override async Task<FMSResponse<bool>> OnValidateConfigurationAsync(
    ProviderConfiguration configuration)
{
    var errors = new List<string>();

    if (string.IsNullOrWhiteSpace(configuration.GetValue<string>("ApiUrl")))
        errors.Add("ApiUrl is required");

    if (string.IsNullOrWhiteSpace(configuration.GetValue<string>("ApiKey")))
        errors.Add("ApiKey is required");

    if (errors.Any())
        return FMSResponse<bool>.ValidationFailed(errors);

    return FMSResponse<bool>.Success(true);
}
```

### Pattern 2: Connection Testing

```csharp
protected override async Task<FMSResponse<bool>> OnValidateConnectionAsync()
{
    try
    {
        var response = await _httpClient.GetAsync("/health");
        response.EnsureSuccessStatusCode();
        return FMSResponse<bool>.Success(true);
    }
    catch (Exception ex)
    {
        return FMSResponse<bool>.Failed($"Connection test failed: {ex.Message}");
    }
}
```

### Pattern 3: Rate Limiting

```csharp
private int _requestCount = 0;
private DateTime _rateLimitResetTime = DateTime.UtcNow;

protected async Task<T> WithRateLimitAsync<T>(Func<Task<T>> action)
{
    if (DateTime.UtcNow >= _rateLimitResetTime)
    {
        _requestCount = 0;
        _rateLimitResetTime = DateTime.UtcNow.AddMinutes(1);
    }

    if (_requestCount >= Capabilities.RateLimitPerMinute)
    {
        throw new ProviderRateLimitException(
            ProviderName,
            Capabilities.RateLimitPerMinute,
            _rateLimitResetTime
        );
    }

    _requestCount++;
    return await action();
}

// Usage
public override async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
{
    return await WithRateLimitAsync(async () =>
    {
        // Your implementation
    });
}
```

### Pattern 4: Retry Logic

```csharp
protected async Task<FMSResponse<T>> WithRetryAsync<T>(
    Func<Task<FMSResponse<T>>> action,
    int maxAttempts = 3)
{
    var attempts = 0;
    var delays = new[] { 1000, 2000, 4000 }; // Exponential backoff

    while (attempts < maxAttempts)
    {
        try
        {
            var result = await action();
            if (result.IsSuccess)
                return result;

            attempts++;
            if (attempts < maxAttempts)
                await Task.Delay(delays[attempts - 1]);
        }
        catch (Exception ex) when (attempts < maxAttempts - 1)
        {
            attempts++;
            await Task.Delay(delays[attempts - 1]);
        }
    }

    return FMSResponse<T>.Failed("Operation failed after retries");
}
```

---

## Exception Handling

### Throwing Exceptions

```csharp
// Not initialized
if (!_isInitialized)
    throw new ProviderNotInitializedException(ProviderName);

// Invalid configuration
if (validationErrors.Any())
    throw new ProviderConfigurationException(ProviderName, validationErrors);

// Connection failed
throw new ProviderConnectionException(ProviderName, "Failed to connect to API", innerEx);

// Rate limit exceeded
throw new ProviderRateLimitException(ProviderName, 100, DateTime.UtcNow.AddMinutes(1));

// Authentication failed
throw new ProviderAuthenticationException(ProviderName, "Invalid API key");

// Unsupported operation
throw new ProviderOperationNotSupportedException(ProviderName, "GetGeofences");
```

### Catching Exceptions

```csharp
try
{
    var result = await provider.GetVehicleLocationAsync(vehicleId);
}
catch (ProviderNotInitializedException ex)
{
    _logger.LogError("Provider not initialized: {Provider}", ex.ProviderName);
    // Re-initialize provider
}
catch (ProviderRateLimitException ex)
{
    _logger.LogWarning("Rate limit hit, retry after {RetryAfter}", ex.RetryAfter);
    // Switch to backup provider or wait
}
catch (ProviderConnectionException ex)
{
    _logger.LogError(ex, "Connection failed for {Provider}", ex.ProviderName);
    // Mark provider as unhealthy
}
```

---

## Testing Your Provider

### Unit Test Example

```csharp
[Fact]
public async Task GetVehicleLocation_ReturnsSuccess_WhenVehicleExists()
{
    // Arrange
    var logger = new Mock<ILogger<MyGPSProvider>>();
    var provider = new MyGPSProvider(logger.Object);

    var config = new ProviderConfiguration();
    config.SetValue("ApiUrl", "https://test.api.com");
    config.SetValue("ApiKey", "test_key");

    await provider.InitializeAsync(config);

    // Act
    var result = await provider.GetVehicleLocationAsync(1);

    // Assert
    Assert.True(result.IsSuccess);
    Assert.NotNull(result.Data);
    Assert.Equal(1, result.Data.VehicleId);
}

[Fact]
public async Task GetVehicleLocation_ThrowsException_WhenNotInitialized()
{
    // Arrange
    var logger = new Mock<ILogger<MyGPSProvider>>();
    var provider = new MyGPSProvider(logger.Object);

    // Act & Assert
    await Assert.ThrowsAsync<ProviderNotInitializedException>(
        () => provider.GetVehicleLocationAsync(1)
    );
}
```

---

## Next Phase Preview: Phase 2

**What's Coming**:

- Database tables for provider configurations
- `ProviderConfigurationService` for CRUD operations
- Health history tracking
- Encrypted storage for API keys
- Entity Framework Core entities

**When**: Ready to proceed when Phase 1 is validated

---

## Resources

- **Full Documentation**: `Documentation/Features/VehicleTracking/Phase1_Implementation_Summary.md`
- **Implementation Plan**: `Documentation/Features/VehicleTracking/PluginArchitectureImplementationPlan.md`
- **Existing Example**: `FMS.Infrastructure/ExternalServices/GPS/GPSGate/GPSGateService.cs`

---

**Questions?** Refer to the comprehensive Phase 1 summary or ask for clarification on specific patterns.
