# 🚀 CI/CD Setup Guide for Tenacy FMS

## Overview

This guide will help you set up automated deployments from your development workspace to IIS using GitHub Actions.

## 📋 Prerequisites

✅ IIS configured (already done via `setup-iis-tenacyfms.ps1`)
✅ GitHub Actions self-hosted runner installed
✅ Development workspace ready

## 🎯 Setup Steps

### Step 1: Set Up Development Workspace

The development workspace keeps your `.git` folder safe from deletion that happens in the runner workspace.

```powershell
# Create development workspace
mkdir C:\dev\Tenacy.FMS

# Clone your repository
cd C:\dev
git clone https://github.com/kagz100/Tenacy.FMS.git
cd Tenacy.FMS

# Checkout your production branch
git checkout productionv1
```

### Step 2: Copy Deployment Scripts to Dev Workspace

From the runner workspace, copy the deployment scripts:

```powershell
# Run this from the runner workspace
$runnerPath = "C:\actions-runner\_work\Tenacy.FMS\Tenacy.FMS"
$devPath = "C:\dev\Tenacy.FMS"

# Copy all deployment scripts
Copy-Item "$runnerPath\setup-iis-tenacyfms.ps1" "$devPath\" -Force
Copy-Item "$runnerPath\control-iis.ps1" "$devPath\" -Force
Copy-Item "$runnerPath\deploy-manual.ps1" "$devPath\" -Force
Copy-Item "$runnerPath\deploy-alternative.ps1" "$devPath\" -Force

# Copy workflow (GitHub Actions already has it, but good to have locally)
$workflowSrc = "$runnerPath\.github\workflows\deploy-to-iis.yml"
$workflowDest = "$devPath\.github\workflows"
if (-not (Test-Path $workflowDest)) {
    New-Item -ItemType Directory -Path $workflowDest -Force
}
Copy-Item $workflowSrc $workflowDest -Force

# Copy documentation
Copy-Item "$runnerPath\DEPLOYMENT_GUIDE.md" "$devPath\" -Force -ErrorAction SilentlyContinue
Copy-Item "$runnerPath\PORT_CONFIGURATION_GUIDE.md" "$devPath\" -Force -ErrorAction SilentlyContinue
Copy-Item "$runnerPath\WEB_CONFIG_PROTECTION.md" "$devPath\" -Force -ErrorAction SilentlyContinue
Copy-Item "$runnerPath\QUICK_REFERENCE.md" "$devPath\" -Force -ErrorAction SilentlyContinue
Copy-Item "$runnerPath\CI_CD_SETUP_GUIDE.md" "$devPath\" -Force -ErrorAction SilentlyContinue

Write-Host "✓ Files copied to development workspace" -ForegroundColor Green
```

### Step 3: Test Manual Deployment

Before enabling automatic deployment, test the manual deployment:

```powershell
cd C:\dev\Tenacy.FMS

# Test the alternative deployment method (most reliable)
.\deploy-alternative.ps1

# Or test backend only
.\deploy-alternative.ps1 -BackendOnly

# Or test frontend only
.\deploy-alternative.ps1 -FrontendOnly
```

### Step 4: Commit and Push to Enable CI/CD

Once manual deployment works, commit the deployment files:

```powershell
cd C:\dev\Tenacy.FMS

# Stage the deployment files
git add .github/workflows/deploy-to-iis.yml
git add setup-iis-tenacyfms.ps1
git add control-iis.ps1
git add deploy-manual.ps1
git add deploy-alternative.ps1
git add *.md

# Commit
git commit -m "Add CI/CD deployment automation for IIS"

# Push to trigger automatic deployment
git push origin productionv1
```

### Step 5: Monitor the Deployment

Watch the deployment in GitHub Actions:

1. Go to your repository on GitHub
2. Click "Actions" tab
3. You'll see "Deploy Tenacy FMS to IIS" workflow running
4. Click on it to see detailed progress

Or monitor locally on the runner:

```powershell
# Check runner status
cd C:\actions-runner
Get-Content _diag\Runner_*.log -Tail 50
```

## 🔄 How CI/CD Works

### Automatic Deployment Trigger

The workflow triggers automatically when you:
- Push to `productionv1`, `main`, or `master` branch
- Manually trigger via GitHub Actions UI (workflow_dispatch)

### Deployment Process (Folder Swap Method)

**Backend:**
1. Builds .NET project to temporary folder (`webAPI_temp_[timestamp]`)
2. Copies existing `web.config` to temp folder
3. Stops IIS app pool
4. Renames `webAPI` → `webAPI_old` (instant, atomic)
5. Renames `webAPI_temp` → `webAPI` (instant, atomic)
6. Starts IIS app pool
7. Cleans up old folder

**Frontend:**
1. Runs `npm ci` and `npm run build`
2. Copies build to temporary folder
3. Copies existing `web.config` to temp folder
4. Stops IIS app pool
5. Atomic folder swap
6. Starts IIS app pool
7. Cleans up

### Why Folder Swap is Better

✅ **No file locking issues** - Never touches running files
✅ **Atomic operation** - Folder rename is instant
✅ **Automatic rollback** - Old version kept as backup
✅ **Zero downtime** - Very fast swap operation
✅ **web.config preserved** - Always copied to new deployment

## 📁 Workspace Structure

```
C:\dev\Tenacy.FMS\                    # Development workspace (safe .git)
├── .github\
│   └── workflows\
│       └── deploy-to-iis.yml         # CI/CD workflow
├── FMS.WebClient\                    # Backend project
├── fms.frontend\                     # Frontend project
├── setup-iis-tenacyfms.ps1          # One-time IIS setup
├── control-iis.ps1                   # IIS control script
├── deploy-manual.ps1                 # Manual deployment (method 1)
├── deploy-alternative.ps1            # Manual deployment (method 2 - recommended)
└── *.md                              # Documentation

C:\actions-runner\_work\Tenacy.FMS\   # Runner workspace (temporary)
└── Tenacy.FMS\                       # Code checkout for CI/CD
    └── (same structure, .git may be cleaned)

C:\inetpub\wwwroot\tenacyFMS\         # IIS deployment location
├── webAPI\                           # Backend (port 7009)
│   └── web.config                    # Never modified
└── reactApp\                         # Frontend (port 80)
    └── web.config                    # Never modified
```

## 🎛️ IIS Control Commands

```powershell
# Check status
.\control-iis.ps1 -Status

# Stop both sites
.\control-iis.ps1 -Stop

# Start both sites
.\control-iis.ps1 -Start

# Restart both sites
.\control-iis.ps1 -Restart

# Control specific site
.\control-iis.ps1 -Stop -Backend     # Stop only backend
.\control-iis.ps1 -Start -Frontend   # Start only frontend
```

## 🔧 Manual Deployment Options

### Option 1: Alternative Method (Recommended)
```powershell
.\deploy-alternative.ps1              # Deploy both
.\deploy-alternative.ps1 -BackendOnly
.\deploy-alternative.ps1 -FrontendOnly
```

### Option 2: Direct Method
```powershell
.\deploy-manual.ps1                   # Deploy both
.\deploy-manual.ps1 -BackendOnly
.\deploy-manual.ps1 -FrontendOnly
```

## 🌐 Application Access

After deployment, access your application:

- **Backend API:** http://localhost:7009
- **Frontend App:** http://localhost:80 (or just http://localhost)

## 🛠️ Troubleshooting

### Deployment Fails with File Locking

Use the alternative deployment method:
```powershell
.\deploy-alternative.ps1
```

### Check IIS Status

```powershell
.\control-iis.ps1 -Status
```

### View Application Logs

```powershell
# Backend logs
Get-Content C:\inetpub\wwwroot\tenacyFMS\webAPI\logs\* -Tail 50

# IIS logs
Get-Content C:\inetpub\logs\LogFiles\W3SVC*\*.log -Tail 50
```

### Restart IIS Completely

```powershell
iisreset
```

### Check Runner Status

```powershell
cd C:\actions-runner
Get-Content _diag\Runner_*.log -Tail 100
```

### Workflow Not Triggering

1. Check GitHub Actions is enabled in repository settings
2. Verify runner is online: Check "Settings" → "Actions" → "Runners"
3. Check workflow file exists in `.github/workflows/`
4. Verify branch name matches trigger (productionv1, main, or master)

### Build Fails

```powershell
# Test backend build locally
cd C:\dev\Tenacy.FMS
dotnet restore FMS.WebClient\FMS.WebClient.csproj
dotnet build FMS.WebClient\FMS.WebClient.csproj --configuration Release

# Test frontend build locally
cd fms.frontend
npm install
npm run build
```

## 📊 Deployment Workflow Timeline

Typical deployment takes **3-5 minutes**:

- ✓ Checkout code: 10-20 seconds
- ✓ Setup .NET/Node: 10-30 seconds
- ✓ Backend build: 60-90 seconds
- ✓ Backend deploy: 20-30 seconds
- ✓ Frontend build: 60-120 seconds
- ✓ Frontend deploy: 20-30 seconds
- ✓ Verification: 5-10 seconds

## 🔐 Security Notes

- **web.config files** are never overwritten (contain sensitive connection strings)
- Deployment scripts preserve existing configurations
- Old deployments are cleaned up after successful swap
- No credentials stored in workflow file

## ✅ Validation Checklist

After setup, verify:

- [ ] Development workspace created at `C:\dev\Tenacy.FMS`
- [ ] All deployment scripts copied to dev workspace
- [ ] Manual deployment tested and successful
- [ ] Deployment scripts committed to repository
- [ ] GitHub Actions workflow visible in repository
- [ ] First automatic deployment completed successfully
- [ ] Backend accessible at http://localhost:7009
- [ ] Frontend accessible at http://localhost:80
- [ ] web.config files preserved in both locations
- [ ] No file locking errors during deployment

## 🎓 Best Practices

1. **Always work in dev workspace** (`C:\dev\Tenacy.FMS`)
2. **Test locally before pushing** (use `deploy-alternative.ps1`)
3. **Monitor first deployment** after pushing
4. **Keep backups** of web.config files separately
5. **Use meaningful commit messages** for deployment tracking
6. **Check IIS status** after deployment

## 📞 Quick Commands Reference

```powershell
# Development workflow
cd C:\dev\Tenacy.FMS
git pull origin productionv1
# Make your changes
.\deploy-alternative.ps1           # Test locally
git add .
git commit -m "Your changes"
git push origin productionv1       # Triggers CI/CD

# Check deployment status
.\control-iis.ps1 -Status

# View running application
start http://localhost:7009        # Backend
start http://localhost:80          # Frontend
```

## 🎉 You're All Set!

Your CI/CD pipeline is now ready. Every push to `productionv1` branch will automatically:
1. Build your backend and frontend
2. Deploy to IIS using atomic folder swap
3. Preserve web.config files
4. Start the applications

Happy deploying! 🚀
