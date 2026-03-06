# Authorization Scheme Issue - Why [Authorize] Returns 404

## Problem Description

When using `[Authorize]` attribute on controllers without specifying the authentication scheme, API endpoints return 404 errors instead of proper authentication challenges.

## Root Cause

The issue occurs because:

1. **Authentication is properly configured** with JWT Bearer as the default scheme
2. **Authorization service was disabled** (commented out in `ConfigureAuthorization` method)
3. **No default authorization policy exists** to handle `[Authorize]` attributes

## Current Workaround

Controllers currently need to explicitly specify the authentication scheme:

```csharp
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class MyController : ControllerBase
{
    // Controller actions
}
```

## Proper Solutions

### Solution 1: Enable Authorization Service (Recommended)

Enable and configure the authorization service in `Program.cs`:

```csharp
static void ConfigureAuthorization (IServiceCollection services) {
    try {
        services.AddAuthorization(options =>
        {
            // Set default policy to require authentication with JWT Bearer
            options.DefaultPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .Build();

            // Configure additional policies
            options.AddPolicy(
                "RequireAdminRole",
                policy => policy.RequireRole("Admin")
                    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
            );
        });
    } catch (Exception ex) {
        // Error handling
    }
}
```

**Benefits:**
- Allows using simple `[Authorize]` attribute
- Provides consistent authorization behavior
- Enables policy-based authorization
- Proper error handling (401 instead of 404)

### Solution 2: Global Authorization Filter

Add a global authorization filter to `AddControllers()`:

```csharp
services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter(
        new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser()
            .Build()));
})
```

**Benefits:**
- Applies authorization globally
- Controllers don't need `[Authorize]` attributes
- Use `[AllowAnonymous]` for public endpoints

### Solution 3: Base Controller Class

Create a base controller with the authorization attribute:

```csharp
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[ApiController]
public abstract class AuthorizedApiController : ControllerBase
{
    // Common functionality
}

// Usage
public class MyController : AuthorizedApiController
{
    // Controller actions are automatically authorized
}
```

## Implementation Status

✅ **COMPLETED**: Authorization service has been enabled in `Program.cs` with proper default policy

## Next Steps

1. Test that `[Authorize]` now works without explicit scheme specification
2. Update existing controllers to remove explicit authentication schemes
3. Implement role-based policies as needed

## Authentication Flow

1. **Request arrives** with JWT token in Authorization header
2. **Authentication middleware** validates JWT token using configured scheme
3. **Authorization middleware** applies policies based on `[Authorize]` attributes
4. **Proper HTTP status codes**:
   - 401 Unauthorized (missing/invalid token)
   - 403 Forbidden (valid token but insufficient permissions)
   - 200 OK (authorized access)

## Security Considerations

- Always validate tokens server-side
- Use HTTPS in production
- Implement proper token expiration
- Consider refresh token strategy
- Log authentication failures for monitoring

## Related Files

- `FMS.WebClient/Program.cs` - Authentication and authorization configuration
- All controller files using `[Authorize]` attributes
- JWT token generation services
