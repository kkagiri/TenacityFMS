# Fix Applied: GitHub Actions Locked Files Issue

## Date: October 7, 2025

## Problem
GitHub Actions deployment was failing with:
```
Error: EBUSY: resource busy or locked, rmdir 
'C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend'
```

Additional issue: `pwsh: command not found` - PowerShell Core not available on runner.

## Root Causes
1. **Node.js processes** from previous builds weren't terminating
2. **File handles** remained open on `node_modules` and `build` directories
3. **Wrong shell**: Workflow used `pwsh` (PowerShell Core) but runner only has `powershell` (Windows PowerShell)
4. **Cleanup step didn't run**: Checkout step failed BEFORE cleanup could execute

## Solutions Applied

### 1. Fixed Shell Issue ✅
- Changed ALL `shell: pwsh` to `shell: powershell` throughout workflow
- This ensures compatibility with Windows PowerShell 5.1 on self-hosted runner

### 2. Enhanced Pre-Checkout Cleanup ✅
Updated the cleanup step to:
- Use hardcoded workspace path: `C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS`
- Kill Node.js processes that match `*actions-runner*` path
- Wait 5 seconds for file handles to release
- Remove both `node_modules` AND `build` folders
- Added explicit status messages for debugging

### 3. Created Emergency Cleanup Script ✅
New file: `scripts/emergency-cleanup.ps1`
- Kills ALL Node.js processes (not just runner-specific ones)
- Uses `robocopy` to mirror empty directory (fastest method for locked files)
- Provides detailed status output
- Can be run manually when needed

### 4. Enhanced npm Install Step ✅
- Cleans `node_modules` before install
- Better error handling and logging
- Uses `npm ci` for deterministic installs

### 5. Post-Deployment Cleanup ✅
- Runs ALWAYS (even on failure)
- Stops lingering Node processes
- Cleans npm cache
- Prepares for next run

## Files Changed

1. `.github/workflows/deploy-to-iis.yml` - Main workflow fixes
2. `scripts/cleanup-runner-workspace.ps1` - Regular cleanup script
3. `scripts/emergency-cleanup.ps1` - **NEW** Emergency cleanup
4. `Documentation/Deployment/locked-files-issue.md` - Full documentation
5. `LOCKED_FILES_FIX.md` - Quick reference guide

## How to Use

### Automatic (Recommended)
Just **retry the failed workflow** - the new cleanup steps will handle everything automatically.

### Manual Cleanup (If Needed)
On the runner server (HY-FMS), as Administrator:

```powershell
# Quick cleanup
cd C:\dev\Hyoung.FMS
.\scripts\emergency-cleanup.ps1

# Then retry the workflow from GitHub
```

### Emergency Manual Fix
If scripts don't work:

```powershell
# Kill all Node processes
Get-Process -Name "node" | Stop-Process -Force

# Wait
Start-Sleep -Seconds 5

# Nuclear option: remove workspace
Remove-Item "C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS" -Recurse -Force
```

## Verification Steps

After committing these changes:

1. ✅ All PowerShell steps use `shell: powershell`
2. ✅ Pre-checkout cleanup runs first (with `continue-on-error: true`)
3. ✅ Cleanup uses correct workspace path
4. ✅ Post-deployment cleanup always runs
5. ✅ Emergency cleanup script available

## Testing Checklist

- [ ] Commit and push changes to `productionv1` branch
- [ ] Workflow triggers automatically
- [ ] Observe "🧹 Cleanup Locked Files" step runs successfully
- [ ] Checkout succeeds
- [ ] Backend and frontend build/deploy succeed
- [ ] Post-deployment cleanup runs

## Expected Workflow Behavior

```
1. 🧹 Cleanup Locked Files (NEW - should show cleanup messages)
2. 📥 Checkout Code (should succeed now)
3. 🔧 Setup .NET
4. 🔧 Setup Node.js
5. 🔨 Build Backend
6. 🔄 Deploy Backend
7. 📦 Install Frontend Dependencies (with cleanup)
8. 🔨 Build Frontend
9. 🔄 Deploy Frontend
10. ✅ Verify Deployment
11. 🧹 Post-Deployment Cleanup (always runs)
```

## Prevention

The workflow is now self-healing:
- **Before each run**: Clean workspace
- **During frontend install**: Clean node_modules
- **After each run**: Kill processes and clean cache

This should prevent the locked files issue from recurring.

## Rollback Plan

If these changes cause issues:

```powershell
git revert HEAD
git push origin productionv1
```

## Next Steps

1. **Commit these changes**:
   ```powershell
   git add .
   git commit -m "fix: Resolve locked files in GitHub Actions (use PowerShell, add robust cleanup)"
   git push origin productionv1
   ```

2. **Monitor the deployment** - watch for the cleanup steps in action

3. **If still failing**: Run `.\scripts\emergency-cleanup.ps1` manually on runner server

## Status
- [x] Shell compatibility fixed (pwsh → powershell)
- [x] Pre-checkout cleanup enhanced
- [x] Emergency cleanup script created
- [x] Documentation updated
- [ ] Changes committed and pushed (NEXT STEP)
- [ ] Workflow tested

---

**Created by**: GitHub Copilot
**Date**: October 7, 2025
**Branch**: productionv1
