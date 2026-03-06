# REST API Best Practices Guide for AI Agents
*FMS System - Clean Architecture & CQRS Implementation*

## Table of Contents
1. [Core Principles](#core-principles)
2. [Response Handling (MANDATORY)](#response-handling-mandatory)
3. [Controller Structure](#controller-structure)
4. [HTTP Methods & Status Codes](#http-methods--status-codes)
5. [Authentication & Authorization](#authentication--authorization)
6. [Input Validation](#input-validation)
7. [Error Handling](#error-handling)
8. [Caching Strategies](#caching-strategies)
9. [Search & Filtering](#search--filtering)
10. [Pagination](#pagination)
11. [Advanced Patterns](#advanced-patterns)
12. [Performance & Security](#performance--security)
13. [Code Examples](#code-examples)

---

## Core Principles

### 1. Always Use FMSResponse<T> Pattern

**MANDATORY**: ALL API responses MUST use the `FMSResponse<T>` wrapper for consistency.

⚠️ **IMPORTANT**: Do NOT use the deprecated `FMSResponseMessage<T>` records. Use `FMSResponse<T>` class instead.

```csharp
// ✅ CORRECT - Use FMSResponse<T> for all responses
public async Task<IActionResult> GetEmployee(int id)
{
    var result = await _mediator.Send(new GetEmployeeByIdQuery { Id = id });
    if (result.IsSuccess)
        return Ok(result);
    return BadRequest(result);
}

// ❌ DEPRECATED - Don't use FMSResponseMessage<T>
public async Task<IActionResult> GetEmployee(int id)
{
    var response = new FMSResponseMessage<EmployeeDto>(true, "Success", employee);
    return Ok(response);
}

// ❌ WRONG - Don't return raw data
public async Task<IActionResult> GetEmployee(int id)
{
    var employee = await _mediator.Send(new GetEmployeeByIdQuery { Id = id });
    return Ok(employee);
}
```

### Why FMSResponse<T> is Preferred:

1. **Rich Error Handling**: Built-in support for validation errors, error types, and structured error responses
2. **Consistency**: Standardized across the entire FMS system
3. **Extensibility**: Easy to add new properties and features
4. **Factory Methods**: Convenient static methods for creating responses
5. **Type Safety**: Strong typing with proper inheritance

### 2. Follow CQRS Pattern
- **Commands**: Write operations (POST, PUT, DELETE)
- **Queries**: Read operations (GET)
- Always use MediatR for handler dispatch

### 3. Consistent Naming Conventions
- Controllers: `[Resource]Controller` (e.g., `EmployeeController`)
- Actions: Use verb-noun pattern (e.g., `GetEmployee`, `CreateEmployee`)
- Routes: Use kebab-case for multi-word resources (e.g., `fuel-refill`)

---

## Response Handling (MANDATORY)

### Standard Response Structure
```csharp
public class FMSResponse<T> : FMSResponse
{
    public T Data { get; set; }
    public bool IsSuccess { get; set; }
    public string Message { get; set; }
    public List<string> ValidationErrors { get; set; }
    public ErrorType ErrorType { get; set; }
}
```

### Success Responses
```csharp
// Single item
return Ok(FMSResponse<EmployeeDto>.Success(employee, "Employee retrieved successfully"));

// List of items
return Ok(FMSResponse<List<EmployeeDto>>.Success(employees, "Employees retrieved successfully"));

// No content response
return NoContent(); // For successful DELETE operations
```

### Error Responses
```csharp
// Validation errors
return BadRequest(FMSResponse<EmployeeDto>.ValidationFailed(validationErrors));

// Not found
if (employee == null)
    return NotFound(FMSResponse<EmployeeDto>.Failed("Employee not found"));

// System errors
return StatusCode(500, FMSResponse<EmployeeDto>.SystemError("Internal server error"));
```

---

## Controller Structure

### Template Structure
```csharp
[ApiController]
[Route("api/[controller]")]
public class [Resource]Controller : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDistributedCache _cache;

    public [Resource]Controller(IMediator mediator, IDistributedCache cache)
    {
        _mediator = mediator;
        _cache = cache;
    }

    // Action methods here...
}
```

### Required Attributes
- `[ApiController]` - Enables automatic model validation
- `[Route("api/[controller]")]` - Standard routing pattern
- `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]` - On actions requiring auth

---

## HTTP Methods & Status Codes

### GET Requests
```csharp
[HttpGet]
public async Task<IActionResult> GetList([FromQuery] bool? active = true)
{
    // Implementation
    return Ok(result);
}

[HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    if (id <= 0) return BadRequest("Invalid ID");
    // Implementation
    if (result == null) return NotFound();
    return Ok(result);
}
```

**Status Codes:**
- `200 OK` - Successful retrieval
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid parameters

### POST Requests
```csharp
[HttpPost]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> Create([FromBody] ResourceDto dto)
{
    // Permission check
    var hasPermission = User.HasClaim("permissions", "_create[Resource]");
    if (!hasPermission) return Forbid();

    // Validation
    if (!ModelState.IsValid) return BadRequest(ModelState);

    // Get user ID
    var userIdClaim = GetUserIdClaim();
    if (userIdClaim == null) return BadRequest("Invalid User ID");

    dto.CreatedBy = userIdClaim.Value;

    var command = new Create[Resource]Command(dto);
    var result = await _mediator.Send(command);

    if (!result.IsSuccess) return BadRequest(result);
    return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, result);
}
```

**Status Codes:**
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation errors
- `403 Forbidden` - Insufficient permissions

### PUT Requests
```csharp
[HttpPut("{id}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> Update(int id, [FromBody] ResourceDto dto)
{
    var hasPermission = User.HasClaim("permissions", "_edit[Resource]");
    if (!hasPermission) return Forbid();

    if (!ModelState.IsValid) return BadRequest(ModelState);
    if (id <= 0) return BadRequest("Invalid ID");
    if (id != dto.Id) return BadRequest("ID mismatch");

    var userIdClaim = GetUserIdClaim();
    if (userIdClaim == null) return BadRequest("Invalid User ID");

    dto.ModifiedBy = userIdClaim.Value;

    var command = new Update[Resource]Command(id, dto);
    var result = await _mediator.Send(command);

    if (!result.IsSuccess) return BadRequest(result);
    return Ok(result);
}
```

**Status Codes:**
- `200 OK` - Resource updated successfully
- `400 Bad Request` - Validation errors or ID mismatch
- `404 Not Found` - Resource not found

### DELETE Requests
```csharp
[HttpDelete("{id}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> Delete(int id)
{
    var hasPermission = User.HasClaim("permissions", "_delete[Resource]");
    if (!hasPermission) return Forbid();

    if (id <= 0) return BadRequest("Invalid ID");

    var command = new Delete[Resource]Command(id);
    var result = await _mediator.Send(command);

    if (!result.IsSuccess) return BadRequest(result);
    return NoContent();
}
```

**Status Codes:**
- `204 No Content` - Resource deleted successfully
- `404 Not Found` - Resource not found
- `400 Bad Request` - Invalid ID

---

## Authentication & Authorization

### Permission-Based Authorization Pattern
```csharp
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> ActionName()
{
    // Check specific permission
    var hasPermission = User.HasClaim("permissions", "_[action][Resource]");
    if (!hasPermission) return Forbid();

    // Action implementation
}
```

### User ID Extraction Helper
```csharp
private Claim GetUserIdClaim()
{
    return User.Claims.FirstOrDefault(c =>
        c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
        Guid.TryParse(c.Value, out _));
}
```

### Permission Naming Convention
- `_create[Resource]` - Create permissions
- `_read[Resource]` - Read permissions
- `_edit[Resource]` - Update permissions
- `_delete[Resource]` - Delete permissions

---

## Input Validation

### Model State Validation
```csharp
public async Task<IActionResult> Create([FromBody] ResourceDto dto)
{
    if (!ModelState.IsValid)
    {
        var errors = ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .ToList();
        return BadRequest(FMSResponse<ResourceDto>.ValidationFailed(errors));
    }

    // Continue with processing
}
```

### Parameter Validation
```csharp
public async Task<IActionResult> GetById(int id)
{
    if (id <= 0)
        return BadRequest(FMSResponse<ResourceDto>.Failed("Invalid ID"));

    // Continue with processing
}

public async Task<IActionResult> Update(int id, [FromBody] ResourceDto dto)
{
    if (id != dto.Id)
        return BadRequest(FMSResponse<ResourceDto>.Failed("ID mismatch"));

    // Continue with processing
}
```

### Query Parameter Validation
```csharp
public async Task<IActionResult> Search([FromQuery] string searchTerm)
{
    if (string.IsNullOrWhiteSpace(searchTerm))
        return BadRequest(FMSResponse.FailedResponse("Search term is required"));

    if (searchTerm.Length < 2)
        return BadRequest(FMSResponse.FailedResponse("Search term must be at least 2 characters long"));

    // Continue with processing
}
```

---

## Error Handling

### Consistent Error Response Structure
```csharp
try
{
    // Action logic
    return Ok(result);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error in {Action}", nameof(ActionName));
    return StatusCode(500, FMSResponse.SystemError("An error occurred while processing your request"));
}
```

### Specific Error Types
```csharp
// Validation errors
return BadRequest(FMSResponse<T>.ValidationFailed(validationErrors));

// Business logic errors
return BadRequest(FMSResponse<T>.Failed("Business rule violation"));

// System errors
return StatusCode(500, FMSResponse<T>.SystemError("Internal server error"));

// Network/Device errors
return StatusCode(502, FMSResponse<T>.DeviceError("Device communication failed"));
```

---

## Caching Strategies

### Read Operations with Caching
```csharp
[HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    if (id <= 0) return BadRequest("Invalid ID");

    // Try cache first
    var cacheKey = $"{nameof(Resource)}:{id}";
    var cachedData = await _cache.GetStringAsync(cacheKey);

    if (!string.IsNullOrEmpty(cachedData))
    {
        var cachedResult = JsonSerializer.Deserialize<FMSResponse<ResourceDto>>(cachedData);
        return Ok(cachedResult);
    }

    // Query from database
    var result = await _mediator.Send(new GetResourceByIdQuery { Id = id });

    if (!result.IsSuccess) return BadRequest(result);
    if (result.Data == null) return NotFound();

    // Cache for 30 minutes
    var cacheOptions = new DistributedCacheEntryOptions
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
    };
    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);

    return Ok(result);
}
```

### Search Results Caching
```csharp
[HttpGet("search")]
public async Task<IActionResult> Search([FromQuery] SearchParams searchParams)
{
    var cacheKey = $"{nameof(Resource)}Search_{searchParams.GetHashCode()}";
    var cached = await _cache.GetStringAsync(cacheKey);

    if (!string.IsNullOrEmpty(cached))
    {
        var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<ResourceDto>>>(cached);
        return Ok(cachedResult);
    }

    var result = await _mediator.Send(new SearchResourceQuery(searchParams));

    if (result.IsSuccess)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) // Shorter cache for search
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options);
    }

    return Ok(result);
}
```

### Cache Invalidation on Updates
```csharp
[HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] ResourceDto dto)
{
    // ... validation and update logic ...

    var result = await _mediator.Send(command);

    if (result.IsSuccess)
    {
        // Invalidate cache
        var cacheKey = $"{nameof(Resource)}:{id}";
        await _cache.RemoveAsync(cacheKey);

        // Optionally invalidate related search caches
        await InvalidateSearchCaches();
    }

    return Ok(result);
}
```

---

## Search & Filtering

### Standard Search Endpoint
```csharp
[HttpGet("search")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> Search(
    [FromQuery] string searchTerm,
    [FromQuery] int? limit = 50,
    [FromQuery] bool? active = true,
    [FromQuery] int? categoryId = null)
{
    try
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return BadRequest(FMSResponse.FailedResponse("Search term is required"));

        var query = new SearchResourceQuery
        {
            SearchTerm = searchTerm,
            Limit = limit,
            Active = active,
            CategoryId = categoryId
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error searching {Resource}", nameof(Resource));
        return StatusCode(500, FMSResponse.SystemError("Error performing search"));
    }
}
```

### Quick Search for Autocomplete
```csharp
[HttpGet("quick-search")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> QuickSearch(
    [FromQuery] string searchTerm,
    [FromQuery] int limit = 10)
{
    if (string.IsNullOrWhiteSpace(searchTerm))
        return BadRequest(FMSResponse.FailedResponse("Search term is required"));

    if (searchTerm.Length < 2)
        return BadRequest(FMSResponse.FailedResponse("Search term must be at least 2 characters long"));

    // Shorter cache time for quick search
    var cacheKey = $"{nameof(Resource)}QuickSearch_{searchTerm}_{limit}";
    var cached = await _cache.GetStringAsync(cacheKey);

    if (!string.IsNullOrEmpty(cached))
    {
        var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<ResourceDto>>>(cached);
        return Ok(cachedResult);
    }

    var result = await _mediator.Send(new QuickSearchResourceQuery
    {
        SearchTerm = searchTerm,
        Limit = limit
    });

    if (result.IsSuccess)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options);
    }

    return Ok(result);
}
```

---

## Pagination

### Standard Pagination Pattern
```csharp
[HttpGet]
public async Task<IActionResult> GetList(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50,
    [FromQuery] bool? active = true,
    [FromQuery] string? sortBy = null,
    [FromQuery] string? sortDirection = "asc")
{
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 1000) pageSize = 50;

    var query = new GetResourceListQuery
    {
        Page = page,
        PageSize = pageSize,
        Active = active,
        SortBy = sortBy,
        SortDirection = sortDirection
    };

    var result = await _mediator.Send(query);
    return Ok(result);
}
```

### Skip/Take Pagination (Alternative)
```csharp
[HttpGet]
public async Task<IActionResult> GetList(
    [FromQuery] int take = 100,
    [FromQuery] int skip = 0,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null)
{
    if (take < 1 || take > 1000) take = 100;
    if (skip < 0) skip = 0;

    var query = new GetResourceListQuery(take, skip, startDate, endDate);
    var result = await _mediator.Send(query);
    return Ok(result);
}
```

---

## Advanced Patterns

### 1. Action-Based Endpoints (State Transitions)

For resources that require state transitions beyond CRUD, use action-based endpoints with clear naming:

```csharp
// ✅ CORRECT - Action-based endpoints for alarm operations
[HttpPost("{id}/acknowledge")]
public async Task<IActionResult> AcknowledgeAlarm(int id, [FromBody] AcknowledgeAlarmRequest request)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
    var alarm = await _service.AcknowledgeAlarmAsync(id, userId, request.Notes);

    if (alarm == null)
        return NotFound(new { success = false, message = "Active alarm not found" });

    return Ok(new ActiveAlarmResponse
    {
        Success = true,
        Message = "Alarm acknowledged successfully",
        ActiveAlarm = alarm
    });
}

[HttpPost("{id}/resolve")]
public async Task<IActionResult> ResolveAlarm(int id, [FromBody] ResolveAlarmRequest request)
{
    // Implementation similar to acknowledge
}

[HttpPost("{id}/escalate")]
public async Task<IActionResult> EscalateAlarm(int id)
{
    // Implementation for escalation
}
```

### 2. Bulk Operations

For operations that need to handle multiple items:

```csharp
[HttpPost("bulk-acknowledge")]
public async Task<IActionResult> BulkAcknowledgeAlarms([FromBody] BulkAcknowledgeRequest request)
{
    try
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
        var count = await _service.BulkAcknowledgeAlarmsAsync(request.AlarmIds, userId, request.Notes);

        return Ok(new {
            success = true,
            message = $"Successfully acknowledged {count} alarms",
            acknowledgedCount = count
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error bulk acknowledging alarms");
        return StatusCode(500, new { success = false, message = "Failed to bulk acknowledge alarms" });
    }
}
```

### 3. Statistics and Aggregation Endpoints

Separate endpoints for summary/statistical data:

```csharp
[HttpGet("statistics")]
public async Task<IActionResult> GetAlarmStatistics([FromQuery] int? siteId = null)
{
    try
    {
        var statistics = await _service.GetAlarmStatisticsAsync(siteId);
        return Ok(new { success = true, data = statistics });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving alarm statistics");
        return StatusCode(500, new { success = false, message = "Failed to retrieve alarm statistics" });
    }
}
```

### 4. Nested Resource Management

For managing relationships between resources:

```csharp
// Assigning rules to resources
[HttpPost("rulesets/{ruleSetId}/assign/{tagId}")]
public async Task<IActionResult> AssignRuleSetToTag(int ruleSetId, int tagId)
{
    try
    {
        var result = await _mediator.Send(new AssignFuelingRuleSetToTagCommand(tagId, ruleSetId));
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error assigning rule set to tag");
        return StatusCode(500, "Internal server error");
    }
}

// Creating nested resources
[HttpPost("rulesets/{ruleSetId}/dailymonthly")]
public async Task<IActionResult> CreateDailyMonthlyRule(int ruleSetId, [FromBody] CreateDailyMonthlyLimitRuleCommand command)
{
    if (ruleSetId != command.RuleSetId)
        return BadRequest("RuleSet ID mismatch");

    var result = await _mediator.Send(command);
    if (!result.Success)
        return BadRequest(result);
    return Ok(result);
}
```

### 5. Testing and Development Endpoints

Include dedicated endpoints for testing (with appropriate security):

```csharp
[HttpPost("test")]
public async Task<IActionResult> CreateTestAlarm([FromBody] CreateActiveAlarmRequest request)
{
    try
    {
        var userId = GetUserId();

        // Override fields for test data
        request.TriggerSource = "Manual";
        request.TriggeredBy = userId;
        request.AlarmType = $"Test_{request.AlarmType}";
        request.Description = $"[TEST ALARM] {request.Description}";

        var activeAlarm = await _service.CreateActiveAlarmAsync(request);

        return Ok(new ActiveAlarmResponse {
            Success = true,
            Message = "Test alarm created successfully",
            ActiveAlarm = activeAlarm
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating test alarm");
        return StatusCode(500, new ActiveAlarmResponse {
            Success = false,
            Message = "Failed to create test alarm"
        });
    }
}
```

### 6. Administrative Operations

Use role-based authorization for admin operations:

```csharp
[HttpPost("process-auto-resolve")]
[Authorize(Roles = "Administrator,SystemAdmin")]
public async Task<IActionResult> ProcessAutoResolveAlarms()
{
    try
    {
        var count = await _service.ProcessAutoResolveAlarmsAsync();
        return Ok(new {
            success = true,
            message = $"Auto-resolved {count} alarms",
            resolvedCount = count
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error processing auto-resolve alarms");
        return StatusCode(500, new { success = false, message = "Failed to process auto-resolve alarms" });
    }
}
```

### 7. Flexible Response Patterns

Handle mixed response types based on your system's needs:

```csharp
// Option 1: FMSResponse wrapper (PREFERRED for consistency)
var result = await _mediator.Send(command);
if (!result.Success)
    return BadRequest(result);
return Ok(result);

// Option 2: Anonymous objects for simple operations (acceptable for specific cases)
return Ok(new {
    success = true,
    data = alarms,
    count = alarms.Count
});

// Option 3: Custom response DTOs for complex operations
return Ok(new ActiveAlarmResponse {
    Success = true,
    Message = "Operation completed successfully",
    ActiveAlarm = alarm
});
```

### 8. Cancellation Token Support

Always support cancellation for long-running operations:

```csharp
public async Task<IActionResult> GetActiveAlarms(
    [FromQuery] int? siteId = null,
    [FromQuery] string? alarmType = null,
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null,
    [FromQuery] int skip = 0,
    [FromQuery] int take = 50,
    CancellationToken cancellationToken = default)
{
    try
    {
        var alarms = await _service.GetActiveAlarmsAsync(
            siteId, alarmType, null, null, fromDate, toDate, skip, take, cancellationToken);

        return Ok(new {
            success = true,
            data = alarms,
            count = alarms.Count
        });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error retrieving active alarms");
        return StatusCode(500, new { success = false, message = "Failed to retrieve active alarms" });
    }
}
```

### 9. Custom Route Patterns

Use custom routes for better API organization:

```csharp
[ApiController]
[Route("api/active-alarms")]  // Custom route instead of [controller]
public class ActiveAlarmController : ControllerBase
{
    // Actions here
}

[Route("api/[controller]")]   // Standard pattern
public class FuelingRuleController : ControllerBase
{
    // Nested resource routes
    [HttpPost("rulesets/{ruleSetId}/timewindow")]
    [HttpPut("rules/timewindow/{ruleId}")]
    [HttpDelete("rules/timewindow/{ruleId}")]
}
```

### 10. Comprehensive Error Context

Provide meaningful error context with structured logging:

```csharp
try
{
    var result = await _mediator.Send(command);
    return Ok(result);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error creating {ResourceType} for user {UserId}",
        nameof(Resource), GetUserId());
    return StatusCode(500, new {
        success = false,
        message = "Failed to create resource",
        errorId = Guid.NewGuid().ToString(), // For tracking
        timestamp = DateTime.UtcNow
    });
}
```

---

## Performance & Security

### Performance Best Practices
1. **Use Caching Strategically**
   - Cache frequently accessed read-only data
   - Use appropriate cache expiration times
   - Invalidate cache on data changes

2. **Implement Pagination**
   - Always limit result sets
   - Use skip/take or page-based pagination
   - Set maximum page size limits

3. **Optimize Database Queries**
   - Use projections to select only needed fields
   - Implement proper indexing
   - Avoid N+1 query problems

### Security Best Practices
1. **Input Validation**
   - Validate all input parameters
   - Use model validation attributes
   - Sanitize search terms

2. **Authentication & Authorization**
   - Always check permissions
   - Validate JWT tokens
   - Use principle of least privilege

3. **Error Information**
   - Don't expose sensitive system information
   - Log detailed errors server-side
   - Return generic error messages to clients

---

## Code Examples

### Complete Controller Example
```csharp
[ApiController]
[Route("api/[controller]")]
public class VehicleController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IDistributedCache _cache;
    private readonly ILogger<VehicleController> _logger;

    public VehicleController(IMediator mediator, IDistributedCache cache, ILogger<VehicleController> logger)
    {
        _mediator = mediator;
        _cache = cache;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetVehicles([FromQuery] bool? active = true)
    {
        try
        {
            var hasPermission = User.HasClaim("permissions", "_readVehicle");
            if (!hasPermission) return Forbid();

            var query = new GetVehiclesQuery(active ?? true);
            var result = await _mediator.Send(query);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicles");
            return StatusCode(500, FMSResponse.SystemError("Error retrieving vehicles"));
        }
    }

    [HttpGet("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> GetVehicle(int id)
    {
        try
        {
            var hasPermission = User.HasClaim("permissions", "_readVehicle");
            if (!hasPermission) return Forbid();

            if (id <= 0) return BadRequest(FMSResponse<VehicleDto>.Failed("Invalid vehicle ID"));

            var cacheKey = $"Vehicle:{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedResult = JsonSerializer.Deserialize<FMSResponse<VehicleDto>>(cachedData);
                return Ok(cachedResult);
            }

            var query = new GetVehicleByIdQuery { Id = id };
            var result = await _mediator.Send(query);

            if (!result.IsSuccess) return BadRequest(result);
            if (result.Data == null) return NotFound(FMSResponse<VehicleDto>.Failed("Vehicle not found"));

            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions);

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle {VehicleId}", id);
            return StatusCode(500, FMSResponse<VehicleDto>.SystemError("Error retrieving vehicle"));
        }
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> CreateVehicle([FromBody] VehicleDto vehicleDto)
    {
        try
        {
            var hasPermission = User.HasClaim("permissions", "_createVehicle");
            if (!hasPermission) return Forbid();

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(FMSResponse<VehicleDto>.ValidationFailed(errors));
            }

            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
                Guid.TryParse(c.Value, out _));

            if (userIdClaim == null)
                return BadRequest(FMSResponse<VehicleDto>.Failed("Invalid User ID"));

            vehicleDto.CreatedBy = userIdClaim.Value;

            var command = new CreateVehicleCommand(vehicleDto);
            var result = await _mediator.Send(command);

            if (!result.IsSuccess) return BadRequest(result);

            return CreatedAtAction(nameof(GetVehicle), new { id = result.Data.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle");
            return StatusCode(500, FMSResponse<VehicleDto>.SystemError("Error creating vehicle"));
        }
    }
}
```

### Common Helper Methods
```csharp
public abstract class BaseController : ControllerBase
{
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

---

## Checklist for AI Agents

When creating or reviewing REST API controllers, ensure:

### ✅ Advanced Patterns
- [ ] Action-based endpoints for state transitions
- [ ] Bulk operations for multiple items
- [ ] Statistics/aggregation endpoints
- [ ] Nested resource management
- [ ] Administrative operation authorization
- [ ] Cancellation token support
- [ ] Custom route patterns where appropriate
- [ ] Comprehensive error context with tracking IDs

### ✅ Response Handling
- [ ] All responses use `FMSResponse<T>` wrapper
- [ ] Proper success and error responses
- [ ] Consistent error types and messages

### ✅ Authentication & Authorization
- [ ] JWT authentication on protected endpoints
- [ ] Permission checks using Claims
- [ ] User ID extraction for audit fields

### ✅ Input Validation
- [ ] Model state validation
- [ ] Parameter validation (ID checks, null checks)
- [ ] Query parameter validation

### ✅ HTTP Methods & Status Codes
- [ ] Correct HTTP methods used
- [ ] Appropriate status codes returned
- [ ] RESTful endpoint design

### ✅ Error Handling
- [ ] Try-catch blocks for exception handling
- [ ] Proper logging of errors
- [ ] User-friendly error messages

### ✅ Performance
- [ ] Caching implemented for read operations
- [ ] Pagination for list endpoints
- [ ] Cache invalidation on updates

### ✅ Security
- [ ] Input sanitization
- [ ] No sensitive data in error responses
- [ ] Rate limiting considerations

### ✅ Code Quality
- [ ] Consistent naming conventions
- [ ] Proper dependency injection
- [ ] CQRS pattern followed
- [ ] Logging implemented

---

## Common Patterns Reference

### Action Endpoint Patterns
```
/{id}/acknowledge        // State transition actions
/{id}/resolve           // State transition actions
/{id}/escalate          // State transition actions
/{id}/suppress          // State transition actions
/bulk-acknowledge       // Bulk operations
/statistics            // Aggregation endpoints
/test                  // Testing endpoints
/process-auto-resolve  // Administrative operations
```

### Nested Resource Patterns
```
/rulesets/{ruleSetId}/assign/{tagId}           // Assignment operations
/rulesets/{ruleSetId}/dailymonthly            // Creating nested resources
/rulesets/{ruleSetId}/timewindow              // Creating nested resources
/rules/timewindow/{ruleId}                    // Managing specific rule types
```

### Alternative User ID Extraction Methods
Based on your controllers, there are multiple patterns for user ID extraction:

```csharp
// Method 1: ClaimTypes.NameIdentifier (Preferred for new code)
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";

// Method 2: Specific claim type with validation (Your current standard)
var userIdClaim = User.Claims.FirstOrDefault(c =>
    c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
    Guid.TryParse(c.Value, out _));
var userId = userIdClaim?.Value;

// Method 3: Identity name fallback
var userId = User?.Identity?.Name ?? "system";
```

### Mixed Response Pattern Handling

Your system uses different response patterns depending on the context:

```csharp
// Pattern 1: FMSResponse wrapper (PREFERRED for business operations)
var result = await _mediator.Send(command);
if (!result.Success)
    return BadRequest(result);
return Ok(result);

// Pattern 2: Custom response DTOs (for specific workflows like alarms)
return Ok(new ActiveAlarmResponse {
    Success = true,
    Message = "Alarm acknowledged successfully",
    ActiveAlarm = alarm
});

// Pattern 3: Anonymous objects (for simple operations and statistics)
return Ok(new {
    success = true,
    data = statistics,
    count = statistics.Count
});

// Pattern 4: Direct string returns (for simple confirmations)
return Ok("Rule set deleted successfully");
```

### Permission Names
```
_create[Resource]   // Create permissions
_read[Resource]     // Read permissions
_edit[Resource]     // Update permissions
_delete[Resource]   // Delete permissions
```

### Cache Key Patterns
```
[Resource]:{id}                           // Single item
[Resource]Search_{searchTerm}_{params}    // Search results
[Resource]List_{params}                   // List results
```

### HTTP Status Code Usage
```
200 OK              // Successful GET, PUT
201 Created         // Successful POST
204 No Content      // Successful DELETE
400 Bad Request     // Validation errors, invalid input
401 Unauthorized    // Missing or invalid authentication
403 Forbidden       // Insufficient permissions
404 Not Found       // Resource not found
500 Internal Error  // System errors
```

This guide should be followed consistently across all API controllers in the FMS system to ensure maintainability, security, and user experience.

---

## Frontend API Integration Best Practices

### 1. Service Layer vs Redux Actions Pattern

Based on your codebase analysis, you have two patterns:

**🎯 RECOMMENDED: Service Layer Pattern** (like `dashboardService.js`)

```javascript
// ✅ PREFERRED - Service Layer Pattern
class VehicleService {
  async getVehicles() {
    try {
      const response = await axiosInstance.get('/vehicle');

      // Handle FMSResponse<T> pattern
      if (response.data?.isSuccess !== false) {
        return {
          success: true,
          data: response.data?.data || response.data,
          message: response.data?.message || 'Success'
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Operation failed',
          validationErrors: response.data?.validationErrors || []
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        errorType: error.response?.data?.errorType || 'Network'
      };
    }
  }
}
```

**⚠️ LEGACY: Redux Actions Pattern** (like `vehicleActions.js`)

```javascript
// ⚠️ LEGACY - Redux Actions (maintain for existing code)
export const fetchVehicleList = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get('/vehicle');
    dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: FETCH_VEHICLES_FAILURE, payload: error.message });
    throw error;
  }
};
```

### 2. Why Service Layer is Preferred

**Benefits of Service Layer:**
1. **Cleaner Separation**: API logic separated from state management
2. **Easier Testing**: Services can be mocked independently
3. **Better Error Handling**: Centralized error processing
4. **Reusability**: Services can be used across different components
5. **Consistent Response Format**: Standardized response handling
6. **FMSResponse Integration**: Better handling of backend response patterns

**When to Use Redux Actions:**
- Legacy code that already uses this pattern
- Complex state management scenarios
- When you need global state updates from API calls

### 3. Standardized Response Handling

**Frontend Service Response Format:**
```javascript
// Standard service response format
{
  success: boolean,
  data: any,           // The actual data payload
  message: string,     // Success/error message
  validationErrors?: string[],  // Validation errors if any
  errorType?: string   // Error type from FMSResponse
}
```

**FMSResponse Integration:**
```javascript
// Handle FMSResponse<T> from backend
function handleFMSResponse(response) {
  const { data } = response;

  return {
    success: data?.isSuccess !== false,
    data: data?.data,
    message: data?.message || (data?.isSuccess ? 'Success' : 'Operation failed'),
    validationErrors: data?.validationErrors || [],
    errorType: data?.errorType
  };
}
```

### 4. API Versioning Strategy

**🎯 RECOMMENDED: URL Versioning**

```javascript
// Backend Controller Routes
[Route("api/v1/[controller]")]   // Version 1
[Route("api/v2/[controller]")]   // Version 2

// Frontend Service Configuration
const API_VERSIONS = {
  v1: '/api/v1',
  v2: '/api/v2',
  current: '/api/v1'  // Default version
};

class BaseService {
  constructor(version = 'current') {
    this.basePath = API_VERSIONS[version];
  }
}
```

**Version Management Implementation:**
```javascript
// axiosInstance configuration
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://localhost:7243',
  headers: {
    'Content-Type': 'application/json',
    'API-Version': 'v1'  // Version header
  }
});

// Version-specific service classes
class VehicleServiceV1 extends BaseService {
  constructor() {
    super('v1');
  }

  async getVehicles() {
    const response = await axiosInstance.get(`${this.basePath}/vehicle`);
    return this.handleResponse(response);
  }
}

class VehicleServiceV2 extends BaseService {
  constructor() {
    super('v2');
  }

  async getVehicles() {
    const response = await axiosInstance.get(`${this.basePath}/vehicle`);
    return this.handleResponseV2(response);
  }
}
```

### 5. Migration Strategy

**Phase 1: Standardize New Development**
```javascript
// ✅ All new features use Service Layer
export class NewFeatureService {
  async getData() {
    try {
      const response = await axiosInstance.get('/new-feature');
      return this.handleFMSResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  handleFMSResponse(response) {
    const { data } = response;
    return {
      success: data?.isSuccess !== false,
      data: data?.data,
      message: data?.message || 'Success',
      validationErrors: data?.validationErrors || [],
      errorType: data?.errorType
    };
  }

  handleError(error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      errorType: error.response?.data?.errorType || 'Network'
    };
  }
}
```

**Phase 2: Gradual Migration**
```javascript
// ⚠️ Maintain existing Redux actions but add service wrapper
export const fetchVehicleListV2 = () => async (dispatch) => {
  try {
    const result = await vehicleService.getVehicles();
    if (result.success) {
      dispatch({ type: FETCH_VEHICLES_SUCCESS, payload: result.data });
    } else {
      dispatch({ type: FETCH_VEHICLES_FAILURE, payload: result.message });
    }
    return result;
  } catch (error) {
    dispatch({ type: FETCH_VEHICLES_FAILURE, payload: error.message });
    return { success: false, message: error.message };
  }
};
```

### 6. Error Handling Best Practices

**Centralized Error Handler:**
```javascript
class APIErrorHandler {
  static handle(error, context = {}) {
    const errorResponse = {
      success: false,
      message: 'An error occurred',
      errorType: 'Unknown',
      context
    };

    if (error.response) {
      // Server responded with error
      const { data, status } = error.response;
      errorResponse.message = data?.message || `HTTP ${status} Error`;
      errorResponse.errorType = data?.errorType || 'Server';
      errorResponse.validationErrors = data?.validationErrors;
      errorResponse.httpStatus = status;
    } else if (error.request) {
      // Network error
      errorResponse.message = 'Network error - please check your connection';
      errorResponse.errorType = 'Network';
    } else {
      // Other error
      errorResponse.message = error.message || 'Unknown error occurred';
      errorResponse.errorType = 'Client';
    }

    console.error('API Error:', errorResponse);
    return errorResponse;
  }
}
```

### 7. Service Base Class Template

**Base Service Implementation:**
```javascript
import axiosInstance from '../api/axiosInstance';
import APIErrorHandler from './APIErrorHandler';

export class BaseService {
  constructor(basePath, version = 'v1') {
    this.basePath = basePath;
    this.version = version;
  }

  async get(endpoint, params = {}) {
    try {
      const response = await axiosInstance.get(`/api/${this.version}${this.basePath}${endpoint}`, { params });
      return this.handleFMSResponse(response);
    } catch (error) {
      return APIErrorHandler.handle(error, { endpoint, method: 'GET' });
    }
  }

  async post(endpoint, data) {
    try {
      const response = await axiosInstance.post(`/api/${this.version}${this.basePath}${endpoint}`, data);
      return this.handleFMSResponse(response);
    } catch (error) {
      return APIErrorHandler.handle(error, { endpoint, method: 'POST' });
    }
  }

  async put(endpoint, data) {
    try {
      const response = await axiosInstance.put(`/api/${this.version}${this.basePath}${endpoint}`, data);
      return this.handleFMSResponse(response);
    } catch (error) {
      return APIErrorHandler.handle(error, { endpoint, method: 'PUT' });
    }
  }

  async delete(endpoint) {
    try {
      const response = await axiosInstance.delete(`/api/${this.version}${this.basePath}${endpoint}`);
      return this.handleFMSResponse(response);
    } catch (error) {
      return APIErrorHandler.handle(error, { endpoint, method: 'DELETE' });
    }
  }

  handleFMSResponse(response) {
    const { data } = response;

    // Handle FMSResponse<T> pattern
    if (data && typeof data === 'object' && 'isSuccess' in data) {
      return {
        success: data.isSuccess,
        data: data.data,
        message: data.message || (data.isSuccess ? 'Success' : 'Operation failed'),
        validationErrors: data.validationErrors || [],
        errorType: data.errorType
      };
    }

    // Handle direct data response (fallback)
    return {
      success: true,
      data: data,
      message: 'Success'
    };
  }
}
```

### 8. Version-Aware Service Factory

```javascript
class ServiceFactory {
  static createService(serviceName, version = 'v1') {
    const services = {
      vehicle: {
        v1: () => new VehicleServiceV1(),
        v2: () => new VehicleServiceV2()
      },
      dashboard: {
        v1: () => new DashboardServiceV1(),
        v2: () => new DashboardServiceV2()
      }
    };

    const serviceVersions = services[serviceName];
    if (!serviceVersions || !serviceVersions[version]) {
      throw new Error(`Service ${serviceName} version ${version} not found`);
    }

    return serviceVersions[version]();
  }
}

// Usage
const vehicleService = ServiceFactory.createService('vehicle', 'v1');
const dashboardService = ServiceFactory.createService('dashboard', 'v2');
```

### 9. Frontend Integration Checklist

When creating or reviewing frontend API integration, ensure:

#### ✅ Service Layer Patterns
- [ ] New features use Service Layer pattern
- [ ] Services extend BaseService class
- [ ] Consistent error handling across all services
- [ ] FMSResponse integration properly implemented

#### ✅ Error Handling
- [ ] Centralized error handling using APIErrorHandler
- [ ] Proper error context and logging
- [ ] User-friendly error messages
- [ ] Network error handling

#### ✅ Response Standardization
- [ ] All services return consistent response format
- [ ] Success/failure states properly handled
- [ ] Validation errors properly extracted
- [ ] Error types mapped correctly

#### ✅ Versioning
- [ ] API version specified in requests
- [ ] Version-aware service factory implemented
- [ ] Graceful handling of version mismatches
- [ ] Migration strategy for version updates

#### ✅ Redux Integration (Legacy)
- [ ] Redux actions wrapped with service calls
- [ ] State properly updated on service responses
- [ ] Error states handled in reducers
- [ ] Loading states managed appropriately

#### ✅ Performance
- [ ] Proper caching at service level
- [ ] Request deduplication where appropriate
- [ ] Timeout handling implemented
- [ ] Loading states managed efficiently

### 10. Migration Timeline

**Immediate Actions:**
1. Create BaseService class and APIErrorHandler
2. Implement ServiceFactory for version management
3. Start using Service Layer for all new features

**Short Term (1-2 months):**
1. Wrap existing Redux actions with service calls
2. Standardize error handling across existing components
3. Implement API versioning infrastructure

**Long Term (3-6 months):**
1. Gradually migrate Redux actions to Service Layer
2. Remove direct axiosInstance usage from components
3. Implement comprehensive caching strategy

---

## Complete Integration Example

### Backend Controller (Following this guide)
```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class VehicleController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetVehicles([FromQuery] bool? active = true)
    {
        var result = await _mediator.Send(new GetVehiclesQuery(active ?? true));
        return Ok(result); // Returns FMSResponse<List<VehicleDto>>
    }
}
```

### Frontend Service (Following this guide)
```javascript
class VehicleService extends BaseService {
  constructor() {
    super('/vehicle');
  }

  async getVehicles(active = true) {
    return await this.get('', { active });
  }
}
```

### Frontend Component Usage
```javascript
import { VehicleService } from '../services/VehicleService';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vehicleService = new VehicleService();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const result = await vehicleService.getVehicles();
      if (result.success) {
        setVehicles(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {vehicles.map(vehicle => (
        <div key={vehicle.id}>{vehicle.name}</div>
      ))}
    </div>
  );
};
```

This comprehensive guide ensures consistent API development and integration across both backend and frontend components of the FMS system.