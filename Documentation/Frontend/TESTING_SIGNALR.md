# Testing SignalR with Postman

## What You Can Test with Postman

### ? 1. Negotiate Endpoint (Works)

Test if the SignalR hub is registered and responding:

```
Method: POST
URL: http://10.0.10.153:7009/ptsHub/negotiate
Headers:
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
```

**Expected Response (Success):**

```json
{
  "connectionId": "abc123...",
  "availableTransports": [
    {
      "transport": "WebSockets",
      "transferFormats": ["Text", "Binary"]
    },
    {
      "transport": "ServerSentEvents",
      "transferFormats": ["Text"]
    },
    {
      "transport": "LongPolling",
      "transferFormats": ["Text", "Binary"]
    }
  ]
}
```

**Expected Response (Unauthorized):**

```
HTTP 401 Unauthorized
WWW-Authenticate: Bearer
```

### ? 2. Test Other Hubs

```
POST http://10.0.10.153:7009/dashboardHub/negotiate
POST http://10.0.10.153:7009/frontendHub/negotiate
```

### ? What Postman CANNOT Test

- **WebSocket connections** - Postman doesn't support WebSocket protocol properly
- **Real-time messages** - Cannot receive SignalR push messages
- **Hub methods** - Cannot invoke hub methods like `SendDeviceStatus`

## Better Testing Tools

### 1. Browser DevTools (BEST for WebSocket)

Open browser console and run:

```javascript
// Test raw WebSocket connection
ws = new WebSocket("ws://10.0.10.153:7009/ptsHub");
ws.onopen = () => console.log("? WebSocket CONNECTED");
ws.onerror = (e) => console.error("? WebSocket ERROR:", e);
ws.onclose = (e) => console.log("WebSocket closed:", e.code, e.reason);
```

### 2. wscat (Command Line WebSocket Client)

```powershell
# Install wscat
npm install -g wscat

# Test WebSocket connection (without auth)
wscat -c ws://10.0.10.153:7009/ptsHub

# Test with authorization header
wscat -c ws://10.0.10.153:7009/ptsHub -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. SignalR Test Page (Create Simple HTML)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>SignalR Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@microsoft/signalr@latest/dist/browser/signalr.min.js"></script>
  </head>
  <body>
    <h1>SignalR Connection Test</h1>
    <div id="status">Disconnected</div>
    <button onclick="connect()">Connect</button>
    <button onclick="disconnect()">Disconnect</button>
    <div id="messages"></div>

    <script>
      let connection = null;

      function connect() {
        const token = prompt("Enter JWT token (or cancel for anonymous):");

        connection = new signalR.HubConnectionBuilder()
          .withUrl("http://10.0.10.153:7009/ptsHub", {
            accessTokenFactory: () => token || "",
            transport:
              signalR.HttpTransportType.WebSockets |
              signalR.HttpTransportType.LongPolling,
          })
          .build();

        connection.on("DeviceStatusChanged", (data) => {
          document.getElementById(
            "messages"
          ).innerHTML += `<div>Device Status: ${JSON.stringify(data)}</div>`;
        });

        connection
          .start()
          .then(() => {
            document.getElementById("status").innerText =
              "? Connected via " + connection.transport;
            document.getElementById("status").style.color = "green";
          })
          .catch((err) => {
            document.getElementById("status").innerText =
              "? Connection failed: " + err;
            document.getElementById("status").style.color = "red";
          });
      }

      function disconnect() {
        if (connection) {
          connection.stop();
          document.getElementById("status").innerText = "Disconnected";
          document.getElementById("status").style.color = "gray";
        }
      }
    </script>
  </body>
</html>
```

## Quick Postman Test Steps

### Step 1: Get JWT Token

```
Method: POST
URL: http://10.0.10.153:7009/api/v1/User/Login
Body (JSON):
{
  "userName": "your-username",
  "password": "your-password"
}
```

Copy the `token` from the response.

### Step 2: Test PTSHub Negotiate

```
Method: POST
URL: http://10.0.10.153:7009/ptsHub/negotiate
Headers:
  Authorization: Bearer <paste-token-here>
  Content-Type: application/json
```

**If you get 200 OK with connectionId** = Hub is working ?
**If you get 401 Unauthorized** = Hub exists but token invalid/expired ??
**If you get 404 Not Found** = Hub not registered ?

### Step 3: Test All Three Hubs

Repeat Step 2 for:

- `/ptsHub/negotiate` (PTS devices)
- `/dashboardHub/negotiate` (Dashboard metrics)
- `/frontendHub/negotiate` (Tank stock, alarms)

## Current Status Check

Run this now to verify firewall and endpoints:

```powershell
cd c:\dev\Tenacity.FMS
.\scripts\diagnostics\test-signalr-connectivity.ps1
```

This will test:

1. ? Port 7009 TCP connectivity
2. ? All three negotiate endpoints
3. ? Firewall rules
4. ? Backend process running

## After Firewall Fix

Now that firewall rules are created, you should:

1. **Rebuild frontend** (to include transport fallback):

   ```powershell
   cd c:\dev\Tenacity.FMS\scripts
   .\quick-rebuild.ps1
   ```

2. **Deploy**:

   ```powershell
   Copy-Item -Path "c:\dev\Tenacity.FMS\fms.frontend\build\*" -Destination "c:\inetpub\wwwroot\tenacyFMS\reactApp\" -Recurse -Force
   ```

3. **Test in browser** (after clearing cache):

   - Open browser DevTools Console
   - Should see: `[PTS SignalR] Connected successfully via WebSockets`
   - Or: `[PTS SignalR] Connected successfully via LongPolling`

4. **Check devices online** in dashboard
