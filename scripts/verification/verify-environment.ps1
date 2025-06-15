# PowerShell script to verify FMS environment variables
# This script checks if all required environment variables are set at the machine level

$requiredVariables = @(
    "ConnectionStrings__FMSConnection",
    "ConnectionStrings__ATGConnection",
    "ConnectionStrings__RedisConnection",
    "JwtSettings__SecretKey",
    "JwtSettings__Issuer",
    "JwtSettings__Audience",
    "JwtSettings__ExpireDays",
    "SecretKey",
    "ApplicationId",
    "UploadStatusResponseDelay",
    "FuelConsumptionReportID",
    "GPSGateUser__Username",
    "GPSGateUser__Password",
    "EndOfShiftTime",
    "StartOfShiftTime"
)

$allVariablesSet = $true

Write-Host "Checking FMS environment variables..." -ForegroundColor Cyan

foreach ($var in $requiredVariables) {
    $value = [Environment]::GetEnvironmentVariable($var, 'Machine')

    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "[MISSING] $var is NOT set" -ForegroundColor Red
        $allVariablesSet = $false
    } else {
        # Mask sensitive information in the output
        if ($var -like "*password*" -or $var -like "*secret*") {
            $maskedValue = "********"
            Write-Host "[OK] $var is set to: $maskedValue" -ForegroundColor Green
        } else {
            Write-Host "[OK] $var is set to: $value" -ForegroundColor Green
        }
    }
}

if ($allVariablesSet) {
    Write-Host "`nAll required environment variables are properly set! Your FMS application should be able to connect to all required services." -ForegroundColor Green
} else {
    Write-Host "`nSome required environment variables are missing. Please run the setup-environment.ps1 script as Administrator to set them." -ForegroundColor Red
}