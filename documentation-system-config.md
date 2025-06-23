# FMS System Configuration Architecture

## Overview

The FMS System Configuration provides a hierarchical approach to managing system-wide settings with multiple configuration sources and override capabilities.

## Configuration Priority

1. **Database** - SystemConfigurations table (highest priority)
2. **appsettings.json** - FMSSystem section
3. **Default values** - SystemConfiguration.cs constants (lowest priority)

## Key Components

### 1. SystemConfiguration.cs - Default Values
Contains constants that serve as ultimate fallbacks:
- `DEFAULT_WEBSOCKET_TIMEOUT_SECONDS = 30`
- `DEFAULT_HTTP_TIMEOUT_SECONDS = 60`
- And other system defaults

### 2. FMSSystemSettings.cs - Settings Classes
Strongly-typed classes for appsettings.json binding:
- `DeviceActivitySettings`
- `WorkScheduleSettings`
- `CommandExecutionSettings`
- `MaintenanceSettings`

### 3. SystemConfiguration Entity - Database Storage
Stores editable configuration in database with:
- Key-value pairs
- Validation rules
- Category grouping
- Audit trail

### 4. ISystemConfigurationService - Unified Access
Service providing configuration values with automatic priority resolution.

## Usage Example

```csharp
public class DeviceActivityMonitorService
{
    private readonly ISystemConfigurationService _config;

    public async Task CheckActivity()
    {
        var wsTimeout = await _config.GetWebSocketTimeoutSecondsAsync();
        var httpTimeout = await _config.GetHttpTimeoutSecondsAsync();
        // Use timeouts...
    }
}
```

## appsettings.json Structure

```json
{
  "FMSSystem": {
    "DeviceActivity": {
      "WebSocketTimeoutSeconds": 30,
      "HttpTimeoutSeconds": 60,
      "CheckIntervalSeconds": 10
    },
    "WorkSchedule": {
      "WorkStartTime": "06:00",
      "WorkEndTime": "22:00",
      "Timezone": "UTC"
    }
  }
}
```

## Database Setup

Run the SQL script `system-configuration-setup.sql` to create the SystemConfigurations table with initial values.

## Migration Notes

Old approach (removed):
```csharp
// Device-specific configuration query per device
var config = await context.Configurations
    .FirstOrDefaultAsync(c => c.PtsId == deviceId &&
                             c.ConfigurationId == Configuration.WEBSOCKET_TIMEOUT_KEY);
```

New approach:
```csharp
// System-wide configuration service
var timeout = await _systemConfigurationService.GetWebSocketTimeoutSecondsAsync();
```

## Benefits

- ✅ Centralized configuration management
- ✅ Type-safe configuration classes
- ✅ Runtime configuration updates
- ✅ Built-in validation and constraints
- ✅ Performance optimization through caching
- ✅ Clear fallback hierarchy
- ✅ Audit trail for changes