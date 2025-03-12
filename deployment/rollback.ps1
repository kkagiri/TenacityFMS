# Rollback Functionality

function Rollback-Deployment {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$FrontendBackupPath,
        [string]$BackendBackupPath,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Starting deployment rollback..." -Level "WARN" -LogFile $LogFile

    # Define site names (frontend and backend)
    $frontendSiteName = $env:IIS_SITE_NAME
    $backendSiteName = $env:BACKEND_SITE_NAME
    if (-not $backendSiteName) {
        $backendSiteName = $frontendSiteName
    }

    # Define app pool name (shared between frontend and backend)
    $appPoolName = $env:IIS_APP_POOL

    # Stop IIS services before rollback
    try {
        Write-Log -Message "Stopping IIS services for rollback..." -Level "INFO" -LogFile $LogFile

        # Stop sites first
        if (-not $BackendOnly) {
            if (Get-Website -Name $frontendSiteName) {
                Stop-Website -Name $frontendSiteName -ErrorAction Stop
                Write-Log -Message "Frontend website $frontendSiteName stopped for rollback." -LogFile $LogFile
            }
        }

        if (-not $FrontendOnly -and $backendSiteName -ne $frontendSiteName) {
            if (Get-Website -Name $backendSiteName) {
                Stop-Website -Name $backendSiteName -ErrorAction Stop
                Write-Log -Message "Backend website $backendSiteName stopped for rollback." -LogFile $LogFile
            }
        }

        # Then stop app pool (only once)
        if (Get-WebAppPoolState -Name $appPoolName) {
            Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
            Write-Log -Message "Application Pool $appPoolName stopped for rollback." -LogFile $LogFile
        }
    }
    catch {
        Write-Log -Message "Warning: Could not stop all IIS services for rollback: $_" -Level "WARN" -LogFile $LogFile
        # Continue with rollback anyway
    }

    # Rollback frontend if needed
    if (-not $BackendOnly -and $FrontendBackupPath -and (Test-Path $FrontendBackupPath)) {
        Write-Log -Message "Rolling back frontend deployment..." -Level "INFO" -LogFile $LogFile

        try {
            # Preserve web.config if it exists
            $frontendWebConfig = $null
            if (Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config") {
                $frontendWebConfig = Get-Content "$env:REACT_DEPLOYMENT_PATH\web.config"
                Write-Log -Message "Preserved frontend web.config for rollback." -LogFile $LogFile
            }

            # Clear current deployment directory
            Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse |
                Where-Object { $_.FullName -ne "$env:REACT_DEPLOYMENT_PATH\web.config" } |
                Remove-Item -Recurse -Force
            Write-Log -Message "Cleaned frontend deployment directory for rollback." -LogFile $LogFile

            # Copy backup files
            Copy-Item -Path "$FrontendBackupPath\*" -Destination $env:REACT_DEPLOYMENT_PATH -Recurse -Force
            Write-Log -Message "Restored frontend files from backup." -LogFile $LogFile

            # Restore preserved web.config if needed
            if ($frontendWebConfig) {
                Set-Content -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Value $frontendWebConfig
                Write-Log -Message "Restored frontend web.config after rollback." -LogFile $LogFile
            }

            Write-Log -Message "Frontend rollback completed successfully." -Level "INFO" -LogFile $LogFile
        }
        catch {
            Write-Log -Message "Error during frontend rollback: $_" -Level "ERROR" -LogFile $LogFile
        }
    }
    elseif (-not $BackendOnly) {
        Write-Log -Message "No frontend backup found at $FrontendBackupPath. Cannot rollback frontend." -Level "WARN" -LogFile $LogFile
    }

    # Rollback backend if needed
    if (-not $FrontendOnly -and $BackendBackupPath -and (Test-Path $BackendBackupPath)) {
        Write-Log -Message "Rolling back backend deployment..." -Level "INFO" -LogFile $LogFile

        try {
            # Preserve web.config if it exists
            $backendWebConfig = $null
            if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
                $backendWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
                Write-Log -Message "Preserved backend web.config for rollback." -LogFile $LogFile
            }

            # Clear current deployment directory
            Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse |
                Where-Object { $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" } |
                Remove-Item -Recurse -Force
            Write-Log -Message "Cleaned backend deployment directory for rollback." -LogFile $LogFile

            # Copy backup files
            Copy-Item -Path "$BackendBackupPath\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
            Write-Log -Message "Restored backend files from backup." -LogFile $LogFile

            # Restore preserved web.config if needed
            if ($backendWebConfig) {
                Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $backendWebConfig
                Write-Log -Message "Restored backend web.config after rollback." -LogFile $LogFile
            }

            Write-Log -Message "Backend rollback completed successfully." -Level "INFO" -LogFile $LogFile
        }
        catch {
            Write-Log -Message "Error during backend rollback: $_" -Level "ERROR" -LogFile $LogFile
        }
    }
    elseif (-not $FrontendOnly) {
        Write-Log -Message "No backend backup found at $BackendBackupPath. Cannot rollback backend." -Level "WARN" -LogFile $LogFile
    }

    # Start IIS services after rollback
    try {
        Write-Log -Message "Starting IIS services after rollback..." -Level "INFO" -LogFile $LogFile

        # Start app pool first
        Start-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Log -Message "Application Pool $appPoolName started after rollback." -LogFile $LogFile

        # Then start websites
        if (-not $BackendOnly) {
            Start-Website -Name $frontendSiteName -ErrorAction Stop
            Write-Log -Message "Frontend website $frontendSiteName started after rollback." -LogFile $LogFile
        }

        if (-not $FrontendOnly -and $backendSiteName -ne $frontendSiteName) {
            Start-Website -Name $backendSiteName -ErrorAction Stop
            Write-Log -Message "Backend website $backendSiteName started after rollback." -LogFile $LogFile
        }
    }
    catch {
        Write-Log -Message "Warning: Could not start all IIS services after rollback: $_" -Level "WARN" -LogFile $LogFile
    }

    Write-Log -Message "Deployment rollback completed." -Level "WARN" -LogFile $LogFile

    # Send rollback notification
    Send-Notification -Subject "Deployment Rollback Completed" -Body "Deployment was rolled back due to errors." -Level "WARN" -IncludeLog -IsError -LogFile $LogFile
}

# Create backup of current deployment
function Backup-CurrentDeployment {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    $currentFrontendBackup = $null
    $currentBackendBackup = $null

    # Backup current deployment (optional)
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupRoot = $env:BACKUP_DIR

    if ($backupRoot -and (Test-Path $backupRoot)) {
        Write-Log -Message "Creating backup of current deployment..." -LogFile $LogFile

        if (-not $BackendOnly -and (Test-Path $env:REACT_DEPLOYMENT_PATH)) {
            $reactBackupPath = Join-Path $backupRoot "react_$timestamp"
            try {
                Copy-Item -Path $env:REACT_DEPLOYMENT_PATH -Destination $reactBackupPath -Recurse -Force
                Write-Log -Message "React app backed up to $reactBackupPath" -LogFile $LogFile
                # Store the backup path for potential rollback
                $currentFrontendBackup = $reactBackupPath
            } catch {
                Write-Log -Message "Failed to backup React app: $_" -Level "WARN" -LogFile $LogFile
            }
        }

        if (-not $FrontendOnly -and (Test-Path $env:WEBAPI_DEPLOYMENT_PATH)) {
            $webApiBackupPath = Join-Path $backupRoot "webapi_$timestamp"
            try {
                Copy-Item -Path $env:WEBAPI_DEPLOYMENT_PATH -Destination $webApiBackupPath -Recurse -Force
                Write-Log -Message "WebAPI backed up to $webApiBackupPath" -LogFile $LogFile
                $currentBackendBackup = $webApiBackupPath
            } catch {
                Write-Log -Message "Failed to backup WebAPI: $_" -Level "WARN" -LogFile $LogFile
            }
        }
    }

    $result = @{
        FrontendBackup = $currentFrontendBackup
        BackendBackup = $currentBackendBackup
    }

    return $result
}