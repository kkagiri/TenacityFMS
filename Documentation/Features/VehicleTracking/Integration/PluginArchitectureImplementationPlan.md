# Vehicle Tracking Plugin Architecture - Implementation Plan

## 📋 Overview

This document outlines the step-by-step implementation plan for converting the FMS GPS tracking system from a single-provider implementation to a flexible, plugin-based architecture that supports multiple GPS providers.

**Reference Documents:**

- [PRD: Vehicle Tracking Plugin Architecture](./PRDvehicletracking.md)
- [Clean Architecture GPS Service](./CleanArchitectureGPSService.md)
- [Current Implementation](./VehicleGPSTrackingImplementation.md)

**Current Status:** ✅ Phase 0 Complete (Clean Architecture Refactoring)

- GPS service properly separated into Infrastructure layer
- IGPSService interface defined in Application layer
- GPSGateService implementation in FMS.Infrastructure

---

## 🎯 Implementation Phases

### **Phase 1: Core Plugin Interfaces** (Week 1-2)

#### 1.1 Create Plugin Interface Structure

**Location:** `FMS.Infrastructure/VehicleTracking/`

```
FMS.Infrastructure/
  └── VehicleTracking/
      ├── Interfaces/
      │   ├── IVehicleTrackingProvider.cs
      │   ├── IProviderFactory.cs
      │   ├── IProviderHealthMonitor.cs
      │   └── IProviderConfigurationValidator.cs
      ├── Models/
      │   ├── ProviderConfiguration.cs
      │   ├── ProviderHealthStatus.cs
      │   ├── ProviderCapabilities.cs
      │   └── ProviderMetadata.cs
      └── Base/
          ├── BaseVehicleTrackingProvider.cs
          └── ProviderException.cs
```

#### 1.2 Define IVehicleTrackingProvider Interface

```csharp
// FMS.Infrastructure/VehicleTracking/Interfaces/IVehicleTrackingProvider.cs
public interface IVehicleTrackingProvider
{
    // Provider Metadata
    string ProviderName { get; }
    string ProviderVersion { get; }
    ProviderCapabilities Capabilities { get; }

    // Core Vehicle Tracking Operations
    Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);
    Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false);
    Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);

    // Advanced Features (Optional)
    Task<FMSResponse<List<VehicleHistoryPoint>>> GetVehicleHistoryAsync(
        int vehicleId, DateTime from, DateTime to);
    Task<FMSResponse<List<GeofenceDTO>>> GetGeofencesAsync();
    Task<FMSResponse<bool>> SubscribeToEventsAsync(IEventHandler eventHandler);

    // Provider Management
    Task<FMSResponse<ProviderHealthStatus>> GetHealthStatusAsync();
    Task<FMSResponse<bool>> ValidateConfigurationAsync(ProviderConfiguration configuration);
    Task<FMSResponse<bool>> InitializeAsync(ProviderConfiguration configuration);
    Task<FMSResponse<bool>> ShutdownAsync();
}
```

#### 1.3 Create Base Provider Class

```csharp
// FMS.Infrastructure/VehicleTracking/Base/BaseVehicleTrackingProvider.cs
public abstract class BaseVehicleTrackingProvider : IVehicleTrackingProvider
{
    protected readonly ILogger _logger;
    protected readonly HttpClient _httpClient;
    protected ProviderConfiguration _configuration;
    protected bool _isInitialized;

    public abstract string ProviderName { get; }
    public abstract string ProviderVersion { get; }
    public abstract ProviderCapabilities Capabilities { get; }

    protected BaseVehicleTrackingProvider(
        ILogger logger,
        HttpClient httpClient)
    {
        _logger = logger;
        _httpClient = httpClient;
    }

    // Common implementation for all providers
    protected async Task<T> ExecuteWithRetryAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3)
    {
        // Retry logic with exponential backoff
    }

    protected void ValidateInitialization()
    {
        if (!_isInitialized)
            throw new ProviderException($"{ProviderName} not initialized");
    }
}
```

---

### **Phase 2: Provider Configuration System** (Week 2-3)

#### 2.1 Database Schema

```sql
-- VehicleTrackingProviders table
CREATE TABLE VehicleTrackingProviders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    DisplayName NVARCHAR(200) NOT NULL,
    AssemblyName NVARCHAR(255) NOT NULL,
    TypeName NVARCHAR(255) NOT NULL,
    Version NVARCHAR(50),
    Configuration NVARCHAR(MAX), -- JSON
    IsEnabled BIT NOT NULL DEFAULT 1,
    IsDefault BIT NOT NULL DEFAULT 0,
    Priority INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT,
    UpdatedBy INT
);

-- Provider Health Monitoring
CREATE TABLE VehicleTrackingProviderHealth (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL, -- 'Healthy', 'Degraded', 'Unhealthy'
    LastCheckAt DATETIME2 NOT NULL,
    ResponseTimeMs INT,
    ErrorCount INT DEFAULT 0,
    ErrorMessage NVARCHAR(MAX),
    AdditionalData NVARCHAR(MAX), -- JSON
    FOREIGN KEY (ProviderId) REFERENCES VehicleTrackingProviders(Id)
);

-- Provider Metrics
CREATE TABLE VehicleTrackingProviderMetrics (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    ProviderId INT NOT NULL,
    MetricName NVARCHAR(100) NOT NULL,
    MetricValue DECIMAL(18,4) NOT NULL,
    Unit NVARCHAR(50),
    RecordedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (ProviderId) REFERENCES VehicleTrackingProviders(Id),
    INDEX IX_Provider_Metric_Date (ProviderId, MetricName, RecordedAt)
);

-- Vehicle-Provider Mapping (for multi-provider support)
CREATE TABLE VehicleProviderMappings (
    VehicleId INT NOT NULL,
    ProviderId INT NOT NULL,
    DeviceId NVARCHAR(100),
    IsPrimary BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (VehicleId, ProviderId),
    FOREIGN KEY (VehicleId) REFERENCES Vehicles(VehicleId),
    FOREIGN KEY (ProviderId) REFERENCES VehicleTrackingProviders(Id)
);
```

#### 2.2 Entity Configuration

```csharp
// FMS.Persistence/EntityConfigurations/VehicleTrackingProviderConfiguration.cs
public class VehicleTrackingProviderConfiguration
    : IEntityTypeConfiguration<VehicleTrackingProvider>
{
    public void Configure(EntityTypeBuilder<VehicleTrackingProvider> builder)
    {
        builder.ToTable("VehicleTrackingProviders");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Configuration).HasColumnType("nvarchar(max)");

        builder.HasIndex(p => p.Name).IsUnique();
    }
}
```

#### 2.3 Configuration Management Service

```csharp
// FMS.Application/Features/VehicleTracking/Services/IProviderConfigurationService.cs
public interface IProviderConfigurationService
{
    Task<FMSResponse<ProviderConfiguration>> GetProviderConfigurationAsync(string providerName);
    Task<FMSResponse<List<ProviderConfiguration>>> GetAllProvidersAsync(bool enabledOnly = true);
    Task<FMSResponse<ProviderConfiguration>> SaveProviderConfigurationAsync(ProviderConfiguration config);
    Task<FMSResponse<bool>> EnableProviderAsync(string providerName, bool enabled);
    Task<FMSResponse<bool>> SetDefaultProviderAsync(string providerName);
    Task<FMSResponse<ProviderConfiguration>> GetDefaultProviderAsync();
}
```

---

### **Phase 3: Provider Factory & Discovery** (Week 3-4)

#### 3.1 Provider Factory Interface

```csharp
// FMS.Infrastructure/VehicleTracking/Interfaces/IProviderFactory.cs
public interface IProviderFactory
{
    IVehicleTrackingProvider GetProvider(string providerName);
    IVehicleTrackingProvider GetDefaultProvider();
    List<IVehicleTrackingProvider> GetAllProviders();
    List<IVehicleTrackingProvider> GetProvidersByCapability(string capability);
    Task<FMSResponse<bool>> RegisterProviderAsync(ProviderConfiguration configuration);
}
```

#### 3.2 Provider Factory Implementation

```csharp
// FMS.Infrastructure/VehicleTracking/ProviderFactory.cs
public class VehicleTrackingProviderFactory : IProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IProviderConfigurationService _configService;
    private readonly ILogger<VehicleTrackingProviderFactory> _logger;
    private readonly Dictionary<string, Type> _providerTypes;

    public VehicleTrackingProviderFactory(
        IServiceProvider serviceProvider,
        IProviderConfigurationService configService,
        ILogger<VehicleTrackingProviderFactory> logger)
    {
        _serviceProvider = serviceProvider;
        _configService = configService;
        _logger = logger;
        _providerTypes = new Dictionary<string, Type>();

        DiscoverProviders();
    }

    private void DiscoverProviders()
    {
        // Scan assemblies for IVehicleTrackingProvider implementations
        var providerType = typeof(IVehicleTrackingProvider);
        var assemblies = AppDomain.CurrentDomain.GetAssemblies();

        foreach (var assembly in assemblies)
        {
            var types = assembly.GetTypes()
                .Where(t => providerType.IsAssignableFrom(t)
                    && !t.IsInterface
                    && !t.IsAbstract);

            foreach (var type in types)
            {
                var instance = (IVehicleTrackingProvider)Activator.CreateInstance(
                    type,
                    _serviceProvider.GetRequiredService<ILogger>(),
                    _serviceProvider.GetRequiredService<HttpClient>());

                _providerTypes[instance.ProviderName] = type;
                _logger.LogInformation("Discovered provider: {ProviderName}",
                    instance.ProviderName);
            }
        }
    }

    public IVehicleTrackingProvider GetProvider(string providerName)
    {
        if (!_providerTypes.ContainsKey(providerName))
            throw new ProviderException($"Provider '{providerName}' not found");

        var type = _providerTypes[providerName];
        return (IVehicleTrackingProvider)_serviceProvider.GetRequiredService(type);
    }
}
```

#### 3.3 Dependency Injection Registration

```csharp
// FMS.Infrastructure/Extensions/VehicleTrackingExtensions.cs
public static class VehicleTrackingExtensions
{
    public static IServiceCollection AddVehicleTrackingPlugins(
        this IServiceCollection services)
    {
        // Register factory
        services.AddSingleton<IProviderFactory, VehicleTrackingProviderFactory>();

        // Register configuration service
        services.AddScoped<IProviderConfigurationService, ProviderConfigurationService>();

        // Auto-register all providers
        services.Scan(scan => scan
            .FromAssembliesOf(typeof(IVehicleTrackingProvider))
            .AddClasses(classes => classes.AssignableTo<IVehicleTrackingProvider>())
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        return services;
    }
}
```

---

### **Phase 4: Refactor GPSGate as Plugin** (Week 4-5)

#### 4.1 Update GPSGateService

```csharp
// FMS.Infrastructure/ExternalServices/GPS/GPSGate/GPSGateProvider.cs
public class GPSGateProvider : BaseVehicleTrackingProvider
{
    private readonly GpsdataContext _context;
    private string _apiKey;
    private string _baseUrl;
    private int _applicationId;

    public override string ProviderName => "GPSGate";
    public override string ProviderVersion => "1.0.0";
    public override ProviderCapabilities Capabilities => new ProviderCapabilities
    {
        SupportsRealTimeLocation = true,
        SupportsHistoricalData = true,
        SupportsGeofencing = true,
        SupportsEvents = true,
        SupportsOdometer = true
    };

    public GPSGateProvider(
        GpsdataContext context,
        ILogger<GPSGateProvider> logger,
        HttpClient httpClient)
        : base(logger, httpClient)
    {
        _context = context;
    }

    public override async Task<FMSResponse<bool>> InitializeAsync(
        ProviderConfiguration configuration)
    {
        try
        {
            _configuration = configuration;
            _apiKey = configuration.GetValue<string>("ApiKey");
            _baseUrl = configuration.GetValue<string>("BaseUrl");
            _applicationId = configuration.GetValue<int>("ApplicationId");

            _httpClient.DefaultRequestHeaders.Add("Authorization", _apiKey);

            _isInitialized = true;
            return FMSResponse<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize GPSGate provider");
            return FMSResponse<bool>.Failed($"Initialization failed: {ex.Message}");
        }
    }

    // Keep existing implementation methods
    public override async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        ValidateInitialization();
        // ... existing implementation
    }
}
```

---

### **Phase 5: Update Application Layer** (Week 5-6)

#### 5.1 Update IGPSService

```csharp
// FMS.Application/Features/Vehicle/Services/IGPSService.cs
public interface IGPSService
{
    // Keep existing methods for backward compatibility
    Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId);
    Task<FMSResponse<VehicleOdometerDTO>> GetVehicleOdometerAsync(int vehicleId);
    Task<FMSResponse<List<VehicleLocationDTO>>> GetAllVehicleLocationsAsync(bool onlineOnly = false);
    Task<FMSResponse<bool>> IsVehicleOnlineAsync(int vehicleId);
    Task<FMSResponse<bool>> ValidateConnectionAsync();

    // New plugin-aware methods
    Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId, string providerName = null);
    Task<FMSResponse<List<string>>> GetAvailableProvidersAsync();
    Task<FMSResponse<ProviderHealthStatus>> GetProviderHealthAsync(string providerName);
}
```

#### 5.2 Implement GPS Service Orchestrator

```csharp
// FMS.Infrastructure/VehicleTracking/GPSServiceOrchestrator.cs
public class GPSServiceOrchestrator : IGPSService
{
    private readonly IProviderFactory _providerFactory;
    private readonly IProviderConfigurationService _configService;
    private readonly ILogger<GPSServiceOrchestrator> _logger;

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(
        int vehicleId,
        string providerName = null)
    {
        try
        {
            // Get provider (default or specified)
            var provider = string.IsNullOrEmpty(providerName)
                ? _providerFactory.GetDefaultProvider()
                : _providerFactory.GetProvider(providerName);

            return await provider.GetVehicleLocationAsync(vehicleId);
        }
        catch (ProviderException ex)
        {
            _logger.LogWarning(ex, "Provider unavailable, attempting failover");
            return await FailoverGetLocationAsync(vehicleId, providerName);
        }
    }

    private async Task<FMSResponse<VehicleLocationDTO>> FailoverGetLocationAsync(
        int vehicleId,
        string failedProvider)
    {
        var providers = _providerFactory.GetAllProviders()
            .Where(p => p.ProviderName != failedProvider)
            .OrderBy(p => p.Capabilities.Priority);

        foreach (var provider in providers)
        {
            try
            {
                var result = await provider.GetVehicleLocationAsync(vehicleId);
                if (result.IsSuccess)
                {
                    _logger.LogInformation(
                        "Failover successful using provider: {ProviderName}",
                        provider.ProviderName);
                    return result;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failover attempt failed for {ProviderName}",
                    provider.ProviderName);
            }
        }

        return FMSResponse<VehicleLocationDTO>.Failed("All providers failed");
    }
}
```

---

### **Phase 6: Health Monitoring & Metrics** (Week 6-7)

#### 6.1 Provider Health Monitor

```csharp
// FMS.Infrastructure/VehicleTracking/ProviderHealthMonitor.cs
public class ProviderHealthMonitor : BackgroundService
{
    private readonly IProviderFactory _providerFactory;
    private readonly ILogger<ProviderHealthMonitor> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CheckAllProvidersHealthAsync();
            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task CheckAllProvidersHealthAsync()
    {
        var providers = _providerFactory.GetAllProviders();

        foreach (var provider in providers)
        {
            try
            {
                var health = await provider.GetHealthStatusAsync();
                await SaveHealthStatusAsync(provider.ProviderName, health.Data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed for {ProviderName}",
                    provider.ProviderName);
            }
        }
    }
}
```

---

### **Phase 7: Admin UI & Management** (Week 7-8)

#### 7.1 Provider Management Controller

```csharp
// FMS.WebClient/Controllers/VehicleTracking/ProviderManagementController.cs
[ApiController]
[Route("api/v1/providers")]
public class ProviderManagementController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAllProviders()
    {
        // List all registered providers with status
    }

    [HttpGet("{providerName}/health")]
    public async Task<IActionResult> GetProviderHealth(string providerName)
    {
        // Get provider health status
    }

    [HttpPost("{providerName}/enable")]
    public async Task<IActionResult> EnableProvider(string providerName)
    {
        // Enable/disable provider
    }

    [HttpPost]
    public async Task<IActionResult> RegisterProvider(
        [FromBody] ProviderConfiguration config)
    {
        // Register new provider
    }
}
```

---

## 🗓️ Implementation Timeline

| Phase       | Duration  | Deliverables                              |
| ----------- | --------- | ----------------------------------------- |
| **Phase 1** | Week 1-2  | Core interfaces, base classes, models     |
| **Phase 2** | Week 2-3  | Database schema, configuration service    |
| **Phase 3** | Week 3-4  | Provider factory, discovery, DI setup     |
| **Phase 4** | Week 4-5  | GPSGate as plugin, backward compatibility |
| **Phase 5** | Week 5-6  | Orchestrator, failover logic              |
| **Phase 6** | Week 6-7  | Health monitoring, metrics                |
| **Phase 7** | Week 7-8  | Admin UI, management endpoints            |
| **Phase 8** | Week 8-10 | Testing, documentation, deployment        |

**Total Duration:** 10 weeks

---

## ✅ Success Criteria

### Technical

- [ ] Zero breaking changes to existing GPS functionality
- [ ] Plugin system supports hot-swapping providers
- [ ] Performance overhead < 5%
- [ ] Automatic failover within 60 seconds
- [ ] Support for 3+ providers

### Business

- [ ] Reduce provider switching time from weeks to hours
- [ ] Enable multi-provider cost optimization
- [ ] Improve reliability through redundancy
- [ ] Provide provider performance visibility

---

## 📝 Next Steps

1. **Review & Approval**: Review this plan with stakeholders
2. **Start Phase 1**: Begin core interface implementation
3. **Set Up Tracking**: Create project board for task tracking
4. **Documentation**: Create plugin development guide
5. **Testing Strategy**: Define comprehensive test plan

---

**Document Version:** 1.0
**Last Updated:** October 26, 2025
**Status:** Ready for Implementation
