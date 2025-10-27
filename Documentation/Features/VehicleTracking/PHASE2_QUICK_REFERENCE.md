# Phase 2 Quick Reference Guide

## Provider Configuration System - At a Glance

### ✅ Status: COMPLETED & BUILD SUCCESSFUL

---

## Quick Start

### 1. Database Setup

```sql
-- Run migration script
SOURCE Documentation/Features/VehicleTracking/database/phase2_provider_configuration.sql;

-- Verify tables created
SHOW TABLES LIKE 'provider%';
SHOW TABLES LIKE 'vehicle_provider%';
```

### 2. Service Registration (DI)

```csharp
// In Startup.cs or Program.cs
services.AddScoped<IProviderConfigurationService, ProviderConfigurationService>();
```

### 3. Basic Usage

```csharp
public class VehicleController : ControllerBase
{
    private readonly IProviderConfigurationService _providerService;

    public VehicleController(IProviderConfigurationService providerService)
    {
        _providerService = providerService;
    }

    // Get all active providers
    public async Task<IActionResult> GetProviders()
    {
        var providers = await _providerService.GetAllAsync();
        return Ok(providers);
    }

    // Get provider for specific vehicle
    public async Task<IActionResult> GetVehicleProvider(int vehicleId)
    {
        var provider = await _providerService.GetForVehicleAsync(vehicleId);
        return Ok(provider);
    }

    // Create new provider
    public async Task<IActionResult> CreateProvider(ProviderConfiguration config)
    {
        var id = await _providerService.CreateAsync(config, User.Identity.Name);
        return Ok(id);
    }
}
```

---

## API Quick Reference

### Configuration Management

| Method               | Purpose                  | Parameters                   | Returns                       |
| -------------------- | ------------------------ | ---------------------------- | ----------------------------- |
| `GetAllAsync`        | List all providers       | `bool includeDisabled`       | `List<ProviderConfiguration>` |
| `GetByNameAsync`     | Get by name              | `string providerName`        | `ProviderConfiguration?`      |
| `GetByIdAsync`       | Get by ID                | `int id`                     | `ProviderConfiguration?`      |
| `GetDefaultAsync`    | Get default provider     | -                            | `ProviderConfiguration?`      |
| `GetForVehicleAsync` | Get provider for vehicle | `int vehicleId`              | `ProviderConfiguration?`      |
| `CreateAsync`        | Create provider          | `config, currentUser`        | `int` (ID)                    |
| `UpdateAsync`        | Update provider          | `config, currentUser`        | `bool`                        |
| `DeleteAsync`        | Delete (soft) provider   | `id, currentUser`            | `bool`                        |
| `SetDefaultAsync`    | Set default provider     | `name, currentUser`          | `bool`                        |
| `SetEnabledAsync`    | Enable/disable           | `name, enabled, currentUser` | `bool`                        |

### Vehicle Mapping

| Method                          | Purpose                   | Returns     |
| ------------------------------- | ------------------------- | ----------- |
| `MapVehicleToProviderAsync`     | Map vehicle to provider   | `bool`      |
| `UnmapVehicleFromProviderAsync` | Remove mapping            | `bool`      |
| `GetMappedVehiclesAsync`        | Get vehicles for provider | `List<int>` |

### Health Monitoring

| Method                       | Purpose             | Returns                      |
| ---------------------------- | ------------------- | ---------------------------- |
| `RecordHealthStatusAsync`    | Record health check | `bool`                       |
| `GetHealthHistoryAsync`      | Get health history  | `List<ProviderHealthStatus>` |
| `GetLatestHealthStatusAsync` | Get latest status   | `ProviderHealthStatus?`      |

---

## Database Schema

### Tables

#### provider_configurations

```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(100) UNIQUE NOT NULL
display_name VARCHAR(200) NOT NULL
description VARCHAR(1000)
is_enabled BOOLEAN DEFAULT TRUE
is_default BOOLEAN DEFAULT FALSE
version VARCHAR(50) DEFAULT '1.0.0'
settings JSON NOT NULL
priority INT DEFAULT 999
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
created_by VARCHAR(100)
updated_by VARCHAR(100)
is_deleted BOOLEAN DEFAULT FALSE
deleted_at TIMESTAMP NULL
deleted_by VARCHAR(100)
```

**Indexes:**

- `idx_provider_name` (UNIQUE on name)
- `idx_provider_enabled` (on is_enabled)
- `idx_provider_default` (on is_default)
- `idx_provider_active` (on is_deleted, is_enabled, priority)

#### provider_health_history

```sql
id INT PRIMARY KEY AUTO_INCREMENT
provider_config_id INT NOT NULL
provider_name VARCHAR(100) NOT NULL
status VARCHAR(50) NOT NULL
message TEXT
response_time_ms INT
success_rate DECIMAL(5,2)
error_count INT DEFAULT 0
additional_metrics JSON
checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Indexes:**

- `idx_health_provider` (on provider_config_id)
- `idx_health_checked_at` (on checked_at)
- `idx_health_provider_time` (on provider_config_id, checked_at DESC)
- `idx_health_status` (on status)

**Foreign Key:** CASCADE DELETE on provider_config_id

#### vehicle_provider_mappings

```sql
id INT PRIMARY KEY AUTO_INCREMENT
vehicle_id INT NOT NULL
provider_config_id INT NOT NULL
external_device_id VARCHAR(200)
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
created_by VARCHAR(100)
updated_by VARCHAR(100)
```

**Indexes:**

- `idx_vehicle_active_unique` (UNIQUE on vehicle_id, is_active WHERE is_active=1)
- `idx_mapping_vehicle` (on vehicle_id)
- `idx_mapping_provider` (on provider_config_id)
- `idx_mapping_external` (on external_device_id)

**Foreign Key:** CASCADE DELETE on provider_config_id

---

## Usage Examples

### Example 1: Create Provider Configuration

```csharp
var config = new ProviderConfiguration
{
    Name = "Geotab",
    DisplayName = "Geotab GPS",
    Description = "Geotab fleet tracking",
    IsEnabled = true,
    Priority = 2,
    Settings = JsonSerializer.Serialize(new
    {
        ApiUrl = "https://api.geotab.com",
        Database = "myDatabase",
        Username = "username",
        Password = "encrypted_password"
    })
};

var id = await _providerService.CreateAsync(config, "admin");
```

### Example 2: Set Default Provider

```csharp
// Set GPSGate as default
var success = await _providerService.SetDefaultAsync("GPSGate", "admin");

// Get default provider
var defaultProvider = await _providerService.GetDefaultAsync();
```

### Example 3: Map Vehicle to Provider

```csharp
// Map vehicle 123 to Geotab with external device ID
var mapped = await _providerService.MapVehicleToProviderAsync(
    vehicleId: 123,
    providerName: "Geotab",
    externalDeviceId: "GEOTAB-DEVICE-456",
    currentUser: "admin"
);

// Get provider for vehicle (returns Geotab)
var provider = await _providerService.GetForVehicleAsync(123);

// Unmap vehicle (falls back to default)
await _providerService.UnmapVehicleFromProviderAsync(123, "admin");
```

### Example 4: Record Health Status

```csharp
var healthStatus = new ProviderHealthStatus
{
    ProviderName = "GPSGate",
    Status = HealthStatus.Healthy,
    Message = "All systems operational",
    ResponseTimeMs = 250,
    SuccessRate = 99.5m,
    ErrorCount = 0,
    CheckedAt = DateTime.UtcNow,
    AdditionalMetrics = JsonSerializer.Serialize(new
    {
        ActiveConnections = 150,
        QueueDepth = 5,
        MemoryUsageMB = 512
    })
};

await _providerService.RecordHealthStatusAsync(healthStatus);
```

### Example 5: Get Health History

```csharp
// Get health history for last 7 days
var history = await _providerService.GetHealthHistoryAsync(
    providerName: "GPSGate",
    from: DateTime.UtcNow.AddDays(-7),
    to: DateTime.UtcNow,
    maxRecords: 100
);

// Get latest status
var latest = await _providerService.GetLatestHealthStatusAsync("GPSGate");
```

---

## Database Views

### v_active_providers

Lists all active (enabled and not deleted) providers:

```sql
SELECT * FROM v_active_providers;
```

### v_provider_health_summary

Shows latest health status with check counts per provider:

```sql
SELECT * FROM v_provider_health_summary;
```

### v_vehicle_provider_assignments

Shows current vehicle-to-provider mappings:

```sql
SELECT * FROM v_vehicle_provider_assignments WHERE vehicle_id = 123;
```

---

## Stored Procedures

### sp_get_default_provider()

```sql
CALL sp_get_default_provider();
```

Returns the default provider configuration.

### sp_get_provider_for_vehicle(vehicleId)

```sql
CALL sp_get_provider_for_vehicle(123);
```

Returns the provider for a specific vehicle (mapped or default).

### sp_record_health_check(params)

```sql
CALL sp_record_health_check(
    1,                  -- provider_config_id
    'GPSGate',          -- provider_name
    'Healthy',          -- status
    'All OK',           -- message
    250,                -- response_time_ms
    99.5,               -- success_rate
    0,                  -- error_count
    NULL                -- additional_metrics
);
```

Records a health check result.

---

## Configuration Settings Format

Provider settings are stored as JSON strings. Example:

```json
{
  "ApiUrl": "https://api.provider.com",
  "ApiKey": "encrypted_api_key",
  "Timeout": 30000,
  "MaxRetries": 3,
  "Features": {
    "RealTimeTracking": true,
    "HistoricalData": true,
    "Geofencing": false
  }
}
```

Access using model methods:

```csharp
var apiUrl = config.GetValue<string>("ApiUrl");
config.SetValue("Timeout", 60000);
```

---

## Error Handling

All service methods throw exceptions on critical errors:

- `ArgumentNullException` - Null parameters
- `DbUpdateException` - Database constraint violations
- `JsonException` - JSON serialization errors
- `InvalidOperationException` - Business rule violations

Use try-catch in controllers:

```csharp
try
{
    var id = await _providerService.CreateAsync(config, user);
    return Ok(id);
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex, "Failed to create provider");
    return BadRequest("Provider with this name already exists");
}
```

---

## Performance Tips

1. **Use Indexes:** All queries use indexed columns for optimal performance
2. **Limit History Queries:** Use `maxRecords` parameter to limit result set size
3. **Cache Default Provider:** Default provider doesn't change frequently
4. **Bulk Operations:** For multiple vehicles, use batch operations
5. **JSON Parsing:** Parse JSON settings only when needed, not on every query

---

## Security Considerations

1. **Encrypt Sensitive Data:** Encrypt API keys and passwords in `settings` JSON
2. **Audit Trail:** All create/update/delete operations are audited
3. **Soft Delete:** Deleted configurations are preserved for audit purposes
4. **Input Validation:** Validate all input parameters in controllers
5. **User Context:** Pass current user to all mutating operations

---

## Troubleshooting

### Provider not found

```csharp
var provider = await _providerService.GetByNameAsync("Unknown");
if (provider == null)
{
    // Provider doesn't exist or is deleted
}
```

### Multiple default providers

```sql
-- Check for multiple defaults (should not happen)
SELECT COUNT(*) FROM provider_configurations
WHERE is_default = TRUE AND is_deleted = FALSE;
```

### Vehicle mapping not working

```sql
-- Check if vehicle has active mapping
SELECT * FROM vehicle_provider_mappings
WHERE vehicle_id = 123 AND is_active = TRUE;
```

---

## Next Phase Preview

**Phase 3: Provider Factory & Discovery**

Will implement:

- Provider factory for dynamic instantiation
- Provider discovery mechanism
- Failover logic with health awareness
- Circuit breaker pattern
- Unified vehicle tracking service

---

## File Locations

### Code Files

- Entities: `FMS.Domain/Entities/VehicleTracking/`
- Configurations: `FMS.Persistence/EntityConfigurations/VehicleTracking/`
- Services: `FMS.Infrastructure/VehicleTracking/Services/`
- Models: `FMS.Infrastructure/VehicleTracking/Models/`

### Documentation

- Phase 2 Summary: `Documentation/Features/VehicleTracking/PHASE2_COMPLETION_SUMMARY.md`
- Quick Reference: `Documentation/Features/VehicleTracking/PHASE2_QUICK_REFERENCE.md`
- Database Script: `Documentation/Features/VehicleTracking/database/phase2_provider_configuration.sql`

---

_Quick Reference Guide - Phase 2 Provider Configuration System_
_Ready for Production ✅_
