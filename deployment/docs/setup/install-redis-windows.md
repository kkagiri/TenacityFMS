# Installing Redis on Windows

## Option 1: Using Windows Subsystem for Linux (WSL)

1. **Install WSL2** (if not already installed):
   ```powershell
   wsl --install
   ```

2. **Install Redis in WSL**:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

3. **Start Redis**:
   ```bash
   sudo service redis-server start
   ```

4. **Make Redis accessible from Windows**:
   - Edit Redis config: `sudo nano /etc/redis/redis.conf`
   - Change `bind 127.0.0.1` to `bind 0.0.0.0`
   - Restart: `sudo service redis-server restart`

## Option 2: Using Chocolatey

1. **Install Chocolatey** (if not installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install Redis**:
   ```powershell
   choco install redis-64
   ```

3. **Start Redis service**:
   ```powershell
   redis-server
   ```

## Option 3: Download Pre-built Binary

1. Download from: https://github.com/tporadowski/redis/releases
2. Extract to `C:\Redis`
3. Open Command Prompt as Administrator
4. Navigate to `C:\Redis`
5. Run: `redis-server.exe`