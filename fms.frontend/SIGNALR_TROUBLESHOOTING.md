# SignalR Connection Troubleshooting Guide

## Issue: LongPolling Still Disabled After Fix

### Symptoms
```
ERROR: 'LongPolling' is disabled by the client
```

### Root Cause
Browser is using **cached bundle.js** from before the transport configuration fix.

---

## Solution Steps

### 1. ✅ Verify Source Code (Already Fixed)

Check `src/signalR/ptsSignalRService.js`:

**Line 1-6: Import Statement**
```javascript
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
  HttpTransportType,  // Must be present ✅
} from "@microsoft/signalr";
```

**Line 148-152: Transport Configuration**
```javascript
transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,  // Must use HttpTransportType ✅
```

---

### 2. 🔄 Clear Browser Cache

#### Chrome/Edge (Recommended)
1. Open DevTools: `F12`
2. Right-click the refresh button (while DevTools open)
3. Select **"Empty Cache and Hard Reload"**

#### Alternative: Keyboard Shortcuts
- **Windows**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

#### Manual Cache Clear
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Close and reopen browser

---

### 3. 🔨 Rebuild Application

#### Stop Dev Server
```powershell
# In the terminal running npm start
# Press Ctrl+C to stop
```

#### Clear Node Cache (if needed)
```powershell
cd "c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend"
Remove-Item -Recurse -Force node_modules\.cache
```

#### Restart Dev Server
```powershell
npm start
```

#### Wait for Compilation
Look for this message:
```
Compiled successfully!
You can now view fms.frontend in the browser.
```

---

### 4. 🌐 Check Network Tab

1. Open DevTools → **Network** tab
2. Refresh page
3. Look for `bundle.js` request
4. Check **Size** column:
   - Should say **"(disk cache)"** initially
   - After hard refresh: Should show actual file size (e.g., "2.4 MB")

---

### 5. ✅ Verify Fix Loaded

Open DevTools **Console** and run:

```javascript
// Check if HttpTransportType is imported
console.log('Bundle loaded at:', new Date().toISOString());

// Force check the ptsSignalRService connection
ptsSignalRService.getConnectionStatus();
```

Expected output:
```
[PTS SignalR] Starting connection attempt (ID: xxxxx)...
[PTS SignalR] Connecting to: http://localhost:7009/ptsHub
[PTS SignalR] Connected successfully ✅
```

---

## Advanced Troubleshooting

### Check Backend Server Running

```powershell
# Test if backend is accessible
Invoke-WebRequest -Uri "http://localhost:7009/api/health" -Method GET
```

Expected: `200 OK` response

---

### Check SignalR Hub Endpoint

```powershell
# Test SignalR hub endpoint
Invoke-WebRequest -Uri "http://localhost:7009/ptsHub" -Method GET
```

Expected: Should negotiate SignalR connection

---

### Verify Environment Variables

Open DevTools Console:
```javascript
console.log('API URL:', process.env.REACT_APP_API_URL);
console.log('SignalR URL:', process.env.REACT_APP_SIGNALR_URL);
```

Expected output:
```
API URL: http://localhost:7009/api
SignalR URL: http://localhost:7009
```

If `undefined`, check your `.env` file:
```env
REACT_APP_API_URL=http://localhost:7009/api
REACT_APP_SIGNALR_URL=http://localhost:7009
```

---

### Check Authentication Token

```javascript
const token = localStorage.getItem('token');
console.log('Token present:', !!token);
console.log('Token preview:', token?.slice(0, 20) + '...');
```

If no token:
1. Navigate to login page
2. Log in again
3. Try connecting again

---

### Inspect Bundle Source

In DevTools **Sources** tab:
1. Navigate to `webpack://` → `src/signalR/ptsSignalRService.js`
2. Find line 150-152
3. Verify it shows:
   ```javascript
   transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
   ```

If it still shows `transport: 1`, the bundle hasn't reloaded.

---

### Manual Bundle Check

Search in bundle for the old code:

**DevTools Console:**
```javascript
fetch('/static/js/bundle.js')
  .then(r => r.text())
  .then(text => {
    const hasOldCode = text.includes('transport:1') || text.includes('transport: 1');
    const hasNewCode = text.includes('HttpTransportType.WebSockets') && text.includes('HttpTransportType.LongPolling');
    console.log('Old code present:', hasOldCode);
    console.log('New code present:', hasNewCode);
  });
```

Expected:
```
Old code present: false
New code present: true
```

---

## Still Not Working?

### Nuclear Option: Complete Cache Clear

```powershell
# Stop dev server (Ctrl+C)

# Clear all caches
cd "c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend"
Remove-Item -Recurse -Force node_modules\.cache
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force .cache

# Restart
npm start
```

In browser:
1. Close ALL browser windows
2. Reopen browser
3. `Ctrl + Shift + Delete` → Clear ALL cached data
4. Navigate to `http://localhost:3000`

---

## Backend Configuration Check

### Verify SignalR Hubs Registered

Check `FMS.WebClient/Extensions/FmsApplicationBuilderExtensions.cs`:

Should have:
```csharp
endpoints.MapHub<PTSHub>("/ptsHub")
    .RequireAuthorization()
    .RequireCors(corsPolicy);
```

### Verify WebSockets Enabled

Should have:
```csharp
var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
};
app.UseWebSockets(webSocketOptions);
```

### Verify SignalR Service Added

Check `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`:

Should have:
```csharp
services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400000;
});
```

---

## Success Indicators

### Console Output (Good)
```
[PTS SignalR] Starting connection attempt (ID: abc123)...
[PTS SignalR] Connecting to: http://localhost:7009/ptsHub
[PTS SignalR] Using authentication token
[PTS SignalR] State: connecting
[PTS SignalR] Connected successfully (ID: abc123) ✅
[PTS SignalR] State: connected
[PTS SignalR] Health check result: Healthy
```

### Console Output (Bad)
```
❌ ERROR: 'LongPolling' is disabled by the client
❌ ERROR: WebSocket failed to connect
```

If you see bad output, **bundle is not updated** → Hard refresh again

---

## Network Tab Analysis

### Successful Connection
1. Initial `negotiate` request → 200 OK
2. WebSocket upgrade → 101 Switching Protocols
3. Or: Repeated POST requests (LongPolling fallback) → 200 OK

### Failed Connection
1. Initial `negotiate` request → 401 Unauthorized (auth issue)
2. WebSocket upgrade → 404 Not Found (hub not found)
3. Or: 502 Bad Gateway (backend down)

---

## Port Conflicts

Check if port 7009 is in use:

```powershell
netstat -ano | findstr :7009
```

If nothing appears, backend may not be running.

---

## CORS Issues

If you see CORS errors in console:

### Backend Must Allow Frontend Origin

Check `appsettings.Development.json`:
```json
{
  "AllowedOrigins": "http://localhost:3000"
}
```

### CORS Policy Must Include SignalR Hubs

In `FmsApplicationBuilderExtensions.cs`:
```csharp
endpoints.MapHub<PTSHub>("/ptsHub")
    .RequireCors(corsPolicy);  // Must have this
```

---

## Final Checklist

- [ ] Source code shows `HttpTransportType.WebSockets | HttpTransportType.LongPolling`
- [ ] Dev server restarted
- [ ] Browser cache cleared (hard refresh)
- [ ] Bundle.js reloaded (check Network tab size)
- [ ] Backend server running on port 7009
- [ ] Authentication token present in localStorage
- [ ] Console shows "Connected successfully"
- [ ] No CORS errors in console
- [ ] Network tab shows successful negotiate request

---

## Contact for Support

If all else fails:
1. Share **full console output** (including stack traces)
2. Share **Network tab** screenshot (filter: ptsHub)
3. Share **Sources** tab view of `ptsSignalRService.js` line 150

---

**Last Updated**: October 4, 2025  
**Status**: Source code fix applied ✅  
**Next**: Clear cache and hard refresh browser
