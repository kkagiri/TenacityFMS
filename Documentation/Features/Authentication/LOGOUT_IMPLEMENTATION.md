# Logout Implementation - Production Best Practices

## Overview
This document explains the proper logout implementation in the FMS system and production best practices for secure session termination.

---

## 🎯 What Production Logout Should Do

### 1. **Client-Side Cleanup** ✅

**Special Handling for Active Fueling:**
- Check for active FullTank mode fueling processes
  - FullTank = No preset volume/price (runs until manually stopped)
  - Fixed volume/price fueling completes automatically (no intervention needed)
- Warn user if FullTank fueling is active
- Send stop commands to pumps if user confirms logout
- Only FullTank mode requires intervention during logout

**Standard Cleanup:**
- Remove JWT authentication token
- Clear Redux state (user, navigation, permissions)
- Clear user-specific localStorage data
- Disconnect real-time connections (SignalR/WebSocket)
- Clear any cached data
- Redirect to login page

### 2. **Server-Side Cleanup** ⚠️ (TODO)
- Invalidate/blacklist the JWT token
- Log logout event for security auditing
- Invalidate refresh tokens (if using refresh token pattern)
- Track active sessions
- Clean up server-side session data

### 3. **Security Considerations**
- Force logout on token expiration (401 errors)
- Implement session timeout
- Clear sensitive data from memory
- Prevent back button access after logout
- Log security events

---

## 📁 Current Implementation

### Files Modified:
1. **`fms.frontend/src/redux/actions/AuthActions.js`**
   - Enhanced `logout()` action with comprehensive cleanup
   - Added SignalR disconnection
   - Added localStorage cleanup
   - Added forced redirect to login

2. **`fms.frontend/src/services/domain/AuthenticationService.js`**
   - Enhanced `signOut()` method with production patterns
   - Added structured cleanup process
   - Added logging for debugging

### What Gets Cleared:

```javascript
// Authentication
localStorage.removeItem('token');

// User-specific data
localStorage.removeItem('fms_dashboard_layouts');
localStorage.removeItem('fms_layout_settings');
localStorage.removeItem('dashboard_widgetConfig');
localStorage.removeItem('dashboard_todayFuelBaseline');
localStorage.removeItem('selectedSite');
localStorage.removeItem('selectedPeriod');
localStorage.removeItem('issueTrackerSavedFilters');
localStorage.removeItem('currentUser');

// Redux state cleared via LOGOUT action
dispatch({ type: LOGOUT });

// SignalR connections
await dashboardSignalRService.disconnect();
await ptsSignalRService.disconnect();
```

---

## 🔄 Logout Flow

### Standard Logout (No Active Fueling)

```
User clicks "Logout"
    ↓
1. Check for active FullTank fueling → None found
    ↓
2. Disconnect SignalR connections
    ↓
3. Remove JWT token from localStorage
    ↓
4. Clear user-specific localStorage data
    ↓
5. Dispatch LOGOUT action to Redux
   ├─ authReducer → Clear user, token, isAuthenticated
   └─ navigationReducer → Clear navigation items
    ↓
6. [Optional] Call backend logout endpoint
    ↓
7. Redirect to /login page (force reload)
    ↓
User sees login page
```

### Logout With Active FullTank Fueling

```
User clicks "Logout"
    ↓
1. Check for active FullTank fueling
    ↓
2. Found active fueling process(es)
    ├─ Pump 3, Nozzle 1 - Diesel
    └─ Pump 5, Nozzle 2 - Petrol
    ↓
3. Show confirmation dialog:
   ⚠️ Active Fueling Alert

   There are 2 active fueling processes:
   • Pump 3, Nozzle 1 - Diesel
   • Pump 5, Nozzle 2 - Petrol

   Logging out will TERMINATE these fueling processes.
   Do you want to proceed?
    ↓
4. User Response:
   ├─ [Cancel] → Logout cancelled, return to app
   └─ [OK] → Continue with forced logout
       ↓
   5. Send stop commands to pumps (if connected)
       ├─ StopPump(3)
       └─ StopPump(5)
       ↓
   6. Wait 500ms for pump response
       ↓
   7. Disconnect SignalR connections
       ↓
   8. Clear token & user data
       ↓
   9. Redirect to login
```

### Why Only FullTank Mode?

**FullTank Mode:**
- User hasn't specified volume or price
- Fueling continues until user manually stops it
- System cannot determine when fueling will end
- **Requires intervention during logout**

**Fixed Volume/Price Mode:**
- User specified exact amount (e.g., 50 liters or $100)
- Pump automatically stops when target reached
- Has a predetermined end point
- **No intervention needed - will complete on its own**

---

## 🛡️ Security Best Practices

### ✅ Currently Implemented:
1. **Token Removal**: JWT token removed from localStorage
2. **State Cleanup**: Redux state cleared
3. **Connection Cleanup**: SignalR disconnected
4. **Cache Cleanup**: User-specific data cleared
5. **Forced Redirect**: User redirected to login page
6. **Graceful Failure**: Logout completes even if some steps fail

### ⚠️ TODO - Backend Implementation:

#### Create Backend Logout Endpoint
```csharp
// FMS.WebClient/Controllers/UserController.cs
[HttpPost("logout")]
[Authorize]
public async Task<IActionResult> Logout()
{
    try
    {
        // Get current user from JWT
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Log logout event
        _logger.LogInformation($"User {userId} logged out at {DateTime.UtcNow}");

        // Optional: Blacklist the token
        // await _tokenBlacklistService.BlacklistTokenAsync(token);

        // Optional: Clear server-side session
        // await _sessionService.ClearSessionAsync(userId);

        return Ok(FMSResponse<bool>.Success(true, "Logged out successfully"));
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Logout error");
        return StatusCode(500, FMSResponse<bool>.Failure("Logout failed"));
    }
}
```

#### JWT Token Blacklist Service
```csharp
// For JWT token invalidation (since JWT is stateless)
public class TokenBlacklistService
{
    private readonly IDistributedCache _cache; // Redis cache

    public async Task BlacklistTokenAsync(string token, DateTime expiration)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = expiration
        };

        await _cache.SetStringAsync(
            $"blacklist:{token}",
            "true",
            options
        );
    }

    public async Task<bool> IsTokenBlacklistedAsync(string token)
    {
        var value = await _cache.GetStringAsync($"blacklist:{token}");
        return !string.IsNullOrEmpty(value);
    }
}
```

#### JWT Middleware Check
```csharp
// Add to JWT authentication middleware
public async Task Invoke(HttpContext context)
{
    var token = context.Request.Headers["Authorization"]
        .FirstOrDefault()?.Split(" ").Last();

    if (!string.IsNullOrEmpty(token))
    {
        // Check if token is blacklisted
        if (await _tokenBlacklistService.IsTokenBlacklistedAsync(token))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Token has been invalidated");
            return;
        }
    }

    await _next(context);
}
```

---

## 📊 Comparison Table

| Feature | Current Implementation | Production Best Practice | Status |
|---------|----------------------|-------------------------|---------|
| **Client-Side** |
| Remove JWT token | ✅ Yes | ✅ Required | ✅ Done |
| Clear Redux state | ✅ Yes | ✅ Required | ✅ Done |
| Clear localStorage | ✅ Yes | ✅ Required | ✅ Done |
| Disconnect SignalR | ✅ Yes | ✅ Required | ✅ Done |
| Redirect to login | ✅ Yes | ✅ Required | ✅ Done |
| Clear browser cache | ❌ No | ⚠️ Optional | 📝 Consider |
| **Server-Side** |
| Logout endpoint | ❌ No | ✅ Required | ⚠️ TODO |
| Token blacklist | ❌ No | ✅ Required | ⚠️ TODO |
| Session tracking | ❌ No | ✅ Required | ⚠️ TODO |
| Audit logging | ❌ No | ✅ Required | ⚠️ TODO |
| **Security** |
| Token expiration | ✅ Yes (JWT) | ✅ Required | ✅ Done |
| Auto-logout on 401 | ✅ Yes | ✅ Required | ✅ Done |
| Session timeout | ❌ No | ⚠️ Optional | 📝 Consider |
| Concurrent sessions | ❌ No control | ⚠️ Optional | 📝 Consider |

---

## 🚀 Usage Examples

### 1. Using Redux Action (Legacy)
```javascript
import { logout } from '../../redux/actions/AuthActions';
import { useDispatch } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    // Will automatically redirect to login
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

### 2. Using Authentication Service (Preferred)
```javascript
import serviceFactory from '../../services/core/ServiceFactory';

const MyComponent = () => {
  const authService = serviceFactory.getAuthenticationService();

  const handleLogout = async () => {
    const result = await authService.signOut();

    if (result.success) {
      console.log('Logged out successfully');
      window.location.href = '/login';
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

### 3. Using useAuth Hook (Modern)
```javascript
import { useAuth } from '../../hooks/useAuth';

const MyComponent = () => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // Hook handles redirect
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

---

## 🔍 Debugging Logout Issues

### Common Issues:

#### 1. User not redirected after logout
**Cause**: React Router might prevent navigation
**Solution**: Use `window.location.href = '/login'` for forced reload

#### 2. User data still visible after logout
**Cause**: Redux state not cleared or cached components
**Solution**: Ensure LOGOUT action is dispatched and force page reload

#### 3. SignalR errors after logout
**Cause**: Connections not properly disconnected
**Solution**: Wait for SignalR disconnect before clearing token

#### 4. 401 errors in console after logout
**Cause**: Pending API calls trying to complete
**Solution**: Cancel pending requests or ignore 401s during logout

### Debug Logging:
```javascript
// Enable detailed logout logging
localStorage.setItem('FMS_LOG_LEVEL', 'DEBUG');

// Watch logout process
// Check browser console for:
// 🔓 Starting logout process...
// 📡 Disconnecting SignalR connections...
// ✅ Token removed
// ✅ Redux state cleared
// 🔓 Logout completed successfully
```

---

## 📋 Testing Checklist

### Manual Testing:
- [ ] Click logout button - redirects to login page
- [ ] No user data visible after logout
- [ ] Cannot access protected routes after logout
- [ ] Back button doesn't show protected content
- [ ] SignalR connections are closed
- [ ] No API calls after logout (check Network tab)
- [ ] localStorage cleared properly
- [ ] Redux DevTools shows cleared state
- [ ] Can login again successfully

### Automated Testing:
```javascript
// Test logout functionality
describe('Logout', () => {
  it('should clear all user data', async () => {
    await authService.signOut();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('fms_dashboard_layouts')).toBeNull();
    // ... test other cleared items
  });

  it('should disconnect SignalR', async () => {
    const disconnectSpy = jest.spyOn(dashboardSignalRService, 'disconnect');
    await authService.signOut();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('should redirect to login', async () => {
    await authService.signOut();
    expect(window.location.href).toContain('/login');
  });
});
```

---

## 🎓 Additional Recommendations

### 1. Session Timeout (Idle Logout)
```javascript
// Implement automatic logout after inactivity
import { useIdleTimer } from 'react-idle-timer';

const App = () => {
  const handleIdle = () => {
    console.log('User inactive, logging out...');
    dispatch(logout());
  };

  useIdleTimer({
    timeout: 1000 * 60 * 30, // 30 minutes
    onIdle: handleIdle,
    debounce: 500
  });
};
```

### 2. Logout on Token Expiration
```javascript
// Already implemented in axiosInstance.js
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired - auto logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Logout All Devices/Sessions
```javascript
// Backend endpoint to logout user from all devices
[HttpPost("logout-all")]
public async Task<IActionResult> LogoutAllSessions()
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    // Increment user's token version to invalidate all existing tokens
    await _userService.IncrementTokenVersionAsync(userId);

    // Log the event
    _logger.LogWarning($"User {userId} logged out from all devices");

    return Ok(FMSResponse<bool>.Success(true));
}
```

### 4. Logout Confirmation Dialog
```javascript
const handleLogout = () => {
  const confirmed = window.confirm(
    'Are you sure you want to logout? Any unsaved changes will be lost.'
  );

  if (confirmed) {
    dispatch(logout());
  }
};
```

---

## 📚 Related Documentation
- [Authentication Implementation](./AUTHENTICATION_IMPLEMENTATION.md)
- [JWT Token Management](./JWT_TOKEN_MANAGEMENT.md)
- [Session Management](./SESSION_MANAGEMENT.md)
- [Security Best Practices](../../Security/SECURITY_BEST_PRACTICES.md)

---

## 📅 Change Log
- **2025-10-13**: Enhanced logout with SignalR disconnection and localStorage cleanup
- **2025-10-13**: Added production-grade logout documentation
- **2025-10-13**: Identified need for backend logout endpoint

---

## 👥 Maintainers
- Frontend Team: Logout UI and client-side cleanup
- Backend Team: Server-side session management (TODO)
- Security Team: Token blacklist implementation (TODO)
