# ADB Device Manager - Quick Reference

## Overview

Tools for managing Android device connections and port forwarding for FMS Mobile development with backend API on port 7009.

## Files

- `adb-device-manager.ps1` - PowerShell script with full functionality
- `adb-device.bat` - Batch wrapper for easy execution
- `adb-commands-quick.txt` - Quick command reference

## Usage

### Option 1: Run Batch File (Easiest)

```batch
cd fms.mobile
adb-device.bat                    # Interactive menu
adb-device.bat list               # List devices
adb-device.bat connect            # Connect to device
adb-device.bat forward            # Setup port forwarding
```

### Option 2: Run PowerShell Script

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\adb-device-manager.ps1 -Action list
.\adb-device-manager.ps1 -Action connect
.\adb-device-manager.ps1 -Action forward
```

### Option 3: Manual ADB Commands

#### List Connected Devices

```bash
adb devices
```

#### Connect to Emulator (TCP)

```bash
adb connect localhost:5555
```

#### Connect to Physical Device Over Network

```bash
adb connect <device-ip>:5555
```

#### Setup Port Forwarding (localhost → device)

```bash
adb forward tcp:7009 tcp:7009
```

#### Setup Reverse Port Forwarding (device → localhost)

```bash
adb reverse tcp:7009 tcp:7009
```

#### View Forwarded Ports

```bash
adb forward --list
adb reverse --list
```

#### Clear Port Forwarding

```bash
adb forward --remove-all
adb reverse --remove-all
```

#### Clear Specific Port

```bash
adb forward --remove tcp:7009
adb reverse --remove tcp:7009
```

#### Disconnect Device

```bash
adb disconnect <device-id>
```

#### Restart ADB Server

```bash
adb kill-server
adb start-server
```

## Common Scenarios

### Scenario 1: Debug on Emulator

```batch
REM 1. Start Android Emulator from Android Studio

REM 2. List devices
adb devices

REM 3. Setup port forwarding
adb forward tcp:7009 tcp:7009

REM 4. Check connection
adb shell ping -c 1 localhost:7009
```

### Scenario 2: Debug on Physical Device (USB)

```batch
REM 1. Connect device via USB cable

REM 2. Enable USB Debugging on device

REM 3. List devices
adb devices

REM 4. Setup port forwarding
adb forward tcp:7009 tcp:7009

REM 5. Verify connection works
curl http://localhost:7009/api/v1/User
```

### Scenario 3: Debug on Physical Device (WiFi)

```batch
REM 1. Get device IP (Settings > About > IP Address)

REM 2. Connect via TCP
adb connect <device-ip>:5555

REM 3. Setup port forwarding
adb forward tcp:7009 tcp:7009

REM 4. Test API endpoint
curl http://localhost:7009/api/v1/User
```

### Scenario 4: Device → LocalHost Access

When the app needs to call backend on device:

```batch
adb reverse tcp:7009 tcp:7009
REM App calls: http://localhost:7009/api/...
```

## Port Forwarding Explanation

### Forward (localhost → device)

```
localhost:7009 ──forward──> device:7009
```

Use when: Your PC runs server, device needs to access it

### Reverse (device → localhost)

```
device:7009 ──reverse──> localhost:7009
```

Use when: Device app needs to call backend on PC

## Testing Connection

### From PC (after forward)

```powershell
Invoke-WebRequest http://localhost:7009/api/v1/User -Method GET
```

### From Device Shell

```bash
adb shell am start -a android.intent.action.VIEW -d "http://localhost:7009/api/v1/User"
```

## Troubleshooting

### Device Not Showing

```batch
adb kill-server
adb start-server
adb devices
```

### Port Already in Use

```batch
REM Remove all port forwards
adb forward --remove-all
adb reverse --remove-all

REM Or use different local port
adb forward tcp:8009 tcp:7009
```

### Network Connection Timeout

```batch
REM Check if device can reach host
adb shell ping <host-ip>

REM Check port is open
REM On Windows (admin):
netstat -ano | findstr :7009
```

### Emulator Specific Issues

```batch
REM Emulator may use 10.0.2.2 instead of localhost
REM Check Android Virtual Device settings

REM Restart emulator
adb emu kill
```

## Environment Variables

Set these for permanent ADB path (optional):

```powershell
# PowerShell
$env:Path += ";C:\Android\sdk\platform-tools"

# Batch (set in system environment variables)
set PATH=%PATH%;C:\Android\sdk\platform-tools
```

## References

- [Android Debug Bridge (ADB) Documentation](https://developer.android.com/studio/command-line/adb)
- [Android Emulator Network](https://developer.android.com/studio/run/emulator-networking)
- FMS Backend: http://localhost:7009/
