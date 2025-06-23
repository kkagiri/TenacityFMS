# Manual Docker Installation Instructions

Since the automated download is having issues, please follow these manual steps:

## Step 1: Download Docker Desktop

1. **Open your web browser** and go to: https://www.docker.com/products/docker-desktop/
2. **Click "Download Docker Desktop"** (it will automatically detect Windows)
3. **OR** go directly to: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
4. **Save the file** to your `C:\Users\admin\repo\Hyoung.FMS` directory

## Step 2: Install Docker Desktop

1. **Right-click** on the downloaded `Docker Desktop Installer.exe`
2. **Select "Run as administrator"**
3. **Follow the installation wizard**:
   - Accept the license agreement
   - Choose "Use WSL 2 instead of Hyper-V" (recommended)
   - Wait for installation to complete
4. **Restart your computer** when prompted

## Step 3: Start Docker Desktop

1. **Search for "Docker Desktop"** in the Start menu
2. **Launch Docker Desktop**
3. **Accept the terms** when prompted
4. **Wait for Docker to start** (first startup may take a few minutes)

## Step 4: Verify Installation

Open PowerShell and run:
```powershell
docker --version
docker-compose --version
```

## Step 5: Start Redis

Once Docker is installed and running, come back to this directory and run:
```powershell
scripts/redis/start-redis.bat
```

## Alternative: Quick Redis Setup

If you prefer not to install Docker right now, you can use the no-Redis setup:
1. Run `scripts/environment/setup-environment-no-redis.bat` as administrator
2. This will configure the FMS application to work without Redis

---

**Need help?** The Docker installer typically weighs ~500MB+, so if you see a much smaller file, the download likely failed.