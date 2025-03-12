# Logging Functions

# Write log message to both console and log file
function Write-Log {
    param (
        [string]$Message,
        [string]$Level = "INFO",
        [string]$LogFile = "./deployment_log.txt"
    )

    # Use environment variable log file if it exists
    if ($env:logFile) {
        $LogFile = $env:logFile
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Output to console
    Write-Host $logMessage

    # Append to log file
    Add-Content -Path $LogFile -Value $logMessage
}

# Generate deployment summary information
function Generate-DeploymentSummary {
    param (
        [switch]$FrontendOnly,
        [switch]$BackendOnly,
        [string]$LogFile = "./deployment_log.txt"
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
    $deploymentStartTime = Get-Content -Path $LogFile | Select-Object -First 1 | ForEach-Object {
        if ($_ -match '\[(.*?)\]') {
            try { [DateTime]::ParseExact($Matches[1], "yyyy-MM-dd HH:mm:ss", $null) } catch { $deploymentEndTime.AddMinutes(-5) }
        } else { $deploymentEndTime.AddMinutes(-5) }
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
    Write-Log -Message "$deploymentType deployment completed successfully!" -LogFile $LogFile
    Write-Log -Message "Deployment log saved to: $((Get-Item $LogFile).FullName)" -LogFile $LogFile

    return $deploymentSummary
}