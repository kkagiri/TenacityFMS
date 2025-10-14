# Quick Setup: IIS URL Rewrite (Port 80 → 7009)

## Problem
Browser sends requests to `http://10.0.10.153/api/` (port 80) but gets 405 error because API is on port 7009.

## Solution
Set up IIS on port 80 to forward `/api/*` requests to backend on port 7009.

---

## Prerequisites Installation

### 1. Install URL Rewrite Module
Download and install:
- **URL Rewrite 2.1**: https://www.iis.net/downloads/microsoft/url-rewrite
- Or use Web Platform Installer: Search for "URL Rewrite 2.1"

### 2. Install Application Request Routing (ARR)
Download and install:
- **ARR 3.0**: https://www.iis.net/downloads/microsoft/application-request-routing

---

## Automated Setup (RECOMMENDED)

### Run the deployment script as Administrator:

```powershell
# Open PowerShell as Administrator
cd C:\Users\kkagiri\source\repos\Hyoung.Fms\scripts

# Run full setup and deployment
.\deploy-frontend-iis.ps1

# Or setup only (no build/deploy)
.\deploy-frontend-iis.ps1 -SetupOnly

# Or deploy only (skip IIS setup)
.\deploy-frontend-iis.ps1 -DeployOnly
```

**This script will:**
1. ✅ Check prerequisites (URL Rewrite, ARR)
2. ✅ Create IIS site `FMS-Frontend` on port 80
3. ✅ Configure URL rewrite rules
4. ✅ Build React app (`npm run build:prod`)
5. ✅ Deploy to `C:\inetpub\wwwroot\fms-frontend`
6. ✅ Test deployment

---

## Manual Setup (Alternative)

If you prefer manual setup:

### Step 1: Enable ARR Proxy
```powershell
# Run as Administrator
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter "system.webServer/proxy" `
    -Name "enabled" `
    -Value "True"
```

### Step 2: Create Frontend Site
1. Open **IIS Manager**
2. Right-click **Sites** → **Add Website**
   - **Site name:** `FMS-Frontend`
   - **Physical path:** `C:\inetpub\wwwroot\fms-frontend`
   - **Port:** 80
   - Click **OK**

### Step 3: Deploy Frontend Files
```powershell
# Build React app
cd C:\Users\kkagiri\source\repos\Hyoung.Fms\fms.frontend
npm run build:prod

# Deploy to IIS
Copy-Item -Path "build\*" -Destination "C:\inetpub\wwwroot\fms-frontend" -Recurse -Force

# Copy URL rewrite config
Copy-Item -Path "public\web.config.iis-frontend" -Destination "C:\inetpub\wwwroot\fms-frontend\web.config" -Force
```

### Step 4: Configure Server Variables
```powershell
# Run as Administrator
cd $env:SystemRoot\system32\inetsrv

.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_ORIGINAL_HOST']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_FOR']" /commit:apphost
.\appcmd.exe set config -section:system.webServer/rewrite/allowedServerVariables /+"[name='HTTP_X_FORWARDED_PROTO']" /commit:apphost
```

---

## Verification

### 1. Test Frontend
```powershell
Invoke-WebRequest -Uri "http://10.0.10.153/" -UseBasicParsing
# Expected: Status 200, HTML content
```

### 2. Test API Forwarding
```powershell
Invoke-WebRequest -Uri "http://10.0.10.153/api/v1/Health" -UseBasicParsing
# Expected: Forwarded to port 7009, returns health status
```

### 3. Browser Test
1. Open browser: `http://10.0.10.153/`
2. Open DevTools → Network tab
3. Try to login
4. Verify requests go to:
   - ✅ `http://10.0.10.153/api/v1/User/Login` (port 80)
   - ❌ NOT `http://10.0.10.153:7009/api/v1/User/Login`

### 4. Check IIS Logs
```powershell
# View recent logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC*\*.log" -Tail 50
```

Look for:
```
POST /api/v1/User/Login - 200  ← Success!
POST /api/v1/User/Login - 401  ← Unauthorized (expected for bad credentials)
```

---

## Architecture After Setup

```
┌─────────────────────────────────────────────────────────────┐
│ Browser: http://10.0.10.153/                                │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ IIS Frontend Site (Port 80)                                 │
│ - Serves React static files (HTML, JS, CSS)                 │
│ - URL Rewrite Rules:                                        │
│   • /api/* → http://localhost:7009/api/*                    │
│   • /hub/* → http://localhost:7009/hub/*                    │
│   • /* → index.html (React Router)                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ (URL Rewrite forwards API requests)
              ▼
┌─────────────────────────────────────────────────────────────┐
│ IIS API Site (Port 7009)                                    │
│ - ASP.NET Core Web API                                      │
│ - SignalR Hubs                                              │
│ - In-process hosting with AspNetCoreModuleV2                │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefits

✅ **Clean URLs**: Users access `http://10.0.10.153/` (no port number)
✅ **No CORS Issues**: Same origin for frontend and API
✅ **Separation**: Frontend and API can be deployed independently
✅ **Production Ready**: Standard IIS reverse proxy pattern
✅ **Easy HTTPS**: Can add SSL certificate to port 80 site later

---

## Troubleshooting

### Issue: Script fails with "URL Rewrite not installed"
**Solution:** Install URL Rewrite Module 2.1 from https://www.iis.net/downloads/microsoft/url-rewrite

### Issue: Script fails with "Cannot enable proxy"
**Solution:** Install Application Request Routing (ARR) 3.0

### Issue: 405 error still occurs
**Check:**
1. Is frontend site running on port 80? `Get-WebSite -Name "FMS-Frontend"`
2. Is web.config deployed? `Test-Path "C:\inetpub\wwwroot\fms-frontend\web.config"`
3. Check IIS logs: `Get-Content "C:\inetpub\logs\LogFiles\W3SVC*\*.log" -Tail 20`

### Issue: API requests return 502 Bad Gateway
**Check:**
1. Is API running on port 7009? `Test-NetConnection -ComputerName localhost -Port 7009`
2. Is API site started? `Get-WebSite -Name "FMS-API"`
3. Check API logs: `Get-Content "C:\inetpub\wwwroot\fms-api\logs\stdout*.log" -Tail 20`

### Issue: Static files (JS/CSS) not loading
**Check:**
1. Are files deployed? `Get-ChildItem "C:\inetpub\wwwroot\fms-frontend"`
2. Check browser console for 404 errors
3. Clear browser cache: `Ctrl+Shift+R`

---

## Next Steps After Setup

1. **Test thoroughly** - Login, navigate, check all features
2. **Update CORS** - Ensure backend allows `http://10.0.10.153` origin
3. **Monitor logs** - Check for errors in IIS logs and API logs
4. **Setup HTTPS** - Add SSL certificate for production
5. **Backup config** - Save web.config and deployment script

---

## Related Files

- Deployment script: `scripts/deploy-frontend-iis.ps1`
- Frontend web.config: `fms.frontend/public/web.config.iis-frontend`
- Environment config: `fms.frontend/.env.production`
- Full guide: `Documentation/Deployment/IIS_URL_REWRITE_SETUP.md`

---

## Support

If you encounter issues:
1. Check IIS logs: `C:\inetpub\logs\LogFiles\W3SVC*\`
2. Check API logs: `C:\Logs\FMS.Webclient\`
3. Review full documentation: `Documentation/Deployment/IIS_URL_REWRITE_SETUP.md`
4. Verify prerequisites are installed (URL Rewrite, ARR)
