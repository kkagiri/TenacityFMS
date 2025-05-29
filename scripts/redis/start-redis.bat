@echo off
echo Starting Redis for FMS development...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running or not installed.
    echo Please install Docker Desktop and make sure it's running.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Start Redis using Docker Compose
echo Starting Redis container...
docker-compose -f docker-compose.redis.yml up -d

REM Check if Redis is running
timeout /t 3 >nul
docker ps --filter "name=fms-redis-dev" --filter "status=running" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Redis is now running on localhost:6379
echo.
echo To stop Redis: docker-compose -f docker-compose.redis.yml down
echo To view Redis logs: docker logs fms-redis-dev
echo To connect to Redis CLI: docker exec -it fms-redis-dev redis-cli

pause