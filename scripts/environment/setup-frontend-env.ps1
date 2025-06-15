# PowerShell script to set up frontend environment files
# Run this script from the root of the repository

# Create .env file with development settings
$envContent = @"
REACT_APP_FMS_API_URL_DEV=http://localhost:7009
REACT_APP_FMS_API_URL_PROD=http://localhost:7009
REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009
REACT_APP_AUTH_ENABLED=true
REACT_APP_LOG_LEVEL=debug
"@

# Create .env.development file
$envDevContent = @"
REACT_APP_FMS_API_URL_DEV=http://localhost:7009
REACT_APP_FMS_API_URL_PROD=http://localhost:7009
REACT_APP_PUBLIC_FMS_API_URL=http://localhost:7009
REACT_APP_AUTH_ENABLED=true
REACT_APP_LOG_LEVEL=debug
"@

# Create .env.production file for production builds
$envProdContent = @"
REACT_APP_FMS_API_URL_DEV=http://10.0.10.150:7009
REACT_APP_FMS_API_URL_PROD=http://10.0.10.150:7009
REACT_APP_PUBLIC_FMS_API_URL=http://10.0.10.150:7009
REACT_APP_AUTH_ENABLED=true
REACT_APP_LOG_LEVEL=error
"@

# Write files
Set-Content -Path "FMS.frontend\.env" -Value $envContent
Set-Content -Path "FMS.frontend\.env.development" -Value $envDevContent
Set-Content -Path "FMS.frontend\.env.production" -Value $envProdContent

Write-Host "Frontend environment files created successfully." -ForegroundColor Green
Write-Host "You can customize the API URLs in these files if needed." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in the PATH. Please install Node.js to run the frontend application." -ForegroundColor Red
}

# Instructions for starting the frontend
Write-Host "`nTo start the frontend application:" -ForegroundColor Cyan
Write-Host "1. Navigate to the frontend directory: cd FMS.frontend" -ForegroundColor White
Write-Host "2. Install dependencies: npm install" -ForegroundColor White
Write-Host "3. Start the development server: npm start" -ForegroundColor White