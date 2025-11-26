# How to View FMS Application Logs

Your logs are currently written to **file-based sinks** at `C:\Logs\FMS.Webclient\`. Here are multiple ways to view them:

---

## 🎯 Option 1: Tail Log Files in PowerShell (FASTEST)

### Watch logs in real-time:

```powershell
# Open PowerShell and run:
Get-Content "C:\Logs\FMS.Webclient\app\app-log-20251119.log" -Wait -Tail 50
```

**Explanation:**
- `-Wait` keeps the terminal open and shows new lines as they're written
- `-Tail 50` shows the last 50 lines immediately
- Replace `20251119` with today's date in `YYYYMMDD` format

### Filter for GPS-related logs only:

```powershell
Get-Content "C:\Logs\FMS.Webclient\app\app-log-20251119.log" -Wait | Where-Object { $_ -match "GPS|GPSGate|Vehicle 422|Sensor" }
```

### View error logs:

```powershell
Get-Content "C:\Logs\FMS.Webclient\errors\error-20251119.log" -Wait -Tail 50
```

---

## 🖥️ Option 2: View Logs in VS Code Terminal

### Create a PowerShell task to tail logs:

1. **Press `Ctrl+Shift+P`** → Type "Tasks: Run Task"
2. **Or manually run in VS Code terminal:**

```powershell
# In VS Code terminal (PowerShell):
Get-Content "C:\Logs\FMS.Webclient\app\app-log-$(Get-Date -Format 'yyyyMMdd').log" -Wait -Tail 100
```

This dynamically uses today's date!

---

## 📺 Option 3: See Logs in Visual Studio Output Window

### If running from Visual Studio:

1. **Start the FMS.WebClient project**
2. **View → Output** (or `Ctrl+Alt+O`)
3. Select **"Debug"** from the "Show output from:" dropdown
4. You'll see console logs in real-time with emojis!

**Note:** The bootstrap logger (from Program.cs) already writes to Console, so you should see logs there.

---

## 🔧 Option 4: Add Real-Time Console Logging (RECOMMENDED FOR DEV)

If you want to see logs **directly in Visual Studio Debug Output** with colors and emojis:

### Enhance Console Output Template:

**File: `FMS.WebClient\appsettings.Development.json`**

```json
"WriteTo": [
  {
    "Name": "Console",
    "Args": {
      "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} => {Message:lj}{NewLine}{Exception}",
      "theme": "Serilog.Sinks.SystemConsole.Themes.AnsiConsoleTheme::Code, Serilog.Sinks.Console"
    }
  },
  // ... file sinks remain the same
]
```

This adds:
- `{SourceContext}` - shows which class logged (e.g., `GPSGateSensorService`)
- ANSI color theme for better readability

---

## 🎨 Option 5: Use a Log Viewer Tool

### Install BareTail (Free Log Viewer):

1. Download from: https://www.baremetalsoft.com/baretail/
2. Open: `C:\Logs\FMS.Webclient\app\app-log-20251119.log`
3. It auto-refreshes and highlights log levels with colors

### Or use Notepad++ with "Document Monitor" plugin:

1. Open log file in Notepad++
2. **Plugins → Document Monitor → Start to Monitor**
3. File updates automatically as new logs arrive

---

## 🔍 Quick Diagnostics: Find Your GPS Logs

### Search all logs for Vehicle 422:

```powershell
Select-String -Path "C:\Logs\FMS.Webclient\app\app-log-*.log" -Pattern "Vehicle 422" -Context 2,5
```

**Output shows:**
- 2 lines before the match
- The matching line
- 5 lines after the match

### Search for sensor parsing logs:

```powershell
Select-String -Path "C:\Logs\FMS.Webclient\app\app-log-*.log" -Pattern "Parsed Fuel Level|Parsed Battery|Parsed Ignition" | Select-Object -Last 20
```

---

## 🚀 Immediate Action: Test Your Endpoint

### 1. Open PowerShell Terminal:

```powershell
# Start tailing logs
Get-Content "C:\Logs\FMS.Webclient\app\app-log-$(Get-Date -Format 'yyyyMMdd').log" -Wait -Tail 100
```

### 2. In another terminal, call the API:

```powershell
curl http://localhost:5000/api/v1/vehicletracking/422/gps-information
```

*(Replace port with your actual port)*

### 3. Watch the logs in the first terminal!

You should see:
```
[15:30:45 INF] 🔍 Getting GPS info for Vehicle 422, ExternalDeviceId: 422, HasMapping: True
[15:30:45 INF] 📡 Calling GPSGate status API: http://10.0.10.150/...
[15:30:45 INF] 📡 GPSGate status API response: 200
[15:30:45 INF] 📡 GPSGate raw response length: 3456 chars
[15:30:45 INF] 📊 Parsed GPSGate data: Position=True, Variables=14
[15:30:45 INF] 🔧 Parsing 14 sensor variables for vehicle 422
[15:30:45 INF] ✓ Parsed Fuel Level (Fuel level): 63.75 Liters
[15:30:45 INF] ✓ Parsed Battery Voltage (Battery Voltage): 12.8
[15:30:45 INF] ✓ Parsed Ignition: True
```

---

## 📂 Log File Locations

| Log Type | Path | Purpose |
|----------|------|---------|
| **Application Logs** | `C:\Logs\FMS.Webclient\app\app-log-YYYYMMDD.log` | All Info+ level logs |
| **Error Logs** | `C:\Logs\FMS.Webclient\errors\error-YYYYMMDD.log` | Error and Fatal only |
| **Startup Logs** | `C:\Logs\FMS.Webclient\startup\webclient-startup.log` | Bootstrap/initialization |
| **Audit Logs** | `C:\Logs\FMS.Webclient\audit\audit-YYYYMMDD.log` | User actions (if configured) |
| **Transaction Logs** | `C:\Logs\FMS.Webclient\transaction\transaction-YYYYMMDD.log` | PTS transactions |

---

## 🎓 Pro Tips

### 1. **Use PowerShell Aliases:**

Add to your PowerShell profile:

```powershell
# Add to: $PROFILE (run `notepad $PROFILE`)
function Watch-FMSLogs {
    Get-Content "C:\Logs\FMS.Webclient\app\app-log-$(Get-Date -Format 'yyyyMMdd').log" -Wait -Tail 50
}

function Watch-FMSErrors {
    Get-Content "C:\Logs\FMS.Webclient\errors\error-$(Get-Date -Format 'yyyyMMdd').log" -Wait -Tail 50
}

# Usage:
# Watch-FMSLogs
# Watch-FMSErrors
```

### 2. **Create a VS Code Task** for log viewing:

**File: `.vscode/tasks.json`**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Watch FMS Logs",
      "type": "shell",
      "command": "Get-Content",
      "args": [
        "C:\\Logs\\FMS.Webclient\\app\\app-log-$(Get-Date -Format 'yyyyMMdd').log",
        "-Wait",
        "-Tail",
        "100"
      ],
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

**Usage:** `Ctrl+Shift+P` → "Tasks: Run Task" → "Watch FMS Logs"

---

## ✅ Summary

**For immediate development:**
```powershell
# Open terminal and run:
Get-Content "C:\Logs\FMS.Webclient\app\app-log-$(Get-Date -Format 'yyyyMMdd').log" -Wait -Tail 100
```

**Then test your endpoint and watch the logs appear in real-time!**

The logs will show:
- 🔍 Vehicle lookup and mapping status
- 📡 API calls to GPSGate
- 📊 Response parsing details
- 🔧 Sensor variable parsing
- ✓ Successfully parsed values
- ⚠ Warnings for unhandled variables
- ❌ Errors if something fails

Your enhanced logging with emojis makes it **very easy to spot** what's happening!
