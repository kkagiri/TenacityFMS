param (
    [switch]$frontendOnly,
    [switch]$backendOnly,
    [string]$logFile = "./deployment_log.txt"
)

# Start logging
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Output to console
    Write-Host $logMessage
    
    # Append to log file
    Add-Content -Path $logFile -Value $logMessage
}

# Function to handle errors
function Handle-Error {
    param (
        [string]$StepName,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )
    
    Write-Log "ERROR during $StepName: $($ErrorRecord.Exception.Message)" -Level "ERROR"
    Write-Log "Stack Trace: $($ErrorRecord.ScriptStackTrace)" -Level "ERROR"
    
    # You could also send notifications here (email, Teams, etc.)
    
    # Return false to indicate failure
    return $false
}

# Initialize log file
if (Test-Path $logFile) {
    Add-Content -Path $logFile -Value "`n------ New Deployment Started $(Get-Date) ------`n"
} else {
    New-Item -Path $logFile -ItemType File -Force | Out-Null
    Add-Content -Path $logFile -Value "------ Deployment Log Created $(Get-Date) ------`n"
}

# Record deployment parameters
Write-Log "Deployment started with parameters: frontendOnly=$frontendOnly, backendOnly=$backendOnly"

# Load configuration
try {
    . ./config-loader.ps1
    Write-Log "Configuration loaded successfully"
} catch {
    Handle-Error "configuration loading" $_
    exit 1
}

# Print debug information
Write-Log "CONFIGURATION VALUES:"
Write-Log "REACT_BUILD_PATH: $env:REACT_BUILD_PATH"
Write-Log "WEBAPI_BUILD_PATH: $env:WEBAPI_BUILD_PATH"
Write-Log "REACT_DEPLOYMENT_PATH: $env:REACT_DEPLOYMENT_PATH"
Write-Log "WEBAPI_DEPLOYMENT_PATH: $env:WEBAPI_DEPLOYMENT_PATH"
Write-Log "IIS_SITE_NAME: $env:IIS_SITE_NAME"
Write-Log "IIS_APP_POOL: $env:IIS_APP_POOL"
Write-Log "ENVIRONMENT: $env:ENVIRONMENT"

# Validate paths before proceeding
$pathsValid = $true
if (-not $backendOnly) {
    if (-not (Test-Path -Path $env:REACT_BUILD_PATH)) {
        Write-Log "React build path does not exist: $env:REACT_BUILD_PATH" -Level "ERROR"
        $pathsValid = $false
    }
}
if (-not $frontendOnly) {
    if (-not (Test-Path -Path $env:WEBAPI_BUILD_PATH)) {
        Write-Log "WebAPI build path does not exist: $env:WEBAPI_BUILD_PATH" -Level "ERROR"
        $pathsValid = $false
    }
}

if (-not $pathsValid) {
    Write-Log "Deployment aborted due to missing build paths" -Level "ERROR"
    exit 1
}

# Record git commit information if available
try {
    $gitCommit = git rev-parse HEAD 2>$null
    $gitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ($gitCommit -and $gitBranch) {
        Write-Log "Deploying Git commit: $gitCommit on branch: $gitBranch"
    }
} catch {
    Write-Log "Unable to retrieve Git information" -Level "WARN"
}

# Stop the IIS site and application pool
Write-Log "Stopping IIS services..."
Import-Module WebAdministration
$siteName = $env:IIS_SITE_NAME
$appPoolName = $env:IIS_APP_POOL

try {
    if (Get-Website -Name $siteName) {
        Stop-Website -Name $siteName -ErrorAction Stop
        Write-Log "Website $siteName stopped."
    }
    
    if (Get-WebAppPoolState -Name $appPoolName) {
        Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Log "Application Pool $appPoolName stopped."
    }
} catch {
    Write-Log "Warning: Could not stop IIS services: $_" -Level "WARN"
    # Continue anyway, as we may just need to copy files
}

# Create deployment directories if they don't exist
Write-Log "Creating deployment directories if they don't exist..."
if (-not $backendOnly) {
    if (!(Test-Path -Path $env:REACT_DEPLOYMENT_PATH)) {
        New-Item -ItemType Directory -Path $env:REACT_DEPLOYMENT_PATH -Force | Out-Null
        Write-Log "Created React deployment directory."
    }
}
if (-not $frontendOnly) {
    if (!(Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH)) {
        New-Item -ItemType Directory -Path $env:WEBAPI_DEPLOYMENT_PATH -Force | Out-Null
        Write-Log "Created WebAPI deployment directory."
    }
}

# Backup current deployment (optional)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = $env:BACKUP_DIR

if ($backupRoot -and (Test-Path $backupRoot)) {
    Write-Log "Creating backup of current deployment..."
    
    if (-not $backendOnly -and (Test-Path $env:REACT_DEPLOYMENT_PATH)) {
        $reactBackupPath = Join-Path $backupRoot "react_$timestamp"
        try {
            Copy-Item -Path $env:REACT_DEPLOYMENT_PATH -Destination $reactBackupPath -Recurse -Force
            Write-Log "React app backed up to $reactBackupPath"
        } catch {
            Write-Log "Failed to backup React app: $_" -Level "WARN"
        }
    }
    
    if (-not $frontendOnly -and (Test-Path $env:WEBAPI_DEPLOYMENT_PATH)) {
        $webApiBackupPath = Join-Path $backupRoot "webapi_$timestamp"
        try {
            Copy-Item -Path $env:WEBAPI_DEPLOYMENT_PATH -Destination $webApiBackupPath -Recurse -Force
            Write-Log "WebAPI backed up to $webApiBackupPath"
        } catch {
            Write-Log "Failed to backup WebAPI: $_" -Level "WARN"
        }
    }
}

# Clean and deploy React app
if (-not $backendOnly) {
    Write-Log "Deploying React application..."
    
    # Handle React deployment directory
    if (Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config") {
        $reactWebConfig = Get-Content "$env:REACT_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | 
            Where-Object { $_.FullName -ne "$env:REACT_DEPLOYMENT_PATH\web.config" } | 
            Remove-Item -Recurse -Force
        Write-Log "React directory cleaned (preserved web.config)."
    } else {
        Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log "React directory cleaned (no web.config found)."
    }
    
    # Copy React build files
    try {
        Write-Log "Copying React build files..."
        Copy-Item -Path "$env:REACT_BUILD_PATH\*" -Destination $env:REACT_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse).Count
        Write-Log "React files copied. Count: $fileCount files"
        
        # Restore web.config if we saved it
        if ($reactWebConfig) {
            Set-Content -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Value $reactWebConfig
            Write-Log "React web.config restored."
        }
    } catch {
        Handle-Error "React files deployment" $_
        exit 1
    }
}

# Clean and deploy WebAPI
if (-not $frontendOnly) {
    Write-Log "Deploying WebAPI application..."
    
    # Handle WebAPI deployment directory
    if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
        $webApiWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | 
            Where-Object { $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" } | 
            Remove-Item -Recurse -Force
        Write-Log "WebAPI directory cleaned (preserved web.config)."
    } else {
        Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
        Write-Log "WebAPI directory cleaned (no web.config found)."
    }
    
    # Copy Web API files
    try {
        Write-Log "Copying Web API files..."
        Copy-Item -Path "$env:WEBAPI_BUILD_PATH\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
        $fileCount = (Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse).Count
        Write-Log "WebAPI files copied. Count: $fileCount files"
        
        # Restore web.config if we saved it
        if ($webApiWebConfig) {
            Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $webApiWebConfig
            Write-Log "WebAPI web.config restored."
        }
    } catch {
        Handle-Error "WebAPI files deployment" $_
        exit 1
    }
}

# Start the IIS site and app pool
Write-Log "Starting IIS services..."
try {
    Start-WebAppPool -Name $appPoolName -ErrorAction Stop
    Write-Log "Application Pool $appPoolName started."
    
    Start-Website -Name $siteName -ErrorAction Stop
    Write-Log "Website $siteName started."
} catch {
    Write-Log "Warning: Could not start IIS services: $_" -Level "WARN"
    # This may happen if services were already running
}

# Perform health check if URL is configured
if ($env:HEALTH_CHECK_URL) {
    Write-Log "Performing health check..."
    $healthCheckSuccess = $false
    
    for ($i = 1; $i -le [int]$env:HEALTH_CHECK_RETRIES; $i++) {
        try {
            Write-Log "Health check attempt $i of $($env:HEALTH_CHECK_RETRIES)..."
            $response = Invoke-WebRequest -Uri $env:HEALTH_CHECK_URL -TimeoutSec 30 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Log "Health check passed: Status $($response.StatusCode)"
                $healthCheckSuccess = $true
                break
            } else {
                Write-Log "Health check returned non-200 status: $($response.StatusCode)" -Level "WARN"
            }
        } catch {
            Write-Log "Health check failed: $_" -Level "WARN"
        }
        
        if ($i -lt [int]$env:HEALTH_CHECK_RETRIES) {
            Write-Log "Waiting $($env:HEALTH_CHECK_RETRY_DELAY) seconds before next retry..."
            Start-Sleep -Seconds [int]$env:HEALTH_CHECK_RETRY_DELAY
        }
    }
    
    if (-not $healthCheckSuccess) {
        Write-Log "All health checks failed. Deployment may be unstable." -Level "ERROR"
        # You might want to trigger alerts here or rollback
    }
}

# Record deployment completion
$deploymentType = if ($frontendOnly) {
    "Frontend Only"
} elseif ($backendOnly) {
    "Backend Only"
} else {
    "Full (Frontend and Backend)"
}

Write-Log "$deploymentType deployment completed successfully!"
Write-Log "Deployment log saved to: $((Get-Item $logFile).FullName)"

# Return success exit code
exit 0
