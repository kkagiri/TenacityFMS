# Function to parse the deploy.config file and set environment variables
function Load-DeployConfig {
    param(
        [string]$ConfigPath = "./deployment/deploy.config"
    )

    Write-Host "Loading configuration from $ConfigPath"

    if (!(Test-Path $ConfigPath)) {
        Write-Host "Warning: Configuration file not found at $ConfigPath"
        return
    }

    # Read the config file line by line
    $configContent = Get-Content $ConfigPath

    foreach ($line in $configContent) {
        # Skip comments and empty lines
        if ($line.Trim().StartsWith("#") -or [string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        # Parse variable assignments (KEY="VALUE" format)
        if ($line -match '([A-Za-z0-9_]+)="([^"]*)"') {
            $key = $matches[1]
            $value = $matches[2]

            # Set as environment variable
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "Set $key = $value"
        }
    }

    # Set default log file path if not present
    if (-not [Environment]::GetEnvironmentVariable("logFile") -and [Environment]::GetEnvironmentVariable("LOG_FILE")) {
        [Environment]::SetEnvironmentVariable("logFile", [Environment]::GetEnvironmentVariable("LOG_FILE"), "Process")
        Write-Host "Set logFile from LOG_FILE configuration"
    }

    # Map notification variables to the expected format in the refactored scripts
    if ([Environment]::GetEnvironmentVariable("EMAIL_SMTP_SERVER")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_SMTP_SERVER", [Environment]::GetEnvironmentVariable("EMAIL_SMTP_SERVER"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_SMTP_PORT")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_SMTP_PORT", [Environment]::GetEnvironmentVariable("EMAIL_SMTP_PORT"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_USE_SSL")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_SMTP_USE_SSL", [Environment]::GetEnvironmentVariable("EMAIL_USE_SSL"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_USERNAME")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_SMTP_USER", [Environment]::GetEnvironmentVariable("EMAIL_USERNAME"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_PASSWORD")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_SMTP_PASSWORD", [Environment]::GetEnvironmentVariable("EMAIL_PASSWORD"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_FROM")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_EMAIL_FROM", [Environment]::GetEnvironmentVariable("EMAIL_FROM"), "Process")
    }

    if ([Environment]::GetEnvironmentVariable("EMAIL_TO")) {
        [Environment]::SetEnvironmentVariable("NOTIFICATION_EMAIL_TO", [Environment]::GetEnvironmentVariable("EMAIL_TO"), "Process")
    }

    Write-Host "Configuration loaded successfully"
}

# Load the configuration
Load-DeployConfig

# Validate required settings
$requiredSettings = @(
    "REACT_BUILD_PATH",
    "WEBAPI_BUILD_PATH",
    "REACT_DEPLOYMENT_PATH",
    "WEBAPI_DEPLOYMENT_PATH",
    "IIS_SITE_NAME",
    "IIS_APP_POOL"
)

$missingSettings = @()
foreach ($setting in $requiredSettings) {
    if (-not (Get-Item env:$setting -ErrorAction SilentlyContinue)) {
        $missingSettings += $setting
    }
}

if ($missingSettings.Count -gt 0) {
    Write-Host "Missing required configuration settings: $($missingSettings -join ', ')" -ForegroundColor Red
    throw "Missing required configuration settings: $($missingSettings -join ', ')"
}