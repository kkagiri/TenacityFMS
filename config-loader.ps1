# Function to parse the deploy.config file and set environment variables
function Load-DeployConfig {
    param(
        [string]$ConfigPath = "./deploy.config"
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

    Write-Host "Configuration loaded successfully"
}

# Load the configuration
Load-DeployConfig