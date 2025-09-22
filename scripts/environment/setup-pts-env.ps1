# PowerShell script to set up PTS Windows Service environment variables
# Run this script as Administrator

# Set environment variables for the PTS Windows Service
Write-Host "Setting up environment variables for PTS Windows Service..." -ForegroundColor Cyan

# Create logging directory if it doesn't exist
if (-not (Test-Path "C:\Logs\FMS.PTS")) {
    New-Item -Path "C:\Logs\FMS.PTS" -ItemType Directory -Force
    Write-Host "Created log directory: C:\Logs\FMS.PTS" -ForegroundColor Green
}

# Database Connection Strings
[Environment]::SetEnvironmentVariable('PTSService__ConnectionStrings__FMSConnection', 'server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__ConnectionStrings__ATGConnection', 'server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000;AllowZeroDateTime=True;', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__ConnectionStrings__RedisConnection', '10.0.10.154:6379', 'Machine')

# WebSocket Configuration
[Environment]::SetEnvironmentVariable('PTSService__WebSocket__ListenPort', '54098', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__WebSocket__Host', '10.0.10.153', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__WebSocket__MaxConcurrentConnections', '100', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__WebSocket__BasePath', '/ptsWebSocket', 'Machine')

# Device Configuration
[Environment]::SetEnvironmentVariable('PTSService__Device__AutoReconnect', 'true', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__Device__ReconnectIntervalSeconds', '30', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__Device__HealthCheckIntervalSeconds', '60', 'Machine')

# Logging Configuration
[Environment]::SetEnvironmentVariable('PTSService__Logging__FilePath', 'C:\\Logs\\FMS.PTS\\pts-service.log', 'Machine')
[Environment]::SetEnvironmentVariable('PTSService__Logging__MinimumLevel', 'Information', 'Machine')

# JWT Settings
[Environment]::SetEnvironmentVariable('Jwt__Key', 'YourLongSecretKeyHereMustBeAtLeast32Characters', 'Machine')
[Environment]::SetEnvironmentVariable('Jwt__Issuer', 'Hyoung EA & Co', 'Machine')
[Environment]::SetEnvironmentVariable('Jwt__Audience', 'FMSUsers', 'Machine')
[Environment]::SetEnvironmentVariable('Jwt__ExpiryInMinutes', '10080', 'Machine')

# Set the environment
[Environment]::SetEnvironmentVariable('DOTNET_ENVIRONMENT', 'Development', 'Machine')

Write-Host "Environment variables for PTS Windows Service have been set successfully." -ForegroundColor Green
Write-Host "You may need to restart the service for these changes to take effect." -ForegroundColor Yellow

# Instructions for installing and starting the service
Write-Host "`nTo install the PTS Windows Service:" -ForegroundColor Cyan
Write-Host "1. Build the project: dotnet build FMS.PTS.WindowsService -c Release" -ForegroundColor White
Write-Host "2. Create the service using sc.exe:" -ForegroundColor White
Write-Host "   sc.exe create FMSPTS binPath= ""C:\path\to\FMS.PTS.WindowsService.exe""" -ForegroundColor White
Write-Host "3. Start the service:" -ForegroundColor White
Write-Host "   sc.exe start FMSPTS" -ForegroundColor White
Write-Host "`nOr for development, run directly:" -ForegroundColor Cyan
Write-Host "   dotnet run --project FMS.PTS.WindowsService" -ForegroundColor White