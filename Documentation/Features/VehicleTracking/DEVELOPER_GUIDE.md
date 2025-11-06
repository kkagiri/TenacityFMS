# Vehicle Tracking System - Developer Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Service Usage](#service-usage)
3. [API Reference](#api-reference)
4. [Creating Custom Providers](#creating-custom-providers)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Quick Start

### Setup

**1. Add Vehicle Tracking to Your Application**

In `Program.cs` or `Startup.cs`:

```csharp
using FMS.Infrastructure.VehicleTracking.Extensions;

// Add vehicle tracking services
builder.Services.AddVehicleTracking(options =>
{
    options.AutoDiscoverProviders = true;
    options.LocationCacheDurationSeconds = 30;
    options.HealthCacheDurationSeconds = 60;
    options.EnableFailover = true;
});
```

**2. Run Database Migrations**

Execute the SQL scripts in order:

```bash
# 1. Create tables
mysql -u username -p database_name < database/phase2_provider_configuration.sql

# 2. Configure GPSGate provider (update credentials first)
mysql -u username -p database_name < Phase4/01_GPSGateProvider_Configuration.sql

# 3. Add navigation menu (optional, for UI)
mysql -u username -p database_name < Phase7/01_ProviderManagement_Navigation.sql
```

**3. Update Provider Configuration**

Update the GPSGate configuration in the database with your credentials:

```sql
UPDATE provider_configurations
SET configuration_data = JSON_OBJECT(
    'Username', 'your_username',
    'Password', 'your_password',
    'BaseUrl', 'https://your-gpsgate-server.com',
    'ApplicationId', 12
)
WHERE provider_name = 'GPSGate';
```

**4. Inject and Use the Service**

```csharp
public class VehicleController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;

    public VehicleController(IVehicleTrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    [HttpGet("{vehicleId}/location")]
    public async Task<IActionResult> GetLocation(int vehicleId)
    {
        var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
        if (location == null)
            return NotFound("Vehicle location not available");

        return Ok(location);
    }
}
```

---

## Service Usage

### IVehicleTrackingService

The unified service for all vehicle tracking operations.

#### Get Single Vehicle Location

```csharp
var location = await _trackingService.GetVehicleLocationAsync(vehicleId: 123);

if (location != null)
{
    Console.WriteLine($"Latitude: {location.Latitude}");
    Console.WriteLine($"Longitude: {location.Longitude}");
    Console.WriteLine($"Speed: {location.Speed} km/h");
    Console.WriteLine($"Heading: {location.Heading}°");
    Console.WriteLine($"Last Update: {location.Timestamp}");
}
```

**Response Model**:
```csharp
public class VehicleLocation
{
    public int VehicleId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }            // km/h
    public double Heading { get; set; }          // Degrees (0-360)
    public double Altitude { get; set; }         // Meters
    public DateTime Timestamp { get; set; }      // UTC
    public double? Odometer { get; set; }        // Kilometers
    public string? Address { get; set; }         // Reverse geocoded
    public string? VehicleName { get; set; }     // From database
    public string? PlateNumber { get; set; }     // From database
    public bool IsOnline { get; set; }           // Updated within 15 minutes
}
```

**Caching**: Results are cached for 30 seconds by default.

#### Get Multiple Vehicle Locations

```csharp
var vehicleIds = new[] { 1, 2, 3, 4, 5 };
var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);

foreach (var (vehicleId, location) in locations)
{
    if (location != null)
    {
        Console.WriteLine($"Vehicle {vehicleId}: {location.Latitude}, {location.Longitude}");
    }
}
```

**Performance**: Requests are processed in parallel for optimal performance.

#### Get Vehicle Location History

```csharp
var vehicleId = 123;
var from = DateTime.UtcNow.AddHours(-24);  // Last 24 hours
var to = DateTime.UtcNow;
var maxPoints = 1000;

var history = await _trackingService.GetVehicleLocationHistoryAsync(
    vehicleId, from, to, maxPoints);

foreach (var point in history)
{
    Console.WriteLine($"{point.Timestamp}: {point.Latitude}, {point.Longitude} @ {point.Speed} km/h");
}
```

**History Point Model**:
```csharp
public class VehicleLocation  // Same as current location
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public DateTime Timestamp { get; set; }
}
```

#### Get Provider for Vehicle

```csharp
var providerName = await _trackingService.GetProviderForVehicleAsync(vehicleId: 123);
Console.WriteLine($"Vehicle is tracked by: {providerName}");
// Output: "Vehicle is tracked by: GPSGate"
```

#### Check Provider Health

```csharp
var healthStatuses = await _trackingService.GetProvidersHealthAsync();

foreach (var (providerName, health) in healthStatuses)
{
    Console.WriteLine($"{providerName}:");
    Console.WriteLine($"  Status: {health.Status}");
    Console.WriteLine($"  Response Time: {health.ResponseTimeMs}ms");
    Console.WriteLine($"  Is Healthy: {health.IsHealthy}");
    Console.WriteLine($"  Message: {health.Message}");
}
```

**Health Status Model**:
```csharp
public class ProviderHealthStatus
{
    public string ProviderName { get; set; }
    public HealthStatus Status { get; set; }     // Healthy/Degraded/Unhealthy
    public string Message { get; set; }
    public double ResponseTimeMs { get; set; }
    public DateTime CheckedAt { get; set; }
    public bool IsHealthy { get; set; }
    public int? ErrorCount { get; set; }
    public double? SuccessRate { get; set; }
    public Dictionary<string, object> Metrics { get; set; }
}

public enum HealthStatus
{
    Healthy,      // Working correctly (< 500ms response)
    Degraded,     // Working but slow (500ms - 2000ms)
    Unhealthy     // Not responding or failing
}
```

**Caching**: Health statuses are cached for 60 seconds.

#### Test Provider Connectivity

```csharp
var providerName = "GPSGate";
var isConnected = await _trackingService.TestProviderConnectivityAsync(providerName);

if (isConnected)
    Console.WriteLine($"{providerName} is accessible");
else
    Console.WriteLine($"{providerName} is not responding");
```

#### Reload Provider Configurations

```csharp
// After updating configuration in database
await _trackingService.ReloadProvidersAsync();

Console.WriteLine("Providers reloaded with new configuration");
```

**What This Does**:
- Clears provider cache
- Clears location cache
- Reloads configurations from database
- Reinitializes all providers

#### Get Provider Statistics

```csharp
var stats = await _trackingService.GetProviderStatisticsAsync();

Console.WriteLine($"Total Requests: {stats.TotalRequests}");
Console.WriteLine($"Successful: {stats.SuccessfulRequests}");
Console.WriteLine($"Failed: {stats.FailedRequests}");
Console.WriteLine($"Failovers: {stats.FailoverCount}");
Console.WriteLine($"Avg Response: {stats.AverageResponseTimeMs}ms");

foreach (var (providerName, providerStats) in stats.ProviderStats)
{
    Console.WriteLine($"\n{providerName}:");
    Console.WriteLine($"  Requests: {providerStats.RequestCount}");
    Console.WriteLine($"  Success Rate: {providerStats.SuccessCount / (double)providerStats.RequestCount:P}");
    Console.WriteLine($"  Avg Response: {providerStats.AverageResponseTimeMs}ms");
}
```

---

## API Reference

All API endpoints require JWT authentication.

**Base URL**: `https://your-server:7009/api/v1/providers`

**Authentication Header**:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Get Provider Health Status

**Endpoint**: `GET /api/v1/providers/health`

**Description**: Get real-time health status of all configured providers.

**Request**:
```http
GET /api/v1/providers/health HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "ProviderHealthStatuses": [
      {
        "ProviderName": "GPSGate",
        "Status": "Healthy",
        "Message": "Provider is operational",
        "ResponseTimeMs": 145.7,
        "CheckedAt": "2025-11-05T14:30:00Z",
        "IsHealthy": true,
        "SuccessRate": 98.5,
        "ErrorCount": 2
      }
    ],
    "TotalProviders": 1,
    "HealthyProviders": 1
  },
  "Message": "Provider health retrieved successfully",
  "Timestamp": "2025-11-05T14:30:00Z"
}
```

### 2. Get Provider Statistics

**Endpoint**: `GET /api/v1/providers/statistics`

**Description**: Get usage statistics and performance metrics for all providers.

**Request**:
```http
GET /api/v1/providers/statistics HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "TotalRequests": 15420,
    "SuccessfulRequests": 15180,
    "FailedRequests": 240,
    "FailoverCount": 15,
    "AverageResponseTimeMs": 182.5,
    "ProviderStats": {
      "GPSGate": {
        "ProviderName": "GPSGate",
        "RequestCount": 15420,
        "SuccessCount": 15180,
        "FailureCount": 240,
        "AverageResponseTimeMs": 182.5,
        "LastRequestTime": "2025-11-05T14:30:00Z",
        "HealthStatus": "Healthy"
      }
    }
  },
  "Message": "Statistics retrieved successfully"
}
```

### 3. List All Providers

**Endpoint**: `GET /api/v1/providers/list`

**Description**: Get list of all configured providers with their settings.

**Request**:
```http
GET /api/v1/providers/list HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**:
```json
{
  "Success": true,
  "Data": [
    {
      "ProviderId": 1,
      "ProviderName": "GPSGate",
      "DisplayName": "GPSGate Vehicle Tracker",
      "Description": "Primary GPS tracking provider",
      "IsEnabled": true,
      "IsDefault": true,
      "PriorityOrder": 1,
      "ConfigurationData": {
        "Username": "admin",
        "Password": "***",
        "BaseUrl": "https://gpsgate.example.com",
        "ApplicationId": 12
      },
      "CreatedAt": "2025-01-01T00:00:00Z",
      "UpdatedAt": "2025-11-05T10:00:00Z"
    }
  ],
  "Message": "Providers retrieved successfully"
}
```

**Note**: Password fields are masked in responses.

### 4. Get Specific Provider

**Endpoint**: `GET /api/v1/providers/{providerId}`

**Description**: Get details of a specific provider.

**Request**:
```http
GET /api/v1/providers/1 HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**: Same structure as individual provider in list endpoint.

### 5. Update Provider Configuration

**Endpoint**: `PUT /api/v1/providers/{providerId}`

**Description**: Update provider configuration. Automatically triggers reload.

**Request**:
```http
PUT /api/v1/providers/1 HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
Content-Type: application/json

{
  "DisplayName": "GPSGate Primary",
  "Description": "Updated description",
  "IsEnabled": true,
  "IsDefault": true,
  "PriorityOrder": 1,
  "ConfigurationData": {
    "Username": "new_username",
    "Password": "new_password",
    "BaseUrl": "https://new-url.com",
    "ApplicationId": 12
  }
}
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "ProviderId": 1,
    "ProviderName": "GPSGate",
    // ... updated provider details
  },
  "Message": "Provider updated and reloaded successfully"
}
```

### 6. Test Provider Connection

**Endpoint**: `POST /api/v1/providers/{providerName}/test`

**Description**: Test connectivity to a specific provider.

**Request**:
```http
POST /api/v1/providers/GPSGate/test HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "ProviderName": "GPSGate",
    "IsConnected": true,
    "ResponseTimeMs": 152.3,
    "Message": "Connection successful",
    "TestedAt": "2025-11-05T14:30:00Z"
  },
  "Message": "Provider test completed"
}
```

### 7. Reload All Providers

**Endpoint**: `POST /api/v1/providers/reload`

**Description**: Reload all provider configurations from database.

**Request**:
```http
POST /api/v1/providers/reload HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "ProvidersReloaded": 1,
    "CacheCleared": true,
    "ReloadedAt": "2025-11-05T14:30:00Z"
  },
  "Message": "All providers reloaded successfully"
}
```

### 8. Get Vehicle-Provider Mappings

**Endpoint**: `GET /api/v1/providers/mappings`

**Description**: Get all vehicle-to-provider assignments.

**Request**:
```http
GET /api/v1/providers/mappings HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
```

**Response**:
```json
{
  "Success": true,
  "Data": [
    {
      "MappingId": 1,
      "VehicleId": 123,
      "ProviderId": 1,
      "ProviderName": "GPSGate",
      "ExternalDeviceId": "device_12345",
      "AssignedDate": "2025-01-15T10:00:00Z",
      "IsActive": true,
      "Notes": "Primary tracking device"
    }
  ],
  "Message": "Mappings retrieved successfully"
}
```

### 9. Create Vehicle-Provider Mapping

**Endpoint**: `POST /api/v1/providers/mappings`

**Description**: Assign a vehicle to a specific provider.

**Request**:
```http
POST /api/v1/providers/mappings HTTP/1.1
Host: your-server:7009
Authorization: Bearer <token>
Content-Type: application/json

{
  "VehicleId": 123,
  "ProviderId": 1,
  "ExternalDeviceId": "device_12345",
  "Notes": "Primary tracking device"
}
```

**Response**:
```json
{
  "Success": true,
  "Data": {
    "MappingId": 1,
    "VehicleId": 123,
    "ProviderId": 1,
    "ExternalDeviceId": "device_12345",
    "AssignedDate": "2025-11-05T14:30:00Z",
    "IsActive": true
  },
  "Message": "Vehicle mapping created successfully"
}
```

---

## Creating Custom Providers

### Step 1: Implement IVehicleTrackingProvider

```csharp
using FMS.Infrastructure.VehicleTracking.Interfaces;
using FMS.Infrastructure.VehicleTracking.Models;
using FMS.Infrastructure.VehicleTracking.Factory;
using FMS.Application.Common;
using FMS.Application.Features.VehicleTracking.DTOs;

[Provider("MyProvider",
    DisplayName = "My GPS Tracking Provider",
    Description = "Integration with My GPS System",
    Version = "1.0.0")]
public class MyGPSProvider : IVehicleTrackingProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MyGPSProvider> _logger;
    private string? _apiKey;
    private bool _initialized;

    public MyGPSProvider(HttpClient httpClient, ILogger<MyGPSProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    #region Metadata

    public string ProviderName => "MyProvider";
    public string ProviderVersion => "1.0.0";

    public ProviderCapabilities Capabilities => new()
    {
        SupportsRealTimeLocation = true,
        SupportsHistoricalData = true,
        SupportsGeofencing = false,
        SupportsEvents = false,
        SupportsOdometer = false
    };

    public ProviderMetadata Metadata => new()
    {
        Name = ProviderName,
        DisplayName = "My GPS Tracking Provider",
        Description = "Integration with My GPS System",
        Version = ProviderVersion,
        Vendor = "My Company",
        SupportUrl = "https://mycompany.com/support",
        ConfigurationRequirements = new List<ConfigurationRequirement>
        {
            new() { Key = "ApiKey", DisplayName = "API Key", IsRequired = true, IsSecure = true },
            new() { Key = "BaseUrl", DisplayName = "Base URL", IsRequired = true }
        }
    };

    #endregion

    #region Lifecycle

    public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
    {
        try
        {
            _apiKey = configuration.GetValue<string>("ApiKey");
            var baseUrl = configuration.GetValue<string>("BaseUrl");

            if (string.IsNullOrEmpty(_apiKey))
                return FMSResponse<bool>.Failed("API Key is required");

            _httpClient.BaseAddress = new Uri(baseUrl);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            _initialized = true;
            return FMSResponse<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize provider");
            return FMSResponse<bool>.Failed($"Initialization failed: {ex.Message}");
        }
    }

    public async Task<FMSResponse<bool>> ValidateConnectionAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/health");
            return FMSResponse<bool>.Success(response.IsSuccessStatusCode);
        }
        catch (Exception ex)
        {
            return FMSResponse<bool>.Failed($"Connection failed: {ex.Message}");
        }
    }

    #endregion

    #region Location Services

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        if (!_initialized)
            return FMSResponse<VehicleLocationDTO>.Failed("Provider not initialized");

        try
        {
            var response = await _httpClient.GetAsync($"/api/vehicles/{vehicleId}/location");
            if (!response.IsSuccessStatusCode)
                return FMSResponse<VehicleLocationDTO>.Failed("Failed to get location");

            var json = await response.Content.ReadAsStringAsync();
            var location = JsonSerializer.Deserialize<MyGPSLocation>(json);

            var dto = new VehicleLocationDTO
            {
                VehicleId = vehicleId,
                Latitude = location.Lat,
                Longitude = location.Lng,
                Speed = location.Speed,
                Heading = location.Direction,
                Altitude = location.Altitude,
                Timestamp = location.Timestamp
            };

            return FMSResponse<VehicleLocationDTO>.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to get location for vehicle {vehicleId}");
            return FMSResponse<VehicleLocationDTO>.Failed($"Error: {ex.Message}");
        }
    }

    public async Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to, int maxPoints = 1000)
    {
        if (!_initialized)
            return FMSResponse<List<VehicleHistoryPoint>>.Failed("Provider not initialized");

        try
        {
            var url = $"/api/vehicles/{vehicleId}/history?from={from:O}&to={to:O}&limit={maxPoints}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return FMSResponse<List<VehicleHistoryPoint>>.Failed("Failed to get history");

            var json = await response.Content.ReadAsStringAsync();
            var history = JsonSerializer.Deserialize<List<MyGPSLocation>>(json);

            var points = history.Select(h => new VehicleHistoryPoint
            {
                Latitude = h.Lat,
                Longitude = h.Lng,
                Speed = h.Speed,
                Heading = h.Direction,
                Timestamp = h.Timestamp
            }).ToList();

            return FMSResponse<List<VehicleHistoryPoint>>.Success(points);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to get history for vehicle {vehicleId}");
            return FMSResponse<List<VehicleHistoryPoint>>.Failed($"Error: {ex.Message}");
        }
    }

    #endregion

    #region Health Monitoring

    public async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
    {
        try
        {
            var startTime = DateTime.UtcNow;
            var response = await _httpClient.GetAsync("/api/health");
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            var isHealthy = response.IsSuccessStatusCode;
            var status = isHealthy
                ? (responseTime < 500 ? HealthStatus.Healthy : HealthStatus.Degraded)
                : HealthStatus.Unhealthy;

            return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
            {
                ProviderName = ProviderName,
                Status = status,
                ResponseTimeMs = responseTime,
                Message = isHealthy ? "Provider is operational" : "Provider is not responding",
                CheckedAt = DateTime.UtcNow,
                IsHealthy = isHealthy
            });
        }
        catch (Exception ex)
        {
            return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
            {
                ProviderName = ProviderName,
                Status = HealthStatus.Unhealthy,
                Message = $"Health check failed: {ex.Message}",
                CheckedAt = DateTime.UtcNow,
                IsHealthy = false
            });
        }
    }

    #endregion

    #region Device Mapping

    public async Task<FMSResponse<string>> GetExternalDeviceIdAsync(int vehicleId)
    {
        // Query database or API to get external device ID
        // For now, return a simple mapping
        return FMSResponse<string>.Success($"device_{vehicleId}");
    }

    public async Task<FMSResponse<bool>> MapVehicleToDeviceAsync(int vehicleId, string externalDeviceId)
    {
        // Store mapping in database
        // This is typically handled by ProviderConfigurationService
        return FMSResponse<bool>.Success(true);
    }

    #endregion
}

// Supporting model for this provider
internal class MyGPSLocation
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public double Speed { get; set; }
    public double Direction { get; set; }
    public double Altitude { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### Step 2: Register HttpClient

```csharp
// In Program.cs
builder.Services.AddHttpClient<MyGPSProvider>();
```

### Step 3: Add Database Configuration

```sql
INSERT INTO provider_configurations (
    provider_name,
    display_name,
    description,
    is_enabled,
    is_default,
    priority_order,
    configuration_data
) VALUES (
    'MyProvider',
    'My GPS Tracking Provider',
    'Integration with My GPS System',
    1,
    0,
    2,
    JSON_OBJECT(
        'ApiKey', 'your_api_key_here',
        'BaseUrl', 'https://api.mygps.com'
    )
);
```

### Step 4: Test Your Provider

```csharp
// The provider is automatically discovered on startup!
var location = await _trackingService.GetVehicleLocationAsync(123);
// System will use MyProvider if it's assigned to vehicle 123

// Test connectivity
var isConnected = await _trackingService.TestProviderConnectivityAsync("MyProvider");

// Check health
var health = await _trackingService.GetProvidersHealthAsync();
var myProviderHealth = health["MyProvider"];
```

---

## Configuration

### VehicleTrackingOptions

Configure the system behavior in `Program.cs`:

```csharp
builder.Services.AddVehicleTracking(options =>
{
    // Auto-discover providers via assembly scanning
    options.AutoDiscoverProviders = true;

    // Location cache duration (seconds)
    options.LocationCacheDurationSeconds = 30;

    // Health status cache duration (seconds)
    options.HealthCacheDurationSeconds = 60;

    // Enable automatic failover
    options.EnableFailover = true;
});
```

### Provider Configuration

Provider configurations are stored in the database as JSON:

```json
{
  "Username": "admin",
  "Password": "secure_password",
  "BaseUrl": "https://gpsgate.example.com",
  "ApplicationId": 12,
  "Timeout": 30000,
  "RetryCount": 3,
  "CustomSetting": "value"
}
```

**Accessing Configuration in Provider**:

```csharp
public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
{
    var username = configuration.GetValue<string>("Username");
    var timeout = configuration.GetValue<int>("Timeout", defaultValue: 30000);
    var customSetting = configuration.GetValue<string>("CustomSetting");

    // Use configuration values
}
```

### Environment-Specific Configuration

Use different configurations per environment:

```csharp
// In appsettings.Development.json
{
  "VehicleTracking": {
    "LocationCacheDurationSeconds": 10,
    "HealthCacheDurationSeconds": 30,
    "EnableFailover": false
  }
}

// In appsettings.Production.json
{
  "VehicleTracking": {
    "LocationCacheDurationSeconds": 30,
    "HealthCacheDurationSeconds": 60,
    "EnableFailover": true
  }
}
```

---

## Testing

### Unit Testing a Provider

```csharp
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;

public class MyGPSProviderTests
{
    private readonly Mock<HttpClient> _mockHttpClient;
    private readonly Mock<ILogger<MyGPSProvider>> _mockLogger;
    private readonly MyGPSProvider _provider;

    public MyGPSProviderTests()
    {
        _mockHttpClient = new Mock<HttpClient>();
        _mockLogger = new Mock<ILogger<MyGPSProvider>>();
        _provider = new MyGPSProvider(_mockHttpClient.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task Initialize_WithValidConfig_ReturnsSuccess()
    {
        // Arrange
        var config = new ProviderConfiguration
        {
            ConfigurationData = JsonSerializer.Serialize(new
            {
                ApiKey = "test_key",
                BaseUrl = "https://test.com"
            })
        };

        // Act
        var result = await _provider.InitializeAsync(config);

        // Assert
        Assert.True(result.Success);
    }

    [Fact]
    public async Task GetVehicleLocation_ReturnsValidLocation()
    {
        // Arrange
        await _provider.InitializeAsync(GetTestConfig());

        // Act
        var result = await _provider.GetVehicleLocationAsync(123);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(123, result.Data.VehicleId);
    }
}
```

### Integration Testing

```csharp
public class VehicleTrackingIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public VehicleTrackingIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetProviderHealth_ReturnsHealthStatus()
    {
        // Arrange
        var client = _factory.CreateClient();
        var token = await GetAuthTokenAsync(client);
        client.DefaultRequestHeaders.Authorization = new("Bearer", token);

        // Act
        var response = await client.GetAsync("/api/v1/providers/health");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<FMSResponse<HealthResponse>>(content);

        Assert.True(result.Success);
        Assert.NotEmpty(result.Data.ProviderHealthStatuses);
    }
}
```

---

## Troubleshooting

### Provider Not Discovered

**Problem**: Custom provider not showing up in the system.

**Solutions**:
1. Verify `[Provider]` attribute is present
2. Check provider implements `IVehicleTrackingProvider`
3. Ensure assembly is loaded at startup
4. Check logs for discovery errors
5. Verify `AutoDiscoverProviders = true` in configuration

**Debug**:
```csharp
var registry = serviceProvider.GetService<IProviderRegistry>();
var providers = registry.GetAllProviderMetadata();
foreach (var p in providers)
{
    Console.WriteLine($"Discovered: {p.Name}");
}
```

### Location Not Updating

**Problem**: Vehicle location is stale or not updating.

**Solutions**:
1. Check provider health status
2. Verify vehicle-to-provider mapping
3. Check external device ID is correct
4. Clear location cache: `await _trackingService.ReloadProvidersAsync()`
5. Test provider connectivity
6. Check provider logs for errors

**Debug**:
```csharp
// Check provider for vehicle
var providerName = await _trackingService.GetProviderForVehicleAsync(vehicleId);
Console.WriteLine($"Using provider: {providerName}");

// Check health
var health = await _trackingService.GetProvidersHealthAsync();
Console.WriteLine($"Health: {health[providerName].Status}");

// Test connectivity
var connected = await _trackingService.TestProviderConnectivityAsync(providerName);
Console.WriteLine($"Connected: {connected}");
```

### Slow Performance

**Problem**: API calls are slow.

**Solutions**:
1. Increase cache durations
2. Verify database indexes exist
3. Check network latency to GPS provider API
4. Use batch operations for multiple vehicles
5. Monitor provider response times

**Optimize**:
```csharp
// Use batch operations
var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);

// Adjust cache durations
builder.Services.AddVehicleTracking(options =>
{
    options.LocationCacheDurationSeconds = 60;  // Increase from 30
    options.HealthCacheDurationSeconds = 120;   // Increase from 60
});
```

### Failover Not Working

**Problem**: System not switching to backup provider.

**Solutions**:
1. Verify `EnableFailover = true`
2. Check multiple providers are configured and enabled
3. Verify priority ordering is correct
4. Check backup provider is healthy
5. Review failover logs

**Debug**:
```csharp
var stats = await _trackingService.GetProviderStatisticsAsync();
Console.WriteLine($"Failover count: {stats.FailoverCount}");

var providers = await _configService.GetAllConfigurationsAsync();
foreach (var p in providers.OrderBy(p => p.PriorityOrder))
{
    Console.WriteLine($"{p.ProviderName}: Priority {p.PriorityOrder}, Enabled: {p.IsEnabled}");
}
```

---

## Best Practices

### 1. Use Batch Operations

```csharp
// ❌ Bad: Multiple individual calls
foreach (var vehicleId in vehicleIds)
{
    var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
}

// ✅ Good: Single batch call
var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);
```

### 2. Handle Null Locations

```csharp
// ✅ Always check for null
var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
if (location != null)
{
    // Use location
}
else
{
    _logger.LogWarning($"Location not available for vehicle {vehicleId}");
}
```

### 3. Use Appropriate Cache Durations

```csharp
// Real-time tracking (frequent updates)
options.LocationCacheDurationSeconds = 10;

// Standard fleet tracking
options.LocationCacheDurationSeconds = 30;

// Historical reporting (less frequent updates)
options.LocationCacheDurationSeconds = 300;
```

### 4. Implement Proper Error Handling

```csharp
try
{
    var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
    if (location != null)
    {
        // Success path
    }
    else
    {
        // Handle missing location
        _logger.LogWarning($"Vehicle {vehicleId} location not found");
    }
}
catch (Exception ex)
{
    // Handle exceptions
    _logger.LogError(ex, $"Error getting location for vehicle {vehicleId}");
    // Return appropriate error response
}
```

### 5. Monitor Provider Health

```csharp
// Periodic health check
public async Task MonitorProvidersAsync()
{
    while (!cancellationToken.IsCancellationRequested)
    {
        var health = await _trackingService.GetProvidersHealthAsync();

        foreach (var (providerName, status) in health)
        {
            if (!status.IsHealthy)
            {
                _logger.LogWarning(
                    $"Provider {providerName} is unhealthy: {status.Message}");

                // Send alert
                await _alertService.SendAlertAsync(
                    $"GPS Provider {providerName} is down");
            }
        }

        await Task.Delay(TimeSpan.FromMinutes(5), cancellationToken);
    }
}
```

### 6. Use Configuration Helper Methods

```csharp
// ✅ Use helper methods with defaults
var timeout = configuration.GetValue<int>("Timeout", defaultValue: 30000);
var retryCount = configuration.GetValue<int>("RetryCount", defaultValue: 3);

// ❌ Avoid direct JSON parsing
var json = JsonSerializer.Deserialize<Dictionary<string, object>>(
    configuration.ConfigurationData);
var timeout = (int)json["Timeout"]; // Can throw exceptions
```

### 7. Implement Proper Logging

```csharp
// Provider implementation
public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
{
    _logger.LogInformation($"Getting location for vehicle {vehicleId}");

    try
    {
        var result = await CallProviderAPIAsync(vehicleId);

        _logger.LogInformation(
            $"Successfully retrieved location for vehicle {vehicleId} " +
            $"({result.Latitude}, {result.Longitude})");

        return FMSResponse<VehicleLocationDTO>.Success(result);
    }
    catch (HttpRequestException ex)
    {
        _logger.LogError(ex,
            $"HTTP error getting location for vehicle {vehicleId}: {ex.Message}");
        return FMSResponse<VehicleLocationDTO>.Failed($"Provider error: {ex.Message}");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            $"Unexpected error getting location for vehicle {vehicleId}");
        return FMSResponse<VehicleLocationDTO>.Failed($"Error: {ex.Message}");
    }
}
```

### 8. Reload After Configuration Changes

```csharp
// Always reload after updating configuration
await _configService.UpdateConfigurationAsync(providerConfig);
await _trackingService.ReloadProvidersAsync();
```

### 9. Use Dependency Injection

```csharp
// ✅ Good: Use DI
public class MyController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;

    public MyController(IVehicleTrackingService trackingService)
    {
        _trackingService = trackingService;
    }
}

// ❌ Bad: Create instances manually
var trackingService = new VehicleTrackingService(...); // Don't do this
```

### 10. Secure Sensitive Configuration

```csharp
// ✅ Use secure storage for sensitive data
// Store API keys in Azure Key Vault, AWS Secrets Manager, etc.

// In production, never log sensitive data
_logger.LogInformation($"Initializing provider with BaseUrl: {baseUrl}");
// ❌ Don't log: _logger.LogInformation($"API Key: {apiKey}");
```

---

## Additional Resources

### Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and design patterns
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Implementation details for each layer
- [USER_GUIDE.md](./USER_GUIDE.md) - User guide for administrators
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation

### Database Scripts

- `database/phase2_provider_configuration.sql` - Database schema
- `Phase4/01_GPSGateProvider_Configuration.sql` - GPSGate setup
- `Phase7/01_ProviderManagement_Navigation.sql` - UI navigation menu

### Sample Code

See the `examples/` directory for additional code samples and use cases.

---

**Last Updated**: November 2025
**Version**: 2.0.0
