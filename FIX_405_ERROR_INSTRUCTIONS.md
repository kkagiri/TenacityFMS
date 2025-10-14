# Fix 405 Error - Update React App web.config

## Your Current Setup
- ✅ React App (Port 80): `C:\inetpub\wwwroot\hyoungFMS\reactApp`
- ✅ API (Port 7009): `C:\inetpub\wwwroot\hyoungFMS\webAPI`

## The Problem
Your React app's `web.config` only handles React routing. When browser sends:
```
POST http://10.0.10.153/api/v1/User/Login
```

IIS on port 80 receives it but doesn't know to forward it to port 7009, so it returns **405 Method Not Allowed**.

## The Solution
Update the React app's `web.config` to add URL rewrite rules that forward `/api/*` requests to port 7009.

---

## Step-by-Step Fix

### Step 1: Enable ARR Proxy (One-Time Setup)

Open **PowerShell as Administrator**:

```powershell
# Enable Application Request Routing proxy
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter "system.webServer/proxy" `
    -Name "enabled" `
    -Value "True"
```

If this fails, you need to install **Application Request Routing (ARR)**:
- Download: https://www.iis.net/downloads/microsoft/application-request-routing

### Step 2: Configure Server Variables

Still in **PowerShell as Administrator**:

```powershell
# Navigate to IIS directory
cd $env:SystemRoot\system32\inetsrv

# Add server variables for URL rewriting
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_ORIGINAL_HOST']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_FOR']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_PROTO']" /commit:apphost
```

### Step 3: Backup Current web.config

```powershell
# Backup your current web.config
Copy-Item "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config" `
          "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config.backup"
```

### Step 4: Replace web.config

**Option A: Manual Edit (Recommended)**

1. Open `C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config` in Notepad
2. Replace the ENTIRE content with the new web.config below

**Option B: Copy from Repository**

```powershell
# Copy the new web.config from your repository
Copy-Item "C:\Users\kkagiri\source\repos\Hyoung.Fms\web.config.REACT-APP-WITH-API-PROXY" `
          "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config" -Force
```

### Step 5: New web.config Content

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>

        <!-- Rule 1: Forward API requests to backend on port 7009 -->
        <rule name="Proxy API to Backend" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:7009/api/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_ORIGINAL_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>

        <!-- Rule 2: Forward SignalR hub requests to backend -->
        <rule name="Proxy SignalR to Backend" stopProcessing="true">
          <match url="^hub/(.*)" />
          <action type="Rewrite" url="http://localhost:7009/hub/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_ORIGINAL_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>

        <!-- Rule 3: React Routes - SPA fallback (must be LAST) -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/hub/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>

      </rules>
    </rewrite>

    <!-- Cache control for index.html -->
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
        <add name="Pragma" value="no-cache" />
        <add name="Expires" value="0" />
      </customHeaders>
    </httpProtocol>

    <!-- Static file caching for JS/CSS (they have hash in filename) -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>

  </system.webServer>
</configuration>
```

### Step 6: Restart IIS

```powershell
# Restart IIS to apply changes
iisreset
```

Or restart just your site:

```powershell
# Find your site name
Get-WebSite | Select Name, ID, State, Bindings

# Restart the React app site
Restart-WebAppPool -Name "DefaultAppPool"  # Or your app pool name
```

---

## Verification

### Test 1: Check web.config was Applied

```powershell
# Open IIS Manager
# Navigate to: Sites → [Your React Site] → URL Rewrite
# You should see 3 rules:
#   1. Proxy API to Backend
#   2. Proxy SignalR to Backend
#   3. React Routes
```

### Test 2: Test API Forwarding

```powershell
# Test that port 80 forwards to port 7009
Invoke-WebRequest -Uri "http://10.0.10.153/api/v1/Health" -UseBasicParsing

# Should get response from API (not 405 error!)
```

### Test 3: Browser Login Test

1. Open browser: `http://10.0.10.153/`
2. Open DevTools → Network tab
3. Try to login
4. Check request URL:
   - ✅ Should be: `http://10.0.10.153/api/v1/User/Login` (port 80)
   - ✅ Should get: 200 or 401 (NOT 405!)

### Test 4: Check IIS Logs

```powershell
# View IIS logs for React site
Get-Content "C:\inetpub\logs\LogFiles\W3SVC*\*.log" -Tail 20

# Look for:
# POST /api/v1/User/Login - 200 or 401 (SUCCESS!)
# NOT 405 (failure)
```

---

## What Changed?

### Before (Your Old web.config):
```xml
<rule name="React Routes" stopProcessing="true">
  <match url=".*" />
  <!-- Matches EVERYTHING including /api/* -->
  <action type="Rewrite" url="/" />
  <!-- Returns index.html for ALL requests -->
</rule>
```

**Result:** API requests got `index.html` instead of being forwarded to port 7009!

### After (New web.config):
```xml
<!-- Rule 1: If URL starts with /api/, forward to port 7009 -->
<rule name="Proxy API to Backend" stopProcessing="true">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://localhost:7009/api/{R:1}" />
</rule>

<!-- Rule 3: React Routes (but SKIP /api/ and /hub/ URLs) -->
<rule name="React Routes" stopProcessing="true">
  <match url=".*" />
  <conditions logicalGrouping="MatchAll">
    <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
    <add input="{REQUEST_URI}" pattern="^/hub/" negate="true" />
  </conditions>
  <action type="Rewrite" url="/" />
</rule>
```

**Result:**
- `/api/*` requests → Forwarded to port 7009 ✅
- Other requests → Serve React app ✅

---

## Architecture Diagram

```
Browser Request: http://10.0.10.153/api/v1/User/Login
                        ↓
┌────────────────────────────────────────────────────┐
│ IIS Site: reactApp (Port 80)                       │
│ Path: C:\inetpub\wwwroot\hyoungFMS\reactApp        │
│                                                     │
│ URL Rewrite Rules:                                 │
│ ┌────────────────────────────────────────────┐    │
│ │ Rule 1: Does URL start with /api/?         │    │
│ │   YES → Forward to http://localhost:7009   │─────┼─────┐
│ │   NO → Check next rule                     │    │     │
│ └────────────────────────────────────────────┘    │     │
│                                                     │     │
│ ┌────────────────────────────────────────────┐    │     │
│ │ Rule 3: Is it a file or /api/?             │    │     │
│ │   NO → Serve index.html (React Router)     │    │     │
│ └────────────────────────────────────────────┘    │     │
└────────────────────────────────────────────────────┘     │
                                                            │
                                    ┌───────────────────────┘
                                    ↓
                    ┌────────────────────────────────────┐
                    │ IIS Site: webAPI (Port 7009)       │
                    │ Path: C:\inetpub\wwwroot\          │
                    │       hyoungFMS\webAPI             │
                    │                                    │
                    │ ASP.NET Core API                   │
                    │ POST /api/v1/User/Login            │
                    │ → Returns 200 or 401               │
                    └────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: Error when saving web.config

**Error:** "Cannot add duplicate collection entry of type 'rule'"

**Solution:** You have duplicate rule names. Remove old rules first:
1. Open IIS Manager
2. Select your React site
3. Open "URL Rewrite"
4. Delete all existing rules
5. Save new web.config

### Issue: 500 Internal Server Error

**Cause:** ARR proxy not enabled or server variables not configured

**Solution:**
```powershell
# Enable ARR proxy
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter "system.webServer/proxy" -Name "enabled" -Value "True"

# Restart IIS
iisreset
```

### Issue: Still getting 405 error

**Check these:**

1. **Is web.config deployed?**
   ```powershell
   Get-Content "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config"
   # Should show the new rules
   ```

2. **Is IIS site running?**
   ```powershell
   Get-WebSite | Where-Object {$_.State -eq 'Started'}
   ```

3. **Are URL Rewrite rules visible in IIS Manager?**
   - Open IIS Manager
   - Select your React site
   - Double-click "URL Rewrite"
   - Should see 3 rules

4. **Is API running on port 7009?**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 7009
   # Should show: TcpTestSucceeded: True
   ```

### Issue: Browser cache still showing old behavior

**Solution:** Clear browser cache
- Chrome/Edge: `Ctrl + Shift + R`
- Or open in Incognito mode

---

## Summary

**What you need to do:**

1. ✅ Install ARR (if not already installed)
2. ✅ Enable ARR proxy (PowerShell command)
3. ✅ Configure server variables (PowerShell commands)
4. ✅ Replace `C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config`
5. ✅ Restart IIS
6. ✅ Test login - should work!

**Files to update:**
- Only ONE file: `C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config`

**Your API web.config stays the same!**
- No changes needed to `C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config`

---

## Next Steps After Fix

Once login works:

1. **Test all features** - Make sure everything works
2. **Update frontend .env** - Change API URLs to use relative paths (`/api`)
3. **Rebuild and redeploy** - New build with updated environment variables
4. **Update CORS** - Ensure API allows `http://10.0.10.153` origin

---

## Need Help?

If you get errors:
1. Check IIS logs: `C:\inetpub\logs\LogFiles\W3SVC*\`
2. Check if ARR is installed: Open IIS Manager → Check for "Application Request Routing Cache"
3. Verify web.config syntax: Open in browser, if 500 error, check Event Viewer

**Ready to apply the fix?** Just update that one web.config file! 🚀
