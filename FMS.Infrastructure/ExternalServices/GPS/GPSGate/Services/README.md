# GPSGate Services Architecture

## Overview
This folder contains all GPSGate-specific service implementations. The services are organized by domain responsibility and share a common configuration provider.

## Key Components

### 1. GPSGateConfigurationProvider (Shared)
**Purpose**: Centralized configuration management for all GPSGate services.

**Features**:
- Loads configuration from `provider_configurations` database table
- Caches configuration for 5 minutes to reduce database calls
- Supports both API Key and Basic (Username/Password) authentication
- Handles authentication header creation automatically

**Usage**:
```csharp
var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
```

**Configuration Format in Database**:
```json
{
  "BaseUrl": "http://10.0.10.150/comGpsGate/api/v.1",
  "ApplicationId": "12",
  "Username": "your-username",
  "Password": "your-password"
}
```

### 2. Domain-Specific Services

#### GPSGateSensorService
- Handles all sensor data (fuel level, temperature, battery, ignition, engine status)
- Provides comprehensive vehicle GPS information including sensor health

#### GPSGateLocationService
- Handles vehicle location tracking
- Provides historical track data
- Calculates distances and detects stops

#### GPSGateGeofenceService
- Manages geofence operations
- Checks if vehicles are within boundaries

#### GPSGateEventService
- Handles GPS events and alerts
- Manages event acknowledgment

#### GPSGateHealthService
- Monitors GPS provider system health
- Provides connectivity checks

## Migration from AppSettings

### Before (Old Way)
```csharp
// Service reads from appsettings.json
private readonly string _apiKey;
private readonly string _baseUrl;
private readonly int _applicationId;

public GPSGateSensorService(IConfiguration configuration, ...)
{
    _apiKey = configuration["GPSGate:ApiKey"];
    _baseUrl = configuration["GPSGate:BaseUrl"];
    _applicationId = int.Parse(configuration["GPSGate:ApplicationId"]);
}
```

### After (New Way)
```csharp
// Service uses shared configuration provider
private readonly IGPSGateConfigurationProvider _configurationProvider;

public GPSGateSensorService(IGPSGateConfigurationProvider configurationProvider, ...)
{
    _configurationProvider = configurationProvider;
}

// Get configuration when needed
var (baseUrl, applicationId, authHeader) = await _configurationProvider.GetProviderSettingsAsync();
```

## Benefits

1. **Centralized Configuration**: One place to manage GPSGate settings across all services
2. **Database-Driven**: Configuration stored in `provider_configurations` table, no need to edit appsettings.json
3. **Caching**: Reduces database calls by caching configuration for 5 minutes
4. **Multi-Provider Ready**: Easy to add support for other GPS providers (Geotab, Traccar, etc.)
5. **Authentication Flexibility**: Supports both API Key and Basic Auth automatically

## Adding New GPSGate Services

1. Create your service interface and implementation
2. Inject `IGPSGateConfigurationProvider` in the constructor
3. Call `await _configurationProvider.GetProviderSettingsAsync()` to get configuration
4. Register your service in `VehicleTrackingServiceCollectionExtensions.cs`

Example:
```csharp
public class GPSGateMyNewService : IGPSGateMyNewService
{
    private readonly IGPSGateConfigurationProvider _configurationProvider;
    private readonly HttpClient _httpClient;

    public GPSGateMyNewService(
        IGPSGateConfigurationProvider configurationProvider,
        HttpClient httpClient)
    {
        _configurationProvider = configurationProvider;
        _httpClient = httpClient;
    }

    public async Task<Result> DoSomethingAsync()
    {
        var (baseUrl, appId, auth) = await _configurationProvider.GetProviderSettingsAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/your-endpoint");
        request.Headers.Authorization = auth;

        var response = await _httpClient.SendAsync(request);
        // ... process response
    }
}
```

## Testing

To test configuration loading:
1. Ensure `provider_configurations` table has an enabled GPSGate entry
2. Verify the `Settings` column contains valid JSON with BaseUrl and credentials
3. Call any GPSGate service - configuration will be loaded automatically
4. Check logs for confirmation: "GPSGate configuration loaded successfully"

## Troubleshooting

**Error: "GPSGate provider configuration not found or is disabled"**
- Check if there's a record in `provider_configurations` where `name = 'GPSGate'` and `is_enabled = 1`

**Error: "Invalid GPSGate configuration settings"**
- Verify the `Settings` JSON column contains valid JSON with required fields (BaseUrl, ApplicationId)

**Error: "GPSGate configuration missing both ApiKey and Username/Password"**
- Add either `ApiKey` OR both `Username` and `Password` to the Settings JSON

**Configuration not updating**
- Configuration is cached for 5 minutes. Wait or restart the application to force reload.
