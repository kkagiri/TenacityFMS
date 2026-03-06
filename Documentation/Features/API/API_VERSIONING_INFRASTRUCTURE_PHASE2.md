# API Versioning Infrastructure - Phase 2 Implementation Guide

## Overview

This document outlines the implementation of v1 API versioning across the FMS system, establishing patterns for future version management and ensuring consistent API evolution.

## Versioning Strategy

### **URL-Based Versioning (Selected Approach)**

We've chosen URL-based versioning for its clarity, simplicity, and ease of implementation:

```
Before: /api/vehicle
After:  /api/v1/vehicle
```

**Benefits:**
- ✅ Clear and explicit version identification
- ✅ Easy to implement and understand
- ✅ No header complexity for frontend teams
- ✅ Compatible with existing tools and documentation
- ✅ RESTful and follows industry best practices

## Implementation Plan

### **Phase 2A: Template Controllers (Week 1)**

Start with our best-practice controllers to establish patterns:

1. **ActiveAlarmController** - Custom route pattern
2. **VehicleController** - Standard route pattern
3. **EmployeeController** - Basic pattern

### **Phase 2B: Critical Controllers (Weeks 2-3)**

4. **DashboardController** - Remove deprecated patterns
5. **FuelManagement/** - Business critical controllers
6. **UserManagement/** - Security critical controllers

### **Phase 2C: Remaining Controllers (Weeks 4-6)**

7. All remaining controllers following established patterns

## Route Pattern Standards

### **Standard Controllers**
```csharp
// Before
[Route("api/[controller]")]

// After
[Route("api/v1/[controller]")]
```

### **Custom Route Controllers**
```csharp
// Before
[Route("api/active-alarms")]

// After
[Route("api/v1/active-alarms")]
```

### **Nested Resource Controllers**
```csharp
// Before
[Route("api/fuel-management/tanks")]

// After
[Route("api/v1/fuel-management/tanks")]
```

## Version Management Infrastructure

### **API Version Constants**

Create a centralized version management system:

```csharp
// FMS.WebClient/Constants/ApiVersions.cs
public static class ApiVersions
{
    public const string V1 = "v1";
    public const string Current = V1;

    public static class Routes
    {
        public const string V1_BASE = "api/v1";
        public const string CURRENT_BASE = V1_BASE;
    }
}
```

### **Base Controller Template**

```csharp
// FMS.WebClient/Controllers/Base/BaseApiController.cs
[ApiController]
[Route(ApiVersions.Routes.V1_BASE + "/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public abstract class BaseApiController : ControllerBase
{
    // Common functionality for all v1 controllers
    protected Claim GetUserIdClaim()
    {
        return User.Claims.FirstOrDefault(c =>
            c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
            Guid.TryParse(c.Value, out _));
    }

    protected bool HasPermission(string permission)
    {
        return User.HasClaim("permissions", permission);
    }

    protected IActionResult HandlePermissionCheck(string permission)
    {
        if (!HasPermission(permission))
            return Forbid();
        return null;
    }

    protected IActionResult ValidateId(int id, string resourceName = "Resource")
    {
        if (id <= 0)
            return BadRequest(FMSResponse.FailedResponse($"Invalid {resourceName} ID"));
        return null;
    }
}
```

## Controller Update Templates

### **Template 1: Standard Controller Pattern**

```csharp
// Example: VehicleController update
[ApiController]
[Route("api/v1/[controller]")]  // ← Updated from "api/[controller]"
public class VehicleController : ControllerBase
{
    // Existing implementation remains the same
    // Only route attribute changes
}
```

### **Template 2: Custom Route Pattern**

```csharp
// Example: ActiveAlarmController update
[ApiController]
[Route("api/v1/active-alarms")]  // ← Updated from "api/active-alarms"
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class ActiveAlarmController : ControllerBase
{
    // Existing implementation remains the same
    // Only route attribute changes
}
```

### **Template 3: Nested Resource Pattern**

```csharp
// Example: Fuel Management controllers
[ApiController]
[Route("api/v1/fuel-management/tanks")]  // ← New nested pattern
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class TankController : ControllerBase
{
    // Implementation
}
```

## Frontend Integration Updates

### **axiosInstance Configuration**

```javascript
// fms.frontend/src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://localhost:7243',
  headers: {
    'Content-Type': 'application/json',
    'API-Version': 'v1'  // Version header for tracking
  }
});

// Request interceptor to ensure v1 prefix
axiosInstance.interceptors.request.use(config => {
  // Ensure all requests go to v1 endpoints
  if (config.url && !config.url.startsWith('/api/v1/')) {
    if (config.url.startsWith('/api/')) {
      config.url = config.url.replace('/api/', '/api/v1/');
    } else if (config.url.startsWith('/')) {
      config.url = '/api/v1' + config.url;
    } else {
      config.url = '/api/v1/' + config.url;
    }
  }
  return config;
});

export default axiosInstance;
```

### **Service Layer Updates**

```javascript
// Example: VehicleService update
class VehicleService {
  async getVehicles() {
    // Old: '/vehicle' or '/api/vehicle'
    // New: Automatically becomes '/api/v1/vehicle' via interceptor
    const response = await axiosInstance.get('/vehicle');
    return this.handleFMSResponse(response);
  }
}
```

## Migration Strategy

### **Backward Compatibility Plan**

During transition period, support both versions:

```csharp
// Option 1: Duplicate routes (transition period only)
[HttpGet]
[Route("api/[controller]")]  // Legacy route
[Route("api/v1/[controller]")]  // New v1 route
public async Task<IActionResult> GetList()
{
    // Same implementation
}

// Option 2: Redirect legacy to v1 (preferred)
[HttpGet]
[Route("api/[controller]")]
public IActionResult GetListLegacy()
{
    return RedirectToAction("GetList");
}

[HttpGet]
[Route("api/v1/[controller]")]
public async Task<IActionResult> GetList()
{
    // Implementation
}
```

### **Deprecation Timeline**

1. **Week 1-2**: Implement v1 routes alongside existing routes
2. **Week 3-4**: Update frontend to use v1 endpoints
3. **Week 5-6**: Add deprecation warnings to legacy endpoints
4. **Week 7-8**: Remove legacy endpoints (breaking change)

## Testing Strategy

### **Endpoint Testing**

```csharp
// Test both legacy and v1 routes during transition
[Test]
public async Task GetVehicles_V1Route_ReturnsSuccess()
{
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var response = await client.GetAsync("/api/v1/vehicle");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}

[Test]
public async Task GetVehicles_LegacyRoute_RedirectsToV1()
{
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var response = await client.GetAsync("/api/vehicle");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Redirect);
    response.Headers.Location.ToString().Should().Contain("/api/v1/vehicle");
}
```

### **Frontend Testing**

```javascript
// Test v1 endpoint integration
describe('VehicleService v1 Integration', () => {
  test('should call v1 endpoint correctly', async () => {
    const mockAxios = jest.mocked(axiosInstance);
    mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } });

    const service = new VehicleService();
    await service.getVehicles();

    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/vehicle');
  });
});
```

## Documentation Updates

### **API Documentation**

Update all API documentation to reflect v1 endpoints:

```markdown
# Vehicle API v1

## Get Vehicles
```
GET /api/v1/vehicle
```

## Get Vehicle by ID
```
GET /api/v1/vehicle/{id}
```
```

### **OpenAPI/Swagger Updates**

```csharp
// Startup.cs or Program.cs
services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "FMS API v1",
        Description = "Fleet Management System API Version 1"
    });
});
```

## Quality Checklist

### **Controller Update Checklist**

For each controller update:

- [ ] Route updated to include `/v1/`
- [ ] All action routes consistent with v1 pattern
- [ ] No breaking changes to request/response structure
- [ ] Tests updated for v1 endpoints
- [ ] Documentation updated

### **Frontend Update Checklist**

For each service update:

- [ ] axiosInstance configured with v1 interceptor
- [ ] Service calls updated to v1 endpoints
- [ ] Error handling updated for v1 responses
- [ ] Tests updated for v1 integration
- [ ] Redux actions updated (if applicable)

## Error Handling

### **Version Mismatch Handling**

```csharp
// Middleware for version validation
public class ApiVersionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path = context.Request.Path.Value;

        // Check for legacy API calls and log warnings
        if (path.StartsWith("/api/") && !path.StartsWith("/api/v"))
        {
            _logger.LogWarning("Legacy API call detected: {Path}", path);
        }

        await next(context);
    }
}
```

### **Version Negotiation**

```csharp
// Future: Support multiple versions
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class VehicleV1Controller : ControllerBase
{
    // v1 implementation
}

[ApiVersion("2.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class VehicleV2Controller : ControllerBase
{
    // v2 implementation
}
```

## Success Metrics

### **Phase 2 Completion Criteria**

- [ ] **100% of controllers** have v1 routes
- [ ] **Frontend axiosInstance** configured for v1
- [ ] **All existing functionality** works with v1 endpoints
- [ ] **API documentation** updated to reflect v1
- [ ] **Tests pass** for all v1 endpoints
- [ ] **No breaking changes** introduced

### **Performance Monitoring**

- Monitor API response times before/after v1 updates
- Track error rates during transition period
- Measure frontend application performance
- Monitor cache hit rates with new v1 cache keys

## Future Versioning Strategy

### **v2 Preparation**

This v1 infrastructure sets the foundation for future versions:

```csharp
// Future v2 controller structure
[ApiController]
[Route("api/v2/[controller]")]
public class VehicleV2Controller : ControllerBase
{
    // v2 improvements:
    // - Enhanced response structure
    // - New filtering options
    // - Improved performance
    // - Breaking changes from v1
}
```

### **Version Lifecycle Management**

1. **v1 (Current)**: Stable, production ready
2. **v2 (Future)**: Enhanced features, possible breaking changes
3. **Deprecation Policy**: Maintain previous version for 12 months minimum

## Risk Mitigation

### **Rollback Plan**

If issues arise during v1 deployment:

1. **Immediate**: Route traffic back to legacy endpoints
2. **Short-term**: Fix issues in v1 implementation
3. **Long-term**: Complete v1 transition with fixes

### **Monitoring**

- API error rate monitoring
- Response time tracking
- Frontend error reporting
- User experience metrics

---

This versioning infrastructure provides a solid foundation for the FMS API evolution while maintaining stability and backward compatibility.