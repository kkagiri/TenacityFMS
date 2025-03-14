#Deploy.ps1
#PS script to deploy the application to the server
#This script is responsible for building and deploying the frontend and backend components of the application to the server. It takes several parameters to control the deployment process, such as whether to deploy only the frontend or backend, whether to build the projects on the server, and the log file path. The script imports several supporting modules for logging, notifications, rollback, error handling, IIS operations, and deployment logic. It also loads configuration values from a separate configuration file.

param (
    [switch]$frontendOnly,
    [switch]$backendOnly,
    [string]$logFile = ""
)

# Generate timestamp-based log file if none provided
if ([string]::IsNullOrEmpty($logFile)) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    # Create logs directory if it doesn't exist
    $logDir = "./logs"
    if (-not (Test-Path -Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }

    # Set log file with timestamp
    $logFile = "$logDir/deployment_log_$timestamp.txt"
}

# Import supporting modules
. ./deployment/logging.ps1
. ./deployment/notifications.ps1
. ./deployment/rollback.ps1
. ./deployment/error-handling.ps1
. ./deployment/iis-operations.ps1
. ./deployment/deployment.ps1
. ./deployment/config-loader.ps1

# Create log directory if it doesn't exist
$logDir = Split-Path -Path $logFile -Parent
if (-not (Test-Path -Path $logDir)) {
    New-Item -Path $logDir -ItemType Directory -Force | Out-Null
}

# Initialize log file - always create a new one
New-Item -Path $logFile -ItemType File -Force | Out-Null
Add-Content -Path $logFile -Value "------ Deployment Log Created $(Get-Date) ------`n"

# Record deployment parameters
Write-Log -Message "Deployment started with parameters: frontendOnly=$frontendOnly, backendOnly=$backendOnly, logFile=$logFile" -LogFile $logFile

# Load configuration
try {
    . ./deployment/config-loader.ps1
    Write-Log -Message "Configuration loaded successfully" -LogFile $logFile
} catch {
    Handle-Error -Operation "configuration loading" -ErrorRecord $_ -LogFile $logFile
    exit 1
}

# Print debug information
Write-Log -Message "CONFIGURATION VALUES:" -LogFile $logFile
Write-Log -Message "REACT_BUILD_PATH: $env:REACT_BUILD_PATH" -LogFile $logFile
Write-Log -Message "WEBAPI_BUILD_PATH: $env:WEBAPI_BUILD_PATH" -LogFile $logFile
Write-Log -Message "REACT_DEPLOYMENT_PATH: $env:REACT_DEPLOYMENT_PATH" -LogFile $logFile
Write-Log -Message "WEBAPI_DEPLOYMENT_PATH: $env:WEBAPI_DEPLOYMENT_PATH" -LogFile $logFile
Write-Log -Message "IIS_SITE_NAME (Frontend): $env:IIS_SITE_NAME" -LogFile $logFile
Write-Log -Message "IIS_APP_POOL (Shared): $env:IIS_APP_POOL" -LogFile $logFile
Write-Log -Message "BACKEND_SITE_NAME: $env:BACKEND_SITE_NAME" -LogFile $logFile
Write-Log -Message "ENVIRONMENT: $env:ENVIRONMENT" -LogFile $logFile

# Set default values for backend site if not explicitly defined
if (-not $env:BACKEND_SITE_NAME) {
    $env:BACKEND_SITE_NAME = $env:IIS_SITE_NAME
    Write-Log -Message "Using frontend site name for backend: $env:BACKEND_SITE_NAME" -LogFile $logFile
}

# Note: Build functionality removed as all builds will be done on the backend

# Validate paths
$pathsValid = Validate-DeploymentPaths -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

if (-not $pathsValid) {
    Write-Log -Message "Deployment aborted due to missing build paths" -Level "ERROR" -LogFile $logFile
    Send-Notification -Subject "Deployment Aborted" -Body "Deployment aborted due to missing build paths" -Level "ERROR" -IncludeLog -IsError -LogFile $logFile
    exit 1
}

# Record git commit information if available
try {
    $gitCommit = git rev-parse HEAD 2>$null
    $gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($gitCommit -and $gitBranch) {
        Write-Log -Message "Deploying Git commit: $gitCommit on branch: $gitBranch" -LogFile $logFile
    }
} catch {
    Write-Log -Message "Unable to retrieve Git information" -Level "WARN" -LogFile $logFile
}

# Stop IIS services
$iisServicesResult = Stop-IISServices  -LogFile $logFile
if (-not $iisServicesResult) {
    Write-Log -Message "Warning: Could not completely stop all IIS components. Will try to proceed anyway." -Level "WARN" -LogFile $logFile

    # Try to specifically handle log directory locks
    Release-LogDirectoryLocks -LogFile $logFile

    # Add a longer delay to give IIS more time
    Write-Log -Message "Waiting 10 seconds for processes to release file handles..." -Level "INFO" -LogFile $logFile
    Start-Sleep -Seconds 10
}
#Create-DeploymentDirectories -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile
$deploymentSummary = Generate-DeploymentSummary -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

# Backup current deployment
# $backupPaths = Backup-CurrentDeployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile
# $currentFrontendBackup = $backupPaths.FrontendBackup
# $currentBackendBackup = $backupPaths.BackendBackup

if (-not $backendOnly) {
    Write-Log -Message "Starting frontend deployment..." -LogFile $logFile
    try {
        $frontendDeployResult = Deploy-Frontend -LogFile $logFile
        if (-not $frontendDeployResult) {
            Write-Log -Message "Frontend deployment returned a failure status" -Level "ERROR" -LogFile $logFile
            Send-Notification -Subject "Frontend Deployment Failed" -Body "Frontend deployment failed with status code: false" -Level "ERROR" -IncludeLog -IsError -LogFile $logFile
            exit 1
        }
        Write-Log -Message "Frontend deployment completed successfully" -LogFile $logFile
    } catch {
        Handle-Error -Operation "Frontend deployment" -ErrorRecord $_ -LogFile $logFile
        if ($currentFrontendBackup -or $currentBackendBackup) {
            Write-Log -Message "Attempting to rollback deployment due to errors..." -Level "WARN" -LogFile $logFile
            Rollback-Deployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -FrontendBackupPath $currentFrontendBackup -BackendBackupPath $currentBackendBackup -LogFile $logFile
        }
        exit 1
    }
} else {
    Write-Log -Message "Skipping frontend deployment (backendOnly flag is set)" -LogFile $logFile
}

# Deploy Backend
if (-not $frontendOnly) {
    Write-Log -Message "Starting backend deployment..." -LogFile $logFile
    try {
        $backendDeployResult = Deploy-Backend -LogFile $logFile
        if (-not $backendDeployResult) {
            Write-Log -Message "Backend deployment returned a failure status" -Level "ERROR" -LogFile $logFile
            Send-Notification -Subject "Backend Deployment Failed" -Body "Backend deployment failed with status code: false" -Level "ERROR" -IncludeLog -IsError -LogFile $logFile
            exit 1
        }
        Write-Log -Message "Backend deployment completed successfully" -LogFile $logFile
    } catch {
        Handle-Error -Operation "Backend deployment" -ErrorRecord $_ -LogFile $logFile
        if ($currentFrontendBackup -or $currentBackendBackup) {
            Write-Log -Message "Attempting to rollback deployment due to errors..." -Level "WARN" -LogFile $logFile
            Rollback-Deployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -FrontendBackupPath $currentFrontendBackup -BackendBackupPath $currentBackendBackup -LogFile $logFile
        }
        exit 1
    }
} else {
    Write-Log -Message "Skipping backend deployment (frontendOnly flag is set)" -LogFile $logFile
}

# Start IIS services
Start-IISServices -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

# Perform health check
if ($env:HEALTH_CHECK_URL) {
    $healthCheckResult = Perform-HealthCheck -LogFile $logFile

    if (-not $healthCheckResult) {
        Write-Log -Message "Health check failed. Consider manual verification." -Level "WARN" -LogFile $logFile

        # Uncomment to enable automatic rollback on health check failure
        # if ($currentFrontendBackup -or $currentBackendBackup) {
        #     Write-Log "Attempting to rollback deployment due to failed health checks..." -Level "WARN" -LogFile $logFile
        #     Rollback-Deployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -FrontendBackupPath $currentFrontendBackup -BackendBackupPath $currentBackendBackup -LogFile $logFile
        # }
    }
}

# Generate and log deployment summary
$deploymentSummary = Generate-DeploymentSummary -FrontendOnly:$frontendOnly -BackendOnly:$backendOnly -LogFile $logFile

# Send success notification with summary
Send-Notification -Subject "Deployment Completed Successfully" -Body $deploymentSummary -IncludeLog -LogFile $logFile

# Write log file path to console for easy access
Write-Host "Deployment log saved to: $((Get-Item $logFile).FullName)" -ForegroundColor Green

# Return success exit code
exit 0