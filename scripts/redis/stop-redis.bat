@echo off
echo Stopping Redis for FMS development...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running or not installed.
    echo Please start Docker Desktop.
    pause
    exit /b 1
)

REM Stop Redis using Docker Compose
echo Stopping Redis container...
docker-compose -f docker-compose.redis.yml down

echo.
echo Redis has been stopped.
echo To start Redis again: start-redis.bat

pause