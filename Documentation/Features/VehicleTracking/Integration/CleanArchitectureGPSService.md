# GPS Service Clean Architecture Implementation

## 📋 Overview

This document describes the Clean Architecture implementation of the GPS Service for vehicle tracking in the FMS system. The refactoring ensures proper separation of concerns and adherence to SOLID principles.

---

## 🏗️ Architecture Layers

### **Clean Architecture Principles Applied**

```
┌──────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (FMS.WebClient)                             │
│  - VehicleTrackingController                             │
│  - Receives HTTP requests                                │
│  - Returns HTTP responses                                │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ↓ Sends MediatR Query
┌──────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│              (FMS.Application)                           │
│  - GetVehicleLocationQueryHandler                        │
│  - IGPSService (INTERFACE) ← Defines contract            │
│  - Business logic orchestration                          │
│  - DTOs: VehicleLocationDTO, VehicleOdometerDTO          │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ↓ Calls IGPSService
┌──────────────────────────────────────────────────────────┐
│                Infrastructure Layer                      │
│              (FMS.Infrastructure)                        │
│  - GPSGateService : IGPSService ← Implementation         │
│  - HttpClient for external API calls                     │
│  - Configuration management                              │
│  - API-specific models (GPSGateUserStatus, etc.)         │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ↓ Accesses database
┌──────────────────────────────────────────────────────────┐
│                 Persistence Layer                        │
│              (FMS.Persistence)                           │
│  - GpsdataContext                                        │
│  - Vehicle entity and DeviceId mapping                   │
└─────────────────┬────────────────────────────────────────┘
                  │
                  ↓ Makes HTTP calls
┌──────────────────────────────────────────────────────────┐
│                 External Service                         │
│                GPSGate API                               │
│  - Vehicle location endpoints                            │
│  - Odometer accumulator endpoints                        │
└──────────────────────────────────────────────────────────┘
```

---

## 📂 File Structure

### **Before Refactoring (WRONG ❌)**

```
FMS.Application/
  └── Features/
      └── Vehicle/
          └── Services/
              ├── IGPSService.cs        ✓ OK
              └── GPSGateService.cs     ✗ WRONG LOCATION
```

**Problem:** Application layer contains infrastructure implementation with HttpClient, Configuration dependencies

---

### **After Refactoring (CORRECT ✅)**

```
FMS.Application/
  └── Features/
      └── Vehicle/
          ├── Services/
          │   └── IGPSService.cs                    ✓ Interface (contract)
          ├── DTOs/
          │   ├── VehicleLocationDTO.cs
          │   └── VehicleOdometerDTO.cs
          └── Queries/
              └── VehicleTracking/
                  ├── GetVehicleLocationQuery.cs
                  ├── GetVehicleOdometerQuery.cs
                  └── GetAllVehicleLocationsQuery.cs

FMS.Infrastructure/
  └── ExternalServices/
      └── GPS/
          └── GPSGate/
              ├── GPSGateService.cs          ✓ Implementation
              └── GPSGateModels.cs           ✓ API models
```

---

## 🔄 Request Flow Sequence

### **1. Controller Receives Request**

```csharp
// FMS.WebClient/Controllers/VehicleManagement/VehicleTrackingController.cs
[HttpGet("{vehicleId}/location")]
public async Task<IActionResult> GetVehicleLocation(int vehicleId)
{
    var query = new GetVehicleLocationQuery { VehicleId = vehicleId };
    var result = await _mediator.Send(query);
    return Ok(result);
}
```

### **2. MediatR Handler (Application Layer)**

```csharp
// FMS.Application/Features/Vehicle/Queries/VehicleTracking/GetVehicleLocationQuery.cs
public class GetVehicleLocationQueryHandler
    : IRequestHandler<GetVehicleLocationQuery, FMSResponse<VehicleLocationDTO>>
{
    private readonly IGPSService _gpsService; // ← Interface dependency

    public async Task<FMSResponse<VehicleLocationDTO>> Handle(...)
    {
        return await _gpsService.GetVehicleLocationAsync(request.VehicleId);
    }
}
```

### **3. GPS Service Implementation (Infrastructure Layer)**

```csharp
// FMS.Infrastructure/ExternalServices/GPS/GPSGate/GPSGateService.cs
public class GPSGateService : IGPSService
{
    private readonly HttpClient _httpClient;
    private readonly GpsdataContext _context;

    public async Task<FMSResponse<VehicleLocationDTO>> GetVehicleLocationAsync(int vehicleId)
    {
        // 1. Get vehicle from database (DeviceId mapping)
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(...);

        // 2. Call GPSGate API
        var response = await _httpClient.GetAsync($"{_baseUrl}/users/{vehicle.DeviceId}/status");

        // 3. Map to DTO and return
        return FMSResponse<VehicleLocationDTO>.Success(locationDto);
    }
}
```

---

## 🔌 Dependency Injection Configuration

### **WebClient Registration**

```csharp
// FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs
public static IServiceCollection AddFMSServices(this IServiceCollection services)
{
    // Vehicle & GPS Services
    services.AddHttpClient<IGPSService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
    services.AddScoped<IGPSService, FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();

    return services;
}
```

### **PTS WindowsService Registration**

```csharp
// FMS.PTS.WindowsService/Program.cs
private static void ConfigureHandlers(IServiceCollection services)
{
    services.AddHttpClient<FMS.Application.Features.Vehicle.Services.IGPSService,
                          FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
    services.AddScoped<FMS.Application.Features.Vehicle.Services.IGPSService,
                      FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService>();
}
```

---

## 📦 Project References

### **FMS.Infrastructure.csproj**

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.Extensions.DependencyInjection.Abstractions" Version="8.0.0" />
  <PackageReference Include="Microsoft.Extensions.Configuration.Abstractions" Version="8.0.0" />
  <PackageReference Include="Microsoft.Extensions.Logging.Abstractions" Version="8.0.0" />
  <PackageReference Include="Microsoft.Extensions.Http" Version="8.0.0" />
  <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
</ItemGroup>

<ItemGroup>
  <ProjectReference Include="..\FMS.Domain\FMS.Domain.csproj" />
  <ProjectReference Include="..\FMS.Application\FMS.Application.csproj" />
  <ProjectReference Include="..\FMS.Persistence\FMS.Persistence.csproj" />
</ItemGroup>
```

---

## 🎯 Benefits of This Architecture

### **1. Separation of Concerns**

- ✅ **Application layer** defines what it needs (interface)
- ✅ **Infrastructure layer** provides implementation details
- ✅ No coupling between application logic and external services

### **2. Testability**

```csharp
// Easy to mock IGPSService for unit testing
public class GetVehicleLocationQueryHandlerTests
{
    [Fact]
    public async Task Should_Return_Location_When_Valid_VehicleId()
    {
        // Arrange
        var mockGpsService = new Mock<IGPSService>();
        mockGpsService.Setup(x => x.GetVehicleLocationAsync(1))
            .ReturnsAsync(FMSResponse<VehicleLocationDTO>.Success(new VehicleLocationDTO()));

        var handler = new GetVehicleLocationQueryHandler(mockGpsService.Object, logger);

        // Act
        var result = await handler.Handle(new GetVehicleLocationQuery { VehicleId = 1 });

        // Assert
        Assert.True(result.IsSuccess);
    }
}
```

### **3. Extensibility - Multiple GPS Providers**

```csharp
// Future: Add Geotab, Traccar, etc.
FMS.Infrastructure/
  └── ExternalServices/
      └── GPS/
          ├── GPSGate/
          │   └── GPSGateService.cs
          ├── Geotab/
          │   └── GeotabService.cs
          └── Traccar/
              └── TraccarService.cs

// Factory Pattern
public interface IGPSServiceFactory
{
    IGPSService GetGPSService(string providerName);
}
```

### **4. Dependency Rule Compliance**

```
Domain ← Application ← Infrastructure
  ↑          ↑              ↑
  │          │              │
  │          │              └── Depends on Application (interface only)
  │          └── Depends on Domain (entities)
  └── No dependencies (pure business logic)
```

---

## 🚀 Usage Examples

### **Get Single Vehicle Location**

```csharp
GET /api/v1/vehicletracking/123/location

Response:
{
  "isSuccess": true,
  "data": {
    "vehicleId": 123,
    "vehicleName": "HY-001",
    "numberPlate": "ABC-123",
    "latitude": -1.2921,
    "longitude": 36.8219,
    "speed": 45.5,
    "heading": 180.0,
    "isOnline": true,
    "lastUpdated": "2025-10-26T10:30:00Z"
  },
  "message": null
}
```

### **Get All Vehicle Locations**

```csharp
GET /api/v1/vehicletracking/locations?onlineOnly=true

Response:
{
  "isSuccess": true,
  "data": [
    { "vehicleId": 1, "isOnline": true, ... },
    { "vehicleId": 2, "isOnline": true, ... }
  ],
  "message": null
}
```

### **Get Vehicle Odometer**

```csharp
GET /api/v1/vehicletracking/123/odometer

Response:
{
  "isSuccess": true,
  "data": {
    "vehicleId": 123,
    "currentOdometer": 45678.5,
    "unit": "km",
    "lastUpdated": "2025-10-26T10:30:00Z"
  },
  "message": null
}
```

---

## ⚙️ Configuration

### **appsettings.json**

```json
{
  "GPSGate": {
    "BaseUrl": "http://gpsgate-server/api",
    "ApiKey": "your-api-key-here",
    "ApplicationId": "1"
  }
}
```

---

## 🧪 Testing Strategy

### **Unit Tests**

- ✅ Mock `IGPSService` in query handlers
- ✅ Test business logic without external dependencies
- ✅ Fast execution, no network calls

### **Integration Tests**

- ✅ Test `GPSGateService` with real API calls
- ✅ Use test environment/mock server
- ✅ Validate API contract and data mapping

### **End-to-End Tests**

- ✅ Test full flow: Controller → Handler → Service → API
- ✅ Verify error handling and resilience
- ✅ Test with real database and GPS provider

---

## 📝 Migration Checklist

- [x] Create `FMS.Infrastructure/ExternalServices/GPS/GPSGate/` structure
- [x] Extract API models to `GPSGateModels.cs`
- [x] Move `GPSGateService` to Infrastructure layer
- [x] Keep `IGPSService` in Application layer
- [x] Update project references in `FMS.Infrastructure.csproj`
- [x] Update service registration in `FmsServiceCollectionExtensions.cs`
- [x] Update service registration in `Program.cs` (PTS.WindowsService)
- [x] Delete old `GPSGateService.cs` from Application layer
- [x] Create this documentation
- [ ] Build and test solution
- [ ] Update unit tests to use new namespaces
- [ ] Deploy to test environment

---

## 🔍 Troubleshooting

### **Common Issues After Migration**

1. **Namespace Not Found**

   - Ensure `FMS.Infrastructure` project reference is added
   - Rebuild solution: `dotnet build Tenacy.Fms.sln`

2. **DI Registration Error**

   - Verify both `AddHttpClient<>` and `AddScoped<>` are configured
   - Check namespace in registration: `FMS.Infrastructure.ExternalServices.GPS.GPSGate.GPSGateService`

3. **GPS Data Not Loading**
   - Check `appsettings.json` for correct GPSGate configuration
   - Verify vehicle has `DeviceId` and `HasGPSInstalled = 1`
   - Check logs for API communication errors

---

## 📚 Related Documentation

- [Vehicle Tracking Implementation](./VehicleGPSTrackingImplementation.md)
- [Product Requirements Document](./PRDvehicletracking.md)
- [Clean Architecture Guide](../../refactoringguide.md)
- [FMS System Instructions](../../../.github/copilot-instructions.md)

---

## 🎓 Key Takeaways

1. **Interfaces belong in Application layer** - They define what the application needs
2. **Implementations belong in Infrastructure layer** - They provide the "how"
3. **Follow the Dependency Rule** - Always point inward (Infrastructure → Application → Domain)
4. **Use FMSResponse<T>** - Consistent response handling across all layers
5. **CQRS Pattern** - Queries for reads, Commands for writes
6. **HttpClient Factory** - Use `AddHttpClient<>` for proper lifecycle management

---

**Last Updated:** October 26, 2025
**Author:** FMS Development Team
**Version:** 1.0.0
