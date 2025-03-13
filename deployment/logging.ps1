# logging.ps1
# Description: This script contains functions for logging deployment information to the console and a log file.
# Logging Functions

# Write log message to both console and log file
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO",
        [string]$LogFile = "./logs/deployment_log.txt"
    )

    # Create log directory if it doesn't exist
    $logDir = Split-Path -Path $LogFile -Parent
    if (-not (Test-Path -Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }

    # Create log file if it doesn't exist
    if (-not (Test-Path -Path $LogFile)) {
        New-Item -Path $LogFile -ItemType File -Force | Out-Null
        Add-Content -Path $LogFile -Value "------ New Log File Created $(Get-Date) ------`n"
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Output to console with color based on level
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARN" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Host $logMessage }
    }

    # Append to log file
    Add-Content -Path $LogFile -Value $logMessage
}

# Generate deployment summary information
function Generate-DeploymentSummary {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./logs/deployment_log.txt"
    )

    # Gather deployment summary information
    $deploymentType = if ($FrontendOnly) {
        "Frontend Only"
    } elseif ($BackendOnly) {
        "Backend Only"
    } else {
        "Full (Frontend and Backend)"
    }

    # Calculate deployment metrics
    $deploymentEndTime = Get-Date

    # Read the log file for start time - handle if the file doesn't exist
    if (Test-Path -Path $LogFile) {
        $firstLogLine = Get-Content -Path $LogFile | Select-Object -First 1
        $deploymentStartTime = if ($firstLogLine -match '\[(.*?)\]') {
            try {
                [DateTime]::ParseExact($Matches[1], "yyyy-MM-dd HH:mm:ss", $null)
            } catch {
                $deploymentEndTime.AddMinutes(-5)
            }
        } else {
            $deploymentEndTime.AddMinutes(-5)
        }
    } else {
        $deploymentStartTime = $deploymentEndTime.AddMinutes(-5)
        Write-Host "Warning: Log file not found at $LogFile. Using estimated start time." -ForegroundColor Yellow
    }

    $deploymentDuration = $deploymentEndTime - $deploymentStartTime
    $deploymentDurationFormatted = "{0:hh\:mm\:ss}" -f $deploymentDuration

    # Create detailed summary
    $deploymentSummary = @"
DEPLOYMENT SUMMARY
-----------------
Type: $deploymentType
Environment: $env:ENVIRONMENT
Server: $env:COMPUTERNAME
Start Time: $deploymentStartTime
End Time: $deploymentEndTime
Duration: $deploymentDurationFormatted

Frontend Site: $env:IIS_SITE_NAME
Backend Site: $env:BACKEND_SITE_NAME
Application Pool: $env:IIS_APP_POOL

Frontend Files Count: $((Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count)
Backend Files Count: $((Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count)
"@

    # Log the summary
    Write-Log -Message "Deployment Summary:" -LogFile $LogFile
    $deploymentSummary -split "`n" | ForEach-Object { Write-Log -Message $_ -LogFile $LogFile }
    Write-Log -Message "$deploymentType deployment completed successfully!" -Level "SUCCESS" -LogFile $LogFile
    Write-Log -Message "Deployment log saved to: $((Get-Item $LogFile).FullName)" -LogFile $LogFile

    return $deploymentSummary
}