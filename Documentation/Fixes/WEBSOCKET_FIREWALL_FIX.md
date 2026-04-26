# WebSocket Connection Fix - Windows Firewall

## Problem
WebSocket connections to SignalR fail with "connection could not be found on server" even though:
- ✅ Port 7009 is TCP accessible
- ✅ HTTP negotiate endpoints work (return 401 Unauthorized)
- ✅ Backend is running and hubs are registered
- ❌ WebSocket upgrade fails

## Root Cause
**Windows Firewall is blocking WebSocket connections** on port 7009.

The negotiate endpoint works because it's HTTP, but when SignalR tries to upgrade to WebSocket protocol, Windows Firewall blocks the connection.

## Solution

### Step 1: Enable Transport Fallback (COMPLETED)
Modified `ptsSignalRService.js` to allow LongPolling fallback:
```javascript
transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
```

This allows the connection to fall back to LongPolling if WebSocket is blocked.

### Step 2: Configure Windows Firewall

**On the production server (10.0.10.153), run as Administrator:**

```powershell
# Navigate to scripts directory
cd c:\dev\Tenacy.FMS

# Run the firewall configuration script
.\scripts\firewall\enable-websocket-port-7009.ps1
```

This script will:
1. Create inbound TCP rule for port 7009
2. Create outbound TCP rule for port 7009
3. Verify the rules are enabled

### Step 3: Rebuild and Deploy Frontend

**On development machine or production server:**

```powershell
# Rebuild frontend with transport fallback
cd c:\dev\Tenacy.FMS\fms.frontend
npm run build

# Deploy to production
Copy-Item -Path "build\*" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" -Recurse -Force
```

### Step 4: Restart Services (Optional)

If issues persist after firewall configuration:

```powershell
# Restart IIS
iisreset

# Or restart specific app pool
Restart-WebAppPool -Name "tenacyFMS"

# Restart FMS backend service
Get-Process | Where-Object { $_.Name -like "*FMS*" } | Stop-Process -Force
# Then start the service again from Services console or Visual Studio
```

### Step 5: Verify Connection

**In browser console:**
```javascript
// Test raw WebSocket
ws = new WebSocket('ws://10.0.10.153:7009/ptsHub');
ws.onopen = () => console.log('✓ WebSocket connected');
ws.onerror = (e) => console.error('✗ WebSocket error:', e);
```

**Check SignalR logs:**
Look for messages like:
- `[PTS SignalR] Connected successfully via WebSockets`
- Or: `[PTS SignalR] Connected successfully via LongPolling` (if WebSocket blocked)

## Diagnostics

Run the diagnostic script to check all components:

```powershell
cd c:\dev\Tenacy.FMS
.\scripts\diagnostics\test-signalr-connectivity.ps1
```

This checks:
1. TCP port connectivity
2. HTTP API health
3. SignalR negotiate endpoints (all three hubs)
4. Windows Firewall rules
5. Running processes

## Expected Behavior After Fix

### If WebSocket Works:
```
[PTS SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
[PTS SignalR] Connecting to: http://10.0.10.153:7009/ptsHub
[PTS SignalR] Using authentication token
[PTS SignalR] Connected successfully via WebSockets
```

### If WebSocket Blocked (LongPolling Fallback):
```
[PTS SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
[PTS SignalR] Connecting to: http://10.0.10.153:7009/ptsHub
[PTS SignalR] Using authentication token
[PTS SignalR] WebSocket failed, trying LongPolling...
[PTS SignalR] Connected successfully via LongPolling
```

## Alternative: Use IIS on Port 80 (NOT RECOMMENDED)

If you cannot modify Windows Firewall, you could:
1. Install IIS WebSocket Protocol feature
2. Configure IIS URL Rewrite to proxy WebSocket connections
3. Use http://10.0.10.153 (port 80) instead of port 7009

**However, this is NOT recommended because:**
- IIS WebSocket proxying is complex and error-prone
- LongPolling fallback works fine for most scenarios
- Port 7009 direct connection has better performance

## Troubleshooting

### WebSocket Still Fails After Firewall Fix
1. Check antivirus software (may block WebSocket)
2. Check network firewall/router between client and server
3. Verify CORS allows the origin (should already be configured)
4. Check backend logs for authorization errors

### LongPolling Works But WebSocket Doesn't
This is expected if firewall blocks WebSocket. LongPolling is a valid fallback and will work fine.

### Neither WebSocket Nor LongPolling Works
1. Check if JWT token is valid
2. Verify user has permissions for the hub
3. Check backend logs for authorization failures
4. Run diagnostic script to verify all endpoints

## Files Modified

- `fms.frontend/src/signalR/ptsSignalRService.js` - Added LongPolling fallback
- `scripts/firewall/enable-websocket-port-7009.ps1` - New firewall configuration script
- `scripts/diagnostics/test-signalr-connectivity.ps1` - New diagnostic script

## References

- SignalR Transport Documentation: https://docs.microsoft.com/en-us/aspnet/core/signalr/configuration
- Windows Firewall for WebSockets: https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-firewall/
