# SignalR External Connection Fix - Action Plan Checklist

**Server**: 197.254.33.227 (Public IP)
**Date**: ******\_\_\_******
**Technician**: ******\_\_\_******

---

## 🎯 OBJECTIVE

Fix SignalR WebSocket connection failure from external networks by rebuilding frontend with public IP.

**Current Problem**:

- ❌ `ws://10.0.10.153:7009/ptsHub` → 404 Not Found
- ❌ Internal IP hardcoded in production build

**Target Result**:

- ✅ `ws://197.254.33.227/ptsHub` → 101 Switching Protocols
- ✅ SignalR connects from external networks

---

## 📋 PRE-FLIGHT CHECKS

**Location**: Production Server (197.254.33.227)

- [ ] Logged in as **Administrator**
- [ ] Backend service is **running** (port 7009)
- [ ] IIS is **running** and site accessible locally
- [ ] Have access to: `C:\dev\Hyoung.FMS\`
- [ ] Node.js and npm installed (check: `npm --version`)
- [ ] PowerShell open as Administrator

**Backend Check**:

```powershell
netstat -ano | findstr :7009
# Should show LISTENING - if not, start backend first
```

---

## PHASE 1: DIAGNOSTICS (5 minutes)

### Task 1.1: Run Diagnostic Script

```powershell
cd C:\dev\Hyoung.FMS\Documentation\Frontend
.\SIGNALR_DIAGNOSTICS.ps1
```

**Record Results**:

- [ ] ARR Installed? ****\_\_\_****
- [ ] WebSocket Enabled? ****\_\_\_****
- [ ] Port 7009 Listening? ****\_\_\_****
- [ ] Current API URL in index.html: ************\_\_\_************

### Task 1.2: Check Current Deployment

```powershell
Select-String -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\index.html" -Pattern "x-api-url"
```

**Current URL**: ****************\_****************

- [ ] Contains `10.0.10.153` → WRONG (needs fix)
- [ ] Contains `197.254.33.227` → OK (but check why SignalR still fails)
- [ ] Contains `localhost` → WRONG (needs fix)

---

## PHASE 2: ENVIRONMENT CONFIGURATION (2 minutes)

### Task 2.1: Edit .env.production

**File Location**: `C:\dev\Hyoung.FMS\fms.frontend\.env.production`

```powershell
cd C:\dev\Hyoung.FMS\fms.frontend
notepad .env.production
```

**Required Content** (copy exactly, NO spaces around `=`):

```bash
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227
NODE_ENV=production
```

- [ ] File exists at correct location
- [ ] Content matches exactly (no spaces)
- [ ] Saved successfully

### Task 2.2: Verify File

```powershell
cat .env.production
```

**Verification**:

- [ ] Shows public IP `197.254.33.227`
- [ ] NO spaces around `=` sign
- [ ] NO quotes around URLs
- [ ] File encoding is UTF-8 (not UTF-16)

---

## PHASE 3: BUILD FRONTEND (5 minutes)

### Task 3.1: Clean Previous Build

```powershell
cd C:\dev\Hyoung.FMS\fms.frontend
Remove-Item -Recurse -Force build\
```

- [ ] `build\` directory deleted
- [ ] No errors

### Task 3.2: Run Build

```powershell
npm run build
```

**Expected Output**:

```
Creating an optimized production build...
Compiled successfully!
```

- [ ] Build completed without errors
- [ ] Saw "Compiled successfully!" message
- [ ] `build\` directory created
- [ ] No warnings (or acceptable warnings only)

**Build Duration**: **\_\_\_** seconds

### Task 3.3: Verify Build Output

```powershell
Select-String -Path "build\index.html" -Pattern "x-api-url"
```

**Expected**: `content="http://197.254.33.227/api"`

**Actual**: **********************\_\_\_\_**********************

- [ ] Shows `197.254.33.227` (CORRECT)
- [ ] Shows `10.0.10.153` (WRONG - go back to Phase 2)
- [ ] Shows `localhost` (WRONG - go back to Phase 2)

**If WRONG, troubleshoot**:

```powershell
# Check if .env.production exists
Test-Path .env.production

# Check file content
cat .env.production

# Verify you're in correct directory
pwd
# Should be: C:\dev\Hyoung.FMS\fms.frontend
```

---

## PHASE 4: BACKUP CURRENT DEPLOYMENT (3 minutes)

### Task 4.1: Create Backup

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "c:\inetpub\wwwroot\hyoungFMS\reactApp_backup_$timestamp"
Copy-Item -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp" -Destination $backupPath -Recurse
Write-Host "Backup created at: $backupPath"
```

**Backup Location**: ********************\_\_\_\_********************

- [ ] Backup created successfully
- [ ] Backup size reasonable (>50MB typically)
- [ ] Backup path recorded (in case rollback needed)

### Task 4.2: Verify Backup

```powershell
Test-Path $backupPath
```

- [ ] Returns `True`

---

## PHASE 5: DEPLOY TO IIS (5 minutes)

### Task 5.1: Copy Build Files

```powershell
$deployPath = "c:\inetpub\wwwroot\hyoungFMS\reactApp"

# Backup web.config (don't overwrite it)
Copy-Item -Path "$deployPath\web.config" -Destination ".\web.config.backup" -ErrorAction SilentlyContinue

# Remove old files (keep web.config)
Remove-Item -Path "$deployPath\*" -Recurse -Force -Exclude "web.config"

# Copy new build
Copy-Item -Path "fms.frontend\build\*" -Destination $deployPath -Recurse -Force

# Restore web.config if missing
if (-not (Test-Path "$deployPath\web.config")) {
    Copy-Item -Path ".\web.config.backup" -Destination "$deployPath\web.config" -Force
}
```

- [ ] Old files removed
- [ ] New files copied
- [ ] `web.config` preserved
- [ ] No errors during copy

### Task 5.2: Verify Deployment

```powershell
# Check files exist
Test-Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\index.html"
Test-Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config"

# Verify API URL in deployed file
Select-String -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\index.html" -Pattern "x-api-url"
```

**Deployed API URL**: ********************\_********************

- [ ] `index.html` exists
- [ ] `web.config` exists
- [ ] API URL shows `197.254.33.227`

---

## PHASE 6: UPDATE WEB.CONFIG (5 minutes)

### Task 6.1: Edit web.config

```powershell
notepad c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config
```

### Task 6.2: Add WebSocket Support

Find `<system.webServer>` section and ensure it has:

```xml
<system.webServer>
    <!-- Enable WebSocket -->
    <webSocket enabled="true" />

    <!-- Disable compression for SignalR -->
    <urlCompression doStaticCompression="false" doDynamicCompression="false" />

    <!-- Rest of existing configuration -->
    <rewrite>
        ...existing rules...
    </rewrite>
</system.webServer>
```

- [ ] `<webSocket enabled="true" />` added
- [ ] `<urlCompression ...>` present
- [ ] All existing rules preserved
- [ ] File saved

### Task 6.3: Verify web.config Syntax

```powershell
# Check for syntax errors
Select-String -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\web.config" -Pattern "webSocket"
```

- [ ] Shows `<webSocket enabled="true" />`

---

## PHASE 7: RESTART IIS (2 minutes)

### Task 7.1: Restart IIS

```powershell
iisreset /noforce
```

**Expected Output**:

```
Attempting stop...
Internet services successfully stopped
Attempting start...
Internet services successfully restarted
```

- [ ] IIS stopped successfully
- [ ] IIS started successfully
- [ ] No errors

### Task 7.2: Verify IIS Running

```powershell
Get-Service W3SVC | Select-Object Status
```

- [ ] Status: `Running`

---

## PHASE 8: LOCAL TESTING (3 minutes)

### Task 8.1: Test from Server Localhost

```powershell
# Test main page
curl http://localhost/ -UseBasicParsing | Select-Object StatusCode

# Test negotiate
Invoke-WebRequest -Uri "http://localhost/ptsHub/negotiate?negotiateVersion=1" -Method POST
```

- [ ] Main page returns 200
- [ ] Negotiate returns 200
- [ ] No 404 or 500 errors

### Task 8.2: Test from Internal Network

**From another machine on 10.0.10.x network**:

- Open: `http://197.254.33.227`

- [ ] Website loads
- [ ] No console errors
- [ ] SignalR connects (check console)

---

## PHASE 9: EXTERNAL TESTING (5 minutes)

### Task 9.1: Test Using External Network

**From external network (mobile hotspot, VPN, or different ISP)**:

**Option A: Browser Test**

1. Open: `http://197.254.33.227`
2. Press F12 → Console tab
3. Look for SignalR logs

- [ ] Website loads
- [ ] No CORS errors
- [ ] SignalR connection logs appear
- [ ] Sees: `[PTS SignalR] ✓ Connected successfully`

**Option B: Use Test Tool**

1. Open: `http://197.254.33.227/SIGNALR_TEST_EXTERNAL.html`
   (Or open local copy from `Documentation/Frontend/SIGNALR_TEST_EXTERNAL.html`)
2. Click "1️⃣ Test Negotiate" → Should be ✅
3. Click "2️⃣ Test WebSocket" → Check result
4. Click "3️⃣ Connect SignalR" → Should connect

**Test Results**:

- [ ] Negotiate: ✅ Success / ❌ Failed
- [ ] WebSocket: ✅ Success / ❌ Failed
- [ ] SignalR: ✅ Success / ❌ Failed

### Task 9.2: Check Network Tab

**Browser DevTools → Network Tab → Filter: WS**

**Expected**: See WebSocket connection with status `101 Switching Protocols`

**Actual**:

- [ ] WebSocket shows 101 (CORRECT)
- [ ] WebSocket shows 404 (FAILED - see troubleshooting)
- [ ] No WebSocket, using SSE/LongPolling (WORKS but not optimal)

---

## PHASE 10: VERIFICATION (2 minutes)

### Task 10.1: Final Checks

**On Production Server**:

```powershell
# Verify deployed API URL
Select-String -Path "c:\inetpub\wwwroot\hyoungFMS\reactApp\index.html" -Pattern "x-api-url"

# Check IIS logs for errors
Get-Content "c:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 20 | Select-String "ptsHub"
```

**Checklist**:

- [ ] Deployed file has public IP (197.254.33.227)
- [ ] No 404 errors in IIS logs for `/ptsHub`
- [ ] Backend service still running (port 7009)
- [ ] IIS application pool running

### Task 10.2: Document Results

**Overall Status**:

- [ ] ✅ **SUCCESS** - SignalR connects from external network
- [ ] ⚠️ **PARTIAL** - Works but using LongPolling (not WebSocket)
- [ ] ❌ **FAILED** - Still getting errors

**If PARTIAL or FAILED, proceed to troubleshooting**

---

## 🐛 TROUBLESHOOTING

### Issue: Negotiate Returns 404

**Cause**: Backend not running or not accessible

**Fix**:

```powershell
# Check if backend running
netstat -ano | findstr :7009

# If not listed, start backend service
# cd to backend directory and start the application
```

### Issue: Negotiate OK (200) but WebSocket Fails (404)

**Cause**: IIS URL Rewrite cannot proxy WebSocket protocol

**Diagnosis**:

```powershell
# Check if ARR installed
Get-WindowsFeature | Where-Object {$_.Name -like "*RequestRouting*"}

# Check if WebSocket feature installed
Get-WindowsFeature | Where-Object {$_.Name -like "*WebSocket*"}
```

**Fix**: Install ARR and WebSocket Protocol

**Steps**:

1. Download Application Request Routing (ARR) 3.0
2. Install ARR on IIS server
3. IIS Manager → Server Name → Application Request Routing Cache
4. Click "Server Proxy Settings" → Check "Enable proxy"
5. Server Manager → Add Features → Web Server (IIS) → Application Development → WebSocket Protocol
6. Restart IIS: `iisreset /noforce`

**OR Use LongPolling Fallback** (temporary solution):

Edit `fms.frontend\src\signalR\ptsSignalRService.js` line 185:

```javascript
// Change to force LongPolling:
transport: HttpTransportType.LongPolling,
```

Then rebuild (go back to Phase 3).

### Issue: Still Shows Internal IP After Rebuild

**Cause**: `.env.production` not read or wrong location

**Fix**:

```powershell
cd C:\dev\Hyoung.FMS\fms.frontend

# Verify file exists
Test-Path .env.production
# Should return: True

# Check content
cat .env.production
# Should show: REACT_APP_FMS_API_URL=http://197.254.33.227/api

# If file missing or wrong, recreate it:
@"
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api
REACT_APP_SIGNALR_URL=http://197.254.33.227
NODE_ENV=production
"@ | Out-File -FilePath .env.production -Encoding UTF8

# Rebuild
Remove-Item build\ -Recurse -Force
npm run build
```

### Issue: Website Loads but SignalR Fails

**Cause**: Backend returns internal IP in negotiate response

**Fix**: Already handled by `REACT_APP_SIGNALR_URL` in `.env.production`

**Verify**:

```powershell
# Test negotiate from external IP
curl http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1 -X POST
```

Check if response contains `url` field with internal IP. If yes, ensure `.env.production` has:

```
REACT_APP_SIGNALR_URL=http://197.254.33.227
```

---

## 📋 ROLLBACK PROCEDURE (If Needed)

If new deployment causes issues:

```powershell
# Find latest backup
Get-ChildItem "c:\inetpub\wwwroot\hyoungFMS\" | Where-Object {$_.Name -like "reactApp_backup_*"} | Sort-Object Name -Descending | Select-Object -First 1

# Set backup path
$backupPath = "c:\inetpub\wwwroot\hyoungFMS\reactApp_backup_YYYYMMDD_HHMMSS"

# Restore
Remove-Item "c:\inetpub\wwwroot\hyoungFMS\reactApp" -Recurse -Force
Copy-Item $backupPath -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp" -Recurse

# Restart IIS
iisreset /noforce
```

---

## ✅ SUCCESS CRITERIA

**Mark complete when ALL are true**:

- [ ] External browser loads `http://197.254.33.227` without errors
- [ ] Browser console shows: `[PTS SignalR] ✓ Connected successfully`
- [ ] Network tab shows WebSocket or SSE connection (NOT 404)
- [ ] Real-time data updates work (check PTS dashboard)
- [ ] No internal IP (`10.0.10.153`) in any browser URLs
- [ ] Test tool shows all tests green
- [ ] Multiple external users can connect simultaneously

---

## 📝 POST-IMPLEMENTATION NOTES

**Date Completed**: ******\_\_\_******
**Time Taken**: **\_\_\_** minutes
**Completed By**: ******\_\_\_******

**Final Configuration**:

- Frontend API URL: ************\_\_\_************
- SignalR Transport Used: ☐ WebSocket ☐ LongPolling ☐ SSE
- ARR Installed: ☐ Yes ☐ No
- Any Issues Encountered: **********\_**********

---

---

**Backup Location**: ************\_\_\_************

**Next Steps**:

- [ ] Monitor SignalR connections for 24 hours
- [ ] Check IIS logs daily for errors
- [ ] Plan ARR installation if using LongPolling
- [ ] Update documentation with any deviations
- [ ] Train team on new configuration

---

**Reference Documents**:

- `SIGNALR_EXTERNAL_FIX_SUMMARY.md` - Quick reference
- `SIGNALR_EXTERNAL_CONNECTION_FIX.md` - Detailed solutions
- `ENV_VARIABLES_FIX.md` - Environment variable guide
- `BUILD_COMMANDS.md` - Build process details
- `SIGNALR_DIAGNOSTICS.ps1` - Diagnostic script

---

**PRINT THIS CHECKLIST AND CHECK OFF EACH STEP AS YOU COMPLETE IT**
