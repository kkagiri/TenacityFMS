# Quick Guide: Setting Up FMS After Cloning

When you clone this repository to a new environment (home PC, development machine, etc.), follow these steps to ensure everything works correctly:

## 0. Prerequisites

This application requires:
- **.NET 8.0 SDK** - Download from [https://dotnet.microsoft.com/download/dotnet/8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
- **MySQL Server** - For database access
- **Node.js and npm** - For the frontend application
- **Redis Server** (optional but recommended) - For distributed caching and SignalR backplane

## 1. Redis Setup (Choose One Option)

### Option A: Docker Redis (Recommended) ✅ READY TO USE
We've already set up everything you need! Just follow these steps:

1. **Install Docker Desktop**: Follow the instructions in `INSTALL-DOCKER-MANUALLY.md`
2. **Start Docker Desktop** and wait for it to be running
3. **Check Docker status**: Run `scripts/verification/check-docker.ps1`
4. **Start Redis**: Run `scripts/redis/start-redis.bat`
5. **Verify setup**: Run `scripts/verification/verify-environment.ps1`

### Option B: Install Redis on Windows
See `install-redis-windows.md` for detailed instructions on installing Redis directly on Windows.

### Option C: Development Without Redis
If you don't want to install Redis, you can run the application without it:
1. Use `scripts/environment/setup-environment-no-redis.bat` instead of `setup-environment.bat`
2. The application will automatically use in-memory alternatives

**Note:** Without Redis, you'll lose some features like:
- Multi-instance SignalR communication
- Distributed device status tracking
- Cross-service command processing (between WebClient and PTS Service)

For single-developer environments, Option C is perfectly fine.

## 2. Environment Variables ✅ COMPLETED

✅ **Already Done!** Your environment variables have been configured for Redis support.

To verify: Run `scripts/verification/verify-environment.ps1`

## 3. Frontend Environment ✅ COMPLETED

✅ **Already Done!** Your frontend environment files have been created.

## 4. Setup PTS Windows Service Environment (if needed)

The PTS Windows Service is a component that handles communication with fuel dispensers and other equipment:

1. Right-click on `scripts/environment/setup-pts-env.bat` in the project root
2. Select "Run as administrator"
3. Press any key when the script completes
4. Verify with:
   ```
   powershell -ExecutionPolicy Bypass -File scripts/verification/verify-pts-env.ps1
   ```

## 5. DevExpress Dependencies (If Needed)

This project uses DevExpress components. If you have DevExpress installed:

1. Open `NuGet.config` in the root directory
2. Uncomment and update the DevExpress package source path to match your installation:
   ```xml
   <add key="devextreme-controls-netcore" value="C:\Program Files (x86)\DevExpress [YOUR_VERSION]\DevExtreme\System\DevExtreme\Bin\AspNetCore" />
   ```
3. If you don't have DevExpress installed, the DevExpress-related functionality will be disabled

## 6. Customize for Your Environment (if needed)

If you need different database or Redis connections:

1. Edit `scripts/environment/setup-environment.bat` with your specific connection details
2. Run the batch file again as administrator
3. Verify with the verification script

For frontend API URLs:
1. Edit the .env files in the FMS.frontend directory
2. Update REACT_APP_FMS_API_URL_DEV and other URLs as needed

For PTS Service:
1. Edit `scripts/environment/setup-pts-env.bat` with your specific connection details
2. Run the batch file again as administrator
3. Verify with the verification script

## 7. Start Development

### Quick Status Check
Run `scripts/verification/check-docker.ps1` to see what's ready and what needs to be done.

### Backend:
1. Restart any running IDE (Visual Studio, etc.)
2. Build the solution
3. Run the FMS.WebClient project

### Frontend:
1. Navigate to the frontend directory: `cd FMS.frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. The frontend should open in your browser at http://localhost:3000

### PTS Windows Service:
For development:
1. Run the service directly: `dotnet run --project FMS.PTS.WindowsService`

For production:
1. Build the project: `dotnet build FMS.PTS.WindowsService -c Release`
2. Install as a Windows service (see instructions in setup-pts-env.bat)

## Helpful Scripts

- `scripts/verification/check-docker.ps1` - Check Docker installation status
- `scripts/redis/start-redis.bat` - Start Redis container
- `scripts/redis/stop-redis.bat` - Stop Redis container
- `scripts/verification/verify-environment.ps1` - Check all environment variables
- `scripts/verification/verify-pts-env.ps1` - Check PTS environment variables

## Important Note on appsettings Files

The appsettings files in the repository have had sensitive values replaced with placeholder text (`REPLACED_BY_ENV_VAR`). This is intentional:

- **DO NOT** add real connection strings or credentials to these files
- **DO NOT** delete these files as they contain important configuration structure
- The environment variables you set with the batch file will override these placeholders

## Committing Changes

Never commit changes to these files:
- `scripts/environment/setup-environment.bat` (if you modified connection strings)
- `FMS.WebClient/appsettings.Development.json` (if you added real credentials)
- `NuGet.config` (if you modified paths specific to your machine)
- `FMS.frontend/.env*` (environment files with your specific settings)
- `scripts/environment/setup-pts-env.bat` (if you modified connection strings)

For more detailed instructions, refer to the [ENVIRONMENT-SETUP.md](./ENVIRONMENT-SETUP.md) file.