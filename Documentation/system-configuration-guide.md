# FMS System Configuration Architecture

## Overview

The FMS System Configuration architecture provides a hierarchical approach to managing system-wide settings with multiple configuration sources and override capabilities.

## Configuration Priority

The configuration system follows this priority order:

1. **Database** - SystemConfigurations table (highest priority)
2. **appsettings.json** - FMSSystem section
3. **Default values** - SystemConfiguration.cs constants (lowest priority)

## Architecture Components

### 1. Default Configuration (SystemConfiguration.cs)
Located in: `FMS.Application/Configuration/SystemConfiguration.cs`

Contains constant values that serve as the ultimate fallback for all configuration settings:
- Device activity monitoring timeouts
- Work schedule defaults
- Command execution settings
- Maintenance intervals
- Logging configuration

### 2. Settings Configuration (FMSSystemSettings.cs)
Located in: `FMS.Application/Configuration/FMSSystemSettings.cs`

Provides strongly-typed classes for binding to appsettings.json:
- `DeviceActivitySettings`
- `WorkScheduleSettings`
- `CommandExecutionSettings`
- `MaintenanceSettings`
- `LoggingSettings`

### 3. Database Configuration (SystemConfiguration Entity)
Located in: `FMS.Domain/Entities/SystemConfiguration.cs`

Stores editable configuration values in the database:
- Key-value pairs with metadata
- Validation rules and constraints
- Category grouping
- Audit trail (created/updated timestamps and users)

### 4. Configuration Service
Located in: `FMS.Application/Services/Configuration/`

- `ISystemConfigurationService` - Interface
- `SystemConfigurationService` - Implementation

Provides unified access to configuration values with automatic priority resolution.

## Configuration Categories

### Device Activity Monitoring
- **WebSocketTimeoutSeconds**: Timeout for WebSocket connections
- **HttpTimeoutSeconds**: Timeout for HTTP connections
- **CheckIntervalSeconds**: How often to check device activity
- **ConfigCacheDurationMinutes**: Cache duration for configuration values

### Work Schedule
- **WorkStartTime**: Start of business hours (HH:mm format)
- **WorkEndTime**: End of business hours (HH:mm format)
- **Timezone**: Timezone for work schedule calculations

### Command Execution
- **CommandTimeoutSeconds**: Timeout for PTS commands
- **StaleConnectionThresholdMinutes**: When to consider connections stale

### Maintenance
- **RedisCleanupIntervalMinutes**: How often to clean Redis
- **EnableAutomaticCleanup**: Enable/disable automatic cleanup
- **EnablePerformanceLogging**: Enable detailed performance logs

### Logging
- **MinimumLevel**: Minimum log level (Trace, Debug, Information, Warning, Error, Critical)
- **MaxFileSizeMB**: Maximum log file size
- **RetainedFileCount**: Number of log files to keep
- **EnableVerboseDeviceLogging**: Verbose device activity logging

## Usage Examples

### In Service Classes

```csharp
public class MyService
{
    private readonly ISystemConfigurationService _config;

    public MyService(ISystemConfigurationService config)
    {
        _config = config;
    }

    public async Task DoSomething()
    {
        var timeout = await _config.GetWebSocketTimeoutSecondsAsync();
        var isWorkHours = await _config.IsWithinWorkHoursAsync();
        // Use configuration values...
    }
}
```

### Updating Configuration at Runtime

```csharp
// Update a configuration value
await _config.UpdateConfigurationAsync("System.WebSocketTimeout", "45");

// Reload configuration from all sources
await _config.ReloadConfigurationAsync();
```

## appsettings.json Example

```json
{
  "FMSSystem": {
    "DeviceActivity": {
      "WebSocketTimeoutSeconds": 30,
      "HttpTimeoutSeconds": 60,
      "CheckIntervalSeconds": 10,
      "ConfigCacheDurationMinutes": 5
    },
    "WorkSchedule": {
      "WorkStartTime": "06:00",
      "WorkEndTime": "22:00",
      "Timezone": "UTC"
    },
    "CommandExecution": {
      "CommandTimeoutSeconds": 15,
      "StaleConnectionThresholdMinutes": 5
    },
    "Maintenance": {
      "RedisCleanupIntervalMinutes": 5,
      "EnableAutomaticCleanup": true,
      "EnablePerformanceLogging": false
    },
    "Logging": {
      "MinimumLevel": "Information",
      "MaxFileSizeMB": 10,
      "RetainedFileCount": 31,
      "EnableVerboseDeviceLogging": false
    }
  }
}
```

## Database Setup

1. Run the SQL script: `Documentation/system-configuration-setup.sql`
2. This creates the `SystemConfigurations` table with initial values
3. Values can be modified through the database or through the configuration service

## Migration from Old System

The old device-specific configuration approach has been replaced:

### Before (DeviceActivityMonitorService.cs)
```csharp
// Old: Device-specific configuration query
var config = await context.Configurations
    .FirstOrDefaultAsync(c => c.PtsId == deviceId &&
                             c.ConfigurationId == Configuration.WEBSOCKET_TIMEOUT_KEY);
```

### After (DeviceActivityMonitorService.cs)
```csharp
// New: System-wide configuration service
var timeout = await _systemConfigurationService.GetWebSocketTimeoutSecondsAsync();
```

## Benefits

1. **Centralized Management**: All system configuration in one place
2. **Type Safety**: Strongly-typed configuration classes
3. **Runtime Updates**: Change configuration without restart
4. **Validation**: Built-in validation rules and constraints
5. **Audit Trail**: Track who changed what and when
6. **Fallback Chain**: Multiple levels of defaults ensure system always works
7. **Performance**: Caching reduces database queries

## Security Considerations

- Sensitive configuration values should be stored as environment variables
- Database configuration changes should be logged and audited
- Configuration validation prevents invalid values
- Only authorized users should modify system configuration

## Testing

- Unit tests can use mock implementations of `ISystemConfigurationService`
- Integration tests can use test-specific configuration values
- Configuration validation is automatically tested through data annotations