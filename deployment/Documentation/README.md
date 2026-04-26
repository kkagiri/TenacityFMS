# 📦 Tenacy FMS - Deployment & Documentation

This folder contains all CI/CD deployment scripts and documentation for Tenacy FMS.

---

## 🚀 Quick Start

### First Time Setup?
```powershell
# 1. Read this first
notepad START_HERE.md

# 2. Test deployment
.\deploy-alternative.ps1

# 3. Check status
.\control-iis.ps1 -Status
```

---

## 📂 What's in This Folder

### PowerShell Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-iis-tenacyfms.ps1` | One-time IIS configuration | Already done ✓ |
| `control-iis.ps1` | IIS management | Start/stop/restart/status |
| `deploy-alternative.ps1` | Manual deployment (folder swap) | **Recommended for testing** |
| `deploy-manual.ps1` | Manual deployment (direct) | Alternative method |
| `copy-to-dev.ps1` | Copy files to dev workspace | After updates |

### Documentation Files

| Document | What It Covers |
|----------|----------------|
| **START_HERE.md** | 👈 **Read this first!** |
| **CHECKLIST.md** | Track your setup progress |
| **CI_CD_SETUP_GUIDE.md** | Complete setup instructions |
| **CI_CD_FLOW_EXPLAINED.md** | How CI/CD works in detail |
| **FOLDER_SWAP_EXPLAINED.md** | Deep dive into deployment technique |
| **DEPLOYMENT_GUIDE.md** | Deployment details & troubleshooting |
| **PORT_CONFIGURATION_GUIDE.md** | Port 7009 vs 80 vs 3000 explained |
| **WEB_CONFIG_PROTECTION.md** | How web.config files are protected |
| **QUICK_REFERENCE.md** | Command cheat sheet |
| **IMPLEMENTATION_COMPLETE.md** | Getting started overview |

---

## 🎯 Important Paths

```
Development Workspace:  C:\dev\Tenacy.FMS
    └── Work here, commit & push from here

Runner Workspace:       C:\actions-runner\_work\Tenacy.FMS\Tenacy.FMS
    └── Temporary, used during CI/CD only

IIS Backend:            C:\inetpub\wwwroot\tenacyFMS\webAPI
    └── Production backend (port 7009)

IIS Frontend:           C:\inetpub\wwwroot\tenacyFMS\reactApp
    └── Production frontend (port 80)

Deployment Docs:        C:\dev\deployment
    └── This folder (scripts & documentation)
```

---

## 🔧 Environment Variables (GitHub Actions)

These are configured in `.github/workflows/deploy-to-iis.yml`:

```yaml
env:
  BACKEND_PROJECT: 'FMS.WebClient/FMS.WebClient.csproj'
  FRONTEND_PATH: 'fms.frontend'
  IIS_BACKEND_PATH: 'C:\inetpub\wwwroot\tenacyFMS\webAPI'
  IIS_FRONTEND_PATH: 'C:\inetpub\wwwroot\tenacyFMS\reactApp'
  BACKEND_APPPOOL: 'TenacyFMS.WebAPI'
  FRONTEND_APPPOOL: 'TenacyFMS.ReactApp'
```

---

## 📞 Common Commands

### Check Status
```powershell
.\control-iis.ps1 -Status
```

### Deploy Everything
```powershell
.\deploy-alternative.ps1
```

### Deploy Backend Only
```powershell
.\deploy-alternative.ps1 -BackendOnly
```

### Deploy Frontend Only
```powershell
.\deploy-alternative.ps1 -FrontendOnly
```

### Stop IIS
```powershell
.\control-iis.ps1 -Stop
```

### Start IIS
```powershell
.\control-iis.ps1 -Start
```

### Restart IIS
```powershell
.\control-iis.ps1 -Restart
```

### Access Applications
```powershell
# Backend API
start http://localhost:7009

# Frontend App
start http://localhost:80
```

---

## 📚 Reading Order

### For Initial Setup:
1. **START_HERE.md** - Overview and next steps
2. **CHECKLIST.md** - Track your progress
3. **CI_CD_SETUP_GUIDE.md** - Complete setup process

### For Understanding:
4. **CI_CD_FLOW_EXPLAINED.md** - How the CI/CD pipeline works
5. **FOLDER_SWAP_EXPLAINED.md** - Why folder swap is brilliant

### For Reference:
- **QUICK_REFERENCE.md** - Command reference card
- **PORT_CONFIGURATION_GUIDE.md** - Port explanations
- **WEB_CONFIG_PROTECTION.md** - Configuration safety
- **DEPLOYMENT_GUIDE.md** - Troubleshooting guide

---

## 🔄 CI/CD Flow Summary

```
You Push Code (to productionv1 branch)
    ↓
GitHub Actions Triggered Automatically
    ↓
Runner Checks Out Code
    ↓
Builds Backend to Temp Folder (app still running)
    ↓
Stops IIS → Swaps Folders → Starts IIS (13 seconds)
    ↓
Builds Frontend (app running)
    ↓
Stops IIS → Swaps Folders → Starts IIS (13 seconds)
    ↓
Verifies Deployment
    ↓
Done! Total: ~5 minutes, 26 seconds downtime
```

---

## 🛡️ Key Features

✅ **No File Locking** - Folder swap avoids all locking issues  
✅ **web.config Protected** - Never overwritten, always preserved  
✅ **Atomic Deployment** - Instant folder swap, all-or-nothing  
✅ **Automatic Backup** - Old version kept temporarily  
✅ **Easy Rollback** - Just swap folders back  
✅ **Zero Database Migrations** - Not included (as per your requirement)  

---

## 🆘 Quick Troubleshooting

### Application Not Loading?
```powershell
.\control-iis.ps1 -Status      # Check status
.\control-iis.ps1 -Restart     # Restart if needed
```

### Deployment Failed?
```powershell
.\deploy-alternative.ps1       # Try folder swap method
```

### Need to Rollback?
```powershell
cd C:\inetpub\wwwroot\tenacyFMS
Rename-Item webAPI webAPI_broken
Rename-Item webAPI_old webAPI
.\control-iis.ps1 -Restart
```

---

## 📊 Port Configuration

| Service | Development | Production |
|---------|-------------|------------|
| Backend API | N/A | 7009 (IIS) |
| Frontend App | 3000 (`npm start`) | 80 (IIS) |

**Note:** In development, you run `npm start` for frontend (port 3000). In production, IIS serves the built React app on port 80.

---

## ✅ Setup Status

After running setup:
- [x] IIS configured
- [x] App pools created
- [x] Sites running on ports 7009 and 80
- [x] Deployment scripts ready
- [x] Documentation organized

Next steps:
- [ ] Test manual deployment
- [ ] Setup dev workspace at C:\dev\Tenacy.FMS
- [ ] Enable CI/CD by committing workflow

---

## 🎓 Learn More

All documentation is in this folder. Start with **START_HERE.md** and follow the guides!

---

**Location:** C:\dev\deployment  
**Last Updated:** October 7, 2025  
**Repository:** https://github.com/kagz100/Tenacy.FMS  
**Branch:** productionv1
