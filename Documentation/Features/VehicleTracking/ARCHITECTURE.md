# Vehicle Tracking System - Architecture

## Overview

The FMS Vehicle Tracking System is a plugin-based, multi-provider GPS tracking architecture that enables flexible integration with various GPS tracking providers while maintaining a unified API. The system supports automatic failover, health monitoring, and dynamic provider configuration without requiring code changes.

## Key Features

- **Multi-Provider Support**: Integrate multiple GPS tracking providers simultaneously
- **Plugin Architecture**: Add new providers through simple plugin implementation
- **Automatic Failover**: Health-aware provider switching ensures continuous tracking
- **Dynamic Configuration**: Update provider settings without restarting the system
- **Real-Time Monitoring**: Live health checks and performance metrics
- **Centralized Management**: Admin UI for provider configuration and monitoring
- **High Performance**: Built-in caching and parallel processing

## Design Principles

### 1. Clean Architecture

The system follows Clean Architecture principles with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│  (WebClient Controllers, React UI)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Application Layer                   │
│  (DTOs, FMSResponse wrapper)                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        Infrastructure Layer                 │
│  (Services, Providers, Factory, Registry)   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      Domain & Persistence Layer             │
│  (Entities, EF Core, Database)              │
└─────────────────────────────────────────────┘
```

### 2. Design Patterns

**Plugin Pattern**
- Providers implement `IVehicleTrackingProvider` interface
- Automatic discovery via `[Provider]` attribute
- Loose coupling through dependency injection

**Factory Pattern**
- `ProviderFactory` manages provider instantiation
- Dynamic creation based on configuration
- Lifecycle management for provider instances

**Registry Pattern**
- `ProviderRegistry` discovers and registers providers
- Assembly scanning for automatic discovery
- Metadata storage for provider capabilities

**Adapter Pattern**
- `VehicleTrackingServiceAdapter` bridges legacy `IGPSService` interface
- Maintains backward compatibility
- Enriches data from multiple sources

**Repository Pattern**
- `ProviderConfigurationService` manages provider configurations
- Abstracts database operations
- Handles vehicle-to-provider mappings

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Web Client                            │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Provider Mgmt UI │  │ ProviderManagementController│   │
│  │  (React)         │  │  (API Endpoints)         │   │
│  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │       IVehicleTrackingService                    │  │
│  │  - Unified API for all providers                 │  │
│  │  - Automatic failover                            │  │
│  │  - Caching (30s location, 60s health)            │  │
│  │  - Statistics tracking                           │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │           IProviderFactory                       │  │
│  │  - Provider instantiation with DI                │  │
│  │  - Provider caching (ConcurrentDictionary)       │  │
│  │  - Lifecycle management                          │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │          IProviderRegistry                       │  │
│  │  - Assembly scanning                             │  │
│  │  - Provider discovery via [Provider] attribute   │  │
│  │  - Metadata storage                              │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │     IProviderConfigurationService                │  │
│  │  - Database-backed configuration                 │  │
│  │  - Vehicle-to-provider mappings                  │  │
│  │  - Health history tracking                       │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Provider Implementations                  │  │
│  │  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │ GPSGate      │  │ Future       │             │  │
│  │  │ Provider     │  │ Providers    │             │  │
│  │  └──────────────┘  └──────────────┘             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Domain & Persistence                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Database Entities (EF Core)                     │  │
│  │  - ProviderConfigurationEntity                   │  │
│  │  - ProviderHealthHistoryEntity                   │  │
│  │  - VehicleProviderMappingEntity                  │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │            MySQL Database                        │  │
│  │  - provider_configurations table                 │  │
│  │  - provider_health_history table                 │  │
│  │  - vehicle_provider_mappings table               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

#### Location Request Flow

```
1. Client Request
   ↓
2. IVehicleTrackingService.GetVehicleLocationAsync(vehicleId)
   ↓
3. Cache Check (30-second TTL)
   ├─ Cache Hit → Return cached location
   └─ Cache Miss → Continue
   ↓
4. Determine Provider for Vehicle
   ├─ Check vehicle_provider_mappings table
   ├─ Use vehicle-specific provider if mapped
   └─ Fall back to default provider
   ↓
5. IProviderFactory.GetProviderAsync(providerName)
   ├─ Check provider cache
   ├─ Return cached instance if available
   └─ Create new instance via DI
   ↓
6. Provider.GetVehicleLocationAsync(vehicleId)
   ├─ Make API call to GPS provider
   ├─ Parse response
   └─ Return location data
   ↓
7. Error Handling & Failover
   ├─ If provider fails → Get next priority provider
   ├─ Retry with backup provider
   └─ Record failover event
   ↓
8. Cache Result (30 seconds)
   ↓
9. Return Response to Client
```

#### Health Monitoring Flow

```
1. Background Health Check (every 60 seconds)
   ↓
2. For each enabled provider:
   ├─ Call provider.ValidateConnectionAsync()
   ├─ Measure response time
   ├─ Calculate success rate
   └─ Determine health status
   ↓
3. Update Health Status
   ├─ Store in provider_health_history table
   ├─ Update cache (60-second TTL)
   └─ Trigger alerts if unhealthy
   ↓
4. Failover Decision
   ├─ If primary provider unhealthy
   ├─ Switch to next priority provider
   └─ Log failover event
```

#### Configuration Update Flow

```
1. Admin updates provider configuration via UI
   ↓
2. API: PUT /api/v1/providers/{providerId}
   ↓
3. ProviderConfigurationService.UpdateConfigurationAsync()
   ├─ Validate configuration
   ├─ Update provider_configurations table
   └─ Return success
   ↓
4. API: POST /api/v1/providers/reload
   ↓
5. VehicleTrackingService.ReloadProvidersAsync()
   ├─ Clear provider cache
   ├─ Clear location cache
   ├─ Reinitialize all providers
   └─ Trigger health checks
   ↓
6. Providers automatically pick up new configuration
```

## Core Interfaces

### IVehicleTrackingProvider

The primary interface that all GPS tracking providers must implement:

```csharp
public interface IVehicleTrackingProvider
{
    // Metadata
    string ProviderName { get; }
    string ProviderVersion { get; }
    ProviderCapabilities Capabilities { get; }
    ProviderMetadata Metadata { get; }

    // Lifecycle
    Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration);
    Task<FMSResponse<bool>> ValidateConnectionAsync();

    // Location Services
    Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);
    Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

    // Health Monitoring
    Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync();

    // Device Management
    Task<FMSResponse<string>> GetExternalDeviceIdAsync(int vehicleId);
    Task<FMSResponse<bool>> MapVehicleToDeviceAsync(int vehicleId, string externalDeviceId);
}
```

### IVehicleTrackingService

Unified service interface abstracting all providers:

```csharp
public interface IVehicleTrackingService
{
    // Single vehicle operations
    Task<VehicleLocation?> GetVehicleLocationAsync(int vehicleId);
    Task<List<VehicleLocation>> GetVehicleLocationHistoryAsync(
        int vehicleId, DateTime from, DateTime to, int maxPoints = 1000);

    // Batch operations
    Task<Dictionary<int, VehicleLocation>> GetVehicleLocationsAsync(
        IEnumerable<int> vehicleIds);

    // Provider management
    Task<string?> GetProviderForVehicleAsync(int vehicleId);
    Task<Dictionary<string, ProviderHealthStatus>> GetProvidersHealthAsync();
    Task<bool> TestProviderConnectivityAsync(string providerName);
    Task ReloadProvidersAsync();

    // Statistics
    Task<ProviderUsageStatistics> GetProviderStatisticsAsync();
}
```

### IProviderFactory

Factory for creating and managing provider instances:

```csharp
public interface IProviderFactory
{
    // Provider creation
    Task<IVehicleTrackingProvider?> GetProviderAsync(string providerName);
    Task<IVehicleTrackingProvider?> GetDefaultProviderAsync();
    Task<IVehicleTrackingProvider?> GetProviderForVehicleAsync(int vehicleId);

    // Provider discovery
    Task<List<IVehicleTrackingProvider>> GetAllProvidersAsync();
    Task<List<IVehicleTrackingProvider>> GetHealthyProvidersAsync();

    // Lifecycle
    Task ReloadProvidersAsync();
    Task<bool> ProviderExistsAsync(string providerName);
}
```

### IProviderRegistry

Registry for provider discovery and metadata:

```csharp
public interface IProviderRegistry
{
    // Discovery
    void DiscoverProviders();
    IReadOnlyList<ProviderMetadata> GetAllProviderMetadata();
    ProviderMetadata? GetProviderMetadata(string providerName);

    // Registration
    void RegisterProvider(Type providerType);
    bool IsProviderRegistered(string providerName);
}
```

### IProviderConfigurationService

Service for managing provider configurations:

```csharp
public interface IProviderConfigurationService
{
    // Configuration CRUD
    Task<ProviderConfigurationEntity?> GetConfigurationAsync(int providerId);
    Task<ProviderConfigurationEntity?> GetConfigurationByNameAsync(string providerName);
    Task<List<ProviderConfigurationEntity>> GetAllConfigurationsAsync();
    Task<ProviderConfigurationEntity> CreateConfigurationAsync(ProviderConfigurationEntity config);
    Task<bool> UpdateConfigurationAsync(ProviderConfigurationEntity config);
    Task<bool> DeleteConfigurationAsync(int providerId);

    // Provider management
    Task<ProviderConfigurationEntity?> GetDefaultProviderAsync();
    Task<bool> SetDefaultProviderAsync(int providerId);
    Task<bool> EnableProviderAsync(int providerId);
    Task<bool> DisableProviderAsync(int providerId);

    // Vehicle mappings
    Task<string?> GetProviderForVehicleAsync(int vehicleId);
    Task<bool> MapVehicleToProviderAsync(int vehicleId, int providerId, string? externalDeviceId);
    Task<bool> UnmapVehicleFromProviderAsync(int vehicleId);
    Task<List<VehicleProviderMappingEntity>> GetAllMappingsAsync();

    // Health tracking
    Task RecordHealthStatusAsync(string providerName, ProviderHealthStatus status);
    Task<List<ProviderHealthHistoryEntity>> GetHealthHistoryAsync(
        string providerName, DateTime from, DateTime to);
}
```

## Database Schema

### provider_configurations

Stores provider configuration and settings:

```sql
CREATE TABLE provider_configurations (
    provider_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 100,
    configuration_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_provider_name (provider_name),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_is_default (is_default),
    INDEX idx_priority_order (priority_order)
);
```

### vehicle_provider_mappings

Maps vehicles to specific providers:

```sql
CREATE TABLE vehicle_provider_mappings (
    mapping_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    provider_id INT NOT NULL,
    external_device_id VARCHAR(255),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,

    FOREIGN KEY (provider_id) REFERENCES provider_configurations(provider_id),
    UNIQUE INDEX idx_vehicle_provider (vehicle_id, provider_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_provider_id (provider_id),
    INDEX idx_is_active (is_active)
);
```

### provider_health_history

Tracks provider health over time:

```sql
CREATE TABLE provider_health_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(100) NOT NULL,
    status ENUM('Healthy', 'Degraded', 'Unhealthy') NOT NULL,
    response_time_ms DOUBLE,
    error_count INT DEFAULT 0,
    success_rate DECIMAL(5,2),
    message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metrics JSON,

    INDEX idx_provider_checked (provider_name, checked_at),
    INDEX idx_status (status),
    INDEX idx_checked_at (checked_at)
);
```

## Performance Optimizations

### Caching Strategy

**Location Cache**
- **TTL**: 30 seconds
- **Key**: `vehicle_location:{vehicleId}`
- **Storage**: IMemoryCache
- **Purpose**: Reduce API calls to GPS providers

**Health Cache**
- **TTL**: 60 seconds
- **Key**: `provider_health:{providerName}`
- **Storage**: IMemoryCache
- **Purpose**: Avoid frequent health checks

**Provider Cache**
- **TTL**: Until reload
- **Key**: Provider name
- **Storage**: ConcurrentDictionary
- **Purpose**: Reuse provider instances

### Parallel Processing

**Batch Location Retrieval**
```csharp
// Process multiple vehicles in parallel
var tasks = vehicleIds.Select(id => GetVehicleLocationAsync(id));
var locations = await Task.WhenAll(tasks);
```

**Health Checks**
```csharp
// Check all providers in parallel
var healthTasks = providers.Select(p => p.GetHealthStatusAsync());
var healthStatuses = await Task.WhenAll(healthTasks);
```

### Thread Safety

**Interlocked Operations**
```csharp
// Thread-safe statistics updates
Interlocked.Increment(ref _totalRequests);
Interlocked.Increment(ref _successfulRequests);
```

**Concurrent Collections**
```csharp
// Thread-safe provider cache
private readonly ConcurrentDictionary<string, IVehicleTrackingProvider> _providerCache;
```

## Error Handling & Resilience

### Automatic Failover

```csharp
// Priority-based failover
var providers = await _factory.GetHealthyProvidersAsync();
foreach (var provider in providers.OrderBy(p => p.Priority))
{
    try
    {
        var result = await provider.GetVehicleLocationAsync(vehicleId);
        if (result.Success) return result;
    }
    catch (Exception ex)
    {
        _logger.LogWarning($"Provider {provider.Name} failed: {ex.Message}");
        // Continue to next provider
    }
}
```

### Health-Aware Routing

```csharp
// Only use healthy providers
var healthyProviders = providers
    .Where(p => p.HealthStatus == HealthStatus.Healthy)
    .OrderBy(p => p.Priority);
```

### Circuit Breaker Pattern

```csharp
// Disable provider if too many failures
if (failureCount > threshold)
{
    await _configService.DisableProviderAsync(providerId);
    _logger.LogError($"Provider {providerName} disabled due to excessive failures");
}
```

## Security Considerations

### Sensitive Configuration Data

- API keys and passwords stored in JSON configuration
- Encrypted at rest in database
- Never logged or exposed in API responses
- Secure transmission via HTTPS

### Authentication & Authorization

- All API endpoints require JWT authentication
- Role-based access control (Admin role required)
- Audit trail for configuration changes

### API Rate Limiting

- Caching reduces load on GPS provider APIs
- Configurable rate limits per provider
- Prevents abuse and cost overruns

## Extensibility

### Adding New Providers

1. Implement `IVehicleTrackingProvider`
2. Add `[Provider]` attribute with metadata
3. Register services in DI container
4. System automatically discovers and registers the provider

```csharp
[Provider("MyProvider",
    DisplayName = "My GPS Provider",
    Description = "Integration with My GPS System",
    Version = "1.0.0")]
public class MyGPSProvider : IVehicleTrackingProvider
{
    // Implementation
}
```

### Custom Health Checks

Providers can implement custom health logic:

```csharp
public async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
{
    // Custom health check logic
    var isHealthy = await CheckCustomMetrics();

    return FMSResponse<ProviderHealthStatus>.Success(new ProviderHealthStatus
    {
        Status = isHealthy ? HealthStatus.Healthy : HealthStatus.Degraded,
        // Custom metrics
    });
}
```

### Provider Capabilities

Advertise provider-specific features:

```csharp
public ProviderCapabilities Capabilities => new()
{
    SupportsRealTimeLocation = true,
    SupportsHistoricalData = true,
    SupportsGeofencing = true,
    SupportsEvents = false,
    SupportsOdometer = true
};
```

## Testing Strategy

### Unit Testing

- Mock IVehicleTrackingProvider for service tests
- Test factory creation logic
- Test failover scenarios
- Test caching behavior

### Integration Testing

- Test database operations
- Test provider discovery
- Test end-to-end location retrieval
- Test failover with real providers

### Performance Testing

- Benchmark cache hit rates
- Test concurrent request handling
- Measure failover time
- Test batch operation performance

## Deployment Considerations

### Database Migrations

- Run SQL scripts before deployment
- Verify indexes and constraints
- Test data migration scripts

### Configuration

- Update provider configurations in database
- Configure caching durations
- Set health check intervals
- Configure logging levels

### Monitoring

- Track provider health metrics
- Monitor cache hit rates
- Alert on failover events
- Track API response times

## Future Enhancements

### Planned Features

- **Advanced Analytics**: Historical trend analysis, predictive maintenance
- **Multi-Tenancy**: Separate provider configurations per tenant
- **Event Streaming**: Real-time location updates via WebSockets
- **Geofencing**: Provider-agnostic geofencing support
- **Provider Marketplace**: Plugin repository for third-party providers

### Scalability

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Distributed Caching**: Redis for shared cache across instances
- **Queue-Based Processing**: Background job processing for heavy operations
- **Database Sharding**: Partition by vehicle or provider for large fleets

---

**Last Updated**: November 2025
**Version**: 2.0.0
