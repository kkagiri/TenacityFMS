# IIS Operations Module

# Stop IIS services
function Stop-IISServices {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Stopping IIS services..." -LogFile $LogFile
    Import-Module WebAdministration

    # Define site names (frontend and backend)
    $frontendSiteName = $env:IIS_SITE_NAME          # ReactApp
    $backendSiteName = $env:BACKEND_SITE_NAME       # Use if configured, otherwise use same as frontend
    if (-not $backendSiteName) {
        $backendSiteName = $frontendSiteName        # Default to same site if not specified
    }

    # Define app pool names (frontend and backend)
    $appPoolName = $env:IIS_APP_POOL        # apihyoungfms (shared between frontend and backend)

    Write-Log -Message "Frontend Site: $frontendSiteName, App Pool: $appPoolName" -LogFile $LogFile
    Write-Log -Message "Backend Site: $backendSiteName, App Pool: $appPoolName" -LogFile $LogFile

    try {
        # Stop sites first
        if (-not $BackendOnly) {
            if (Get-Website -Name $frontendSiteName) {
                Stop-Website -Name $frontendSiteName -ErrorAction Stop
                Write-Log -Message "Frontend website $frontendSiteName stopped." -LogFile $LogFile
            }
        }

        if (-not $FrontendOnly -and $backendSiteName -ne $frontendSiteName) {
            if (Get-Website -Name $backendSiteName) {
                Stop-Website -Name $backendSiteName -ErrorAction Stop
                Write-Log -Message "Backend website $backendSiteName stopped." -LogFile $LogFile
            }
        }

        # Then stop shared app pool (only once)
        if (Get-WebAppPoolState -Name $appPoolName) {
            Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
            Write-Log -Message "Application Pool $appPoolName stopped." -LogFile $LogFile
        }

        return $true
    } catch {
        Write-Log -Message "Warning: Could not stop IIS services: $_" -Level "WARN" -LogFile $LogFile
        # Continue anyway, as we may just need to copy files
        return $false
    }
}

# Start IIS services
function Start-IISServices {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Starting IIS services..." -LogFile $LogFile

    # Define site names (frontend and backend)
    $frontendSiteName = $env:IIS_SITE_NAME
    $backendSiteName = $env:BACKEND_SITE_NAME
    if (-not $backendSiteName) {
        $backendSiteName = $frontendSiteName
    }

    # Define app pool name
    $appPoolName = $env:IIS_APP_POOL

    try {
        # Start app pool first (shared between both sites)
        Start-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Log -Message "Application Pool $appPoolName started." -LogFile $LogFile

        # Then start websites
        if (-not $BackendOnly) {
            Start-Website -Name $frontendSiteName -ErrorAction Stop
            Write-Log -Message "Frontend website $frontendSiteName started." -LogFile $LogFile
        }

        if (-not $FrontendOnly -and $backendSiteName -ne $frontendSiteName) {
            Start-Website -Name $backendSiteName -ErrorAction Stop
            Write-Log -Message "Backend website $backendSiteName started." -LogFile $LogFile
        }

        return $true
    } catch {
        Write-Log -Message "Warning: Could not start IIS services: $_" -Level "WARN" -LogFile $LogFile
        # This may happen if services were already running
        return $false
    }
}

# Create necessary deployment directories
function Create-DeploymentDirectories {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
    )

    Write-Log -Message "Creating deployment directories if they don't exist..." -LogFile $LogFile

    if (-not $BackendOnly) {
        if (!(Test-Path -Path $env:REACT_DEPLOYMENT_PATH)) {
            New-Item -ItemType Directory -Path $env:REACT_DEPLOYMENT_PATH -Force | Out-Null
            Write-Log -Message "Created React deployment directory." -LogFile $LogFile
        }
    }

    if (-not $FrontendOnly) {
        if (!(Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH)) {
            New-Item -ItemType Directory -Path $env:WEBAPI_DEPLOYMENT_PATH -Force | Out-Null
            Write-Log -Message "Created WebAPI deployment directory." -LogFile $LogFile
        }
    }
}

# Perform health check after deployment
function Perform-HealthCheck {
    param (
        [string]$LogFile = "./deployment_log.txt"
    )

    if ($env:HEALTH_CHECK_URL) {
        Write-Log -Message "Performing health check..." -LogFile $LogFile
        $healthCheckSuccess = $false

        for ($i = 1; $i -le [int]$env:HEALTH_CHECK_RETRIES; $i++) {
            try {
                Write-Log -Message "Health check attempt $i of $($env:HEALTH_CHECK_RETRIES)..." -LogFile $LogFile
                $response = Invoke-WebRequest -Uri $env:HEALTH_CHECK_URL -TimeoutSec 30 -UseBasicParsing

                if ($response.StatusCode -eq 200) {
                    Write-Log -Message "Health check passed: Status $($response.StatusCode)" -LogFile $LogFile
                    $healthCheckSuccess = $true
                    break
                } else {
                    Write-Log -Message "Health check returned non-200 status: $($response.StatusCode)" -Level "WARN" -LogFile $LogFile
                }
            } catch {
                Write-Log -Message "Health check failed: $_" -Level "WARN" -LogFile $LogFile
            }

            if ($i -lt [int]$env:HEALTH_CHECK_RETRIES) {
                Write-Log -Message "Waiting $($env:HEALTH_CHECK_RETRY_DELAY) seconds before next retry..." -LogFile $LogFile
                Start-Sleep -Seconds [int]$env:HEALTH_CHECK_RETRY_DELAY
            }
        }

        if (-not $healthCheckSuccess) {
            Write-Log -Message "All health checks failed. Deployment may be unstable." -Level "ERROR" -LogFile $LogFile

            # Send notification about failed health checks
            Send-Notification -Subject "Deployment Health Check Failed" -Body "The application health check failed after deployment. The application may be unstable or not functioning correctly." -Level "ERROR" -IncludeLog -IsError -LogFile $LogFile

            return $false
        }

        return $true
    }

    # If no health check URL defined, consider it a success
    return $true
}