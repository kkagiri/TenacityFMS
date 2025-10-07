# Quick Fix: GitHub Actions Locked Files Error

## The Problem You're Experiencing

```
Error: File was unable to be removed
Error: EBUSY: resource busy or locked, rmdir
'C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend'
```

## ✅ Solution Applied

I've updated your GitHub Actions workflow with automatic cleanup steps that will:

1. **Pre-Checkout Cleanup**: Stop Node.js processes and clean locked files before checkout
2. **Enhanced Build Process**: Clean node_modules before npm install
3. **Post-Deployment Cleanup**: Always cleanup after deployment (even on failure)

## 🚀 Next Steps

### Option 1: Just Retry (Recommended)

Simply **re-run the failed workflow** from GitHub Actions. The new cleanup steps will handle the locked files automatically.

### Option 2: Manual Cleanup (If retry doesn't work)

If you have access to the self-hosted runner server:

```powershell
# On the runner server, run as Administrator:
cd C:\dev\Hyoung.FMS
.\scripts\cleanup-runner-workspace.ps1
```

Then retry the workflow.

### Option 3: Emergency Manual Cleanup

On the runner server as Administrator:

```powershell
# Stop Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait
Start-Sleep -Seconds 5

# Remove workspace
Remove-Item "C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS" -Recurse -Force

# Retry workflow
```

## 📝 What Changed

### 1. Workflow File (`.github/workflows/deploy-to-iis.yml`)

- Added pre-checkout cleanup step
- Enhanced npm install with cleanup
- Added post-deployment cleanup (runs always)

### 2. New Cleanup Script (`scripts/cleanup-runner-workspace.ps1`)

Manual cleanup script for emergencies

### 3. Documentation (`Documentation/Deployment/locked-files-issue.md`)

Complete troubleshooting guide

## ⚡ Test Your Fix

1. Commit and push these changes:

   ```powershell
   git add .
   git commit -m "fix: Add automatic cleanup for locked files in GitHub Actions"
   git push origin productionv1
   ```

2. The workflow will trigger automatically

3. Monitor the deployment - you should see the new cleanup steps running

## 🔍 Monitoring

Watch for these new steps in your GitHub Actions logs:

- 🧹 Cleanup Locked Files (before checkout)
- 📦 Install Frontend Dependencies (with cleanup)
- 🧹 Post-Deployment Cleanup (at the end)

## 💡 Why This Happened

Node.js processes from previous builds weren't fully terminating, leaving file handles open. The new workflow ensures proper cleanup between builds.

## 📞 If You Still Have Issues

Check the detailed documentation at:
`Documentation/Deployment/locked-files-issue.md`

Or run the diagnostic:

```powershell
# See what's locking files
Get-Process -Name "node" | Where-Object { $_.Path -like "*actions-runner*" }
```

---

**Summary**: The workflow is now self-healing. Just retry your deployment and it should work! 🎉
