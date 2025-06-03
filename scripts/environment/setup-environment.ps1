# PowerShell script to set up FMS environment variables at the machine level
# Run this script as Administrator

# Database Connection Strings
[Environment]::SetEnvironmentVariable('ConnectionStrings__FMSConnection', 'server=localhost;port=3306;database=gpsdata;user=root;password=root;connection timeout=2000;command timeout=2000', 'Machine')
[Environment]::SetEnvironmentVariable('ConnectionStrings__ATGConnection', 'server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000', 'Machine')
[Environment]::SetEnvironmentVariable('ConnectionStrings__RedisConnection','localhost:6379', 'Machine')

# JWT Settings
[Environment]::SetEnvironmentVariable('JwtSettings__SecretKey', 'YourLongSecretKeyHereMustBeAtLeast32Characters', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Issuer', 'Hyoung EA & Co', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__Audience', 'FMSUsers', 'Machine')
[Environment]::SetEnvironmentVariable('JwtSettings__ExpireDays', '7', 'Machine')

# Application Settings
[Environment]::SetEnvironmentVariable('SecretKey', 'Hyoung2030', 'Machine')
[Environment]::SetEnvironmentVariable('ApplicationId', '12', 'Machine')
[Environment]::SetEnvironmentVariable('UploadStatusResponseDelay', '5000', 'Machine')
[Environment]::SetEnvironmentVariable('FuelConsumptionReportID', '208', 'Machine')

# GPSGate User Settings
[Environment]::SetEnvironmentVariable('GPSGateUser__Username', 'kkagiri', 'Machine')
[Environment]::SetEnvironmentVariable('GPSGateUser__Password', 'Niwewe1000', 'Machine')

# Additional Settings
[Environment]::SetEnvironmentVariable('EndOfShiftTime', '18:59:59', 'Machine')
[Environment]::SetEnvironmentVariable('StartOfShiftTime', '06:00:00', 'Machine')

Write-Host "Environment variables have been set successfully at the machine level." -ForegroundColor Green
Write-Host "You may need to restart your applications for these changes to take effect." -ForegroundColor Yellow