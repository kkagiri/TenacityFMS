# FMS PTS Windows Service Uninstallation Script
# This script safely removes the FMS PTS Windows Service and cleans up resources

param(
    [switch]$RemoveLogs = $false,
    [switch]$RemoveFirewallRules = $true,
    [switch]$Force = $false,
    [switch]$KeepConfiguration = $false
)

$ErrorActionPreference = "Stop"

# Script configuration
$serviceName = "FMS.PTS.Service"
$serviceDisplayName = "FMS PTS Service"
$logDirectory = "C:\Logs\FMS.PTS"

Write-Host "============================================" -ForegroundColor Red
Write-Host "FMS PTS Windows Service Uninstallation" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red

function Test-AdminPrivileges {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Confirm-Uninstallation {
    if ($Force) {
        return $true
    }

    Write-Host "`nThis will remove the FMS PTS Windows Service and associated components." -ForegroundColor Yellow
    Write-Host "The following actions will be performed:" -ForegroundColor Yellow
    Write-Host "  - Stop and remove the Windows Service"

    if ($RemoveFirewallRules) {
        Write-Host "  - Remove Windows Firewall rules"
    }

    if ($RemoveLogs) {
        Write-Host "  - Delete all log files"
    }

    if (-not $KeepConfiguration) {
        Write-Host "  - Remove environment variables"
    }

    $confirmation = Read-Host "`nDo you want to continue? (yes/no)"
    return $confirmation -eq "yes" -or $confirmation -eq "y"
}

function Stop-PTSService {
    Write-Host "Checking service status..." -ForegroundColor Yellow

    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "✓ Service not found (already removed)" -ForegroundColor Green
        return
    }

    if ($service.Status -eq "Running") {
        Write-Host "Stopping service..." -ForegroundColor Yellow
        try {
            Stop-Service -Name $serviceName -Force -Timeout 30
            Write-Host "✓ Service stopped successfully" -ForegroundColor Green
        } catch {
            Write-Warning "Could not stop service gracefully: $_"
            Write-Host "Attempting force stop..." -ForegroundColor Yellow

            # Try to force kill the process
            $process = Get-Process -Name "FMS.PTS.WindowsService" -ErrorAction SilentlyContinue
            if ($process) {
                $process | Stop-Process -Force
                Write-Host "✓ Service process terminated" -ForegroundColor Green
            }
        }

        # Wait a moment for cleanup
        Start-Sleep -Seconds 3
    } else {
        Write-Host "✓ Service is already stopped" -ForegroundColor Green
    }
}

function Remove-WindowsService {
    Write-Host "Removing Windows Service..." -ForegroundColor Yellow

    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "✓ Service not found (already removed)" -ForegroundColor Green
        return
    }

    try {
        # Remove the service using sc.exe for reliability
        $result = & sc.exe delete $serviceName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Service removed successfully" -ForegroundColor Green
        } else {
            throw "sc.exe delete failed: $result"
        }

        # Wait for service removal to complete
        Start-Sleep -Seconds 2

        # Verify removal
        $verifyService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($verifyService) {
            Write-Warning "Service still exists after removal attempt"
        }

    } catch {
        Write-Error "Failed to remove service: $_"
        throw
    }
}

function Remove-FirewallRules {
    if (-not $RemoveFirewallRules) {
        Write-Host "Skipping firewall rule removal..." -ForegroundColor Yellow
        return
    }

    Write-Host "Removing Windows Firewall rules..." -ForegroundColor Yellow

    try {
        # Remove PTS-specific firewall rules
        $rulesToRemove = @(
            "FMS PTS WebSocket",
            "FMS PTS MySQL Out",
            "FMS PTS Redis Out"
        )

        foreach ($ruleName in $rulesToRemove) {
            $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
            if ($rule) {
                Remove-NetFirewallRule -DisplayName $ruleName -Confirm:$false
                Write-Host "✓ Removed firewall rule: $ruleName" -ForegroundColor Green
            }
        }

        Write-Host "✓ Firewall cleanup completed" -ForegroundColor Green

    } catch {
        Write-Warning "Could not remove some firewall rules: $_"
    }
}

function Remove-EnvironmentVariables {
    if ($KeepConfiguration) {
        Write-Host "Keeping environment variables..." -ForegroundColor Yellow
        return
    }

    Write-Host "Removing environment variables..." -ForegroundColor Yellow

    try {
        $envVarsToRemove = @(
            "FMS_DATABASE_CONNECTION",
            "FMS_REDIS_CONNECTION",
            "FMS_JWT_KEY",
            "FMS_JWT_ISSUER",
            "FMS_JWT_AUDIENCE"
        )

        foreach ($envVar in $envVarsToRemove) {
            $currentValue = [Environment]::GetEnvironmentVariable($envVar, "Machine")
            if ($currentValue) {
                [Environment]::SetEnvironmentVariable($envVar, $null, "Machine")
                Write-Host "✓ Removed environment variable: $envVar" -ForegroundColor Green
            }
        }

        Write-Host "✓ Environment variables cleaned up" -ForegroundColor Green

    } catch {
        Write-Warning "Could not remove some environment variables: $_"
    }
}

function Remove-LogFiles {
    if (-not $RemoveLogs) {
        Write-Host "Keeping log files..." -ForegroundColor Yellow
        return
    }

    Write-Host "Removing log files..." -ForegroundColor Yellow

    try {
        if (Test-Path $logDirectory) {
            # Get file count for reporting
            $logFiles = Get-ChildItem -Path $logDirectory -Recurse -File
            $fileCount = $logFiles.Count

            if ($fileCount -gt 0) {
                Remove-Item -Path $logDirectory -Recurse -Force
                Write-Host "✓ Removed $fileCount log files from $logDirectory" -ForegroundColor Green
            } else {
                Write-Host "✓ No log files to remove" -ForegroundColor Green
            }
        } else {
            Write-Host "✓ Log directory not found" -ForegroundColor Green
        }

    } catch {
        Write-Warning "Could not remove all log files: $_"
    }
}

function Verify-Uninstallation {
    Write-Host "Verifying uninstallation..." -ForegroundColor Yellow

    $issues = @()

    # Check if service still exists
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($service) {
        $issues += "Service still exists"
    }

    # Check if process is still running
    $process = Get-Process -Name "FMS.PTS.WindowsService" -ErrorAction SilentlyContinue
    if ($process) {
        $issues += "Service process still running"
    }

    # Check environment variables (if they should be removed)
    if (-not $KeepConfiguration) {
        $envVars = @("FMS_DATABASE_CONNECTION", "FMS_REDIS_CONNECTION", "FMS_JWT_KEY")
        foreach ($envVar in $envVars) {
            $value = [Environment]::GetEnvironmentVariable($envVar, "Machine")
            if ($value) {
                $issues += "Environment variable still exists: $envVar"
            }
        }
    }

    if ($issues.Count -eq 0) {
        Write-Host "✓ Uninstallation verified successfully" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠ Issues found during verification:" -ForegroundColor Yellow
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor Yellow
        }
        return $false
    }
}

function Show-UninstallationSummary {
    Write-Host "`n============================================" -ForegroundColor Green
    Write-Host "Uninstallation Summary" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green

    Write-Host "`nActions performed:" -ForegroundColor Cyan
    Write-Host "✓ Stopped and removed Windows Service"

    if ($RemoveFirewallRules) {
        Write-Host "✓ Removed Windows Firewall rules"
    }

    if ($RemoveLogs) {
        Write-Host "✓ Deleted log files"
    } else {
        Write-Host "- Kept log files in: $logDirectory"
    }

    if (-not $KeepConfiguration) {
        Write-Host "✓ Removed environment variables"
    } else {
        Write-Host "- Kept environment variables"
    }

    Write-Host "`nCleanup completed!" -ForegroundColor Green

    if ($KeepConfiguration -or -not $RemoveLogs) {
        Write-Host "`nRemaining items:" -ForegroundColor Yellow
        if ($KeepConfiguration) {
            Write-Host "- Environment variables preserved"
        }
        if (-not $RemoveLogs -and (Test-Path $logDirectory)) {
            Write-Host "- Log files preserved in: $logDirectory"
        }
    }

    Write-Host "`nTo completely remove all traces:" -ForegroundColor Yellow
    Write-Host "  .\Uninstall-Service.ps1 -RemoveLogs -Force"
}

# Main uninstallation logic
try {
    if (-not (Test-AdminPrivileges)) {
        throw "This script requires administrative privileges. Please run as administrator."
    }

    # Confirm uninstallation
    if (-not (Confirm-Uninstallation)) {
        Write-Host "Uninstallation cancelled by user." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "`nStarting uninstallation process..." -ForegroundColor Cyan

    # Perform uninstallation steps
    Stop-PTSService
    Remove-WindowsService
    Remove-FirewallRules
    Remove-EnvironmentVariables
    Remove-LogFiles

    # Verify and show summary
    $verificationPassed = Verify-Uninstallation
    Show-UninstallationSummary

    if ($verificationPassed) {
        Write-Host "`n✓ Uninstallation completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n⚠ Uninstallation completed with some issues. See verification results above." -ForegroundColor Yellow
        exit 1
    }

} catch {
    Write-Host "`n❌ Uninstallation failed: $_" -ForegroundColor Red

    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure you're running PowerShell as Administrator"
    Write-Host "2. Stop any running FMS PTS processes manually"
    Write-Host "3. Use Task Manager to force-close any remaining processes"
    Write-Host "4. Check Windows Event Log for additional error details"
    Write-Host "5. Try running with -Force parameter"

    exit 1
}
