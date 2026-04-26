# Quick IIS Test Page Setup

## Problem
Opening HTML files directly (`file://`) causes CORS errors when connecting to SignalR.

## Solution: Host via IIS

### Step 1: Copy Test Page to Frontend Folder
```powershell
Copy-Item "c:\dev\Tenacy.FMS\Documentation\Frontend\SIGNALR_WEBSOCKET_TEST.html" `
          "c:\inetpub\wwwroot\fms.frontend\signalr-test.html" -Force
```

### Step 2: Access via Browser
Open your browser to:
```
http://10.0.10.153/signalr-test.html
```

OR for public IP:
```
http://197.254.33.227/signalr-test.html
```

### Step 3: Test
1. The page will load from IIS (http://)
2. Click "Connect" on each hub
3. CORS will work because same origin

---

## Alternative Solutions

### Option 2: Use Simple HTTP Server (Python)
```powershell
cd c:\dev\Tenacy.FMS\Documentation\Frontend
python -m http.server 8000
```
Then browse to: `http://localhost:8000/SIGNALR_WEBSOCKET_TEST.html`

### Option 3: Use Simple HTTP Server (Node.js)
```powershell
cd c:\dev\Tenacy.FMS\Documentation\Frontend
npx http-server -p 8000
```
Then browse to: `http://localhost:8000/SIGNALR_WEBSOCKET_TEST.html`

---

## Why This Fixes It

| Method | Origin | CORS Issue? |
|--------|--------|-------------|
| `file://` | null | ❌ Blocked by browser security |
| `http://10.0.10.153` | http://10.0.10.153 | ✅ Same origin as IIS |
| `http://localhost:8000` | http://localhost:8000 | ✅ Allowed in CORS config |

---

## Quick Setup Script
