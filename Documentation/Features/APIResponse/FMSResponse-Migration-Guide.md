# FMSResponse Migration Guide

## Overview
This guide helps developers migrate to the enhanced FMSResponse structure with improved API response standards.

**Migration Type**: Backward Compatible (Evolutionary)
**Effort**: Low to Medium
**Risk**: Low

---

## What's New

### New Properties
- ✅ `StatusCode` - HTTP status code (automatic)
- ✅ `ErrorCode` - Machine-readable error code
- ✅ `Timestamp` - UTC timestamp (automatic)
- ✅ `RequestId` - Unique request identifier (automatic via middleware)
- ✅ `CorrelationId` - Request correlation ID (automatic via middleware)
- ✅ `Path` - API endpoint path (automatic via middleware)
- ✅ `Method` - HTTP method (automatic via middleware)
- ✅ `Warnings` - Non-critical warning messages
- ✅ `DebugInfo` - Debug information (development only)
- ✅ `Metadata` - Extensible metadata dictionary

### New Error Types
- ✅ `Unauthorized` (401)
- ✅ `Forbidden` (403)
- ✅ `NotFound` (404)
- ✅ `Conflict` (409)
- ✅ `TooManyRequests` (429)
- ✅ `ServiceUnavailable` (503)

### New Classes
- ✅ `FMSPagedResponse<T>` - For paginated responses
- ✅ `PaginationMetadata` - Pagination info
- ✅ `ErrorCodes` - Centralized error code constants
- ✅ `FMSResponseHelper` - Helper utilities

### New Middleware
- ✅ `RequestTrackingMiddleware` - Adds request/correlation IDs
- ✅ `ResponseEnrichmentMiddleware` - Auto-populates response properties

---

## Quick Start

### 1. Enable Middleware (Optional but Recommended)

Update `Program.cs` or `Startup.cs`:

```csharp
// Add to the application pipeline (after authentication, before controllers)
app.UseRequestTracking();        // Add request tracking
app.UseResponseEnrichment();     // Auto-enrich responses

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

### 2. Use Error Codes

```csharp
using FMS.Application.Common;

// Before
return FMSResponse<Tank>.Failed("Tank not found");

// After
return FMSResponse<Tank>.NotFound(
    ErrorCodes.TANK_NOT_FOUND,
    "Tank not found"
);
```

### 3. Leverage StatusCode Property

```csharp
// Before
[HttpGet("{id}")]
public async Task<IActionResult> GetTank(int id) {
    var result = await _mediator.Send(new GetTankQuery { TankId = id });

    if (result.IsSuccess)
        return Ok(result);

    return NotFound(result);  // Manual mapping
}

// After
[HttpGet("{id}")]
public async Task<IActionResult> GetTank(int id) {
    var result = await _mediator.Send(new GetTankQuery { TankId = id });
    return StatusCode(result.StatusCode, result);  // Automatic mapping
}
```

---

## Backward Compatibility

### ✅ Existing Code Continues to Work

All existing code using FMSResponse will continue to work without changes:

```csharp
// This still works perfectly
var response = FMSResponse<Tank>.Success(tank);
var response2 = FMSResponse.FailedResponse("Error occurred");
var response3 = FMSResponse<Tank>.ValidationFailed(errors);
```

### ✅ Frontend Compatibility

Existing frontend code continues to work:

```javascript
// Still works - just ignores new properties
if (response.isSuccess) {
    console.log(response.data);
} else {
    console.error(response.message);
}
```

### ✅ Gradual Migration

You can migrate code gradually:
1. New features can use enhanced properties immediately
2. Old features can be updated over time
3. No breaking changes

---

## Migration Patterns

### Pattern 1: Simple Success Response

#### Before
```csharp
public async Task<FMSResponse<TankDto>> Handle(GetTankQuery request) {
    var tank = await _repository.GetByIdAsync(request.TankId);

    if (tank == null)
        return FMSResponse<TankDto>.Failed("Tank not found");

    return FMSResponse<TankDto>.Success(_mapper.Map<TankDto>(tank));
}
```

#### After
```csharp
public async Task<FMSResponse<TankDto>> Handle(GetTankQuery request) {
    var tank = await _repository.GetByIdAsync(request.TankId);

    if (tank == null)
        return FMSResponse<TankDto>.NotFound(
            ErrorCodes.TANK_NOT_FOUND,
            "Tank not found"
        );

    return FMSResponse<TankDto>.Success(_mapper.Map<TankDto>(tank));
}
```

**Benefits**:
- ✅ Proper HTTP 404 status code
- ✅ Machine-readable error code
- ✅ Better frontend error handling

---

### Pattern 2: Validation Errors

#### Before
```csharp
var validationErrors = new List<string>();

if (string.IsNullOrEmpty(request.TankName))
    validationErrors.Add("Tank name is required");

if (request.Capacity <= 0)
    validationErrors.Add("Capacity must be greater than 0");

if (validationErrors.Any())
    return FMSResponse<int>.ValidationFailed(validationErrors);
```

#### After
```csharp
var validationErrors = new List<string>();

if (string.IsNullOrEmpty(request.TankName))
    validationErrors.Add("Tank name is required");

if (request.Capacity <= 0)
    validationErrors.Add("Capacity must be greater than 0");

if (validationErrors.Any())
    return FMSResponse<int>.ValidationFailed(
        validationErrors,
        ErrorCodes.VALIDATION_FAILED
    );
```

**Benefits**:
- ✅ Error code for programmatic handling
- ✅ Same validation error list structure

---

### Pattern 3: Exception Handling

#### Before
```csharp
[HttpPost]
public async Task<IActionResult> CreateTank([FromBody] CreateTankDto dto) {
    try {
        var result = await _mediator.Send(new CreateTankCommand { /* ... */ });
        return Ok(result);
    } catch (Exception ex) {
        return StatusCode(500, FMSResponse<object>.SystemError(
            "An error occurred while creating tank"
        ));
    }
}
```

#### After
```csharp
[HttpPost]
public async Task<IActionResult> CreateTank([FromBody] CreateTankDto dto) {
    try {
        var result = await _mediator.Send(new CreateTankCommand { /* ... */ });
        return StatusCode(result.StatusCode, result);
    } catch (DbUpdateException ex) {
        var response = FMSResponse<object>.SystemError(
            "Failed to save tank to database",
            ErrorCodes.SYSTEM_DATABASE_ERROR
        );

        // Add debug info in development only
        if (_environment.IsDevelopment()) {
            response.WithDebugInfo(new {
                Exception = ex.Message,
                StackTrace = ex.StackTrace
            });
        }

        return StatusCode(response.StatusCode, response);
    } catch (Exception ex) {
        _logger.LogError(ex, "Unexpected error creating tank");

        var response = FMSResponse<object>.SystemError(
            "An unexpected error occurred",
            ErrorCodes.SYSTEM_ERROR
        );

        return StatusCode(response.StatusCode, response);
    }
}
```

**Benefits**:
- ✅ Specific error codes
- ✅ Debug info in development
- ✅ Proper logging
- ✅ Security (no debug info in production)

---

### Pattern 4: Business Logic Errors

#### Before
```csharp
if (tank.CurrentVolume < request.FuelAmount) {
    return FMSResponse<FuelingDto>.Failed(
        "Insufficient fuel in tank"
    );
}
```

#### After
```csharp
if (tank.CurrentVolume < request.FuelAmount) {
    return FMSResponse<FuelingDto>.BusinessLogicError(
        ErrorCodes.FUELING_INSUFFICIENT_STOCK,
        $"Insufficient fuel in tank. Available: {tank.CurrentVolume}L, Requested: {request.FuelAmount}L"
    );
}
```

**Benefits**:
- ✅ HTTP 422 (Unprocessable Entity) status
- ✅ Clear error code
- ✅ Detailed error message

---

### Pattern 5: Success with Warnings

#### New Feature
```csharp
var fuelingDto = _mapper.Map<FuelingDto>(fueling);
var response = FMSResponse<FuelingDto>.Success(fuelingDto);

// Add warnings for non-critical issues
if (tank.CurrentVolume < tank.MinVolume) {
    response.AddWarning("Tank volume is below minimum threshold");
}

if (vehicle.FuelEfficiency < vehicle.ExpectedEfficiency * 0.8) {
    response.AddWarning("Vehicle fuel efficiency is significantly lower than expected");
}

return response;
```

**Response**:
```json
{
    "isSuccess": true,
    "statusCode": 200,
    "message": "Fueling completed successfully",
    "data": { /* fueling data */ },
    "warnings": [
        "Tank volume is below minimum threshold",
        "Vehicle fuel efficiency is significantly lower than expected"
    ]
}
```

**Benefits**:
- ✅ Success with non-critical issues
- ✅ User awareness of potential problems
- ✅ No data loss

---

### Pattern 6: Paginated Lists

#### Before
```csharp
public async Task<FMSResponse<List<TankDto>>> Handle(GetTanksQuery request) {
    var tanks = await _repository.GetAllAsync();
    return FMSResponse<List<TankDto>>.Success(_mapper.Map<List<TankDto>>(tanks));
}
```

#### After
```csharp
public async Task<FMSPagedResponse<List<TankDto>>> Handle(GetTanksQuery request) {
    var (tanks, totalCount) = await _repository.GetPagedAsync(
        request.PageNumber,
        request.PageSize
    );

    return FMSPagedResponse<List<TankDto>>.Success(
        data: _mapper.Map<List<TankDto>>(tanks),
        pageNumber: request.PageNumber,
        pageSize: request.PageSize,
        totalCount: totalCount
    );
}
```

**Response**:
```json
{
    "isSuccess": true,
    "statusCode": 200,
    "data": [ /* tank list */ ],
    "pagination": {
        "totalCount": 150,
        "pageNumber": 2,
        "pageSize": 20,
        "totalPages": 8,
        "hasPrevious": true,
        "hasNext": true
    }
}
```

**Benefits**:
- ✅ Standard pagination structure
- ✅ Complete pagination metadata
- ✅ Easy frontend integration

---

### Pattern 7: Controller Response Handling

#### Before
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetTank(int id) {
    var result = await _mediator.Send(new GetTankQuery { TankId = id });

    if (result.IsSuccess)
        return Ok(result);

    return BadRequest(result);  // Always 400, even if not found
}
```

#### After (Simple)
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetTank(int id) {
    var result = await _mediator.Send(new GetTankQuery { TankId = id });
    return StatusCode(result.StatusCode, result);  // Automatic status mapping
}
```

#### After (Advanced with Logging)
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetTank(int id) {
    var result = await _mediator.Send(new GetTankQuery { TankId = id });

    if (!result.IsSuccess) {
        _logger.LogWarning(
            "Failed to retrieve tank {TankId}. Error: {ErrorCode} - {Message}",
            id,
            result.ErrorCode,
            result.Message
        );
    }

    return StatusCode(result.StatusCode, result);
}
```

**Benefits**:
- ✅ Correct HTTP status codes automatically
- ✅ Less code in controllers
- ✅ Consistent response handling

---

## Frontend Migration

### Pattern 1: Basic Error Handling

#### Before
```javascript
async function fetchTank(tankId) {
    try {
        const response = await tankService.fetchTankById(tankId);

        if (response.isSuccess) {
            return response.data;
        } else {
            showError(response.message);
            return null;
        }
    } catch (error) {
        showError('An error occurred');
        return null;
    }
}
```

#### After
```javascript
async function fetchTank(tankId) {
    try {
        const response = await tankService.fetchTankById(tankId);

        if (response.isSuccess) {
            return response.data;
        }

        // Handle specific error codes
        switch (response.errorCode) {
            case 'TANK_NOT_FOUND':
                showNotFoundMessage('Tank not found');
                break;
            case 'AUTH_PERMISSION_DENIED':
                showPermissionDenied();
                break;
            default:
                showError(response.message);
        }

        return null;
    } catch (error) {
        showError('An error occurred');
        return null;
    }
}
```

---

### Pattern 2: Request Tracking

#### New Feature
```javascript
async function fetchTankWithTracking(tankId) {
    try {
        const response = await tankService.fetchTankById(tankId);

        if (!response.isSuccess) {
            console.error('Request failed', {
                requestId: response.requestId,
                correlationId: response.correlationId,
                errorCode: response.errorCode,
                message: response.message,
                path: response.path
            });

            // Show error with request ID for support
            showError(
                `${response.message} (Request ID: ${response.requestId})`
            );
        }

        return response.data;
    } catch (error) {
        console.error('Network error', error);
        return null;
    }
}
```

---

### Pattern 3: Pagination Handling

#### Before
```javascript
async function loadTanks(page, pageSize) {
    const response = await tankService.fetchTanks({ page, pageSize });

    if (response.isSuccess) {
        setTanks(response.data);
        // No pagination metadata available
    }
}
```

#### After
```javascript
async function loadTanks(page, pageSize) {
    const response = await tankService.fetchTanks({ page, pageSize });

    if (response.isSuccess) {
        setTanks(response.data);

        // Use pagination metadata
        setPagination({
            currentPage: response.pagination.pageNumber,
            totalPages: response.pagination.totalPages,
            totalCount: response.pagination.totalCount,
            hasNext: response.pagination.hasNext,
            hasPrevious: response.pagination.hasPrevious
        });
    }
}
```

---

### Pattern 4: Warning Display

#### New Feature
```javascript
function handleFuelingResponse(response) {
    if (response.isSuccess) {
        showSuccess('Fueling completed successfully');

        // Display warnings if any
        if (response.warnings && response.warnings.length > 0) {
            response.warnings.forEach(warning => {
                showWarning(warning);
            });
        }

        return response.data;
    } else {
        showError(response.message);
        return null;
    }
}
```

---

## Testing Migration

### Unit Tests

#### Before
```csharp
[Fact]
public async Task GetTank_WhenNotFound_ReturnsFailedResponse() {
    // Arrange
    var handler = new GetTankQueryHandler(_repository, _mapper);
    var query = new GetTankQuery { TankId = 999 };

    // Act
    var result = await handler.Handle(query, CancellationToken.None);

    // Assert
    Assert.False(result.IsSuccess);
}
```

#### After
```csharp
[Fact]
public async Task GetTank_WhenNotFound_ReturnsNotFoundResponse() {
    // Arrange
    var handler = new GetTankQueryHandler(_repository, _mapper);
    var query = new GetTankQuery { TankId = 999 };

    // Act
    var result = await handler.Handle(query, CancellationToken.None);

    // Assert
    Assert.False(result.IsSuccess);
    Assert.Equal(404, result.StatusCode);
    Assert.Equal(ErrorType.NotFound, result.ErrorType);
    Assert.Equal(ErrorCodes.TANK_NOT_FOUND, result.ErrorCode);
}
```

---

### Integration Tests

#### Before
```csharp
[Fact]
public async Task GetTank_WhenNotFound_Returns404() {
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var response = await client.GetAsync("/api/v1/tanks/999");

    // Assert
    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

#### After
```csharp
[Fact]
public async Task GetTank_WhenNotFound_Returns404WithErrorCode() {
    // Arrange
    var client = _factory.CreateClient();

    // Act
    var httpResponse = await client.GetAsync("/api/v1/tanks/999");
    var content = await httpResponse.Content.ReadFromJsonAsync<FMSResponse<TankDto>>();

    // Assert
    Assert.Equal(HttpStatusCode.NotFound, httpResponse.StatusCode);
    Assert.False(content.IsSuccess);
    Assert.Equal(404, content.StatusCode);
    Assert.Equal(ErrorCodes.TANK_NOT_FOUND, content.ErrorCode);
    Assert.NotNull(content.RequestId);
    Assert.NotNull(content.Timestamp);
}
```

---

## Migration Checklist

### Phase 1: Setup (Week 1)
- [ ] Review FMSResponse enhancements
- [ ] Add middleware to Program.cs/Startup.cs
- [ ] Test middleware functionality
- [ ] Update API documentation

### Phase 2: Backend Migration (Week 2-4)
- [ ] Update command/query handlers to use error codes
- [ ] Convert NotFound scenarios to use `NotFound()` method
- [ ] Convert unauthorized scenarios to use `Unauthorized()` method
- [ ] Convert validation errors to include error codes
- [ ] Add warnings where appropriate
- [ ] Update exception handling with debug info
- [ ] Simplify controller actions using `StatusCode(result.StatusCode, result)`

### Phase 3: Frontend Migration (Week 3-5)
- [ ] Update error handling to use error codes
- [ ] Add request ID logging for support
- [ ] Update pagination components
- [ ] Add warning display components
- [ ] Update error messages

### Phase 4: Testing (Week 5-6)
- [ ] Update unit tests to verify new properties
- [ ] Update integration tests
- [ ] Test backward compatibility
- [ ] Performance testing

### Phase 5: Documentation (Week 6-7)
- [ ] Update API documentation with error codes
- [ ] Create error code reference
- [ ] Update developer guidelines
- [ ] Create training materials

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting Error Codes
```csharp
// Bad - No error code
return FMSResponse<Tank>.NotFound("Tank not found");

// Good - With error code
return FMSResponse<Tank>.NotFound(ErrorCodes.TANK_NOT_FOUND, "Tank not found");
```

### ❌ Pitfall 2: Manual Status Code Mapping
```csharp
// Bad - Manual mapping
if (result.IsSuccess)
    return Ok(result);
return BadRequest(result);

// Good - Automatic
return StatusCode(result.StatusCode, result);
```

### ❌ Pitfall 3: Exposing Debug Info in Production
```csharp
// Bad - Always includes debug info
response.WithDebugInfo(exception.StackTrace);

// Good - Only in development
if (_environment.IsDevelopment()) {
    response.WithDebugInfo(exception.StackTrace);
}
```

### ❌ Pitfall 4: Wrong Error Type
```csharp
// Bad - Using Failed for NotFound
return FMSResponse<Tank>.Failed("Tank not found");

// Good - Using NotFound
return FMSResponse<Tank>.NotFound(ErrorCodes.TANK_NOT_FOUND, "Tank not found");
```

---

## Benefits Summary

### For Developers
- ✅ Less boilerplate code in controllers
- ✅ Consistent error handling
- ✅ Better debugging with request tracking
- ✅ Easier testing

### For Frontend
- ✅ Programmatic error handling with error codes
- ✅ Request tracking for support
- ✅ Standard pagination structure
- ✅ Better UX with warnings

### For Operations
- ✅ Request correlation across services
- ✅ Better logging and monitoring
- ✅ Easier debugging production issues
- ✅ Performance tracking

### For Users
- ✅ Better error messages
- ✅ More helpful support with request IDs
- ✅ Faster issue resolution

---

## Support and Resources

### Documentation
- [FMSResponse Review and Standards](./FMSResponse-Review-And-Standards.md)
- [Error Code Reference](./ErrorCodes-Reference.md)
- API Documentation (Swagger/OpenAPI)

### Code Examples
- See `Documentation/Features/APIResponse/Examples/`
- Check updated controller examples
- Review test examples

### Getting Help
- Review this migration guide
- Check example code in the codebase
- Ask in team chat or code reviews

---

## Conclusion

The enhanced FMSResponse provides a solid foundation for building robust, maintainable APIs. The backward-compatible approach allows gradual migration while immediately benefiting from new features.

Start small, migrate gradually, and enjoy the improved developer experience and API quality!

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Migration Status**: Ready for Implementation
