# PowerShell script to verify PTS Windows Service environment variables
# This script checks if all required environment variables are set at the machine level

$requiredVariables = @(
    "PTSService__ConnectionStrings__FMSConnection",
    "PTSService__ConnectionStrings__ATGConnection",
    "PTSService__ConnectionStrings__RedisConnection",
    "PTSService__WebSocket__ListenPort",
    "PTSService__WebSocket__Host",
    "PTSService__WebSocket__MaxConcurrentConnections",
    "PTSService__WebSocket__BasePath",
    "PTSService__Device__AutoReconnect",
    "PTSService__Device__ReconnectIntervalSeconds",
    "PTSService__Device__HealthCheckIntervalSeconds",
    "PTSService__Logging__FilePath",
    "PTSService__Logging__MinimumLevel",
    "Jwt__Key",
    "Jwt__Issuer",
    "Jwt__Audience",
    "Jwt__ExpiryInMinutes",
    "DOTNET_ENVIRONMENT"
)

$allVariablesSet = $true

Write-Host "Checking PTS Windows Service environment variables..." -ForegroundColor Cyan

foreach ($var in $requiredVariables) {
    $value = [Environment]::GetEnvironmentVariable($var, 'Machine')

    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "[MISSING] $var is NOT set" -ForegroundColor Red
        $allVariablesSet = $false
    } else {
        # Mask sensitive information in the output
        if ($var -like "*password*" -or $var -like "*key*" -or $var -like "*secret*") {
            $maskedValue = "********"
            Write-Host "[OK] $var is set to: $maskedValue" -ForegroundColor Green
        } else {
            Write-Host "[OK] $var is set to: $value" -ForegroundColor Green
        }
    }
}

# Check if the log directory exists
if (Test-Path "C:\Logs\FMS.PTS") {
    Write-Host "[OK] Log directory C:\Logs\FMS.PTS exists" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Log directory C:\Logs\FMS.PTS does not exist" -ForegroundColor Red
    $allVariablesSet = $false
}

if ($allVariablesSet) {
    Write-Host "`nAll required environment variables for PTS Windows Service are properly set!" -ForegroundColor Green
} else {
    Write-Host "`nSome required environment variables for PTS Windows Service are missing. Please run the setup-pts-env.ps1 script as Administrator to set them." -ForegroundColor Red
}