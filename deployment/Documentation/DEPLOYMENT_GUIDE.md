# Complete Deployment & Development Guide for Hyoung FMS

## 🎯 Quick Start

### First Time Setup (Run Once):
```powershell
# 1. Setup IIS (as Administrator)
.\setup-iis-hyoungfms.ps1

# 2. Test IIS is working
.\control-iis.ps1 -Status

# 3. Deploy your code
.\deploy-manual.ps1
```

### Daily Development:
```powershell
# 1. Open your dev workspace
code C:\dev\Hyoung.FMS

# 2. Make changes...

# 3. Push to GitHub (auto-deploys)
git add .
git commit -m "Your changes"
git push
```

---

## 📁 Directory Structure

```
C:\dev\Hyoung.FMS\                          ← Development (WORK HERE!)
├── FMS.WebClient\                          ← Backend (.NET)
├── fms.frontend\                           ← Frontend (React)
├── .github\workflows\deploy-to-iis.yml     ← CI/CD
├── setup-iis-hyoungfms.ps1                 ← IIS Setup
├── deploy-manual.ps1                       ← Manual Deploy
├── control-iis.ps1                         ← IIS Control
└── DEPLOYMENT_GUIDE.md                     ← This file

C:\inetpub\wwwroot\hyoungFMS\               ← IIS Deployment (AUTO!)
├── webAPI\                                 ← Backend deployed here
│   └── web.config                          ← Never overwritten
└── reactApp\                               ← Frontend deployed here
    └── web.config                          ← Never overwritten

C:\actions-runner\_work\                    ← GitHub Actions (DON'T TOUCH!)
```

---

## 🚀 Setup Instructions

### Step 1: Setup IIS (One Time Only)

Run as **Administrator**:

```powershell
cd c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS
.\setup-iis-hyoungfms.ps1
```

This creates:
- ✅ IIS App Pools: `HyoungFMS.WebAPI` and `HyoungFMS.ReactApp`
- ✅ IIS Websites on ports 5000 and 3000
- ✅ Folders: `C:\inetpub\wwwroot\hyoungFMS\webAPI` and `reactApp`
- ✅ web.config files with proper settings
- ✅ Correct permissions

### Step 2: Verify IIS Setup

```powershell
# Check status
.\control-iis.ps1 -Status

# Should show both sites as "Started"
```

Visit:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Step 3: First Deployment

```powershell
# Deploy everything
.\deploy-manual.ps1

# Or deploy individually
.\deploy-manual.ps1 -BackendOnly
.\deploy-manual.ps1 -FrontendOnly
```

### Step 4: Commit CI/CD Workflow

```powershell
cd C:\dev\Hyoung.FMS

# Copy workflow from runner
Copy-Item c:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\.github\workflows\deploy-to-iis.yml .\.github\workflows\

# Commit and push
git add .github\workflows\deploy-to-iis.yml
git commit -m "Add IIS deployment workflow"
git push
```

---

## 💻 Development Workflow

### Option 1: Automatic Deployment (Recommended)

```powershell
# 1. Work in dev workspace
cd C:\dev\Hyoung.FMS
code .

# 2. Make changes...

# 3. Commit and push (triggers auto-deploy)
git add .
git commit -m "Updated tank delivery form"
git push

# 4. Monitor deployment
# Go to: https://github.com/kagz100/Hyoung.FMS/actions
# Wait ~3-5 minutes for automatic deployment
```

### Option 2: Manual Deployment (Emergency)

```powershell
cd C:\dev\Hyoung.FMS

# Full deployment
.\deploy-manual.ps1

# Backend only (faster)
.\deploy-manual.ps1 -BackendOnly

# Frontend only (faster)
.\deploy-manual.ps1 -FrontendOnly

# Use existing build (fastest)
.\deploy-manual.ps1 -SkipBuild
```

---

## 🛠️ Common Tasks

### Control IIS

```powershell
# Check status
.\control-iis.ps1 -Status

# Stop both sites
.\control-iis.ps1 -Stop

# Start both sites
.\control-iis.ps1 -Start

# Restart both sites
.\control-iis.ps1 -Restart

# Stop only backend
.\control-iis.ps1 -Stop -BackendOnly

# Restart only frontend
.\control-iis.ps1 -Restart -FrontendOnly
```

### View Logs

```powershell
# Backend logs
Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\stdout*.log" -Tail 50

# Watch logs in real-time
Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\stdout*.log" -Wait -Tail 20

# GitHub Actions logs
# Visit: https://github.com/kagz100/Hyoung.FMS/actions
```

### Test Locally Before Deploying

```powershell
# Backend
cd C:\dev\Hyoung.FMS\FMS.WebClient
dotnet run

# Frontend
cd C:\dev\Hyoung.FMS\fms.frontend
npm start
# Visit: http://localhost:3000
```

---

## 🔧 Troubleshooting

### Problem: Files Won't Deploy (File in Use)

```powershell
# Force stop IIS
.\control-iis.ps1 -Stop
Start-Sleep -Seconds 5

# Try deployment again
.\deploy-manual.ps1
```

### Problem: Backend 500 Error

```powershell
# Check logs
Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\stdout*.log" -Tail 100

# Restart backend
.\control-iis.ps1 -Restart -BackendOnly

# Check web.config exists
Test-Path "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config"
```

### Problem: Frontend Shows Old Version

```powershell
# Clear browser cache (Ctrl+Shift+Delete)

# Force rebuild and redeploy
cd C:\dev\Hyoung.FMS\fms.frontend
Remove-Item build -Recurse -Force
cd ..
.\deploy-manual.ps1 -FrontendOnly
```

### Problem: CI/CD Not Triggering

```powershell
# Check runner is running
cd C:\actions-runner
.\run.cmd

# Or restart runner service
.\svc.bat stop
.\svc.bat start

# Check GitHub Actions settings
# https://github.com/kagz100/Hyoung.FMS/settings/actions/runners
```

### Problem: web.config Getting Overwritten

The scripts should preserve web.config automatically. If not:

```powershell
# Restore from backup
Copy-Item "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config.backup" `
          "C:\inetpub\wwwroot\hyoungFMS\webAPI\web.config" -Force
```

---

## 📊 Deployment Timeline

### Automatic (CI/CD):
- **0:00** - Push to GitHub
- **0:30** - Runner picks up job
- **1:00** - Build backend
- **2:00** - Build frontend
- **3:00** - Stop IIS
- **3:30** - Deploy files
- **4:00** - Restart IIS
- **4:30** - ✅ Complete

### Manual:
- **0:00** - Run script
- **0:30** - Backend deployed
- **1:00** - Frontend deployed
- **1:30** - ✅ Complete

---

## 📝 Configuration Reference

### IIS App Pools
- Backend: `HyoungFMS.WebAPI` (No Managed Code)
- Frontend: `HyoungFMS.ReactApp` (No Managed Code)

### IIS Sites
- Backend: `HyoungFMS.WebAPI` (Port 5000)
- Frontend: `HyoungFMS.ReactApp` (Port 3000)

### Paths
- Backend Deploy: `C:\inetpub\wwwroot\hyoungFMS\webAPI`
- Frontend Deploy: `C:\inetpub\wwwroot\hyoungFMS\reactApp`
- Backend Logs: `C:\inetpub\wwwroot\hyoungFMS\webAPI\logs`

### Projects
- Backend: `FMS.WebClient\FMS.WebClient.csproj`
- Frontend: `fms.frontend`

---

## ✅ Best Practices

1. ✅ **Always work in** `C:\dev\Hyoung.FMS`
2. ✅ **Never edit files** in `C:\inetpub\wwwroot` directly
3. ✅ **Use CI/CD** for normal deployments
4. ✅ **Use manual deploy** only for emergencies
5. ✅ **Commit frequently** with descriptive messages
6. ✅ **Test locally** before pushing
7. ✅ **Monitor deployments** in GitHub Actions
8. ✅ **Check logs** when issues occur
9. ✅ **Keep runner running** as Windows service
10. ✅ **Preserve web.config** (scripts do this)

---

## 🆘 Quick Commands Reference

```powershell
# IIS Control
.\control-iis.ps1 -Status          # Check status
.\control-iis.ps1 -Restart         # Restart all
.\control-iis.ps1 -Stop            # Stop all

# Deployment
.\deploy-manual.ps1                # Deploy all
.\deploy-manual.ps1 -BackendOnly   # Backend only
.\deploy-manual.ps1 -FrontendOnly  # Frontend only

# Logs
Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\stdout*.log" -Tail 50

# IIS Management
iisreset                           # Reset IIS completely
Get-Website                        # List all sites
Get-WebAppPoolState -Name "HyoungFMS.WebAPI"  # Check app pool
```

---

## 🎓 Understanding the Workflow

```
Developer → Git Push → GitHub → Actions Runner → IIS Deployment
    ↓           ↓          ↓           ↓               ↓
C:\dev    GitHub.com   Webhook   Build/Deploy   C:\inetpub
```

1. You make changes in `C:\dev\Hyoung.FMS`
2. Push to GitHub repository
3. GitHub triggers workflow on self-hosted runner
4. Runner builds and deploys to IIS folders
5. IIS serves your application

---

## 📞 Need Help?

### Check These First:
1. IIS Status: `.\control-iis.ps1 -Status`
2. Logs: `Get-Content "C:\inetpub\wwwroot\hyoungFMS\webAPI\logs\stdout*.log" -Tail 50`
3. GitHub Actions: https://github.com/kagz100/Hyoung.FMS/actions

### Emergency Recovery:
```powershell
# Full reset
.\control-iis.ps1 -Stop
Start-Sleep -Seconds 5
.\deploy-manual.ps1
```

---

**🎉 You're all set! Start coding and push to deploy!** 🚀
