@echo off
echo Setting up FMS environment variables...

REM Database Connection Strings
setx ConnectionStrings__FMSConnection "server=localhost;port=3306;database=gpsdata;user=root;password=root;connection timeout=2000;command timeout=2000" /M
setx ConnectionStrings__ATGConnection "server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000" /M
setx ConnectionStrings__RedisConnection "localhost:6379" /M

REM JWT Settings
setx JwtSettings__SecretKey "YourLongSecretKeyHereMustBeAtLeast32Characters" /M
setx JwtSettings__Issuer "Hyoung EA & Co" /M
setx JwtSettings__Audience "FMSUsers" /M
setx JwtSettings__ExpireDays "7" /M

REM Application Settings
setx SecretKey "Hyoung2030" /M
setx ApplicationId "12" /M
setx UploadStatusResponseDelay "5000" /M
setx FuelConsumptionReportID "208" /M

REM GPSGate User Settings
setx GPSGateUser__Username "kkagiri" /M
setx GPSGateUser__Password "Niwewe1000" /M

REM Additional Settings
setx EndOfShiftTime "18:59:59" /M
setx StartOfShiftTime "06:00:00" /M

echo Environment variables have been set successfully at the machine level.
echo You may need to restart your applications for these changes to take effect.
pause