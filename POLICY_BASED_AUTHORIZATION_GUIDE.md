# Policy-Based Authorization Guide

## Overview
This guide shows how to use the new policy-based authorization system instead of manual `User.HasClaim()` checks.

---

## ✅ Benefits of Policy-Based Authorization

1. **Cleaner Code** - No more `if (!User.HasClaim("permissions", "xxx")) return Forbid();`
2. **Centralized Logic** - All permission checks in one place
3. **Easier Testing** - Policies can be unit tested
4. **Better IntelliSense** - IDE autocomplete for policies
5. **DRY Principle** - Don't Repeat Yourself

---

## 🔧 How It Works

### **PermissionPolicyProvider.cs**
Dynamically creates authorization policies based on permission names.

```csharp
// When you use [Authorize(Policy = "Permission.TankStock.Read")]
// The policy provider automatically creates a policy that:
// 1. Requires authentication
// 2. Checks if user has "permissions" claim with value "TankStock.Read"
```

### **PermissionAuthorizationHandler.cs**
Handles the actual permission check:

```csharp
protected override Task HandleRequirementAsync(
    AuthorizationHandlerContext context,
    PermissionRequirement requirement)
{
    if (context.User.HasClaim("permissions", requirement.PermissionName))
    {
        context.Succeed(requirement);
    }
    return Task.CompletedTask;
}
```

---

## 📝 **Usage Examples**

### **Before (Manual Checks)**

```csharp
[HttpGet]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> GetTankStocks()
{
    // Manual permission check
    var hasPermission = User.HasClaim("permissions", "_Read_tankStock");
    if (!hasPermission)
    {
        return Forbid();
    }

    var result = await _mediator.Send(new GetTankStockListQuery());
    return Ok(result);
}

[HttpPost]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<IActionResult> CreateTankStock([FromBody] TankStockDTO tankStockDTO)
{
    var hasPermission = User.HasClaim("permissions", "_Create_tankStock");
    if (!hasPermission) return Forbid();

    // ... rest of code
}
```

### **After (Policy-Based)**

```csharp
// Read permission
[HttpGet]
[Authorize(Policy = "Permission._Read_tankStock")]
public async Task<IActionResult> GetTankStocks()
{
    // No manual check needed! Authorization handled by framework
    var result = await _mediator.Send(new GetTankStockListQuery());
    return Ok(result);
}

// Create permission
[HttpPost]
[Authorize(Policy = "Permission._Create_tankStock")]
public async Task<IActionResult> CreateTankStock([FromBody] TankStockDTO tankStockDTO)
{
    // Permission already checked by framework!
    var result = await _mediator.Send(new CreateTankStockCommand(tankStockDTO));
    return Ok(result);
}
```

---

## 🎯 **Recommended Permission Naming Convention**

### Current Naming (Inconsistent)
- TankStock: `_Read_tankStock`, `_Create_tankStock`, `_Update_tankStock`, `_Delete_tankStock`
- Employee: `_createEmployee`, `_readEmployee`, `_editEmployee`, `_deleteEmployee`

### Recommended Naming (Consistent)
Format: `{Module}.{Action}`

Examples:
- **TankStock Module**:
  - `TankStock.Read`
  - `TankStock.Create`
  - `TankStock.Update`
  - `TankStock.Delete`

- **Employee Module**:
  - `Employee.Read`
  - `Employee.Create`
  - `Employee.Update`
  - `Employee.Delete`

- **Pump Module**:
  - `Pump.Read`
  - `Pump.Control`
  - `Pump.Configure`

- **Reports Module**:
  - `Reports.View`
  - `Reports.Export`
  - `Reports.Generate`

### Benefits of Standardized Naming:
1. ✅ Predictable - Easy to guess permission name
2. ✅ Searchable - Find all permissions for a module
3. ✅ Maintainable - Clear pattern to follow
4. ✅ Professional - Industry standard format

---

## 🔄 **Migration Path**

### Option 1: Keep Current Names (No DB Changes)
Use existing permission names with policy system:

```csharp
[Authorize(Policy = "Permission._Read_tankStock")]
[Authorize(Policy = "Permission._readEmployee")]
```

**Pros:** No database changes needed
**Cons:** Inconsistent naming persists

### Option 2: Standardize Names (Recommended)
1. Run SQL migration to update permission names
2. Update code to use new names
3. Notify users to re-login to get fresh tokens

**SQL Migration Example:**
```sql
-- TankStock permissions
UPDATE Permissions SET Name = 'TankStock.Read' WHERE Name = '_Read_tankStock';
UPDATE Permissions SET Name = 'TankStock.Create' WHERE Name = '_Create_tankStock';
UPDATE Permissions SET Name = 'TankStock.Update' WHERE Name = '_Update_tankStock';
UPDATE Permissions SET Name = 'TankStock.Delete' WHERE Name = '_Delete_tankStock';

-- Employee permissions
UPDATE Permissions SET Name = 'Employee.Read' WHERE Name = '_readEmployee';
UPDATE Permissions SET Name = 'Employee.Create' WHERE Name = '_createEmployee';
UPDATE Permissions SET Name = 'Employee.Update' WHERE Name = '_editEmployee';
UPDATE Permissions SET Name = 'Employee.Delete' WHERE Name = '_deleteEmployee';
```

**Code Update:**
```csharp
[Authorize(Policy = "Permission.TankStock.Read")]
[Authorize(Policy = "Permission.Employee.Create")]
```

---

## 💡 **Advanced Usage**

### Multiple Permissions (OR logic)
Not directly supported, but you can create a custom policy:

```csharp
// In service registration
services.AddAuthorization(options =>
{
    options.AddPolicy("TankStockReadOrUpdate", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim("permissions", "TankStock.Read") ||
            context.User.HasClaim("permissions", "TankStock.Update")
        )
    );
});

// In controller
[Authorize(Policy = "TankStockReadOrUpdate")]
public async Task<IActionResult> ViewOrEditTankStock() { }
```

### Role-Based + Permission-Based
Combine roles and permissions:

```csharp
[Authorize(Roles = "Admin", Policy = "Permission.TankStock.Delete")]
public async Task<IActionResult> DeleteTankStock(int id)
{
    // Only Admins with TankStock.Delete permission can access
}
```

### Custom Authorization Attributes
Create reusable attributes:

```csharp
public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
    {
        Policy = $"Permission.{permission}";
    }
}

// Usage
[RequirePermission("TankStock.Read")]
public async Task<IActionResult> GetTankStocks() { }
```

---

## 🧪 **Testing**

### Unit Testing Policies
```csharp
[Fact]
public async Task TankStockRead_WithPermission_ReturnsSuccess()
{
    // Arrange
    var user = CreateUserWithPermission("TankStock.Read");
    var handler = new PermissionAuthorizationHandler();
    var requirement = new PermissionRequirement("TankStock.Read");
    var context = new AuthorizationHandlerContext(
        new[] { requirement }, user, null);

    // Act
    await handler.HandleAsync(context);

    // Assert
    Assert.True(context.HasSucceeded);
}
```

---

## 📊 **Performance Comparison**

| Aspect | Manual Checks | Policy-Based |
|--------|--------------|--------------|
| **Code Lines** | 3-5 per endpoint | 1 attribute |
| **Maintainability** | Low | High |
| **Performance** | Same | Same |
| **Testability** | Harder | Easier |
| **Code Duplication** | High | Low |

---

## 🚀 **Next Steps**

1. ✅ Policy provider registered (DONE)
2. ✅ Example controller created (THIS FILE)
3. ⏳ Decide on naming convention (Current or Standardized)
4. ⏳ Refactor existing controllers
5. ⏳ Update frontend permission checks

---

## 📚 **References**

- **ASP.NET Core Authorization**: https://learn.microsoft.com/en-us/aspnet/core/security/authorization/
- **Policy-Based Authorization**: https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies
- **Custom Policy Providers**: https://learn.microsoft.com/en-us/aspnet/core/security/authorization/iauthorizationpolicyprovider

---

**Created:** 2025-11-23
**Status:** Ready for Implementation
