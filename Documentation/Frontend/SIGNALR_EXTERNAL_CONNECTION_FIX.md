# SignalR External Network Connection Fix

## 🚨 Problem Summary

**Issue**: SignalR WebSocket connections fail from external networks (outside your local network)

- **Error**: `404 Not Found` and `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED`
- **URL Attempted**: `ws://10.0.10.153:7009/ptsHub?id=...`
- **Public IP**: 197.254.33.227
- **Internal IP**: 10.0.10.153
- **Status**: Works on dev machine, fails on external networks

## 🔍 Root Causes Identified

### 1. **Hardcoded Internal IP in Production Build**

**Location**: `c:\inetpub\wwwroot\tenacyFMS\reactApp\index.html`

```html
<meta name="x-api-url" content="http://10.0.10.153:7009/api" />
```

**Problem**:

- The production build was created with `REACT_APP_FMS_API_URL=http://10.0.10.153:7009/api`
- This internal IP is baked into the JavaScript bundle
- SignalR negotiate returns this internal URL to clients
- External clients cannot reach `10.0.10.153` (internal IP)

### 2. **IIS URL Rewrite Cannot Proxy WebSockets**

**Location**: `c:\inetpub\wwwroot\tenacyFMS\reactApp\web.config`

**Problem**:

- IIS URL Rewrite Module can proxy HTTP/HTTPS requests
- **BUT it CANNOT handle WebSocket protocol upgrades**
- WebSocket requires HTTP/1.1 Upgrade header which URL Rewrite doesn't support
- This is a known IIS limitation

**Current Config (doesn't work for WebSockets)**:

```xml
<rule name="Proxy PTSHub to Backend" stopProcessing="true">
  <match url="^ptsHub(.*)$" />
  <action type="Rewrite" url="http://localhost:7009/ptsHub{R:1}" />
</rule>
```

### 3. **Port 7009 Direct Access Issues**

- Port 7009 is your backend Kestrel server
- It's not exposed through firewall (security)
- External clients try to connect directly to `10.0.10.153:7009`
- Connection refused / 404 error

---

## ✅ SOLUTIONS (Choose One or Combine)

### **🎯 SOLUTION 1: Use Public URL + Enable IIS Application Request Routing (RECOMMENDED)**

This is the proper production setup.

#### Step 1: Enable WebSocket Support in IIS

**A. Install Application Request Routing (ARR) 3.0**

1. Download ARR 3.0 from Microsoft
2. Install on your IIS server
3. Restart IIS

**B. Enable ARR Proxy**

1. Open IIS Manager
2. Click on server name (top level)
3. Double-click "Application Request Routing Cache"
4. Click "Server Proxy Settings" in right panel
5. Check "Enable proxy"
6. Set timeout to 3600 seconds
7. Check "Preserve host header for requests to destination"
8. Click Apply

**C. Enable WebSocket Protocol**

1. Open Server Manager
2. Add Roles and Features
3. Web Server (IIS) → Application Development
4. Check "WebSocket Protocol"
5. Install

#### Step 2: Update web.config for ARR

Replace your current `web.config` with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API Proxy -->
        <rule name="Proxy API to Backend" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:7009/api/{R:1}" />
        </rule>

        <!-- SignalR Hub Proxy with WebSocket support -->
        <rule name="Proxy DashboardHub" stopProcessing="true">
          <match url="^dashboardHub(.*)" />
          <action type="Rewrite" url="http://localhost:7009/dashboardHub{R:1}" />
        </rule>

        <rule name="Proxy PTSHub" stopProcessing="true">
          <match url="^ptsHub(.*)" />
          <action type="Rewrite" url="http://localhost:7009/ptsHub{R:1}" />
        </rule>

        <rule name="Proxy FrontEndHub" stopProcessing="true">
          <match url="^frontendHub(.*)" />
          <action type="Rewrite" url="http://localhost:7009/frontendHub{R:1}" />
        </rule>

        <!-- SPA Fallback -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(dashboardHub|ptsHub|frontendHub)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>

    <!-- Enable WebSocket -->
    <webSocket enabled="true" />

    <!-- Disable compression for SignalR -->
    <urlCompression doStaticCompression="false" doDynamicCompression="false" />

    <!-- Cache control -->
    <httpProtocol>
      <customHeaders>
        <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
        <add name="Pragma" value="no-cache" />
        <add name="Expires" value="0" />
      </customHeaders>
    </httpProtocol>

    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
  </system.webServer>
</configuration>
```

#### Step 3: Rebuild Frontend with Public URL

**A. Update .env.production** (in source folder: `fms.frontend/.env.production`):

```bash
# Use public IP or domain name
REACT_APP_FMS_API_URL=http://197.254.33.227/api
REACT_APP_PUBLIC_FMS_API_URL=http://197.254.33.227/api

# Optional: Force SignalR to use same base
REACT_APP_SIGNALR_URL=http://197.254.33.227

# Production mode
NODE_ENV=production
```

**B. Rebuild the application**:

```bash
cd fms.frontend
npm run build
```

**C. Deploy to IIS**:
Copy the `build` folder contents to `c:\inetpub\wwwroot\tenacyFMS\reactApp\`

#### Step 4: Verify Configuration

Check the deployed `index.html`:

```html
<!-- Should now show public IP -->
<meta name="x-api-url" content="http://197.254.33.227/api" />
```

---

### **🎯 SOLUTION 2: Open Port 7009 in Firewall (Quick but Less Secure)**

If ARR is not an option, you can expose port 7009 directly:

#### Step 1: Open Firewall Port

**Windows Firewall**:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Kestrel Backend 7009" -Direction Inbound -LocalPort 7009 -Protocol TCP -Action Allow
```

#### Step 2: Configure Backend to Accept External Connections

Update backend `launchSettings.json` or `appsettings.json`:

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:7009" // Listen on all interfaces
      }
    }
  }
}
```

#### Step 3: Update Frontend Environment Variables

```bash
REACT_APP_FMS_API_URL=http://197.254.33.227:7009/api
REACT_APP_SIGNALR_URL=http://197.254.33.227:7009
```

⚠️ **Security Warning**: This exposes your backend directly. Consider:

- Adding authentication
- Using HTTPS with SSL certificate
- Rate limiting
- IP whitelisting

---

### **🎯 SOLUTION 3: Force LongPolling Transport (Fallback)**

If WebSocket cannot be configured, force SignalR to use LongPolling:

**Update ptsSignalRService.js** (line 185):

```javascript
// Original (tries WebSocket first)
transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,

// Change to (force LongPolling only for production)
transport: process.env.NODE_ENV === 'production'
  ? HttpTransportType.LongPolling
  : (HttpTransportType.WebSockets | HttpTransportType.LongPolling),
```

**Pros**: Works with standard URL Rewrite
**Cons**: Less efficient than WebSockets, higher latency

---

## 🧪 Testing Steps

### 1. **Test from External Network**

Open browser console on external device:

```javascript
// Check what URL is being used
console.log(document.querySelector('meta[name="x-api-url"]').content);
```

### 2. **Test SignalR Negotiate Endpoint**

```bash
# From external network
curl http://197.254.33.227/ptsHub/negotiate?negotiateVersion=1 -v

# Should return 200 and JSON with connection info
```

### 3. **Test WebSocket Connection**

Use browser console:

```javascript
const ws = new WebSocket("ws://197.254.33.227/ptsHub?id=test");
ws.onopen = () => console.log("✓ WebSocket connected");
ws.onerror = (e) => console.error("✗ WebSocket error", e);
```

### 4. **Check Firewall Port 7009**

From external machine:

```bash
# Test if port 7009 is accessible
telnet 197.254.33.227 7009

# Or use PowerShell
Test-NetConnection -ComputerName 197.254.33.227 -Port 7009
```

Expected result:

- **If port closed**: Connection refused (expected for Solution 1)
- **If port open**: Should connect (Solution 2)

---

## 📊 Comparison Matrix

| Solution              | Pros                                                                       | Cons                                                 | Security        | Setup Complexity |
| --------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- | --------------- | ---------------- |
| **ARR + Public URL**  | ✓ Proper production setup<br>✓ Single port (80/443)<br>✓ WebSocket support | ✗ Requires ARR installation<br>✗ More complex config | ⭐⭐⭐⭐⭐ High | Medium           |
| **Open Port 7009**    | ✓ Quick to implement<br>✓ WebSocket works                                  | ✗ Exposes backend directly<br>✗ Security risk        | ⭐⭐ Low        | Easy             |
| **Force LongPolling** | ✓ Works with URL Rewrite<br>✓ No extra config                              | ✗ Less efficient<br>✗ Higher latency                 | ⭐⭐⭐⭐ High   | Easy             |

---

## 🎯 RECOMMENDED APPROACH

**For Production**: Use **Solution 1 (ARR + Public URL)**

**Implementation Order**:

1. Install ARR and enable WebSocket in IIS
2. Update `web.config` with WebSocket settings
3. Update `.env.production` with public IP/domain
4. Rebuild frontend application
5. Deploy to IIS
6. Test from external network
7. If still fails, check firewall/network rules

**Fallback**: If ARR installation is blocked, use **Solution 3 (LongPolling)** temporarily, then schedule ARR installation.

---

## 🔧 Quick Diagnostic Commands

Run these on production server:

```powershell
# 1. Check if ARR is installed
Get-WindowsFeature | Where-Object {$_.Name -like "*ARR*"}

# 2. Check if WebSocket is enabled
Get-WindowsFeature | Where-Object {$_.Name -like "*WebSocket*"}

# 3. Check if port 7009 is listening
netstat -ano | findstr :7009

# 4. Check IIS Application Pool settings
Get-IISAppPool | Select Name, State, StartMode

# 5. Test backend SignalR endpoint locally
curl http://localhost:7009/ptsHub/negotiate?negotiateVersion=1
```

---

## 📞 Next Steps

1. **Verify current setup**: Run diagnostic commands above
2. **Choose solution**: Based on your infrastructure capabilities
3. **Implement**: Follow step-by-step guide for chosen solution
4. **Test**: Use testing steps to verify external connectivity
5. **Monitor**: Check SignalR connection logs after deployment

---

## 🐛 Common Issues After Fix

### Issue: Still getting 404

- **Check**: IIS Application Pool is running
- **Check**: Backend service (port 7009) is running
- **Check**: web.config is in correct location
- **Check**: IIS has been restarted after config changes

### Issue: Negotiate works but WebSocket fails

- **Check**: ARR is enabled (if using Solution 1)
- **Check**: WebSocket protocol is installed in IIS
- **Check**: `<webSocket enabled="true" />` is in web.config
- **Check**: Antivirus/firewall isn't blocking WebSocket upgrade

### Issue: Connection works then drops

- **Check**: Keep-alive settings in SignalR client
- **Check**: IIS timeout settings (increase to 3600 seconds)
- **Check**: Load balancer timeout (if using one)

---

**Last Updated**: 2025-10-31
**Server**: Production (197.254.33.227)
**Application**: Tenacy FMS
