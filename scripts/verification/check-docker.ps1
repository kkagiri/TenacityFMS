# PowerShell script to check Docker installation status

Write-Host "Checking Docker Desktop installation..." -ForegroundColor Cyan

# Check if Docker is installed
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor Green

        # Check if Docker daemon is running
        try {
            $dockerInfo = docker info 2>$null
            if ($dockerInfo) {
                Write-Host "[OK] Docker daemon is running" -ForegroundColor Green
                Write-Host "[OK] Ready to start Redis!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Yellow
                Write-Host "1. Run: .\start-redis.bat" -ForegroundColor White
                Write-Host "2. Run: .\verify-environment.ps1" -ForegroundColor White
                Write-Host "3. Start developing!" -ForegroundColor White
            } else {
                Write-Host "[WARNING] Docker is installed but daemon is not running" -ForegroundColor Yellow
                Write-Host "Please start Docker Desktop from the Start menu" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[WARNING] Docker is installed but daemon is not running" -ForegroundColor Yellow
            Write-Host "Please start Docker Desktop from the Start menu" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[MISSING] Docker is not installed" -ForegroundColor Red
        Write-Host "Please follow the instructions in INSTALL-DOCKER-MANUALLY.md" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[MISSING] Docker is not installed" -ForegroundColor Red
    Write-Host "Please follow the instructions in INSTALL-DOCKER-MANUALLY.md" -ForegroundColor Yellow
}

# Check if docker-compose is available
try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "[OK] Docker Compose is available: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Docker Compose not found separately (it's included in Docker Desktop)" -ForegroundColor Blue
    }
} catch {
    Write-Host "[INFO] Docker Compose not found separately (it's included in Docker Desktop)" -ForegroundColor Blue
}