# 🔌 Port Configuration Guide for Hyoung FMS

## 📍 Current Port Setup

### Backend (.NET API)
- **Development (Direct Run)**: Port **7009** (from Program.cs)
- **Production (IIS)**: Port **7009** (updated to match)
- **Configuration**: See `Program.cs` line 176

### Frontend (React App)
- **Development (npm start)**: Port **3000** (React dev server)
- **Production (IIS)**: Port **80** (standard HTTP)

---

## 🎯 Understanding the Ports

### Why Different Ports?

```
┌─────────────────────────────────────────────────────┐
│            DEVELOPMENT ENVIRONMENT                   │
├─────────────────────────────────────────────────────┤
│  Backend:  dotnet run  → http://localhost:7009     │
│  Frontend: npm start   → http://localhost:3000     │
│                                                      │
│  Frontend makes API calls to backend at :7009       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            PRODUCTION ENVIRONMENT (IIS)              │
├─────────────────────────────────────────────────────┤
│  Backend:  IIS Site    → http://yourserver:7009    │
│  Frontend: IIS Site    → http://yourserver:80      │
│                                                      │
│  Or use subdomains/paths:                           │
│  - http://yourserver:80          (frontend)         │
│  - http://yourserver:80/api      (backend proxy)    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Port Configuration in Files

### 1. Program.cs (Backend Application Port)
```csharp
// Current configuration - Port 7009
var bindingIP = currentEnvironment == "Production" ? "10.0.10.153" : "10.0.11.90";
// Binds to: http://10.0.10.153:7009 (Production)
//           http://10.0.11.90:7009 (Development)
//           http://localhost:7009 (Always)
```

**Location**: `FMS.WebClient/Program.cs` line ~176

### 2. appsettings.json (URL Configuration)
Check your `appsettings.json` for Kestrel URL configuration:
```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://localhost:7009"
      }
    }
  }
}
```

### 3. IIS Setup Script (IIS Site Ports)
```powershell
# setup-iis-hyoungfms.ps1
[int]$BackendPort = 7009    # Updated to match Program.cs
[int]$FrontendPort = 80     # Standard HTTP port
```

### 4. Frontend API Configuration
Check `fms.frontend/src/config.js` or similar:
```javascript
// Development
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:7009'     // Local backend
  : 'http://yourserver:7009';   // Production backend

// Or if using proxy
const API_BASE_URL = '/api';    // Proxied through IIS
```

---

## 🚀 Deployment Scenarios

### Scenario 1: Direct Port Access (Current Setup)
```
Frontend:  http://yourserver:80
Backend:   http://yourserver:7009

Frontend calls:
fetch('http://yourserver:7009/api/tanks')
```

**IIS Configuration:**
- Frontend Site: Port 80
- Backend Site: Port 7009

### Scenario 2: Using Port 80 for Everything (Recommended)
```
Frontend:  http://yourserver:80
Backend:   http://yourserver:80/api (IIS URL Rewrite)

Frontend calls:
fetch('/api/tanks')  // Proxied to backend
```

**IIS Configuration:**
- Frontend Site: Port 80, path: `/`
- Backend Application: Port 80, path: `/api`

### Scenario 3: Subdomain Setup
```
Frontend:  http://app.yourserver.com
Backend:   http://api.yourserver.com

Frontend calls:
fetch('http://api.yourserver.com/tanks')
```

---

## 📝 Recommended Configuration

### For Production (Best Practice)

#### Option A: Single Port with Path-Based Routing
```
http://yourserver:80/          → Frontend
http://yourserver:80/api/      → Backend (proxied)
```

**Advantages:**
- ✅ Single port to open in firewall
- ✅ No CORS issues
- ✅ Cleaner URLs
- ✅ Standard setup

**Setup:**
1. Frontend on port 80 as main site
2. Backend as application under frontend site at `/api`
3. Or use IIS URL Rewrite to proxy `/api` to port 7009

#### Option B: Separate Ports (Current Setup)
```
http://yourserver:80           → Frontend
http://yourserver:7009         → Backend (direct)
```

**Advantages:**
- ✅ Simple to set up
- ✅ Backend can be restarted independently
- ✅ Matches your Program.cs configuration

**Disadvantages:**
- ⚠️ Need to manage CORS
- ⚠️ Two ports to open in firewall
- ⚠️ More complex networking

---

## 🔨 Implementation

### Current Configuration (After Fix)

**Development:**
```powershell
# Backend
cd C:\dev\Hyoung.FMS\FMS.WebClient
dotnet run
# Runs on: http://localhost:7009

# Frontend
cd C:\dev\Hyoung.FMS\fms.frontend
npm start
# Runs on: http://localhost:3000
# Configure to call: http://localhost:7009/api
```

**Production (IIS):**
```powershell
# Run setup
.\setup-iis-hyoungfms.ps1
# Creates:
#   Backend:  http://localhost:7009
#   Frontend: http://localhost:80
```

**Frontend Environment Configuration:**
```javascript
// fms.frontend/.env.development
REACT_APP_API_URL=http://localhost:7009

// fms.frontend/.env.production
REACT_APP_API_URL=http://10.0.10.153:7009
```

---

## 🛠️ Configuration Files to Update

### 1. Update Frontend API URL

**File**: `fms.frontend/src/api/config.js` (or similar)
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:7009'
    : 'http://10.0.10.153:7009');

export default API_BASE_URL;
```

### 2. Enable CORS in Backend

**File**: `FMS.WebClient/Program.cs` or startup configuration
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",      // Development
            "http://10.0.10.153",         // Production frontend
            "http://10.0.10.153:80"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Later in pipeline:
app.UseCors("AllowFrontend");
```

### 3. Update IIS web.config (if needed)

**File**: `C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config`

The backend web.config should reference the correct DLL:
```xml
<aspNetCore processPath="dotnet" 
            arguments=".\FMS.WebClient.dll"
            stdoutLogEnabled="true" 
            stdoutLogFile=".\logs\stdout" 
            hostingModel="inprocess" />
```

---

## ✅ Verification Checklist

After deployment, verify:

### Backend Checks:
```powershell
# Test backend directly
Invoke-WebRequest -Uri "http://localhost:7009/api/health" -UseBasicParsing

# Check from network
Invoke-WebRequest -Uri "http://10.0.10.153:7009/api/health" -UseBasicParsing
```

### Frontend Checks:
```powershell
# Test frontend
Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing

# Check from network
Invoke-WebRequest -Uri "http://10.0.10.153:80" -UseBasicParsing
```

### Integration Check:
1. Open frontend: `http://10.0.10.153:80`
2. Open browser DevTools (F12)
3. Check Network tab
4. Should see calls to: `http://10.0.10.153:7009/api/...`
5. Verify no CORS errors

---

## 🐛 Common Issues

### Issue 1: "Port 7009 already in use"
```powershell
# Check what's using it
netstat -ano | findstr :7009

# Stop IIS site
.\control-iis.ps1 -Stop -BackendOnly

# Or kill the process
# (Use PID from netstat output)
Stop-Process -Id <PID> -Force
```

### Issue 2: "CORS policy error"
- Backend needs CORS configuration
- Check `Program.cs` for `AddCors` and `UseCors`
- Verify frontend URL is in allowed origins

### Issue 3: "Cannot connect to backend from frontend"
```javascript
// Check frontend is using correct URL
console.log('API URL:', process.env.REACT_APP_API_URL);

// Test backend directly in browser:
// http://10.0.10.153:7009/api/health
```

### Issue 4: "npm start on port 3000 conflicts"
```powershell
# Change port for development
# Create .env file:
PORT=3001

# Or use:
$env:PORT=3001; npm start
```

---

## 📚 Summary

| Environment | Backend Port | Frontend Port | Usage |
|-------------|--------------|---------------|-------|
| **Development** | 7009 | 3000 | `dotnet run`, `npm start` |
| **Production (IIS)** | 7009 | 80 | IIS hosted |

**Key Points:**
- ✅ Backend always uses **7009** (Program.cs configuration)
- ✅ Frontend uses **3000** for development (`npm start`)
- ✅ Frontend uses **80** for production (IIS)
- ✅ Frontend must be configured to call backend at **:7009**
- ✅ CORS must be enabled in backend for frontend origin

---

## 🚀 Quick Commands

```powershell
# Check ports in use
netstat -ano | findstr ":7009 :80 :3000"

# Test backend
curl http://localhost:7009/api/health

# Test frontend
curl http://localhost:80

# View IIS sites
Get-Website | Select-Object Name, PhysicalPath, Bindings

# Restart sites
.\control-iis.ps1 -Restart
```

---

**Updated configuration files are ready! Run the setup script to apply changes.** ✅
