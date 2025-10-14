# 405 Error Fix - Quick Summary

## Your Setup
```
Port 80:  C:\inetpub\wwwroot\hyoungFMS\reactApp   (React Frontend)
Port 7009: C:\inetpub\wwwroot\hyoungFMS\webAPI     (ASP.NET Core API)
```

## The Problem
React app's `web.config` doesn't forward `/api/*` requests to port 7009.

## The Fix (3 Commands + 1 File)

### 1. Enable ARR Proxy (PowerShell as Admin):
```powershell
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
```

### 2. Configure Server Variables (PowerShell as Admin):
```powershell
cd $env:SystemRoot\system32\inetsrv
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_ORIGINAL_HOST']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_FOR']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_PROTO']" /commit:apphost
```

### 3. Copy New web.config:
```powershell
# Backup current
Copy-Item "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config" "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config.backup"

# Copy new one
Copy-Item "C:\Users\kkagiri\source\repos\Hyoung.Fms\web.config.REACT-APP-WITH-API-PROXY" "C:\inetpub\wwwroot\hyoungFMS\reactApp\web.config" -Force

# Restart IIS
iisreset
```

## Test
```powershell
# Should work now (not 405!)
Invoke-WebRequest -Uri "http://10.0.10.153/api/v1/Health" -UseBasicParsing
```

## Full Instructions
See: `FIX_405_ERROR_INSTRUCTIONS.md`
