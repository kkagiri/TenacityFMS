# SignalR Connection Diagnosis Guide

## Issue

- Inconsistent SignalR connections to PTS devices
- Upload status not being received in FuelingProcess component
- Connection drops or doesn't establish reliably

## Quick Diagnosis Steps

### Step 1: Run PowerShell Diagnostic

```powershell
cd c:\dev\Hyoung.FMS
.\scripts\diagnostics\test-signalr-connectivity.ps1
```

This checks:

- Backend API health
- SignalR negotiate endpoints
- Windows Firewall rules
- IIS WebSocket feature
- Redis connection
- Backend logs
- FMS processes

### Step 2: Run Browser Console Diagnostic

1. Open production site (http://10.0.10.153 or http://197.254.33.227)
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy and paste contents of `Documentation/signalr-browser-diagnostic.js`
5. Press Enter

This will:

- Check if SignalR service is loaded
- Verify authentication token
- Set up event monitors for real-time debugging
- Test connection manually
- Check Redux store state
- Show environment configuration

### Step 3: Monitor Real-Time Events

After running the browser diagnostic, console will show:

```
⚡ UploadStatusUpdate received!     <-- Device status updates
⚡ FillingStatus received!          <-- Pump filling events
⚡ NozzleStateChange received!      <-- Nozzle up/down events
✓ Connection status changed: CONNECTED
```

## Common Issues & Solutions

### Issue 1: No Connection Established

**Symptoms:**

- Console shows: `[PTS SignalR] Connection error`
- Connection state shows "disconnected"

**Check:**

```javascript
ptsSignalRService.getConnectionStatus(); // Should return true
ptsSignalRService.connection.state; // Should be "Connected"
```

**Solutions:**

1. **Check auth token:**

   ```javascript
   localStorage.getItem("token"); // Should exist and not be expired
   ```

2. **Verify backend is running:**

   ```powershell
   Get-Process | Where-Object { $_.Name -like "*FMS*" }
   ```

3. **Check IIS WebSocket feature:**
   ```powershell
   Get-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
   ```

### Issue 2: Connection Established But No Events

**Symptoms:**

- SignalR shows "connected"
- No `UploadStatusUpdate` events received
- Devices don't show online

**Check:**

```javascript
// Browser console
ptsSignalRService.on("uploadStatusUpdate", (data) => {
  console.log("Upload Status:", data);
});
```

**Solutions:**

1. **Check if backend is broadcasting:**

   ```powershell
   # Check backend logs
   Get-Content "C:\Logs\FMS.Webclient\*.log" -Tail 100 | Select-String "UploadStatusUpdate"
   ```

2. **Verify device is sending data:**

   - Check Redis for device connection: `redis-cli GET device:<deviceId>:status`
   - Check backend logs for incoming upload status

3. **Check Redux is receiving events:**
   ```javascript
   store.getState().ptsDeviceStatus; // Should have device data
   ```

### Issue 3: Connection Keeps Dropping

**Symptoms:**

- Console shows repeated "Reconnecting..." messages
- Connection state oscillates between connected/reconnecting

**Solutions:**

1. **Check network stability:**

   ```powershell
   Test-NetConnection -ComputerName 10.0.10.153 -Port 7009 -InformationLevel Detailed
   ```

2. **Increase timeout values** (already set to 30s)

3. **Check for firewall blocking:**
   ```powershell
   Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*7009*" }
   ```

### Issue 4: UploadStatus Events Not Reaching FuelingProcess

**Symptoms:**

- SignalR connected and receiving events in console
- FuelingProcess component not updating

**Check:**

```javascript
// In FuelingProcess component, check devicePumpStatus
console.log(devicePumpStatus); // Should update when events arrive
```

**Solutions:**

1. **Verify useDeviceData hook is working:**

   ```javascript
   // Check if hook is subscribed
   const { devicePumpStatus, isLiveDataEnabled } = useDeviceData(ptsId);
   console.log("Live Data Enabled:", isLiveDataEnabled);
   console.log("Device Pump Status:", devicePumpStatus);
   ```

2. **Check Redux updates:**

   ```javascript
   // Monitor Redux state changes
   store.subscribe(() => {
     console.log("Redux updated:", store.getState().pumpStatus);
   });
   ```

3. **Verify ptsId matches:**
   ```javascript
   // In FuelingProcess
   console.log("Component ptsId:", ptsId);
   // Compare with event deviceId
   ```

## Enhanced Logging

### Frontend Changes Made:

1. **Detailed connection logs:**

   - Shows URL, transport, timeout settings
   - Logs actual transport used (WebSocket vs LongPolling)
   - Shows connection ID

2. **UploadStatusUpdate event logging:**

   - Logs every received event with timestamp
   - Shows device ID and status structure
   - Confirms Redux dispatch

3. **Reconnection logging:**
   - Shows transport used after reconnection
   - Logs re-sync attempts

### Backend Logging:

Check backend logs for:

```
[Broadcast] Sent UploadStatusUpdate for {DeviceId}
```

If missing, device is not sending status or backend is not receiving it.

## Testing Checklist

- [ ] Run PowerShell diagnostic script
- [ ] Run browser console diagnostic script
- [ ] Verify "✓ Connected successfully" in console
- [ ] Check transport used (WebSocket or LongPolling)
- [ ] Monitor for `⚡ UploadStatusUpdate` events
- [ ] Verify Redux state updates with events
- [ ] Check FuelingProcess receives updates
- [ ] Test with multiple devices
- [ ] Test connection recovery (restart backend)
- [ ] Test with long-running connection (30+ minutes)

## Rebuild & Deploy

After making SignalR service changes:

```powershell
cd c:\dev\Hyoung.FMS\scripts
.\quick-rebuild.ps1

# Deploy
Copy-Item -Path "c:\dev\Hyoung.FMS\fms.frontend\build\*" `
  -Destination "c:\inetpub\wwwroot\hyoungFMS\reactApp\" `
  -Recurse -Force

# Clear browser cache
# Ctrl+Shift+Delete -> Clear cached images and files
```

## Key Files

**Frontend:**

- `fms.frontend/src/signalR/ptsSignalRService.js` - SignalR client
- `fms.frontend/src/hooks/useDeviceData.js` - Device data hook
- `fms.frontend/src/pages/ATG/fuelingprocess/fuelingprocess.js` - Fueling component

**Backend:**

- `FMS.Application/Communication/SignalR/PTSHub.cs` - SignalR hub
- `FMS.Application/Command/PTSCommand/UploadStatusCommands/UploadStatusCommand.cs` - Broadcast logic
- `FMS.WebClient/Extensions/FmsApplicationBuilderExtensions.cs` - Hub registration

## Environment Variables

Required in `.env` files:

```bash
REACT_APP_SIGNALR_URL=http://10.0.10.153:7009
REACT_APP_API_URL=http://10.0.10.153:7009/api
```

## Success Criteria

When working correctly, console should show:

```
[PTS SignalR] ============================================
[PTS SignalR] Connection Configuration:
[PTS SignalR]   URL: http://10.0.10.153:7009/ptsHub
[PTS SignalR]   Transport: WebSockets with LongPolling fallback
[PTS SignalR]   KeepAlive: 15s, ServerTimeout: 30s
[PTS SignalR] ============================================
[PTS SignalR] ✓ Auth token present
[PTS SignalR] ✓ Connected successfully (ID: xyz123)
[PTS SignalR] ✓ Transport: WebSockets
[PTS SignalR] ✓ Connection ID: abc-123-def
[PTS SignalR] ✓ Initial data requests sent
[PTS SignalR] ⚡ UploadStatusUpdate received: { deviceId: "123", ... }
[PTS SignalR] ✓ Dispatched RECEIVE_UPLOAD_STATUS_UPDATE to Redux
```

## Date Created

October 30, 2025
