@echo off
echo Setting up FMS environment variables (No Redis Version)...

REM Database Connection Strings (Required)
setx ConnectionStrings__FMSConnection "server=10.0.10.150;port=3306;database=gpsdata;user=root;password=Niwewenamimi1000;connection timeout=2000;command timeout=2000;AllowZeroDateTime=True;" /M
setx ConnectionStrings__ATGConnection "server=10.0.11.239;port=3306;database=azs;user=kkagiri;password=Hyoung2030;connection timeout=10000;command timeout=10000;AllowZeroDateTime=True;" /M

REM DO NOT SET Redis connection - this will make the app use in-memory alternatives
REM setx ConnectionStrings__RedisConnection "10.0.10.154:6379" /M

REM JWT Settings (Required)
setx JwtSettings__SecretKey "YourLongSecretKeyHereMustBeAtLeast32Characters" /M
setx JwtSettings__Issuer "Hyoung EA & Co" /M
setx JwtSettings__Audience "FMSUsers" /M
setx JwtSettings__ExpireDays "7" /M

REM Application Settings (Required)
setx SecretKey "YourLongSecretKeyHereMustBeAtLeast32CharactersForSecurity!" /M
setx ApplicationId "FMS" /M

REM GPSGate User Credentials (Required)
setx GPSGateUser "admin" /M
setx GPSGatePassword "admin" /M

echo Environment variables have been set successfully (WITHOUT Redis).
echo.
echo The application will use:
echo - In-memory SignalR (instead of Redis backplane)
echo - In-memory distributed cache (instead of Redis cache)
echo - Local device tracking (instead of Redis-based tracking)
echo.
echo This is perfectly fine for development purposes.
echo If you want full Redis functionality later, use setup-environment.bat instead.

pause