# Frontend Documentation - SignalR External Connection Fix

## 📚 Document Index

This folder contains comprehensive documentation for fixing SignalR WebSocket connection issues on external networks.

---

## 🚨 START HERE

**Problem**: SignalR connections fail from external networks (404 error on WebSocket)

**Quick Links**:

1. **[ACTION_PLAN_CHECKLIST.md](ACTION_PLAN_CHECKLIST.md)** ⭐ **START HERE** - Step-by-step checklist with checkboxes
2. **[SIGNALR_EXTERNAL_FIX_SUMMARY.md](SIGNALR_EXTERNAL_FIX_SUMMARY.md)** - 30-minute quick fix guide
3. **[SIGNALR_EXTERNAL_CONNECTION_FIX.md](SIGNALR_EXTERNAL_CONNECTION_FIX.md)** - Complete technical analysis

---

## 📋 Document Guide

### For Quick Fix (30 minutes)

If you just want to fix it fast:

1. Read: **SIGNALR_EXTERNAL_FIX_SUMMARY.md**
2. Follow: **ACTION_PLAN_CHECKLIST.md**
3. Use: **SIGNALR_DIAGNOSTICS.ps1** to diagnose
4. Test with: **SIGNALR_TEST_EXTERNAL.html**

### For Understanding the Problem

If you want to understand what's wrong:

1. Read: **SIGNALR_EXTERNAL_CONNECTION_FIX.md** (Root causes section)
2. Review: `fms.frontend/src/signalR/ptsSignalRService.js` (lines 138-168)
3. Check: Deployed `c:\inetpub\wwwroot\tenacyFMS\reactApp\index.html`

### For Build Configuration

If you need to rebuild the application:

1. Read: **ENV_VARIABLES_FIX.md** (Environment setup)
2. Follow: **BUILD_COMMANDS.md** (Build process)
3. Verify: `.env.production` configuration

---

## 📖 Document Reference

| Document                                                                     | Purpose                          | When to Use                |
| ---------------------------------------------------------------------------- | -------------------------------- | -------------------------- |
| **[ACTION_PLAN_CHECKLIST.md](ACTION_PLAN_CHECKLIST.md)**                     | Printable step-by-step checklist | During implementation      |
| **[SIGNALR_EXTERNAL_FIX_SUMMARY.md](SIGNALR_EXTERNAL_FIX_SUMMARY.md)**       | Quick fix guide (30 min)         | For immediate fix          |
| **[SIGNALR_EXTERNAL_CONNECTION_FIX.md](SIGNALR_EXTERNAL_CONNECTION_FIX.md)** | Complete technical guide         | For detailed understanding |
| **[ENV_VARIABLES_FIX.md](ENV_VARIABLES_FIX.md)**                             | Environment variable setup       | When configuring builds    |
| **[BUILD_COMMANDS.md](BUILD_COMMANDS.md)**                                   | Build process guide              | When rebuilding frontend   |
| **[SIGNALR_DIAGNOSTICS.ps1](SIGNALR_DIAGNOSTICS.ps1)**                       | Automated diagnostics script     | Before and after fix       |
| **[SIGNALR_TEST_EXTERNAL.html](SIGNALR_TEST_EXTERNAL.html)**                 | Browser-based test tool          | For testing connections    |

---

## 🎯 Problem Summary

### Current Issue

```
❌ External clients cannot connect to SignalR
❌ Error: ws://10.0.10.153:7009/ptsHub → 404 Not Found
❌ Internal IP hardcoded in production build
```

### Root Cause

1. Frontend built with internal IP (`10.0.10.153:7009`)
2. This IP is baked into JavaScript bundle
3. External clients cannot reach internal IP
4. WebSocket connection fails

### Solution

1. Update `.env.production` with public IP (`197.254.33.227`)
2. Rebuild frontend with public configuration
3. Deploy to IIS with WebSocket support
4. Test from external network

---

## 🚀 Quick Start Guide

### Step 1: Run Diagnostics (5 min)

```powershell
cd C:\dev\Tenacy.FMS\Documentation\Frontend
.\SIGNALR_DIAGNOSTICS.ps1
```

This will tell you:

- Current configuration status
- What needs to be fixed
- Missing components

### Step 2: Fix Configuration (2 min)

Edit `C:\dev\Tenacy.FMS\fms.frontend\.env.production`:

```bash
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227
NODE_ENV=production
```

### Step 3: Rebuild (5 min)

```powershell
cd C:\dev\Tenacy.FMS\fms.frontend
Remove-Item -Recurse -Force build\
npm run build
```

### Step 4: Verify Build (1 min)

```powershell
Select-String -Path "build\index.html" -Pattern "x-api-url"
# Should show: content="http://197.254.33.227/api"
```

### Step 5: Deploy (5 min)

```powershell
# Backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "c:\inetpub\wwwroot\tenacyFMS\reactApp" `
          -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp_backup_$timestamp" `
          -Recurse

# Deploy
Copy-Item -Path "fms.frontend\build\*" `
          -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" `
          -Recurse -Force

# Restart IIS
iisreset /noforce
```

### Step 6: Test (5 min)

**From external network**:

1. Open: `http://197.254.33.227`
2. Press F12 → Console
3. Look for: `[PTS SignalR] ✓ Connected successfully`

**Or use test tool**:
Open `SIGNALR_TEST_EXTERNAL.html` in browser and run tests.

---

## 🔍 Diagnostic Tools

### PowerShell Script

**File**: `SIGNALR_DIAGNOSTICS.ps1`

**Usage**:

```powershell
.\SIGNALR_DIAGNOSTICS.ps1
```

**Checks**:

- ARR installation status
- WebSocket protocol enabled
- Backend service running
- Firewall configuration
- Current deployed configuration
- IIS application pool status

### Browser Test Tool

**File**: `SIGNALR_TEST_EXTERNAL.html`

**Usage**:

1. Open file in browser (any device on external network)
2. Ensure URL is set to `http://197.254.33.227`
3. Run tests in sequence:
   - Test 1: Negotiate (HTTP)
   - Test 2: WebSocket (WS protocol)
   - Test 3: Full SignalR connection

**Tests**:

- ✅ Green = Working
- ❌ Red = Failed (with diagnostic info)
- ⚠️ Yellow = Warning

---

## 📊 Architecture Overview

### Current Setup

```
External Client (Internet)
    ↓
IIS on 197.254.33.227 (Port 80)
    ↓ URL Rewrite Proxy
Kestrel Backend (localhost:7009)
    ↓
SignalR Hub
```

### Connection Flow

1. Client requests: `http://197.254.33.227/ptsHub/negotiate`
2. IIS proxies to: `http://localhost:7009/ptsHub/negotiate`
3. Backend returns connection info
4. Client attempts WebSocket: `ws://197.254.33.227/ptsHub`
5. IIS must proxy WebSocket upgrade (requires ARR)
6. Connection established

### Problem Areas

- **Environment Variables**: Wrong IP baked into build
- **IIS URL Rewrite**: Cannot proxy WebSocket without ARR
- **Firewall**: Port 7009 should NOT be exposed externally
- **Backend Config**: May return internal IP in negotiate

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Shows Wrong IP

**Symptom**: `index.html` has `10.0.10.153` after build

**Solution**:

- Verify `.env.production` location and content
- Delete `build/` folder completely
- Rebuild with `npm run build`

**Details**: See [ENV_VARIABLES_FIX.md](ENV_VARIABLES_FIX.md)

### Issue 2: WebSocket Returns 404

**Symptom**: Negotiate works (200) but WebSocket fails (404)

**Solution**:

- Install Application Request Routing (ARR)
- Enable WebSocket Protocol in Windows Features
- Update web.config

**Details**: See [SIGNALR_EXTERNAL_CONNECTION_FIX.md](SIGNALR_EXTERNAL_CONNECTION_FIX.md) → Solution 1

### Issue 3: Connection Drops After 60s

**Symptom**: Connects initially but disconnects after timeout

**Solution**: Already handled in code

- Keep-alive: 15s
- Ping interval: 10s
- Health check: 30s

**Details**: Review `ptsSignalRService.js` lines 202-203, 731-741

---

## 🎓 Technical Reference

### Environment Variables

| Variable                       | Purpose              | Production Value            |
| ------------------------------ | -------------------- | --------------------------- |
| `REACT_APP_FMS_API_URL`        | Primary API endpoint | `http://197.254.33.227/api` |
| `REACT_APP_PUBLIC_FMS_API_URL` | Public fallback      | `http://197.254.33.227/api` |
| `REACT_APP_SIGNALR_URL`        | SignalR override     | `http://197.254.33.227`     |
| `NODE_ENV`                     | Build mode           | `production`                |

### SignalR Configuration

**File**: `fms.frontend/src/signalR/ptsSignalRService.js`

**URL Resolution** (lines 138-168):

1. `REACT_APP_SIGNALR_URL` (highest priority)
2. Resolved API base URL
3. `REACT_APP_PUBLIC_FMS_API_URL`
4. `REACT_APP_API_URL`
5. Default: `http://localhost:7009/api`

**Transport** (line 185):

```javascript
HttpTransportType.WebSockets | HttpTransportType.LongPolling;
```

Tries WebSocket first, falls back to LongPolling if WebSocket fails.

### IIS Configuration

**File**: `c:\inetpub\wwwroot\tenacyFMS\reactApp\web.config`

**Required Settings**:

```xml
<webSocket enabled="true" />
<urlCompression doStaticCompression="false" doDynamicCompression="false" />
```

**Proxy Rules**: Forwards `/ptsHub*` to `http://localhost:7009/ptsHub*`

---

## 📞 Troubleshooting Resources

### Before Implementation

1. **Run diagnostics**: `SIGNALR_DIAGNOSTICS.ps1`
2. **Check current config**: Review `.env.production`
3. **Verify backend**: Test `http://localhost:7009/api`

### During Implementation

1. **Follow checklist**: `ACTION_PLAN_CHECKLIST.md`
2. **Verify each step**: Don't skip verification
3. **Document results**: Record backup locations and issues

### After Implementation

1. **Test from external**: Use `SIGNALR_TEST_EXTERNAL.html`
2. **Monitor logs**: Check IIS logs for errors
3. **Check console**: Browser F12 → Console for SignalR logs

### If Still Failing

1. **Re-run diagnostics**: `SIGNALR_DIAGNOSTICS.ps1`
2. **Review detailed guide**: `SIGNALR_EXTERNAL_CONNECTION_FIX.md`
3. **Check IIS logs**: `c:\inetpub\logs\LogFiles\`
4. **Verify backend logs**: Check application logs

---

## 🔗 Related Files

### Frontend Source Code

- `fms.frontend/src/signalR/ptsSignalRService.js` - PTS SignalR service
- `fms.frontend/src/api/axiosInstance.js` - API configuration
- `fms.frontend/public/index.html` - HTML template with meta tags
- `fms.frontend/.env.production` - Production environment config

### Deployment Files

- `c:\inetpub\wwwroot\tenacyFMS\reactApp\index.html` - Deployed frontend
- `c:\inetpub\wwwroot\tenacyFMS\reactApp\web.config` - IIS configuration

---

## ✅ Success Criteria

You know the fix is complete when:

1. ✅ External browser loads `http://197.254.33.227` without errors
2. ✅ Browser console shows: `[PTS SignalR] ✓ Connected successfully`
3. ✅ Network tab shows WebSocket or SSE (not 404)
4. ✅ Real-time data updates automatically
5. ✅ No internal IP visible anywhere
6. ✅ Test tool shows all green
7. ✅ Multiple external users can connect

---

## 📝 Version History

| Version | Date       | Changes                       |
| ------- | ---------- | ----------------------------- |
| 1.0     | 2025-10-31 | Initial documentation created |
|         |            | - Root cause analysis         |
|         |            | - Complete fix procedures     |
|         |            | - Diagnostic tools            |
|         |            | - Test utilities              |

---

## 📧 Support

If you're still experiencing issues after following all documentation:

1. **Gather diagnostics**:

   ```powershell
   .\SIGNALR_DIAGNOSTICS.ps1 > diagnostics_output.txt
   ```

2. **Collect logs**:

   - Browser console output (F12 → Console → Copy all)
   - IIS logs: `c:\inetpub\logs\LogFiles\W3SVC1\*.log`
   - Backend application logs

3. **Document the problem**:

   - What you're trying to do
   - Steps you've taken
   - Current behavior vs. expected behavior
   - Error messages
   - Screenshots if applicable

4. **Review documentation**:
   - All documents in this folder
   - Ensure each step was followed exactly
   - Verify all verification steps passed

---

## 🎯 Quick Reference Commands

```powershell
# Diagnose current setup
.\SIGNALR_DIAGNOSTICS.ps1

# Check .env.production
cat C:\dev\Tenacy.FMS\fms.frontend\.env.production

# Rebuild frontend
cd C:\dev\Tenacy.FMS\fms.frontend
Remove-Item build\ -Recurse -Force
npm run build

# Verify build
Select-String -Path "build\index.html" -Pattern "x-api-url"

# Deploy to IIS
Copy-Item -Path "build\*" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" -Recurse -Force

# Restart IIS
iisreset /noforce

# Test negotiate
Invoke-WebRequest -Uri "http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1" -Method POST

# Check backend
netstat -ano | findstr :7009

# View IIS logs
Get-Content "c:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50 | Select-String "ptsHub"
```

---

**Last Updated**: 2025-10-31
**Production Server**: 197.254.33.227
**Application**: Tenacy FMS
**Issue**: SignalR WebSocket External Connection Failure
