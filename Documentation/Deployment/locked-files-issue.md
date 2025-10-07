# GitHub Actions Deployment - Locked Files Issue

## Problem

When using `act### Option 2: Manual Cleanup
```powershell
# Connect to the self-hosted runner server
# Run as Administrator:
.\scripts\cleanup-runner-workspace.ps1

# Then retry the workflow
```

### Option 3: Reset Runner (When Nothing Else Works)
If files are still locked after cleanup, reset the runner:

```powershell
# As Administrator:
.\scripts\reset-runner-workspace.ps1

# This will:
# 1. Stop the runner service
# 2. Kill lingering processes
# 3. Clear the workspace completely
# 4. Restart the runner service
```

### Option 4: Emergency Manual Cleanupcheckout@v4` in a self-hosted GitHub Actions runner on Windows, the checkout step may fail with:

```
Error: File was unable to be removed Error: EBUSY: resource busy or locked, rmdir 'C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend'
```

## Root Cause

This happens when:

1. Node.js processes from previous builds are still running
2. File handles are still held by npm or other processes
3. Windows file system locks haven't been released

## Solutions Implemented

### 1. Pre-Checkout Cleanup Step (Automatic)

The workflow now includes a cleanup step before checkout that:

- Stops any lingering Node.js processes
- Removes locked `node_modules` directories
- Waits for file handles to be released

```yaml
- name: 🧹 Cleanup Locked Files
  continue-on-error: true
  run: |
    # Stop Node.js processes and cleanup locked files
```

### 2. Enhanced Frontend Build (Automatic)

The frontend build step now:

- Cleans existing `node_modules` before install
- Provides better error messages
- Uses `npm ci` for clean installs

### 3. Post-Deployment Cleanup (Automatic)

A cleanup step runs after deployment (even on failure) to:

- Stop lingering processes
- Clean npm cache
- Prepare for next deployment

### 4. Manual Cleanup Script (When Needed)

If the automatic cleanup doesn't work, run this script manually:

```powershell
# Run as Administrator
.\scripts\cleanup-runner-workspace.ps1
```

This script will:

1. Stop all Node.js processes in the runner workspace
2. Remove locked directories using multiple methods
3. Clean the entire runner workspace if needed

## Quick Fix During Deployment Failure

If a deployment fails with the locked files error:

### Option 1: Retry the Workflow

Simply re-run the failed workflow. The cleanup step will handle it.

### Option 2: Manual Cleanup

```powershell
# Connect to the self-hosted runner server
# Run as Administrator:
.\scripts\cleanup-runner-workspace.ps1

# Then retry the workflow
```

### Option 3: Emergency Cleanup

```powershell
# As Administrator on the runner server:

# Stop all Node.js processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 5

# Remove the workspace
Remove-Item "C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS" -Recurse -Force

# Retry the workflow
```

## Prevention Tips

### 1. Ensure Clean Shutdowns

Make sure your GitHub Actions runner service shuts down cleanly:

```powershell
# Check runner service
Get-Service "actions.runner.*"

# If needed, restart the service
Restart-Service "actions.runner.*"
```

### 2. Regular Maintenance

Run the cleanup script weekly:

```powershell
# Add to Windows Task Scheduler
.\scripts\cleanup-runner-workspace.ps1
```

### 3. Monitor Processes

Keep an eye on lingering Node.js processes:

```powershell
Get-Process -Name "node" | Where-Object { $_.Path -like "*actions-runner*" }
```

## Workflow Changes Made

The workflow file `deploy-to-iis.yml` now includes:

1. **Pre-checkout cleanup** (before the checkout step)
2. **Enhanced npm install** (with cleanup before install)
3. **Post-deployment cleanup** (runs always, even on failure)

These changes make the deployment more robust and self-healing.

## Troubleshooting

### Issue: Cleanup script doesn't work

**Solution**: Run as Administrator

```powershell
Start-Process powershell -Verb RunAs -ArgumentList "-File", ".\scripts\cleanup-runner-workspace.ps1"
```

### Issue: Files still locked after cleanup

**Solution**: Use Handle.exe from Sysinternals

```powershell
# Download Handle.exe from Sysinternals
# Find what's locking the files:
handle.exe "fms.frontend" -accepteula

# Then close those handles or restart the process
```

### Issue: Runner service is unresponsive

**Solution**: Restart the runner service

```powershell
Stop-Service "actions.runner.*"
Start-Sleep -Seconds 10
Start-Service "actions.runner.*"
```

## Best Practices

1. **Always use `continue-on-error: true`** for cleanup steps
2. **Add delays** (`Start-Sleep`) after stopping processes
3. **Use `npm ci`** instead of `npm install` in CI/CD
4. **Clean node_modules** before install in CI/CD
5. **Run cleanup** after each deployment (success or failure)

## Related Files

- Workflow: `.github/workflows/deploy-to-iis.yml`
- Cleanup Script: `scripts/cleanup-runner-workspace.ps1`
- This Documentation: `Documentation/Deployment/locked-files-issue.md`

## Additional Resources

- [GitHub Actions Checkout Action](https://github.com/actions/checkout)
- [Windows File Locking](https://docs.microsoft.com/en-us/windows/win32/fileio/file-management-functions)
- [npm ci Documentation](https://docs.npmjs.com/cli/v8/commands/npm-ci)
