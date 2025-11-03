# SignalR External Connection - Quick Fix Summary

## 🚨 Problem Statement

**Current Issue**: SignalR WebSocket connections fail from external networks

- **Error**: `404 Not Found` and `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED`
- **Failed URL**: `ws://10.0.10.153:7009/ptsHub?id=...`
- **Public IP**: 197.254.33.227
- **Internal IP**: 10.0.10.153
- **Status**: ✅ Works on dev machine | ❌ Fails on external networks

---

## 🔍 Root Cause

Your production build was created with **internal IP hardcoded** into the JavaScript bundle:

```html
<!-- Current (WRONG) -->
<meta name="x-api-url" content="http://10.0.10.153:7009/api" />

<!-- Should be (CORRECT) -->
<meta name="x-api-url" content="http://197.254.33.227/api" />
```

**Why this causes the problem:**

1. SignalR negotiate endpoint returns this internal IP to clients
2. External clients try to connect to `ws://10.0.10.153:7009/ptsHub`
3. External network cannot route to internal IP `10.0.10.153`
4. Connection fails with 404

---

## ✅ IMMEDIATE FIX (30 Minutes)

Follow these steps on your production server:

### Step 1: Run Diagnostics (5 minutes)

```powershell
# Run on production server as Administrator
cd C:\dev\Hyoung.FMS\Documentation\Frontend
.\SIGNALR_DIAGNOSTICS.ps1
```

This will tell you:

- ✓ What's currently wrong
- ✓ What needs to be fixed
- ✓ Current configuration status

### Step 2: Update Environment Variables (2 minutes)

Edit `C:\dev\Hyoung.FMS\fms.frontend\.env.production`:

```bash
# === CRITICAL: Use public IP ===
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227

# Production mode
NODE_ENV=production
```

**Save the file** and verify no spaces around `=` sign.

### Step 3: Rebuild Frontend (5 minutes)

```powershell
cd C:\dev\Hyoung.FMS\fms.frontend

# Clean previous build
Remove-Item -Recurse -Force build\

# Rebuild
npm run build
```

Wait for "Compiled successfully!" message.

### Step 4: Verify Build (1 minute)

```powershell
# Check if API URL is correct
Select-String -Path "build\index.html" -Pattern "x-api-url"
```

**Expected output**:

```
<meta name="x-api-url" content="http://197.254.33.227/api"/>
```

**If you see `10.0.10.153` or `localhost`** → Go back to Step 2, check `.env.production` file location and content.

### Step 5: Backup and Deploy (5 minutes)

```powershell
# Backup current deployment
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp" `
          -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp_backup_$timestamp" `
          -Recurse

# Deploy new build
Copy-Item -Path "fms.frontend\build\*" `
          -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp\" `
          -Recurse -Force

# Verify web.config exists
Test-Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config"
```

### Step 6: Update web.config (5 minutes)

Edit `c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config`:

Add this line inside `<system.webServer>` section:

```xml
<system.webServer>
    <!-- Enable WebSocket -->
    <webSocket enabled="true" />

    <!-- Rest of configuration -->
    <rewrite>
        ...
    </rewrite>
</system.webServer>
```

**Save the file**.

### Step 7: Restart IIS (1 minute)

```powershell
iisreset /noforce
```

### Step 8: Test from External Network (5 minutes)

**Option A: Use Test Page**

1. Open `Documentation\Frontend\SIGNALR_TEST_EXTERNAL.html` in browser
2. Ensure URL is `http://197.254.33.227`
3. Click "1️⃣ Test Negotiate" → Should be ✓ green
4. Click "2️⃣ Test WebSocket" → Check result
5. Click "3️⃣ Connect SignalR" → Should connect

**Option B: Manual Browser Test**

1. Open `http://197.254.33.227` from external network
2. Open Browser DevTools (F12) → Console tab
3. Look for SignalR connection logs
4. Should see: `[PTS SignalR] ✓ Connected successfully`
5. Check Network tab → Look for WebSocket connection (not 404)

---

## 🎯 Expected Results

### Before Fix:

```
❌ WebSocket URL: ws://10.0.10.153:7009/ptsHub
❌ Status: 404 Not Found
❌ Error: NS_ERROR_WEBSOCKET_CONNECTION_REFUSED
```

### After Fix:

```
✅ WebSocket URL: ws://197.254.33.227/ptsHub
✅ Status: 101 Switching Protocols
✅ Connected via: WebSocket or LongPolling
```

---

## 🐛 If Still Not Working

### Issue: Negotiate returns 404

**Diagnosis**: Backend not accessible

**Solution**:

```powershell
# Check if backend is running
netstat -ano | findstr :7009

# Should show LISTENING on port 7009
# If not, start the backend service
```

### Issue: Negotiate works (200) but WebSocket fails (404)

**Diagnosis**: IIS cannot proxy WebSocket connections

**Root Cause**: Standard IIS URL Rewrite doesn't support WebSocket protocol upgrades

**Solution**: Install Application Request Routing (ARR)

```powershell
# Check if ARR is installed
Get-WindowsFeature | Where-Object {$_.Name -like "*RequestRouting*"}

# If not installed:
# 1. Download ARR 3.0 from Microsoft
# 2. Install on IIS server
# 3. Enable "Server Proxy Settings" in IIS Manager
# 4. Enable "WebSocket Protocol" in Windows Features
```

**Detailed steps**: See `SIGNALR_EXTERNAL_CONNECTION_FIX.md` → Solution 1

### Issue: WebSocket still tries internal IP

**Diagnosis**: Negotiate endpoint returns internal server URL

**Quick Fix**: Force SignalR to use public URL

Edit `.env.production`:

```bash
REACT_APP_SIGNALR_URL=http://197.254.33.227
```

Rebuild and redeploy (Steps 3-7 above).

### Issue: Connection works then drops after 60 seconds

**Diagnosis**: Keep-alive timeout

**Solution**: Already configured in `ptsSignalRService.js`:

- Client sends ping every 10 seconds (line 731)
- Keep-alive interval: 15 seconds (line 202)
- Server timeout: 30 seconds (line 203)
- Health check every 30 seconds (line 744)

If still dropping, check IIS timeout settings:

```xml
<!-- In web.config -->
<system.webServer>
    <webSocket enabled="true" receiveBufferLimit="4194304" />
</system.webServer>
```

---

## 📋 Verification Checklist

Check these after completing the fix:

### Server-Side:

- [ ] `.env.production` has public IP (197.254.33.227)
- [ ] Build shows public IP in `index.html`
- [ ] Deployed `index.html` shows public IP
- [ ] `web.config` has `<webSocket enabled="true" />`
- [ ] Backend service running on port 7009
- [ ] IIS application pool started

### Client-Side (External Network):

- [ ] Website loads (`http://197.254.33.227`)
- [ ] No console errors in browser
- [ ] SignalR connection logs show "Connected"
- [ ] Network tab shows WebSocket or SSE connection
- [ ] Real-time data updates working
- [ ] No 404 errors for SignalR endpoints

---

## 📞 Testing Tools

### 1. PowerShell Diagnostics

```powershell
.\Documentation\Frontend\SIGNALR_DIAGNOSTICS.ps1
```

### 2. Browser Test Page

Open `Documentation\Frontend\SIGNALR_TEST_EXTERNAL.html`

### 3. Manual cURL Tests

```bash
# Test negotiate
curl http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1 -X POST

# Test API
curl http://197.254.33.227/api/ -v
```

### 4. Postman Collection

Create collection with:

- GET `http://197.254.33.227/api/`
- POST `http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1`

---

## 🎓 Understanding the Architecture

### Current Setup:

```
External Client (Internet)
    ↓
    ↓ HTTP/WS request to 197.254.33.227
    ↓
IIS (Port 80) on 197.254.33.227
    ↓
    ↓ URL Rewrite/Proxy
    ↓
Backend (Kestrel) on localhost:7009
    ↓
    ↓ Returns response with URL
    ↓
IIS forwards response
    ↓
External Client receives response
```

**Problem**: Backend returns `http://10.0.10.153:7009` which external clients can't reach.

**Solution**: Configure frontend to use public URL so connections route through IIS.

---

## 📖 Related Documentation

| Document                             | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| `SIGNALR_EXTERNAL_CONNECTION_FIX.md` | Detailed solutions and explanations      |
| `ENV_VARIABLES_FIX.md`               | Environment variable configuration guide |
| `BUILD_COMMANDS.md`                  | Complete build process documentation     |
| `SIGNALR_DIAGNOSTICS.ps1`            | Automated diagnostic script              |
| `SIGNALR_TEST_EXTERNAL.html`         | Interactive testing tool                 |

---

## 🚀 Alternative Solutions (If ARR Not Available)

If you cannot install ARR (Application Request Routing):

### Option A: Force LongPolling (Quick Temporary Fix)

Edit `fms.frontend\src\signalR\ptsSignalRService.js` line 185:

```javascript
// Change from:
transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,

// To:
transport: HttpTransportType.LongPolling,
```

**Pros**: Works with standard IIS URL Rewrite
**Cons**: Less efficient, higher latency than WebSocket

### Option B: Open Port 7009 (Security Risk)

Open firewall port 7009 and allow external access to backend directly:

```powershell
New-NetFirewallRule -DisplayName "Kestrel Backend 7009" `
                    -Direction Inbound `
                    -LocalPort 7009 `
                    -Protocol TCP `
                    -Action Allow
```

Update `.env.production`:

```bash
REACT_APP_FMS_API_URL=http://197.254.33.227:7009/api
REACT_APP_SIGNALR_URL=http://197.254.33.227:7009
```

**Pros**: WebSocket works directly
**Cons**: Exposes backend directly (security risk)

---

## 💡 Quick Commands Reference

```powershell
# Verify current deployed URL
Select-String -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\index.html" -Pattern "x-api-url"

# Check if backend is running
netstat -ano | findstr :7009

# Test negotiate endpoint
Invoke-WebRequest -Uri "http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1" -Method POST

# Rebuild frontend
cd fms.frontend; Remove-Item build\ -Recurse -Force; npm run build

# Deploy to IIS
Copy-Item -Path "fms.frontend\build\*" -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp\" -Recurse -Force

# Restart IIS
iisreset /noforce

# Check IIS logs
Get-Content "c:\inetpub\logs\LogFiles\W3SVC1\*.log" | Select-Object -Last 50
```

---

## ⏱️ Time Estimate

| Task                   | Time        |
| ---------------------- | ----------- |
| Run diagnostics        | 5 min       |
| Update .env.production | 2 min       |
| Rebuild frontend       | 5 min       |
| Verify build           | 1 min       |
| Deploy to IIS          | 5 min       |
| Update web.config      | 5 min       |
| Restart IIS            | 1 min       |
| Test from external     | 5 min       |
| **Total**              | **~30 min** |

If ARR installation needed: +30 minutes

---

## 🎯 Success Criteria

You'll know it's fixed when:

1. ✅ External browser loads `http://197.254.33.227` without errors
2. ✅ Browser console shows: `[PTS SignalR] ✓ Connected successfully`
3. ✅ Network tab shows WebSocket or SSE connection (not 404)
4. ✅ Real-time dashboard data updates automatically
5. ✅ No internal IP (`10.0.10.153`) visible in any URLs
6. ✅ Test page shows all tests green

---

## 📞 Need Help?

If you're still stuck after following this guide:

1. Run `SIGNALR_DIAGNOSTICS.ps1` and share output
2. Check browser console errors (F12 → Console tab)
3. Check IIS logs: `c:\inetpub\logs\LogFiles\`
4. Review detailed documentation: `SIGNALR_EXTERNAL_CONNECTION_FIX.md`

---

**Last Updated**: 2025-10-31
**Production Server**: 197.254.33.227
**Application**: Hyoung FMS
