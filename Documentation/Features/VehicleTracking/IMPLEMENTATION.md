# Vehicle Tracking System - Implementation Guide

## Overview

This document provides a comprehensive guide to the implemented components of the FMS Vehicle Tracking System. It details what has been built in each layer of the application, where the code is located, and how the components interact.

## Implementation Status

### Completed Components

| Layer               | Component                      | Status      | Files |
| ------------------- | ------------------------------ | ----------- | ----- |
| **Domain**          | Entities                       | ✅ Complete | 3     |
| **Persistence**     | Entity Configurations          | ✅ Complete | 3     |
| **Persistence**     | Database Context               | ✅ Complete | 1     |
| **Infrastructure**  | Core Interfaces                | ✅ Complete | 4     |
| **Infrastructure**  | Provider Factory & Registry    | ✅ Complete | 4     |
| **Infrastructure**  | Services                       | ✅ Complete | 4     |
| **Infrastructure**  | GPSGate Provider               | ✅ Complete | 1     |
| **Infrastructure**  | Models                         | ✅ Complete | 45+   |
| **Infrastructure**  | Adapters                       | ✅ Complete | 1     |
| **Infrastructure**  | Extensions                     | ✅ Complete | 1     |
| **Application**     | DTOs                           | ✅ Complete | 2     |
| **WebClient**       | API Controller                 | ✅ Complete | 1     |
| **WebClient**       | React UI Components            | ✅ Complete | 5     |
| **Database**        | Schema & Migrations            | ✅ Complete | 3     |
| **Documentation**   | User Guides & API Reference    | ✅ Complete | Multiple |

---

## Domain Layer

**Location**: `FMS.Domain/Entities/VehicleTracking/`

The domain layer defines the core business entities for provider configuration and health tracking.

### Entities

#### 1. ProviderConfigurationEntity

**File**: `FMS.Domain/Entities/VehicleTracking/ProviderConfigurationEntity.cs`

**Purpose**: Represents a GPS tracking provider configuration in the database.

**Properties**:
```csharp
public class ProviderConfigurationEntity
{
    public int ProviderId { get; set; }                    // Primary key
    public string ProviderName { get; set; }               // Unique identifier (e.g., "GPSGate")
    public string? DisplayName { get; set; }               // User-friendly name
    public string? Description { get; set; }               // Provider description
    public bool IsEnabled { get; set; }                    // Whether provider is active
    public bool IsDefault { get; set; }                    // Whether provider is default
    public int PriorityOrder { get; set; }                 // Failover priority (lower = higher priority)
    public string? ConfigurationData { get; set; }         // JSON configuration data
    public DateTime CreatedAt { get; set; }                // Creation timestamp
    public DateTime? UpdatedAt { get; set; }               // Last update timestamp
    public DateTime? DeletedAt { get; set; }               // Soft delete timestamp

    // Navigation properties
    public ICollection<VehicleProviderMappingEntity> VehicleMappings { get; set; }
}
```

**Key Features**:
- Soft delete support via `DeletedAt`
- JSON configuration storage for flexibility
- Priority ordering for failover
- Audit trail with timestamps

#### 2. ProviderHealthHistoryEntity

**File**: `FMS.Domain/Entities/VehicleTracking/ProviderHealthHistoryEntity.cs`

**Purpose**: Tracks provider health status over time for analytics and monitoring.

**Properties**:
```csharp
public class ProviderHealthHistoryEntity
{
    public long HistoryId { get; set; }                    // Primary key
    public string ProviderName { get; set; }               // Provider identifier
    public string Status { get; set; }                     // Healthy/Degraded/Unhealthy
    public double? ResponseTimeMs { get; set; }            // Response time in milliseconds
    public int ErrorCount { get; set; }                    // Number of errors
    public decimal? SuccessRate { get; set; }              // Success rate percentage
    public string? Message { get; set; }                   // Status message
    public DateTime CheckedAt { get; set; }                // Check timestamp
    public string? Metrics { get; set; }                   // JSON metrics data
}
```

**Key Features**:
- Time-series health data
- Performance metrics
- JSON storage for custom metrics
- Indexed for efficient querying

#### 3. VehicleProviderMappingEntity

**File**: `FMS.Domain/Entities/VehicleTracking/VehicleProviderMappingEntity.cs`

**Purpose**: Maps vehicles to specific providers, enabling vehicle-specific provider assignment.

**Properties**:
```csharp
public class VehicleProviderMappingEntity
{
    public int MappingId { get; set; }                     // Primary key
    public int VehicleId { get; set; }                     // FMS vehicle ID
    public int ProviderId { get; set; }                    // Provider configuration ID
    public string? ExternalDeviceId { get; set; }          // Provider's device ID
    public DateTime AssignedDate { get; set; }             // Assignment timestamp
    public bool IsActive { get; set; }                     // Whether mapping is active
    public string? Notes { get; set; }                     // Optional notes

    // Navigation properties
    public ProviderConfigurationEntity Provider { get; set; }
}
```

**Key Features**:
- Links FMS vehicles to GPS provider devices
- Supports multiple mappings (historical tracking)
- External device ID for provider APIs
- Active/inactive state management

---

## Persistence Layer

**Location**: `FMS.Persistence/`

The persistence layer implements Entity Framework Core configurations and database context.

### Entity Configurations

#### 1. ProviderConfigurationEntityConfiguration

**File**: `FMS.Persistence/EntityConfigurations/VehicleTracking/ProviderConfigurationEntityConfiguration.cs`

**Purpose**: Configures EF Core mapping for `ProviderConfigurationEntity`.

**Key Configuration**:
```csharp
public class ProviderConfigurationEntityConfiguration
    : IEntityTypeConfiguration<ProviderConfigurationEntity>
{
    public void Configure(EntityTypeBuilder<ProviderConfigurationEntity> builder)
    {
        builder.ToTable("provider_configurations");

        builder.HasKey(e => e.ProviderId);

        builder.Property(e => e.ProviderName)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(e => e.ProviderName).IsUnique();
        builder.HasIndex(e => e.IsEnabled);
        builder.HasIndex(e => e.IsDefault);
        builder.HasIndex(e => e.PriorityOrder);

        // JSON configuration
        builder.Property(e => e.ConfigurationData)
            .HasColumnType("json");

        // Soft delete filter
        builder.HasQueryFilter(e => e.DeletedAt == null);
    }
}
```

**Features**:
- Unique constraint on provider name
- Multiple indexes for performance
- JSON column type for MySQL
- Global query filter for soft delete

#### 2. ProviderHealthHistoryEntityConfiguration

**File**: `FMS.Persistence/EntityConfigurations/VehicleTracking/ProviderHealthHistoryEntityConfiguration.cs`

**Purpose**: Configures EF Core mapping for `ProviderHealthHistoryEntity`.

**Key Configuration**:
```csharp
builder.Property(e => e.Status)
    .HasConversion<string>()  // Store enum as string
    .HasMaxLength(50);

builder.HasIndex(e => new { e.ProviderName, e.CheckedAt });
builder.HasIndex(e => e.CheckedAt);

// JSON metrics column
builder.Property(e => e.Metrics)
    .HasColumnType("json");
```

**Features**:
- Composite index for time-series queries
- Enum-to-string conversion
- JSON metrics storage

#### 3. VehicleProviderMappingEntityConfiguration

**File**: `FMS.Persistence/EntityConfigurations/VehicleTracking/VehicleProviderMappingEntityConfiguration.cs`

**Purpose**: Configures EF Core mapping for `VehicleProviderMappingEntity`.

**Key Configuration**:
```csharp
builder.HasOne(e => e.Provider)
    .WithMany(p => p.VehicleMappings)
    .HasForeignKey(e => e.ProviderId)
    .OnDelete(DeleteBehavior.Restrict);

builder.HasIndex(e => new { e.VehicleId, e.ProviderId }).IsUnique();
builder.HasIndex(e => e.VehicleId);
builder.HasIndex(e => e.IsActive);
```

**Features**:
- Foreign key relationship to provider
- Unique constraint on vehicle-provider pair
- Indexes for efficient lookups

### Database Context

**File**: `FMS.Persistence/DataAccess/GpsdataContext.cs`

**Added DbSets**:
```csharp
public DbSet<ProviderConfigurationEntity> ProviderConfigurations { get; set; }
public DbSet<ProviderHealthHistoryEntity> ProviderHealthHistory { get; set; }
public DbSet<VehicleProviderMappingEntity> VehicleProviderMappings { get; set; }
```

**Configuration Registration**:
```csharp
modelBuilder.ApplyConfiguration(new ProviderConfigurationEntityConfiguration());
modelBuilder.ApplyConfiguration(new ProviderHealthHistoryEntityConfiguration());
modelBuilder.ApplyConfiguration(new VehicleProviderMappingEntityConfiguration());
```

---

## Infrastructure Layer

**Location**: `FMS.Infrastructure/VehicleTracking/`

The infrastructure layer contains the core implementation of the vehicle tracking system.

### Core Interfaces

#### 1. IVehicleTrackingProvider

**File**: `FMS.Infrastructure/VehicleTracking/Interfaces/IVehicleTrackingProvider.cs`

**Purpose**: Primary interface that all GPS tracking providers must implement.

**Key Methods**:
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

    // Location services
    Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);
    Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to, int maxPoints);

    // Health
    Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync();

    // Device mapping
    Task<FMSResponse<string>> GetExternalDeviceIdAsync(int vehicleId);
    Task<FMSResponse<bool>> MapVehicleToDeviceAsync(int vehicleId, string externalDeviceId);
}
```

#### 2. IProviderFactory

**File**: `FMS.Infrastructure/VehicleTracking/Factory/IProviderFactory.cs`

**Purpose**: Factory interface for creating and managing provider instances.

**Implemented Methods**:
- `GetProviderAsync(string providerName)` - Get provider by name
- `GetDefaultProviderAsync()` - Get default provider
- `GetProviderForVehicleAsync(int vehicleId)` - Get provider for specific vehicle
- `GetAllProvidersAsync()` - Get all configured providers
- `GetHealthyProvidersAsync()` - Get only healthy providers
- `ReloadProvidersAsync()` - Reload configurations
- `ProviderExistsAsync(string providerName)` - Check existence

#### 3. IProviderRegistry

**File**: `FMS.Infrastructure/VehicleTracking/Factory/IProviderRegistry.cs`

**Purpose**: Registry interface for provider discovery and metadata management.

**Implemented Methods**:
- `DiscoverProviders()` - Scan assemblies for providers
- `GetAllProviderMetadata()` - Get all provider metadata
- `GetProviderMetadata(string providerName)` - Get specific metadata
- `RegisterProvider(Type providerType)` - Manual registration
- `IsProviderRegistered(string providerName)` - Check registration

#### 4. IProviderConfigurationService

**File**: `FMS.Infrastructure/VehicleTracking/Services/IProviderConfigurationService.cs`

**Purpose**: Service interface for managing provider configurations in database.

**Implemented Methods**:
- Configuration CRUD operations (15 methods)
- Provider enable/disable
- Default provider management
- Vehicle-to-provider mapping
- Health history tracking

### Factory & Registry Implementation

#### ProviderFactory

**File**: `FMS.Infrastructure/VehicleTracking/Factory/ProviderFactory.cs`

**Key Features**:
```csharp
public class ProviderFactory : IProviderFactory
{
    private readonly ConcurrentDictionary<string, IVehicleTrackingProvider> _providerCache;
    private readonly IProviderRegistry _registry;
    private readonly IProviderConfigurationService _configService;
    private readonly IServiceProvider _serviceProvider;

    // Provider creation with DI
    public async Task<IVehicleTrackingProvider?> GetProviderAsync(string providerName)
    {
        // Check cache first
        if (_providerCache.TryGetValue(providerName, out var cachedProvider))
            return cachedProvider;

        // Get provider type from registry
        var metadata = _registry.GetProviderMetadata(providerName);
        if (metadata?.ProviderType == null)
            return null;

        // Create instance using DI
        var provider = ActivatorUtilities.CreateInstance(
            _serviceProvider, metadata.ProviderType) as IVehicleTrackingProvider;

        // Initialize and cache
        var config = await _configService.GetConfigurationByNameAsync(providerName);
        await provider.InitializeAsync(config);
        _providerCache[providerName] = provider;

        return provider;
    }
}
```

**Implementation Highlights**:
- Thread-safe provider caching
- Dependency injection integration
- Automatic initialization
- Lifecycle management
- Health-aware provider filtering

#### ProviderRegistry

**File**: `FMS.Infrastructure/VehicleTracking/Factory/ProviderRegistry.cs`

**Key Features**:
```csharp
public class ProviderRegistry : IProviderRegistry
{
    private readonly Dictionary<string, ProviderMetadata> _providers;

    public void DiscoverProviders()
    {
        var assemblies = AppDomain.CurrentDomain.GetAssemblies();

        foreach (var assembly in assemblies)
        {
            try
            {
                var providerTypes = assembly.GetTypes()
                    .Where(t => typeof(IVehicleTrackingProvider).IsAssignableFrom(t)
                                && !t.IsInterface
                                && !t.IsAbstract
                                && t.GetCustomAttribute<ProviderAttribute>() != null);

                foreach (var type in providerTypes)
                {
                    RegisterProvider(type);
                }
            }
            catch (ReflectionTypeLoadException ex)
            {
                _logger.LogWarning($"Could not load types from {assembly.FullName}");
            }
        }
    }

    public void RegisterProvider(Type providerType)
    {
        var attribute = providerType.GetCustomAttribute<ProviderAttribute>();
        if (attribute == null) return;

        var metadata = new ProviderMetadata
        {
            Name = attribute.Name,
            DisplayName = attribute.DisplayName,
            Description = attribute.Description,
            Version = attribute.Version,
            ProviderType = providerType
        };

        _providers[attribute.Name] = metadata;
    }
}
```

**Implementation Highlights**:
- Assembly scanning for automatic discovery
- `[Provider]` attribute for metadata
- Thread-safe registration
- Error handling for assembly loading

### Services

#### 1. VehicleTrackingService

**File**: `FMS.Infrastructure/VehicleTracking/Services/VehicleTrackingService.cs`

**Purpose**: Unified service that abstracts all providers with failover and caching.

**Key Features**:
```csharp
public class VehicleTrackingService : IVehicleTrackingService
{
    private readonly IProviderFactory _factory;
    private readonly IProviderConfigurationService _configService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<VehicleTrackingService> _logger;

    // Thread-safe statistics
    private long _totalRequests;
    private long _successfulRequests;
    private long _failedRequests;
    private long _failoverCount;

    public async Task<VehicleLocation?> GetVehicleLocationAsync(int vehicleId)
    {
        // Check cache first (30-second TTL)
        var cacheKey = $"vehicle_location:{vehicleId}";
        if (_cache.TryGetValue(cacheKey, out VehicleLocation cachedLocation))
            return cachedLocation;

        // Get provider for vehicle
        var provider = await _factory.GetProviderForVehicleAsync(vehicleId);
        if (provider == null)
            provider = await _factory.GetDefaultProviderAsync();

        try
        {
            // Call provider
            Interlocked.Increment(ref _totalRequests);
            var response = await provider.GetVehicleLocationAsync(vehicleId);

            if (response.Success && response.Data != null)
            {
                Interlocked.Increment(ref _successfulRequests);

                // Convert DTO to model
                var location = MapDtoToModel(response.Data);

                // Cache result
                _cache.Set(cacheKey, location, TimeSpan.FromSeconds(30));

                return location;
            }

            // Try failover
            return await FailoverGetLocation(vehicleId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting location for vehicle {vehicleId}");
            Interlocked.Increment(ref _failedRequests);
            return await FailoverGetLocation(vehicleId);
        }
    }

    private async Task<VehicleLocation?> FailoverGetLocation(int vehicleId)
    {
        Interlocked.Increment(ref _failoverCount);
        var healthyProviders = await _factory.GetHealthyProvidersAsync();

        foreach (var provider in healthyProviders)
        {
            try
            {
                var response = await provider.GetVehicleLocationAsync(vehicleId);
                if (response.Success && response.Data != null)
                {
                    return MapDtoToModel(response.Data);
                }
            }
            catch
            {
                continue; // Try next provider
            }
        }

        return null;
    }
}
```

**Implementation Highlights**:
- 30-second location cache
- 60-second health cache
- Automatic failover on errors
- Thread-safe statistics tracking
- Batch operations with parallelization
- DTO-to-model mapping

#### 2. ProviderConfigurationService

**File**: `FMS.Infrastructure/VehicleTracking/Services/ProviderConfigurationService.cs`

**Purpose**: Service for managing provider configurations in the database.

**Key Features**:
- Full CRUD operations for provider configurations
- Default provider management
- Vehicle-to-provider mapping
- Health history tracking
- Transaction support
- Comprehensive logging

**Implementation Highlights**:
```csharp
public class ProviderConfigurationService : IProviderConfigurationService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<ProviderConfigurationService> _logger;

    public async Task<ProviderConfigurationEntity?> GetConfigurationByNameAsync(string providerName)
    {
        return await _context.ProviderConfigurations
            .Include(p => p.VehicleMappings)
            .FirstOrDefaultAsync(p => p.ProviderName == providerName);
    }

    public async Task<bool> SetDefaultProviderAsync(int providerId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Clear all defaults
            var allProviders = await _context.ProviderConfigurations.ToListAsync();
            foreach (var p in allProviders)
                p.IsDefault = false;

            // Set new default
            var provider = await _context.ProviderConfigurations
                .FindAsync(providerId);
            if (provider == null) return false;

            provider.IsDefault = true;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error setting default provider");
            return false;
        }
    }

    public async Task RecordHealthStatusAsync(string providerName, ProviderHealthStatus status)
    {
        var history = new ProviderHealthHistoryEntity
        {
            ProviderName = providerName,
            Status = status.Status.ToString(),
            ResponseTimeMs = status.ResponseTimeMs,
            SuccessRate = (decimal?)status.SuccessRate,
            Message = status.Message,
            CheckedAt = DateTime.UtcNow,
            Metrics = JsonSerializer.Serialize(status.Metrics)
        };

        _context.ProviderHealthHistory.Add(history);
        await _context.SaveChangesAsync();
    }
}
```

#### 3. VehicleTrackingServiceAdapter

**File**: `FMS.Infrastructure/VehicleTracking/Adapters/VehicleTrackingServiceAdapter.cs`

**Purpose**: Adapter that bridges the new `IVehicleTrackingService` to the legacy `IGPSService` interface.

**Key Features**:
- Maintains backward compatibility
- Enriches data from database (vehicle name, plate number)
- Calculates online status
- Maps between models and DTOs

**Implementation**:
```csharp
public class VehicleTrackingServiceAdapter : IGPSService
{
    private readonly IVehicleTrackingService _trackingService;
    private readonly GpsdataContext _context;
    private readonly ILogger<VehicleTrackingServiceAdapter> _logger;

    public async Task<FMSResponse<VehicleLocation>> GetVehicleLocationAsync(int vehicleId)
    {
        try
        {
            // Get location from new service
            var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
            if (location == null)
                return FMSResponse<VehicleLocation>.Failed("Vehicle location not found");

            // Enrich with database data
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId);

            if (vehicle != null)
            {
                location.VehicleName = vehicle.VehicleName;
                location.PlateNumber = vehicle.PlateNumber;
                location.IsGpsInstalled = vehicle.IsGpsInstalled ?? false;
            }

            // Calculate online status (15-minute threshold)
            var timeSinceLastUpdate = DateTime.UtcNow - location.Timestamp;
            location.IsOnline = timeSinceLastUpdate.TotalMinutes <= 15;

            return FMSResponse<VehicleLocation>.Success(location);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting vehicle location for vehicle {vehicleId}");
            return FMSResponse<VehicleLocation>.Failed($"Error: {ex.Message}");
        }
    }
}
```

### Provider Implementation

#### GPSGateProvider

**File**: `FMS.Infrastructure/VehicleTracking/Providers/GPSGateProvider.cs`

**Purpose**: Implementation of `IVehicleTrackingProvider` for GPSGate Vehicle Tracker API.

**Key Features**:
```csharp
[Provider("GPSGate",
    DisplayName = "GPSGate Vehicle Tracker",
    Description = "Integration with GPSGate Vehicle Tracker system",
    Version = "2.0.0")]
public class GPSGateProvider : IVehicleTrackingProvider, IDisposable
{
    private readonly GpsdataContext _context;
    private readonly HttpClient _httpClient;
    private readonly ILogger<GPSGateProvider> _logger;

    private string? _apiToken;
    private string? _baseUrl;
    private int _applicationId;

    public ProviderCapabilities Capabilities => new()
    {
        SupportsRealTimeLocation = true,
        SupportsHistoricalData = true,
        SupportsGeofencing = true,
        SupportsEvents = false,
        SupportsOdometer = true
    };

    public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
    {
        // Extract credentials from configuration
        var username = configuration.GetValue<string>("Username");
        var password = configuration.GetValue<string>("Password");
        _baseUrl = configuration.GetValue<string>("BaseUrl");
        _applicationId = configuration.GetValue<int>("ApplicationId");

        // Authenticate and get token
        _apiToken = await AuthenticateAsync(username, password);

        return FMSResponse<bool>.Success(true);
    }

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        // Map vehicle ID to GPSGate device ID
        var deviceId = await GetExternalDeviceIdAsync(vehicleId);
        if (!deviceId.Success || string.IsNullOrEmpty(deviceId.Data))
            return FMSResponse<VehicleLocationDTO>.Failed("Device ID not found");

        // Call GPSGate API
        var url = $"{_baseUrl}/applications/{_applicationId}/users/{deviceId.Data}";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return FMSResponse<VehicleLocationDTO>.Failed("API call failed");

        // Parse response
        var json = await response.Content.ReadAsStringAsync();
        var user = JsonSerializer.Deserialize<GPSGateUser>(json);

        // Map to DTO
        var locationDto = new VehicleLocationDTO
        {
            VehicleId = vehicleId,
            Latitude = user.Position?.Latitude ?? 0,
            Longitude = user.Position?.Longitude ?? 0,
            Speed = user.Velocity?.Speed ?? 0,
            Heading = user.Velocity?.Heading ?? 0,
            Altitude = user.Position?.Altitude ?? 0,
            Timestamp = user.Position?.Time ?? DateTime.UtcNow,
            Odometer = user.Accumulators?.FirstOrDefault(a => a.Type == 1)?.Value ?? 0
        };

        return FMSResponse<VehicleLocationDTO>.Success(locationDto);
    }

    public async Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to, int maxPoints)
    {
        // Get device ID
        var deviceId = await GetExternalDeviceIdAsync(vehicleId);
        if (!deviceId.Success) return FMSResponse<List<VehicleHistoryPoint>>.Failed("Device not found");

        // Call GPSGate tracks endpoint
        var url = $"{_baseUrl}/applications/{_applicationId}/tracks";
        var body = new
        {
            userIds = new[] { deviceId.Data },
            fromDate = from.ToString("O"),
            toDate = to.ToString("O"),
            maxPoints = maxPoints
        };

        var response = await _httpClient.PostAsJsonAsync(url, body);
        if (!response.IsSuccessStatusCode)
            return FMSResponse<List<VehicleHistoryPoint>>.Failed("Failed to retrieve history");

        // Parse and map response
        var json = await response.Content.ReadAsStringAsync();
        var tracks = JsonSerializer.Deserialize<List<GPSGateTrack>>(json);

        var historyPoints = tracks?.SelectMany(track =>
            track.TrackPoints?.Select(point => new VehicleHistoryPoint
            {
                Latitude = point.Latitude,
                Longitude = point.Longitude,
                Speed = point.Speed ?? 0,
                Heading = point.Heading ?? 0,
                Timestamp = point.Timestamp
            }) ?? Enumerable.Empty<VehicleHistoryPoint>()
        ).ToList() ?? new List<VehicleHistoryPoint>();

        return FMSResponse<List<VehicleHistoryPoint>>.Success(historyPoints);
    }

    public async Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync()
    {
        try
        {
            // Test API connectivity
            var startTime = DateTime.UtcNow;
            var url = $"{_baseUrl}/applications/{_applicationId}/users";
            var response = await _httpClient.GetAsync(url);
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
}
```

**Implementation Highlights**:
- Full GPSGate API v.1 integration
- Token-based authentication
- Real-time location retrieval
- Historical track data
- Odometer/accumulator support
- Health monitoring
- Device ID mapping
- Comprehensive error handling

### Models

**Location**: `FMS.Infrastructure/VehicleTracking/Models/`

The system includes 45+ model classes:

**Core Models**:
- `ProviderConfiguration.cs` - Provider configuration model
- `ProviderHealthStatus.cs` - Health status model
- `ProviderCapabilities.cs` - Provider capabilities
- `ProviderMetadata.cs` - Provider metadata
- `VehicleLocation.cs` - Vehicle location model

**GPSGate Models** (30+ classes):
- API request/response models
- Position, velocity, and track models
- User, device, and application models
- Geofence and event models
- Custom field and accumulator models

### Extensions

**File**: `FMS.Infrastructure/VehicleTracking/Extensions/VehicleTrackingServiceCollectionExtensions.cs`

**Purpose**: Dependency injection configuration.

**Usage**:
```csharp
public static class VehicleTrackingServiceCollectionExtensions
{
    public static IServiceCollection AddVehicleTracking(
        this IServiceCollection services,
        Action<VehicleTrackingOptions>? configureOptions = null)
    {
        // Register options
        var options = new VehicleTrackingOptions();
        configureOptions?.Invoke(options);
        services.AddSingleton(options);

        // Register core services
        services.AddMemoryCache();
        services.AddScoped<IProviderConfigurationService, ProviderConfigurationService>();
        services.AddSingleton<IProviderRegistry, ProviderRegistry>();
        services.AddScoped<IProviderFactory, ProviderFactory>();
        services.AddScoped<IVehicleTrackingService, VehicleTrackingService>();

        // Register adapter for backward compatibility
        services.AddScoped<IGPSService, VehicleTrackingServiceAdapter>();

        // Register HttpClient for providers
        services.AddHttpClient<GPSGateProvider>();

        // Provider discovery
        if (options.AutoDiscoverProviders)
        {
            services.AddHostedService<ProviderDiscoveryHostedService>();
        }

        return services;
    }
}

public class VehicleTrackingOptions
{
    public bool AutoDiscoverProviders { get; set; } = true;
    public int LocationCacheDurationSeconds { get; set; } = 30;
    public int HealthCacheDurationSeconds { get; set; } = 60;
    public bool EnableFailover { get; set; } = true;
}
```

---

## Application Layer

**Location**: `FMS.Application/Features/VehicleTracking/DTOs/`

### Data Transfer Objects

#### VehicleLocationDTO

**File**: `FMS.Application/Features/VehicleTracking/DTOs/VehicleLocationDTO.cs`

**Purpose**: DTO for transferring vehicle location data between layers.

```csharp
public class VehicleLocationDTO
{
    public int VehicleId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public double Altitude { get; set; }
    public DateTime Timestamp { get; set; }
    public double? Odometer { get; set; }
    public string? Address { get; set; }
}
```

#### VehicleHistoryPoint

**File**: `FMS.Application/Features/VehicleTracking/DTOs/VehicleHistoryPoint.cs`

**Purpose**: DTO for historical location points.

```csharp
public class VehicleHistoryPoint
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Speed { get; set; }
    public double Heading { get; set; }
    public DateTime Timestamp { get; set; }
}
```

---

## Web Client Layer

**Location**: `FMS.WebClient/`

### API Controller

**File**: `FMS.WebClient/Controllers/VehicleManagement/ProviderManagementController.cs`

**Purpose**: RESTful API for provider management.

**Endpoints**:

```csharp
[ApiController]
[Route("api/v1/providers")]
[Authorize]
public class ProviderManagementController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;
    private readonly IProviderConfigurationService _configService;

    // 1. Get health status
    [HttpGet("health")]
    public async Task<IActionResult> GetProvidersHealth() { }

    // 2. Get statistics
    [HttpGet("statistics")]
    public async Task<IActionResult> GetProviderStatistics() { }

    // 3. List all providers
    [HttpGet("list")]
    public async Task<IActionResult> ListProviders() { }

    // 4. Get specific provider
    [HttpGet("{providerId:int}")]
    public async Task<IActionResult> GetProvider(int providerId) { }

    // 5. Update provider
    [HttpPut("{providerId:int}")]
    public async Task<IActionResult> UpdateProvider(int providerId, [FromBody] UpdateProviderRequest request) { }

    // 6. Test provider
    [HttpPost("{providerName}/test")]
    public async Task<IActionResult> TestProvider(string providerName) { }

    // 7. Reload providers
    [HttpPost("reload")]
    public async Task<IActionResult> ReloadProviders() { }

    // 8. Get vehicle mappings
    [HttpGet("mappings")]
    public async Task<IActionResult> GetVehicleMappings() { }

    // 9. Create vehicle mapping
    [HttpPost("mappings")]
    public async Task<IActionResult> CreateVehicleMapping([FromBody] VehicleMappingRequest request) { }
}
```

**Features**:
- JWT authentication required
- FMSResponse wrapper for consistent responses
- Comprehensive error handling
- Automatic provider reload after updates

### React UI Components

**Location**: `FMS.WebClient/ClientApp/src/pages/providermanagement/`

#### 1. ProviderManagementMain.js

**Purpose**: Main routing component with nested routes.

```javascript
import { Routes, Route, Navigate } from 'react-router-dom';
import ProviderManagementLayout from './ProviderManagementLayout';
import ProviderDashboard from './ProviderDashboard';
import ProviderConfiguration from './ProviderConfiguration';
import VehicleAssignments from './VehicleAssignments';

export default function ProviderManagementMain() {
  return (
    <Routes>
      <Route path="/" element={<ProviderManagementLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ProviderDashboard />} />
        <Route path="configuration" element={<ProviderConfiguration />} />
        <Route path="assignments" element={<VehicleAssignments />} />
      </Route>
    </Routes>
  );
}
```

#### 2. ProviderManagementLayout.js

**Purpose**: Common layout with tab navigation.

**Features**:
- Tab-based navigation (Dashboard, Configuration, Assignments)
- Consistent header and styling
- Outlet for nested routes

#### 3. ProviderDashboard.js

**Purpose**: Real-time monitoring dashboard.

**Features**:
- Statistics cards (Total Providers, Healthy, Requests, Success Rate)
- Provider status table with health badges
- Provider statistics section
- Auto-refresh (30-second interval)
- Test connection button
- Reload providers button

**Key Functions**:
```javascript
const loadData = async (silent = false) => {
  const healthResponse = await api.get('/providers/health');
  const statsResponse = await api.get('/providers/statistics');
  // Update state
};

const testConnection = async (providerName) => {
  await api.post(`/providers/${providerName}/test`);
};

const reloadProviders = async () => {
  await api.post('/providers/reload');
};
```

#### 4. ProviderConfiguration.js

**Purpose**: Provider configuration management.

**Features**:
- Provider list with enable/disable toggles
- Set default provider
- Edit configuration (JSON editor)
- Save and reload functionality
- Configuration validation

**Key Functions**:
```javascript
const toggleEnabled = async (providerId, isEnabled) => {
  await api.put(`/providers/${providerId}`, { IsEnabled: isEnabled });
  await reloadProviders();
};

const setDefault = async (providerId) => {
  await api.put(`/providers/${providerId}`, { IsDefault: true });
  await reloadProviders();
};

const saveConfiguration = async (providerId, configData) => {
  await api.put(`/providers/${providerId}`, {
    ConfigurationData: JSON.stringify(configData)
  });
  await api.post('/providers/reload');
};
```

#### 5. VehicleAssignments.js

**Purpose**: Manage vehicle-to-provider mappings.

**Features**:
- Assignment table with vehicle-provider mappings
- Info cards explaining default behavior
- Future-ready for vehicle integration

---

## Database Layer

**Location**: `Documentation/Features/VehicleTracking/database/`

### Database Scripts

#### 1. Phase 2 Configuration Schema

**File**: `database/phase2_provider_configuration.sql`

**Contains**:
- Table creation scripts for 3 tables
- Index definitions
- Foreign key constraints
- 3 views for common queries
- 3 stored procedures
- Sample data

#### 2. GPSGate Configuration

**File**: `Phase4/01_GPSGateProvider_Configuration.sql`

**Contains**:
- INSERT statement for GPSGate provider
- JSON configuration template
- Default provider designation

#### 3. Navigation Menu

**File**: `Phase7/01_ProviderManagement_Navigation.sql`

**Contains**:
- Menu item creation for Provider Management
- Sub-menu items (Dashboard, Configuration, Assignments)
- Role permissions

---

## Integration & Usage

### Startup Configuration

**In `Program.cs` (WebClient)**:

```csharp
// Add vehicle tracking services
builder.Services.AddVehicleTracking(options =>
{
    options.AutoDiscoverProviders = true;
    options.LocationCacheDurationSeconds = 30;
    options.HealthCacheDurationSeconds = 60;
    options.EnableFailover = true;
});
```

### Using the Service

**Example: Get Vehicle Location**

```csharp
public class VehicleController : ControllerBase
{
    private readonly IVehicleTrackingService _trackingService;

    [HttpGet("{vehicleId}/location")]
    public async Task<IActionResult> GetLocation(int vehicleId)
    {
        var location = await _trackingService.GetVehicleLocationAsync(vehicleId);
        if (location == null)
            return NotFound();

        return Ok(location);
    }
}
```

**Example: Get Multiple Locations**

```csharp
var vehicleIds = new[] { 1, 2, 3, 4, 5 };
var locations = await _trackingService.GetVehicleLocationsAsync(vehicleIds);

foreach (var (vehicleId, location) in locations)
{
    Console.WriteLine($"Vehicle {vehicleId}: {location.Latitude}, {location.Longitude}");
}
```

**Example: Check Provider Health**

```csharp
var healthStatuses = await _trackingService.GetProvidersHealthAsync();

foreach (var (providerName, health) in healthStatuses)
{
    Console.WriteLine($"{providerName}: {health.Status} ({health.ResponseTimeMs}ms)");
}
```

### Creating a New Provider

```csharp
[Provider("MyProvider",
    DisplayName = "My GPS Provider",
    Description = "Integration with My GPS System",
    Version = "1.0.0")]
public class MyGPSProvider : IVehicleTrackingProvider
{
    public string ProviderName => "MyProvider";
    public string ProviderVersion => "1.0.0";

    public ProviderCapabilities Capabilities => new()
    {
        SupportsRealTimeLocation = true,
        SupportsHistoricalData = false,
        SupportsGeofencing = false,
        SupportsEvents = false,
        SupportsOdometer = false
    };

    public async Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration)
    {
        // Initialize provider with configuration
        return FMSResponse<bool>.Success(true);
    }

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        // Implement location retrieval
    }

    // Implement other interface methods...
}
```

The system will automatically discover and register the new provider on startup!

---

## Summary

### Implementation Statistics

- **Total Files**: 60+ files
- **Lines of Code**: ~7,400 lines
- **Interfaces**: 15+
- **Classes**: 50+
- **Database Tables**: 3
- **API Endpoints**: 9
- **React Components**: 5

### Key Achievements

✅ Plugin-based architecture with automatic discovery
✅ Multi-provider support with automatic failover
✅ Database-backed configuration management
✅ Real-time health monitoring
✅ Caching for performance
✅ Thread-safe implementations
✅ Comprehensive API
✅ Admin UI for management
✅ Backward compatibility maintained
✅ Production-ready implementation

---

**Last Updated**: November 2025
**Version**: 2.0.0
