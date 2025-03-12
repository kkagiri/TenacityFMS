param (
    [switch]$frontendOnly,
    [switch]$backendOnly,
    [string]$logFile = "./deployment_log.txt",
    [switch]$buildOnServer # New parameter to control whether to build on server
)

# Import supporting modules
. ./deployment/logging.ps1
. ./deployment/notifications.ps1
. ./deployment/rollback.ps1
. ./deployment/error-handling.ps1
. ./deployment/iis-operations.ps1
. ./deployment/deployment.ps1
. ./deployment/config-loader.ps1

# Initialize log file from environment variable if set
if ($env:logFile) {
    $logFile = $env:logFile
}

# Create log directory if it doesn't exist
$logDir = Split-Path -Path $logFile -Parent
if (-not (Test-Path -Path $logDir)) {
    New-Item -Path $logDir -ItemType Directory -Force | Out-Null
}

# Initialize log file
if (Test-Path $logFile) {
    Add-Content -Path $logFile -Value "`n------ New Deployment Started $(Get-Date) ------`n"
} else {
    New-Item -Path $logFile -ItemType File -Force | Out-Null
    Add-Content -Path $logFile -Value "------ Deployment Log Created $(Get-Date) ------`n"
}

# Record deployment parameters
Write-Log -Message "Deployment started with parameters: frontendOnly=$frontendOnly, backendOnly=$backendOnly, buildOnServer=$buildOnServer" -LogFile $logFile

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

# Build projects on server if requested
if ($buildOnServer) {
    # Build React app if needed
    if (-not $backendOnly) {
        Write-Log -Message "Building React application on server..." -LogFile $logFile
        try {
            # Get the frontend source directory (parent of build path)
            $frontendSourceDir = Split-Path $env:REACT_BUILD_PATH -Parent
            if (Test-Path -Path "$frontendSourceDir/package.json") {
                # Go to frontend directory
                Push-Location $frontendSourceDir
                Write-Log -Message "Changed directory to $frontendSourceDir" -LogFile $logFile

                # Check if node_modules exists, install dependencies if not
                if (-not (Test-Path -Path "node_modules")) {
                    Write-Log -Message "Installing npm dependencies..." -LogFile $logFile
                    & npm ci
                    if ($LASTEXITCODE -ne 0) {
                        throw "npm ci failed with exit code $LASTEXITCODE"
                    }
                }

                # Build React app
                Write-Log -Message "Building React app with npm run build..." -LogFile $logFile
                & npm run build
                if ($LASTEXITCODE -ne 0) {
                    throw "npm run build failed with exit code $LASTEXITCODE"
                }

                Write-Log -Message "React build completed successfully" -LogFile $logFile
                Pop-Location
            } else {
                Write-Log -Message "Frontend source directory does not contain package.json at $frontendSourceDir" -Level "WARN" -LogFile $logFile
            }
        } catch {
            Pop-Location
            Handle-Error -Operation "React build" -ErrorRecord $_ -LogFile $logFile
            exit 1
        }
    }

    # Build .NET WebAPI if needed
    if (-not $frontendOnly) {
        Write-Log -Message "Building .NET WebAPI on server..." -LogFile $logFile
        try {
            # Determine WebAPI project directory
            $webApiProjectDir = "FMS.WebClient"
            if (-not (Test-Path -Path $webApiProjectDir)) {
                $webApiProjectDir = Split-Path $env:WEBAPI_BUILD_PATH -Parent
            }

            if (Test-Path -Path "$webApiProjectDir/*.csproj") {
                # Go to WebAPI directory
                Push-Location $webApiProjectDir
                Write-Log -Message "Changed directory to $webApiProjectDir" -LogFile $logFile

                # Run dotnet publish
                Write-Log -Message "Publishing .NET WebAPI with dotnet publish..." -LogFile $logFile
                & dotnet publish -c Release -o $env:WEBAPI_BUILD_PATH
                if ($LASTEXITCODE -ne 0) {
                    throw "dotnet publish failed with exit code $LASTEXITCODE"
                }

                Write-Log -Message ".NET WebAPI build completed successfully" -LogFile $logFile
                Pop-Location

                # Verify the build output
                $fileCount = (Get-ChildItem -Path $env:WEBAPI_BUILD_PATH -Recurse).Count
                Write-Log -Message "WebAPI build output contains $fileCount files" -LogFile $logFile
            } else {
                Write-Log -Message "WebAPI project directory does not contain .csproj files at $webApiProjectDir" -Level "WARN" -LogFile $logFile
            }
        } catch {
            Pop-Location
            Handle-Error -Operation ".NET WebAPI build" -ErrorRecord $_ -LogFile $logFile
            exit 1
        }
    }
}

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
$iisServicesResult = Stop-IISServices -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

# Create deployment directories if needed
Create-DeploymentDirectories -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

# Backup current deployment
$backupPaths = Backup-CurrentDeployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile
$currentFrontendBackup = $backupPaths.FrontendBackup
$currentBackendBackup = $backupPaths.BackendBackup

# Deploy Frontend
if (-not $backendOnly) {
    try {
        $frontendDeployResult = Deploy-Frontend -LogFile $logFile
        if (-not $frontendDeployResult) {
            throw "Frontend deployment failed"
        }
    } catch {
        Handle-Error -Operation "Frontend deployment" -ErrorRecord $_ -LogFile $logFile
        if ($currentFrontendBackup -or $currentBackendBackup) {
            Write-Log -Message "Attempting to rollback deployment due to errors..." -Level "WARN" -LogFile $logFile
            Rollback-Deployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -FrontendBackupPath $currentFrontendBackup -BackendBackupPath $currentBackendBackup -LogFile $logFile
        }
        exit 1
    }
}

# Deploy Backend
if (-not $frontendOnly) {
    try {
        $backendDeployResult = Deploy-Backend -LogFile $logFile
        if (-not $backendDeployResult) {
            throw "Backend deployment failed"
        }
    } catch {
        Handle-Error -Operation "Backend deployment" -ErrorRecord $_ -LogFile $logFile
        if ($currentFrontendBackup -or $currentBackendBackup) {
            Write-Log -Message "Attempting to rollback deployment due to errors..." -Level "WARN" -LogFile $logFile
            Rollback-Deployment -FrontendOnly $frontendOnly -BackendOnly $backendOnly -FrontendBackupPath $currentFrontendBackup -BackendBackupPath $currentBackendBackup -LogFile $logFile
        }
        exit 1
    }
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
$deploymentSummary = Generate-DeploymentSummary -FrontendOnly $frontendOnly -BackendOnly $backendOnly -LogFile $logFile

# Send success notification with summary
Send-Notification -Subject "Deployment Completed Successfully" -Body $deploymentSummary -IncludeLog -LogFile $logFile

# Return success exit code
exit 0