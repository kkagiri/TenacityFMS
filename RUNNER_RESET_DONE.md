# 🚨 Quick Fix: GitHub Actions Locked Files

## **What Just Happened:**

The GitHub Actions checkout step failed with:
```
Error: EBUSY: resource busy or locked, rmdir 'C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS\fms.frontend'
```

## **What We Did:**

✅ **Stopped the GitHub Actions Runner service**
✅ **Cleared the workspace using robocopy**
✅ **Restarted the runner service**
✅ **Created reset script for future use**

## **Current Status:**

🟢 **Runner Service:** Running
🟢 **Workspace:** Clean and ready
🟢 **Ready to deploy:** YES

## **Next Steps:**

### **1. Retry Your Deployment (NOW)**

Go to GitHub Actions and **re-run the failed workflow**:
- Navigate to: https://github.com/kagz100/Hyoung.FMS/actions
- Click on the failed workflow
- Click **"Re-run all jobs"**

The deployment should now succeed!

## **If It Happens Again:**

### **Option 1: Quick Reset (Recommended)**
Run this script as Administrator on the runner server:

```powershell
cd C:\dev\Hyoung.FMS
.\scripts\reset-runner-workspace.ps1
```

This automatically:
1. Stops the runner service
2. Clears the workspace
3. Restarts the runner

### **Option 2: Manual Steps**
```powershell
# As Administrator:

# 1. Stop the runner
Stop-Service "actions.runner.*" -Force
Start-Sleep -Seconds 5

# 2. Clear workspace
$empty = New-Item -ItemType Directory -Path "$env:TEMP\empty_$(Get-Random)" -Force
robocopy $empty.FullName "C:\actions-runner\_work\Hyoung.FMS\Hyoung.FMS" /MIR /R:0 /W:0
Remove-Item $empty -Force

# 3. Restart runner
Start-Service "actions.runner.*"
```

## **Why This Happened:**

The GitHub Actions checkout action itself was holding file locks on the workspace. This can happen when:
- Previous workflow was interrupted
- Checkout process didn't complete cleanly
- File handles weren't released properly

## **The Solution:**

**DON'T close the runner permanently!** Just:
1. **Temporarily stop** the service
2. **Clear** the workspace
3. **Restart** the service

The runner will come back online and work normally.

## **Scripts Available:**

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `emergency-cleanup.ps1` | Clears workspace files | When files are locked but runner is OK |
| `reset-runner-workspace.ps1` | **Full reset (stops/restarts runner)** | **When checkout keeps failing** |
| `cleanup-runner-workspace.ps1` | Light cleanup | Before manual deployments |

## **Verification:**

Check runner status:
```powershell
Get-Service "actions.runner.*"
```

Should show: **Status: Running** ✅

## **Ready to Deploy!**

Your runner is now clean and ready. Go retry the deployment from GitHub Actions! 🚀

---

**Created:** October 7, 2025
**Issue:** Locked files in GitHub Actions workspace
**Resolution:** Reset runner workspace script
**Status:** ✅ RESOLVED
