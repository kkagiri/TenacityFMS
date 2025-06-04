@echo off
echo Setting up environment variables for PTS Windows Service...

REM Create logging directory if it doesn't exist
if not exist "C:\Logs\FMS.PTS" (
    mkdir "C:\Logs\FMS.PTS"
    echo Created log directory: C:\Logs\FMS.PTS
)

REM Database Connection Strings
setx PTSService__ConnectionStrings__FMSConnection "server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;" /M
setx PTSService__ConnectionStrings__ATGConnection "server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000;AllowZeroDateTime=True;" /M
setx PTSService__ConnectionStrings__RedisConnection "10.0.10.154:6379"

REM WebSocket Configuration
setx PTSService__WebSocket__ListenPort "54098" /M
setx PTSService__WebSocket__Host "localhost" /M
setx PTSService__WebSocket__MaxConcurrentConnections "100" /M
setx PTSService__WebSocket__BasePath "/ptsWebSocket" /M

REM Device Configuration
setx PTSService__Device__AutoReconnect "true" /M
setx PTSService__Device__ReconnectIntervalSeconds "30" /M
setx PTSService__Device__HealthCheckIntervalSeconds "60" /M

REM Logging Configuration
setx PTSService__Logging__FilePath "C:\\Logs\\FMS.PTS\\pts-service.log" /M
setx PTSService__Logging__MinimumLevel "Information" /M

REM JWT Settings
setx Jwt__Key "YourLongSecretKeyHereMustBeAtLeast32Characters" /M
setx Jwt__Issuer "Hyoung EA & Co" /M
setx Jwt__Audience "FMSUsers" /M
setx Jwt__ExpiryInMinutes "10080" /M

REM Set the environment
setx DOTNET_ENVIRONMENT "Development" /M

echo Environment variables for PTS Windows Service have been set successfully.
echo You may need to restart the service for these changes to take effect.

echo.
echo To install the PTS Windows Service:
echo 1. Build the project: dotnet build FMS.PTS.WindowsService -c Release
echo 2. Create the service using sc.exe:
echo    sc.exe create FMSPTS binPath= "C:\path\to\FMS.PTS.WindowsService.exe"
echo 3. Start the service:
echo    sc.exe start FMSPTS
echo.
echo Or for development, run directly:
echo    dotnet run --project FMS.PTS.WindowsService

pause