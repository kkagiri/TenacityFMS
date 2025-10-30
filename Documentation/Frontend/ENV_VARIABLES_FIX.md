# Environment Variables Fix - Missing /api Suffix

## Problem

Login and other API calls were failing with **404 Not Found** errors:

```
POST http://10.0.10.153:7009/v1/User/Login [HTTP/1.1 404 Not Found]
```

The URL was missing the `/api` prefix. It should have been:

```
POST http://10.0.10.153:7009/api/v1/User/Login
```

## Root Cause

All environment variable URLs in `.env` files were missing the `/api/` suffix:

**Before (WRONG):**

```bash
REACT_APP_API_URL=http://10.0.10.153:7009
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009
```

**After (CORRECT):**

```bash
REACT_APP_API_URL=http://10.0.10.153:7009/api
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009/api
```

## How axiosInstance Works

1. `axiosInstance` reads `REACT_APP_API_URL` (or other variants) as the `baseURL`
2. The request interceptor auto-prepends `v1/` to URLs that don't have it
3. Final URL = `baseURL` + `v1/` + `endpoint`

**Example:**

- Environment: `REACT_APP_API_URL=http://10.0.10.153:7009/api`
- Request: `axiosInstance.post('/User/Login', ...)`
- Interceptor transforms to: `v1/User/Login`
- Final URL: `http://10.0.10.153:7009/api/v1/User/Login` ✅

**Without /api (broken):**

- Environment: `REACT_APP_API_URL=http://10.0.10.153:7009`
- Final URL: `http://10.0.10.153:7009/v1/User/Login` ❌ (404)

## What Was Fixed

Updated all three `.env` files:

### 1. `.env` (standard build)

```bash
# API URLs - Added /api suffix
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009/api
REACT_APP_API_URL=http://10.0.10.153:7009/api
REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_FMS_API_URL_DEV=http://10.0.11.90:7009/api
REACT_APP_FMS_API_URL_PROD=http://10.0.10.153:7009/api

# SignalR URL - NO /api suffix (connects directly to hub)
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
```

### 2. `.env.development`

```bash
# API URLs - Added /api suffix
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://105.160.12.217:7009/api
REACT_APP_API_URL=http://10.0.10.153:7009/api
REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api

# SignalR URL - NO /api suffix
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
```

### 3. `.env.production`

```bash
# API URLs - Added /api suffix
REACT_APP_PRIVATE_FMS_API_URL=http://10.0.10.153:7009/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227:7009/api
REACT_APP_API_URL=http://10.0.10.153:7009/api
REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api

# SignalR URL - NO /api suffix
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
```

## Important: API vs SignalR URLs

### API URLs - MUST have `/api` suffix

All REST API calls go through `/api/v1/*` routes:

- ✅ `http://10.0.10.153:7009/api` → becomes `http://10.0.10.153:7009/api/v1/User/Login`

### SignalR URLs - NO `/api` suffix

SignalR hubs connect directly to hub endpoints (not under `/api`):

- ✅ `http://10.0.10.153:7009` → becomes `http://10.0.10.153:7009/ptsHub`
- ❌ `http://10.0.10.153:7009/api` → becomes `http://10.0.10.153:7009/api/ptsHub` (wrong!)

## Backend Routes

For reference, the backend routes are:

```csharp
// UserController.cs
[ApiController]
[Route("api/v1/[controller]")]  // → /api/v1/User
public class UserController : ControllerBase
{
    [HttpPost("Login")]  // → /api/v1/User/Login
    [AllowAnonymous]
    public async Task<ActionResult> Login(LoginCommand command)
    {
        // ...
    }
}
```

SignalR hubs are registered directly:

```csharp
// Program.cs or Startup.cs
endpoints.MapHub<PTSHub>("/ptsHub");           // → ws://host:7009/ptsHub
endpoints.MapHub<DashboardHub>("/dashboardHub"); // → ws://host:7009/dashboardHub
endpoints.MapHub<FrontEndHub>("/frontendHub");  // → ws://host:7009/frontendHub
```

## Next Steps

1. **Rebuild the frontend** to bake in the corrected environment variables:

   ```powershell
   cd c:\dev\Hyoung.FMS\fms.frontend
   npm run build
   ```

2. **Deploy to IIS**:

   ```powershell
   # Option 1: Use deployment script
   .\scripts\deploy-frontend.ps1

   # Option 2: Manual copy
   Copy-Item -Path "c:\dev\Hyoung.FMS\fms.frontend\build\*" `
             -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp\" `
             -Recurse -Force
   ```

3. **Test login**:

   - Navigate to `http://10.0.10.153`
   - Try logging in with valid credentials
   - Check browser console (F12) - should see successful login
   - Network tab should show: `POST http://10.0.10.153:7009/api/v1/User/Login [200 OK]`

4. **Verify SignalR connections**:
   - Console should show override messages:
     ```
     [PTS SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
     [Dashboard SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
     [Business SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
     ```
   - Network tab should show WebSocket connections:
     ```
     ws://10.0.10.153:7009/ptsHub [101 Switching Protocols]
     ws://10.0.10.153:7009/dashboardHub [101 Switching Protocols]
     ws://10.0.10.153:7009/frontendHub [101 Switching Protocols]
     ```

## Files Modified

- `fms.frontend/.env`
- `fms.frontend/.env.development`
- `fms.frontend/.env.production`

## Related Issues Fixed

This fix also ensures:

- All REST API calls work correctly (not just login)
- Health checks resolve to correct endpoint
- API base URL resolution works as expected
- No 404 errors on any `/api/v1/*` routes

## Verification Checklist

After rebuild and deploy:

- [ ] Login works (no 404)
- [ ] Browser console shows correct API base URL with `/api`
- [ ] SignalR connections show port 7009 (not port 80)
- [ ] WebSocket upgrade succeeds (101 Switching Protocols, not 404)
- [ ] Dashboard loads data
- [ ] PTS devices show online status
- [ ] No errors in browser console
