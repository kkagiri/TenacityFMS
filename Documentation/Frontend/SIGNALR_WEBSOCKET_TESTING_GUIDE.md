# SignalR WebSocket Testing Guide

**Date**: October 31, 2025
**Test Page**: `SIGNALR_WEBSOCKET_TEST.html`

---

## ?? How to Test

### Method 1: Browser Test Page (Recommended) ?

1. **Open the test page**:

   ```powershell
   cd c:\dev\Tenacity.FMS\Documentation\Frontend
   .\open-signalr-test.ps1
   ```

2. **Test each hub**:

   - Click "Connect" on PTS Hub
   - Click "Connect" on Dashboard Hub
   - Click "Connect" on Business Hub

3. **What to look for**:
   - ? Status changes to "Connected" (green)
   - ? Log shows "Connected successfully!"
   - ? Connection Info shows transport (should be "WebSockets")
   - ? Connection ID generated

---

## ?? Expected Results

### Successful Connection:

```
[14:30:15] Connecting to http://10.0.10.153/ptsHub...
[14:30:15] ? Connected successfully!

[PTS Hub] Connection Info:
  - Connection ID: ABC123XYZ
  - State: Connected
  - Base URL: http://10.0.10.153
  - Transport: WebSockets
```

### Transport Priority:

SignalR will try in this order:

1. **WebSockets** (fastest, bidirectional) ? Should use this
2. **ServerSentEvents** (fallback if WebSockets blocked)
3. **LongPolling** (last resort, works everywhere)

---

## ?? Test Scenarios

### Test 1: Intranet Connection

- **Base URL**: `http://10.0.10.153`
- **Expected**: All 3 hubs connect via WebSockets
- **Purpose**: Verify internal network connectivity

### Test 2: Public IP Connection

- **Base URL**: `http://197.254.33.227`
- **Expected**: All 3 hubs connect via WebSockets
- **Purpose**: Verify external access works

### Test 3: Request Data

After connecting, click "Request Data" buttons:

- **PTS Hub**: Requests device status summary
- **Dashboard Hub**: Requests dashboard metrics
- **Business Hub**: Requests business data

**Expected**: Request sent successfully (may need authentication for response)

---

## ?? Debugging

### If Connection Fails:

1. **Check Console Logs**:

   - Press F12 in browser
   - Check Console tab for errors
   - Look for red error messages

2. **Common Issues**:

   **401 Unauthorized**:

   - Hub requires authentication
   - Need to add JWT token
   - This is expected for secured hubs

   **404 Not Found**:

   - Hub path wrong
   - Backend not running
   - Check: http://10.0.10.153/ptsHub/negotiate in Postman

   **Connection Timeout**:

   - Backend not responding
   - Firewall blocking
   - IIS not forwarding requests

   **WebSocket Upgrade Failed**:

   - Will fallback to ServerSentEvents or LongPolling
   - Still works, just slower

---

## ?? What Each Hub Tests

### PTS Hub (`/ptsHub`)

- **Purpose**: PTS device communication
- **Events**: DeviceStatusUpdate, PumpStatusUpdate
- **Methods**: RequestDeviceStatusSummary, RequestPTSDeviceList
- **Used By**: ATG Dashboard, Fueling screens

### Dashboard Hub (`/dashboardHub`)

- **Purpose**: Dashboard real-time updates
- **Events**: ReceiveDashboardMetrics, ReceiveWidgetData
- **Methods**: RequestDashboardMetrics, SubscribeToWidget
- **Used By**: Dashboard widgets, metrics

### Business Hub (`/frontendHub`)

- **Purpose**: Business data updates
- **Events**: ReceiveAlarmUpdate, ReceiveTankStockUpdate, ReceiveNotification
- **Methods**: RequestAlarmStatistics (if available)
- **Used By**: Tank Stock, Alarms, Notifications

---

## ?? Success Criteria

? **All 3 hubs connect**
? **Transport = WebSockets**
? **Connection IDs generated**
? **Status shows "Connected"**
? **No errors in browser console**

---

## ?? Advanced Testing

### Test Auto-Reconnection:

1. Connect to a hub
2. Stop the backend service
3. Watch the log - should show "Reconnecting..."
4. Start the backend service
5. Should show "Reconnected!"

### Test Transport Fallback:

If you want to test fallback transports, modify the test page:

```javascript
// Force ServerSentEvents only
.withUrl(`${baseUrl}/ptsHub`, {
    transport: signalR.HttpTransportType.ServerSentEvents
})

// Force LongPolling only
.withUrl(`${baseUrl}/ptsHub`, {
    transport: signalR.HttpTransportType.LongPolling
})
```

---

## ?? Troubleshooting

### Browser Console Shows Errors?

**Check for**:

- CORS errors (Cross-Origin Resource Sharing)
- Mixed content warnings (http vs https)
- WebSocket protocol errors

**Solutions**:

- Ensure backend allows the origin
- Use same protocol (both http or both https)
- Check browser console for specific error details

### Connections Keep Dropping?

**Possible Causes**:

- IIS application pool recycling
- Backend service restarting
- Network timeout
- Firewall interference

**Check**:

- IIS Application Pool settings (idle timeout)
- Backend service logs
- Network stability

---

## ?? Performance Tips

### Optimal Configuration:

1. **Use WebSockets**: Fastest, lowest latency
2. **Enable Compression**: Reduce bandwidth
3. **Tune Reconnection**: Adjust retry intervals
4. **Monitor Connections**: Track active connection count

### Connection Limits:

- **IIS**: Default limit is high
- **Kestrel**: Check MaxConcurrentConnections
- **SignalR**: Monitor hub connection count

---

## ?? Next Steps

After successful WebSocket tests:

1. ? Test in your actual React application
2. ? Navigate to different routes
3. ? Watch SignalRConnectionManager logs in console
4. ? Verify route-based connection management works
5. ? Test auto-detection (intranet ? public fallback)

---

**Your SignalR WebSocket connections should now be working!** ??

If you see all 3 hubs connecting successfully, your setup is correct and ready for production use.
