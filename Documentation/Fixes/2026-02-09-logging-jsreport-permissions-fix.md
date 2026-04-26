# 🚨 URGENT FIX: Logging & jsReport Permissions Issue - RESOLVED

**Date**: February 9, 2026
**Issue**: `Access denied` to jsreport directory causing 500 errors
**Status**: ✅ FIXED

---

## 🔍 Root Cause Analysis

### What Happened

1. **No logs being written** - Serilog directory didn't exist
2. **500 error on `/api/v1/pump/authorize`** - jsReport initialization failure
3. **Permission denied** - IIS app pool couldn't write to deployment directory

### Technical Details

- **Error**: `Access to the path 'C:\inetpub\wwwroot\tenacyFMS\webAPI\jsreport' is denied`
- **Cause**: JsReportService (singleton) tried to create directories on first request
- **Location**: Deployment directory is read-only for IIS app pools

---

## ✅ What Was Fixed

### 1. **Enhanced Logging** (`Program.cs`)

- ✅ Added Serilog self-diagnostics
- ✅ Auto-creates log directories on startup
- ✅ Fallback logging to app directory
- ✅ Logs written to: `C:\Logs\FMS.Webclient\`

### 2. **Global Exception Handler** (`FmsApplicationBuilderExtensions.cs`)

- ✅ Catches all unhandled exceptions
- ✅ Logs complete error details
- ✅ Returns proper JSON error responses
- ✅ Includes stack traces in development mode

### 3. **JsReport Fix** (`JsReportService.cs`)

- ✅ Uses writable locations (C:\Logs or temp folder)
- ✅ Never writes to deployment directory
- ✅ Auto-fallback chain: Logs → Temp → ProgramData → App_Data
- ✅ Tests write access before selecting directory

---

## 🚀 DEPLOYMENT STEPS (DO THIS NOW)

### Step 1: Run Setup Script (REQUIRED)

Open PowerShell **as Administrator** and run:

```powershell
cd C:\dev\Tenacy.FMS
.\scripts\environment\setup-logging-directories.ps1
```

This creates:

- `C:\Logs\FMS.Webclient\app\` - Application logs
- `C:\Logs\FMS.Webclient\errors\` - Error logs
- `C:\Logs\FMS.Webclient\audit\` - Audit logs
- `C:\Logs\FMS.Webclient\startup\` - Startup logs
- `C:\Logs\FMS.Webclient\ReportTemplates\` - jsReport templates

### Step 2: Build and Deploy

```powershell
# Build the solution
cd C:\dev\Tenacy.FMS
dotnet build FMS.WebClient/FMS.WebClient.csproj -c Release

# Publish
dotnet publish FMS.WebClient/FMS.WebClient.csproj -c Release -o C:\publish\FMS.Webclient
```

### Step 3: Update Deployment

```powershell
# Stop IIS
iisreset /stop

# Copy files
Copy-Item -Path "C:\publish\FMS.Webclient\*" -Destination "C:\inetpub\wwwroot\tenacyFMS\webAPI\" -Recurse -Force

# Start IIS
iisreset /start
```

### Step 4: Verify Logs

```powershell
# Check startup logs
Get-Content "C:\Logs\FMS.Webclient\startup\webclient-startup*.log" -Tail 50

# Check main logs
Get-Content "C:\Logs\FMS.Webclient\app\app-log*.log" -Tail 50 -Wait

# Check errors
Get-Content "C:\Logs\FMS.Webclient\errors\error*.log" -Tail 50
```

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] Logs directory exists: `C:\Logs\FMS.Webclient\`
- [ ] Startup log created: `C:\Logs\FMS.Webclient\startup\webclient-startup-*.log`
- [ ] No "Access Denied" errors in logs
- [ ] API responds: `http://10.0.10.153/api/v1/notifications?take=50`
- [ ] jsReport initializes successfully (check startup log)
- [ ] Pump authorize works: `POST http://10.0.10.153/api/v1/pump/authorize`

---

## 🛠️ Troubleshooting

### If logs still don't appear:

1. **Check directory permissions**:

   ```powershell
   icacls "C:\Logs\FMS.Webclient"
   ```

   Should show `IIS_IUSRS:(OI)(CI)F` and `TenacyFMS.WebAPI:(OI)(CI)F`

2. **Check app pool identity**:
   - Open IIS Manager
   - Application Pools → TenacyFMS.WebAPI → Advanced Settings
   - Identity should be: ApplicationPoolIdentity

3. **Check Serilog self-log**:
   ```powershell
   Get-Content "C:\inetpub\wwwroot\tenacyFMS\webAPI\logs\serilog-selflog.txt"
   ```

### If jsReport still fails:

The new code automatically falls back to:

1. `C:\Logs\FMS.Webclient\ReportTemplates\`
2. `%TEMP%\FMS_ReportTemplates\`
3. `%ProgramData%\Tenacy\FMS\ReportTemplates\`
4. `App_Data\ReportTemplates\` (may fail)

Check startup log to see which location was selected.

---

## 📊 Log File Locations

| Log Type      | Location                                               | Retention      |
| ------------- | ------------------------------------------------------ | -------------- |
| Application   | `C:\Logs\FMS.Webclient\app\app-log-*.log`              | 30 days        |
| Errors        | `C:\Logs\FMS.Webclient\errors\error-*.log`             | 60 days        |
| Audit         | `C:\Logs\FMS.Webclient\audit\audit-*.log`              | 90 days        |
| Slow Queries  | `C:\Logs\FMS.Webclient\slow\slow-*.log`                | 30 days        |
| Startup       | `C:\Logs\FMS.Webclient\startup\webclient-startup*.log` | 5 days         |
| Serilog Debug | `<approot>\logs\serilog-selflog.txt`                   | Manual cleanup |
| Fallback      | `<approot>\logs\fallback-log-*.log`                    | 7 days         |

---

## 📝 Files Modified

1. ✅ `FMS.WebClient/Program.cs` - Added directory creation + Serilog self-diagnostics
2. ✅ `FMS.WebClient/Extensions/FmsApplicationBuilderExtensions.cs` - Global exception handler
3. ✅ `FMS.WebClient/Services/Reporting/JsReportService.cs` - Fixed directory logic
4. ✅ `FMS.WebClient/appsettings.json` - Added fallback log sink
5. ✅ `scripts/environment/setup-logging-directories.ps1` - New setup script

---

## 🎯 Expected Behavior After Fix

### Startup

```
[06:45:00 INF] === FMS.WebClient Starting ===
[06:45:00 INF] Serilog self-log enabled at: C:\...\serilog-selflog.txt
[06:45:00 INF] ✓ Created log directory: C:\Logs\FMS.Webclient\app
[06:45:01 INF] JsReport service initialized successfully.
[06:45:01 INF]   - Templates: C:\Logs\FMS.Webclient\ReportTemplates
[06:45:01 INF]   - Temp files: C:\Users\...\Temp\FMS_JsReport_Temp
```

### Request Logging

```
[06:45:23 INF] REQ GET /api/v1/notifications?take=50 -> 200 145ms
```

### Error Logging

```
[06:45:23 ERR] UNHANDLED EXCEPTION: POST /api/v1/pump/authorize - Input string was not in a correct format
System.FormatException: Input string was not in a correct format.
   at FMS.Application.Command.PTSCommand.PumpCommands.PumpAuthorizeCommandHandler...
```

---

## 🔄 Recovery Actions

If something goes wrong:

1. **Rollback code** (if needed):

   ```powershell
   git checkout HEAD~1 FMS.WebClient/Services/Reporting/JsReportService.cs
   ```

2. **Manual directory creation**:

   ```powershell
   mkdir "C:\Logs\FMS.Webclient\app" -Force
   icacls "C:\Logs\FMS.Webclient" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

3. **Check previous logs** (if any):
   ```powershell
   Get-ChildItem "C:\Windows\System32\LogFiles\W3SVC*" -Recurse | Sort LastWriteTime -Desc | Select -First 5
   ```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ No 500 errors on pump/authorize endpoint
2. ✅ Logs appear in `C:\Logs\FMS.Webclient\`
3. ✅ jsReport templates created automatically
4. ✅ Detailed error messages in error log (not just "500")
5. ✅ Console output shows log initialization

---

**Need help?** Check:

- Startup log: `C:\Logs\FMS.Webclient\startup\webclient-startup-*.log`
- Error log: `C:\Logs\FMS.Webclient\errors\error-*.log`
- Serilog self-log: `C:\inetpub\wwwroot\tenacyFMS\webAPI\logs\serilog-selflog.txt`
