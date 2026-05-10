# IIS URL Rewrite Setup Guide
## Forward API Requests from Port 80 to Port 7009

This guide explains how to set up IIS to serve your React frontend on port 80 while forwarding API requests to your ASP.NET Core API on port 7009.

---

## Architecture

```
Browser Request ? IIS Port 80 ? URL Rewrite Module ? Backend API Port 7009
                      ?
                 React Frontend (Static Files)
```

**Request Flow:**
- `http://10.0.10.153/` ? Serves React app (index.html)
- `http://10.0.10.153/api/*` ? Forwards to `http://localhost:7009/api/*`
- `http://10.0.10.153/hub/*` ? Forwards to `http://localhost:7009/hub/*` (SignalR)

---

## Prerequisites

### 1. Install IIS URL Rewrite Module

**Download and install:**
- URL Rewrite Module 2.1: https://www.iis.net/downloads/microsoft/url-rewrite
- Or use Web Platform Installer

**Verify installation:**
```powershell
# Check if URL Rewrite is installed
Get-WindowsFeature -Name Web-Http-Redirect
```

### 2. Install Application Request Routing (ARR)

**Download and install:**
- ARR 3.0: https://www.iis.net/downloads/microsoft/application-request-routing

**Enable ARR Proxy:**
```powershell
# Run in PowerShell as Administrator
Import-Module WebAdministration
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
```

---

## IIS Site Structure

You'll need **TWO separate IIS sites:**

### Site 1: Frontend (Port 80)
- **Name:** `FMS-Frontend`
- **Port:** 80
- **Physical Path:** `C:\inetpub\wwwroot\fms-frontend`
- **Purpose:** Serve React static files + URL rewrite for API

### Site 2: API (Port 7009)
- **Name:** `FMS-API`
- **Port:** 7009
- **Physical Path:** `C:\inetpub\wwwroot\fms-api`
- **Purpose:** ASP.NET Core API (already configured)

---

## Step-by-Step Setup

### Step 1: Create Frontend IIS Site

```powershell
# Run as Administrator
Import-Module WebAdministration

# Create physical directory
New-Item -ItemType Directory -Force -Path "C:\inetpub\wwwroot\fms-frontend"

# Create IIS site
New-WebSite -Name "FMS-Frontend" `
    -Port 80 `
    -PhysicalPath "C:\inetpub\wwwroot\fms-frontend" `
    -ApplicationPool "DefaultAppPool"

# Set bindings
New-WebBinding -Name "FMS-Frontend" -IPAddress "*" -Port 80 -Protocol http
```

### Step 2: Deploy Frontend Files

```powershell
# Build React app
cd C:\Users\kkagiri\source\repos\Tenacity.Fms\fms.frontend
npm run build:prod

# Copy build files to IIS
Copy-Item -Path "build\*" -Destination "C:\inetpub\wwwroot\fms-frontend" -Recurse -Force
```

### Step 3: Create Frontend web.config

Create `C:\inetpub\wwwroot\fms-frontend\web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>

    <!-- URL Rewrite Rules -->
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

        <!-- Rule 3: SPA fallback - serve index.html for all other routes -->
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

    <!-- Static file caching -->
    <staticContent>
      <!-- Cache JS/CSS files for 1 year (they have hash in filename) -->
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>

    <!-- Disable caching for index.html -->
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
        <add name="Pragma" value="no-cache" />
        <add name="Expires" value="0" />
      </customHeaders>
    </httpProtocol>

    <!-- MIME types for modern files -->
    <staticContent>
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>

  </system.webServer>
</configuration>
```

### Step 4: Configure Server Variables

**Important:** You must allow server variables to be set in URL Rewrite.

```powershell
# Run as Administrator in PowerShell
%windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_ORIGINAL_HOST']" /commit:apphost
%windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_FOR']" /commit:apphost
%windir%\system32\inetsrv\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_PROTO']" /commit:apphost
```

### Step 5: Update API web.config

Your API's `web.config` at `C:\inetpub\wwwroot\fms-api\web.config` should remain as-is but ensure CORS is configured in your backend to accept requests from port 80.

---

## Frontend Environment Variables

Update `fms.frontend\.env.production`:

```env
# Production Environment Configuration
NODE_ENV=production

# API Configuration - Use relative URLs (port 80 will forward to 7009)
REACT_APP_PRIVATE_FMS_API_URL=/api
REACT_APP_API_URL=/api
REACT_APP_FMS_API_URL=/api
REACT_APP_FMS_API_URL_PROD=/api
REACT_APP_PUBLIC_FMS_API_URL=/api

# SignalR Configuration - Use relative URL
REACT_APP_SIGNALR_URL=
```

**Why relative URLs?**
- Browser sends requests to `http://10.0.10.153/api/*` (port 80)
- IIS URL Rewrite forwards to `http://localhost:7009/api/*`
- No CORS issues since browser thinks it's same-origin!

---

## Verification Steps

### 1. Test URL Rewrite Rules

```powershell
# Test API forwarding
Invoke-WebRequest -Uri "http://10.0.10.153/api/v1/Health" -UseBasicParsing

# Should return health check response from port 7009
```

### 2. Test React Routing

```powershell
# Test React app serves
Invoke-WebRequest -Uri "http://10.0.10.153/" -UseBasicParsing

# Test React route (should return index.html)
Invoke-WebRequest -Uri "http://10.0.10.153/dashboard" -UseBasicParsing
```

### 3. Browser Testing

1. Open `http://10.0.10.153/` in browser
2. Open Developer Tools ? Network tab
3. Login
4. Verify requests go to:
   - `http://10.0.10.153/api/v1/User/Login` ?
   - NOT `http://10.0.10.153:7009/api/v1/User/Login` ?

### 4. Check IIS Logs

**Frontend site logs:**
```
C:\inetpub\logs\LogFiles\W3SVC[site-id]\
```

**Look for:**
- `GET /` ? 200 (serves index.html)
- `POST /api/v1/User/Login` ? 200 or 401 (forwarded successfully)
- `GET /dashboard` ? 200 (React route, serves index.html)

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Cause:** URL Rewrite module not installed or ARR proxy not enabled.

**Solution:**
```powershell
# Check URL Rewrite
Get-WindowsFeature -Name Web-Http-Redirect

# Enable ARR Proxy
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
```

### Issue: 404 on API requests

**Cause:** URL Rewrite rule not matching.

**Solution:** Check rule pattern and test:
```powershell
# Enable Failed Request Tracing in IIS
# Check if rule is being hit in trace logs
```

### Issue: SignalR connections fail

**Cause:** WebSocket forwarding not configured.

**Solution:** Add WebSocket support to ARR:
```powershell
# In IIS Manager ? Server ? Application Request Routing ? Server Proxy Settings
# Enable: "Enable proxy" and "WebSocket"
```

### Issue: CORS errors

**Cause:** Backend CORS not configured for port 80 origin.

**Solution:** Update `FmsServiceCollectionExtensions.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionCorsPolicy", policy =>
    {
        policy.WithOrigins(
            "http://10.0.10.153",      // Port 80 (IIS frontend)
            "http://10.0.10.153:7009", // Port 7009 (Direct API)
            "http://localhost:7009"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

### Issue: Static files not loading

**Cause:** React app not built or deployed correctly.

**Solution:**
```powershell
# Rebuild and redeploy
cd C:\Users\kkagiri\source\repos\Tenacity.Fms\fms.frontend
npm run build:prod
Remove-Item "C:\inetpub\wwwroot\fms-frontend\*" -Recurse -Force
Copy-Item -Path "build\*" -Destination "C:\inetpub\wwwroot\fms-frontend" -Recurse -Force
```

---

## Production Deployment Script

Create `deploy-frontend-production.ps1`:

```powershell
# FMS Frontend Deployment Script
# Run as Administrator

param(
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$FrontendSourcePath = "C:\Users\kkagiri\source\repos\Tenacity.Fms\fms.frontend"
$IISFrontendPath = "C:\inetpub\wwwroot\fms-frontend"

Write-Host "=== FMS Frontend Deployment ===" -ForegroundColor Cyan

# Step 1: Build React app
if (-not $SkipBuild) {
    Write-Host "Building React app..." -ForegroundColor Yellow
    Push-Location $FrontendSourcePath
    try {
        npm run build:prod
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        Write-Host "? Build successful" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "Skipping build (using existing build folder)..." -ForegroundColor Yellow
}

# Step 2: Stop IIS site
Write-Host "Stopping IIS site..." -ForegroundColor Yellow
Stop-WebSite -Name "FMS-Frontend" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 3: Backup current deployment
$BackupPath = "C:\inetpub\backups\fms-frontend-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
if (Test-Path $IISFrontendPath) {
    Write-Host "Backing up current deployment to $BackupPath..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
    Copy-Item -Path "$IISFrontendPath\*" -Destination $BackupPath -Recurse -Force
    Write-Host "? Backup created" -ForegroundColor Green
}

# Step 4: Clear old files
Write-Host "Clearing old files..." -ForegroundColor Yellow
if (Test-Path $IISFrontendPath) {
    Remove-Item "$IISFrontendPath\*" -Recurse -Force -Exclude "web.config"
}

# Step 5: Copy new files
Write-Host "Deploying new files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $IISFrontendPath | Out-Null
Copy-Item -Path "$FrontendSourcePath\build\*" -Destination $IISFrontendPath -Recurse -Force
Write-Host "? Files deployed" -ForegroundColor Green

# Step 6: Create/update web.config if missing
$WebConfigPath = Join-Path $IISFrontendPath "web.config"
if (-not (Test-Path $WebConfigPath)) {
    Write-Host "Creating web.config..." -ForegroundColor Yellow
    # Copy web.config content here (see above)
    Write-Host "? web.config created" -ForegroundColor Green
}

# Step 7: Start IIS site
Write-Host "Starting IIS site..." -ForegroundColor Yellow
Start-WebSite -Name "FMS-Frontend"
Write-Host "? IIS site started" -ForegroundColor Green

# Step 8: Test deployment
Write-Host "Testing deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://10.0.10.153/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "? Frontend is accessible" -ForegroundColor Green
    }
}
catch {
    Write-Host "? Warning: Could not verify frontend accessibility" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Frontend URL: http://10.0.10.153/" -ForegroundColor Green
Write-Host "API URL: http://10.0.10.153:7009/api/" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open http://10.0.10.153/ in browser"
Write-Host "2. Clear browser cache (Ctrl+Shift+R)"
Write-Host "3. Test login functionality"
```

---

## Security Considerations

### 1. HTTPS Setup (Recommended for Production)

Once working on HTTP, set up HTTPS:

```powershell
# Bind SSL certificate to port 443
New-WebBinding -Name "FMS-Frontend" -IPAddress "*" -Port 443 -Protocol https

# Import certificate
$cert = Import-PfxCertificate -FilePath "path\to\certificate.pfx" -CertStoreLocation Cert:\LocalMachine\My
$binding = Get-WebBinding -Name "FMS-Frontend" -Port 443 -Protocol https
$binding.AddSslCertificate($cert.Thumbprint, "My")
```

### 2. IP Restrictions

Restrict API access to local network only:

```xml
<system.webServer>
  <security>
    <ipSecurity allowUnlisted="false">
      <add ipAddress="10.0.10.0" subnetMask="255.255.255.0" allowed="true" />
      <add ipAddress="127.0.0.1" allowed="true" />
    </ipSecurity>
  </security>
</system.webServer>
```

---

## Summary

**Before:**
- Browser ? `http://10.0.10.153:7009/api/` ? 405 Error (wrong port)

**After:**
- Browser ? `http://10.0.10.153/api/` ? IIS URL Rewrite ? `http://localhost:7009/api/` ? ? Success!

**Benefits:**
- ? Clean URLs (no port number for users)
- ? No CORS issues (same-origin)
- ? Frontend and API separated but accessible
- ? Easy to add HTTPS later
- ? Can add load balancing/caching

---

## Related Files
- Frontend web.config: `C:\inetpub\wwwroot\fms-frontend\web.config`
- API web.config: `C:\inetpub\wwwroot\fms-api\web.config`
- Environment config: `fms.frontend\.env.production`
- Deployment script: `scripts\deploy-frontend-production.ps1`
