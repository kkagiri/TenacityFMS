# SignalR WebSocket Connection Solution

## Problem Summary

Devices visible in **development** but not in **production** on the same server.

## Root Cause

**IIS WebSocket Protocol feature was not installed**, preventing WebSocket connections from being proxied through IIS.

## Symptoms

- ✅ Dev environment works (direct Kestrel connection on port 7009)
- ❌ Production fails with: `can't establish connection to ws://10.0.10.153:7009/dashboardHub`
- ❌ Browser console shows WebSocket connection failures
- ✅ HTTP API calls work fine
- ✅ SignalR negotiate endpoint returns 200 OK with connectionId

## The Fix

### Step 1: Install IIS WebSocket Protocol Feature

```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
```

### Step 2: Restart IIS

```powershell
iisreset
```

### Step 3: Verify Installation

```powershell
Get-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
```

**Expected output:**

```
FeatureName : IIS-WebSockets
State       : Enabled
```

## Why This Was Required

### IIS URL Rewrite Limitation

IIS URL Rewrite can proxy HTTP requests but **cannot proxy WebSocket upgrade requests** without the WebSocket Protocol feature installed.

**What happens:**

1. SignalR client sends HTTP POST to `/dashboardHub/negotiate` → ✅ Works (regular HTTP)
2. IIS proxies negotiate to Kestrel on port 7009 → ✅ Works
3. SignalR client attempts WebSocket upgrade → ❌ **Blocked by IIS without WebSocket feature**
4. IIS cannot complete the WebSocket handshake → Connection fails

### Dev vs Production Difference

**Development (10.0.11.90):**

- Frontend connects **directly** to `http://10.0.11.90:7009` (Kestrel)
- No IIS in the middle
- WebSocket works immediately

**Production (10.0.10.153):**

- Frontend connects through **IIS on port 80** which proxies to Kestrel on port 7009
- IIS needs WebSocket Protocol feature to proxy WebSocket connections
- Without feature: negotiate works, WebSocket upgrade fails

## Additional Fixes Applied

### 1. Windows Firewall Rules

Created inbound/outbound rules for port 7009:

```powershell
.\scripts\firewall\enable-websocket-port-7009.ps1
```

### 2. Environment Variables

Fixed `.env` files to use correct URLs:

```bash
# API URLs - WITH /api suffix
REACT_APP_API_URL=http://10.0.10.153:7009/api

# SignalR URL - WITHOUT /api suffix
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
```

### 3. Transport Fallback

Enabled LongPolling fallback in case WebSocket fails:

```javascript
transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling;
```

## Verification Steps

### Test 1: Check IIS WebSocket Feature

```powershell
Get-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
```

### Test 2: Test WebSocket in Browser Console

```javascript
ws = new WebSocket("ws://10.0.10.153:7009/ptsHub");
ws.onopen = () => console.log("✓ WebSocket CONNECTED!");
ws.onerror = (e) => console.error("✗ WebSocket ERROR:", e);
```

**Expected:** `✓ WebSocket CONNECTED!`

### Test 3: Check SignalR Connection Logs

Open browser console and look for:

```
[PTS SignalR] Using REACT_APP_SIGNALR_URL override: http://10.0.10.153:7009
[PTS SignalR] Connecting to: http://10.0.10.153:7009/ptsHub
[PTS SignalR] Connected successfully via WebSockets
```

### Test 4: Verify Devices Online

1. Open dashboard
2. Check device status - should show online devices
3. Verify device count matches backend

## Alternative Solution (If IIS WebSocket Installation Fails)

If you cannot install IIS WebSocket feature, use **direct Kestrel connection**:

### Option A: Change Frontend to Use Port 7009 Directly

```bash
# In .env files
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
REACT_APP_API_URL=http://10.0.10.153:7009/api
```

Then rebuild and deploy.

### Option B: Use LongPolling Transport Only

```javascript
// In SignalR services, force LongPolling
transport: HttpTransportType.LongPolling;
```

**Note:** LongPolling works through IIS URL Rewrite without WebSocket feature, but has higher latency and server load.

## Files Modified During Fix

1. `fms.frontend/.env` - Added REACT_APP_SIGNALR_URL
2. `fms.frontend/.env.development` - Added REACT_APP_SIGNALR_URL
3. `fms.frontend/.env.production` - Added REACT_APP_SIGNALR_URL
4. `fms.frontend/src/signalR/ptsSignalRService.js` - Added transport fallback
5. `fms.frontend/src/signalR/dashboardSignalRService.js` - Prioritize REACT_APP_SIGNALR_URL
6. `fms.frontend/src/signalR/businessSignalRService.js` - Prioritize REACT_APP_SIGNALR_URL
7. `scripts/firewall/enable-websocket-port-7009.ps1` - New firewall configuration script

## Server Configuration

### IIS Site: tenacyFMS

- **Physical Path:** `c:\inetpub\wwwroot\tenacyFMS\reactApp\`
- **Binding:** Port 80 (HTTP)
- **Features Required:**
  - IIS-WebSockets ✅
  - IIS-URLRewrite (ARR) ✅

### Backend: FMS.WebClient

- **Port:** 7009 (Kestrel)
- **Protocol:** HTTP with WebSocket upgrade support
- **SignalR Hubs:**
  - `/ptsHub` - PTS device connections
  - `/dashboardHub` - Dashboard metrics
  - `/frontendHub` - Business data (tank stock, alarms)

### Firewall Rules

- **Inbound:** TCP port 7009 allowed
- **Outbound:** TCP port 7009 allowed

## Troubleshooting

### WebSocket Still Fails After Installing Feature

**Check 1: Verify IIS Module**

```powershell
Get-WebGlobalModule | Where-Object { $_.Name -like "*WebSocket*" }
```

**Check 2: Restart Application Pool**

```powershell
Restart-WebAppPool -Name "tenacyFMS"
```

**Check 3: Check Backend Logs**

```powershell
Get-Content "C:\Logs\FMS.Webclient\*.log" -Tail 100 | Select-String "WebSocket|SignalR"
```

**Check 4: Test Direct Connection**
Bypass IIS and connect directly to port 7009:

```javascript
ws = new WebSocket("ws://10.0.10.153:7009/ptsHub");
```

If this works but port 80 doesn't, IIS configuration is the issue.

### Negotiate Works But WebSocket Fails

This is the exact symptom we had. Solution:

1. Install IIS-WebSockets feature
2. Restart IIS
3. Clear browser cache
4. Test again

### All Transports Fail

**Check authentication:**

```javascript
// Get JWT token from localStorage
const token = localStorage.getItem("authToken");
console.log("Token:", token ? "Present" : "Missing");
```

**Check CORS:**

```powershell
# In backend logs, look for CORS errors
Get-Content "C:\Logs\FMS.Webclient\*.log" -Tail 100 | Select-String "CORS"
```

## Success Criteria

After applying the fix, you should see:

✅ IIS WebSocket feature installed and enabled
✅ IIS restarted successfully
✅ Browser console shows SignalR connected via WebSockets
✅ Devices show online in dashboard
✅ Real-time updates work (device status changes reflected immediately)
✅ No WebSocket connection errors in console

## Date Fixed

October 30, 2025

## Key Takeaway

**Always install IIS-WebSockets feature when using IIS to proxy SignalR WebSocket connections.**
