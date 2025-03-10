# Load configuration
. ./config-loader.ps1

# Print debug information
Write-Host "Starting deployment process..."
Write-Host "REACT_BUILD_PATH: $env:REACT_BUILD_PATH"
Write-Host "WEBAPI_BUILD_PATH: $env:WEBAPI_BUILD_PATH"
Write-Host "REACT_DEPLOYMENT_PATH: $env:REACT_DEPLOYMENT_PATH"
Write-Host "WEBAPI_DEPLOYMENT_PATH: $env:WEBAPI_DEPLOYMENT_PATH"
Write-Host "IIS_SITE_NAME: $env:IIS_SITE_NAME"
Write-Host "IIS_APP_POOL: $env:IIS_APP_POOL"

# Stop the IIS site and application pool
Write-Host "Stopping IIS services..."
Import-Module WebAdministration
$siteName = $env:IIS_SITE_NAME
$appPoolName = $env:IIS_APP_POOL

try {
    if (Get-Website -Name $siteName) {
        Stop-Website -Name $siteName -ErrorAction Stop
        Write-Host "Website $siteName stopped."
    }
    
    if (Get-WebAppPoolState -Name $appPoolName) {
        Stop-WebAppPool -Name $appPoolName -ErrorAction Stop
        Write-Host "Application Pool $appPoolName stopped."
    }
} catch {
    Write-Host "Warning: Could not stop IIS services: $_"
    # Continue anyway, as we may just need to copy files
}

# Create deployment directories if they don't exist
Write-Host "Creating deployment directories if they don't exist..."
if (!(Test-Path -Path $env:REACT_DEPLOYMENT_PATH)) {
    New-Item -ItemType Directory -Path $env:REACT_DEPLOYMENT_PATH -Force
    Write-Host "Created React deployment directory."
}
if (!(Test-Path -Path $env:WEBAPI_DEPLOYMENT_PATH)) {
    New-Item -ItemType Directory -Path $env:WEBAPI_DEPLOYMENT_PATH -Force
    Write-Host "Created WebAPI deployment directory."
}

# Clean deployment directories but preserve web.config
Write-Host "Cleaning deployment directories (preserving web.config)..."

# Handle React deployment directory
if (Test-Path -Path "$env:REACT_DEPLOYMENT_PATH\web.config") {
    $reactWebConfig = Get-Content "$env:REACT_DEPLOYMENT_PATH\web.config"
    Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | 
        Where-Object { $_.FullName -ne "$env:REACT_DEPLOYMENT_PATH\web.config" } | 
        Remove-Item -Recurse -Force
    Write-Host "React directory cleaned (preserved web.config)."
} else {
    Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
    Write-Host "React directory cleaned (no web.config found)."
}

# Handle WebAPI deployment directory
if (Test-Path -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config") {
    $webApiWebConfig = Get-Content "$env:WEBAPI_DEPLOYMENT_PATH\web.config"
    Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | 
        Where-Object { $_.FullName -ne "$env:WEBAPI_DEPLOYMENT_PATH\web.config" } | 
        Remove-Item -Recurse -Force
    Write-Host "WebAPI directory cleaned (preserved web.config)."
} else {
    Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse | Remove-Item -Recurse -Force
    Write-Host "WebAPI directory cleaned (no web.config found)."
}

# Copy React build files
Write-Host "Copying React build files..."
Copy-Item -Path "$env:REACT_BUILD_PATH\*" -Destination $env:REACT_DEPLOYMENT_PATH -Recurse -Force
Write-Host "React files copied. Count: $((Get-ChildItem -Path $env:REACT_DEPLOYMENT_PATH -Recurse).Count) files"

# Restore web.config if we saved it
if ($reactWebConfig) {
    Set-Content -Path "$env:REACT_DEPLOYMENT_PATH\web.config" -Value $reactWebConfig
    Write-Host "React web.config restored."
}

# Copy Web API files
Write-Host "Copying Web API files..."
Copy-Item -Path "$env:WEBAPI_BUILD_PATH\*" -Destination $env:WEBAPI_DEPLOYMENT_PATH -Recurse -Force
Write-Host "WebAPI files copied. Count: $((Get-ChildItem -Path $env:WEBAPI_DEPLOYMENT_PATH -Recurse).Count) files"

# Restore web.config if we saved it
if ($webApiWebConfig) {
    Set-Content -Path "$env:WEBAPI_DEPLOYMENT_PATH\web.config" -Value $webApiWebConfig
    Write-Host "WebAPI web.config restored."
}

# Start the IIS site and app pool
Write-Host "Starting IIS services..."
try {
    Start-WebAppPool -Name $appPoolName -ErrorAction Stop
    Write-Host "Application Pool $appPoolName started."
    
    Start-Website -Name $siteName -ErrorAction Stop
    Write-Host "Website $siteName started."
} catch {
    Write-Host "Warning: Could not start IIS services: $_"
    # This may happen if services were already running
}

Write-Host "Deployment completed successfully!"
