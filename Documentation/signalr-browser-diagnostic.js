// ========================================
// SignalR Diagnostic Test Script
// Copy and paste this into browser console on production site
// ========================================

console.log("%c========================================", "color: cyan; font-weight: bold");
console.log("%cSignalR Connection Diagnostics", "color: cyan; font-weight: bold");
console.log("%c========================================", "color: cyan; font-weight: bold");

// Test 1: Check if ptsSignalRService is loaded
console.log("\n%c1. PTS SignalR Service Status", "color: yellow; font-weight: bold");
if (typeof ptsSignalRService !== 'undefined') {
  console.log("%c   ✓ ptsSignalRService is loaded", "color: green");
  console.log("   State:", ptsSignalRService.state);
  console.log("   Is Connected:", ptsSignalRService.isConnected);
  console.log("   Connection:", ptsSignalRService.connection ? "Exists" : "Not initialized");
  if (ptsSignalRService.connection) {
    console.log("   Connection State:", ptsSignalRService.connection.state);
    console.log("   Connection ID:", ptsSignalRService.connection.connectionId || "Not connected");
  }
} else {
  console.log("%c   ✗ ptsSignalRService is NOT loaded", "color: red");
}

// Test 2: Check localStorage token
console.log("\n%c2. Authentication Token", "color: yellow; font-weight: bold");
const token = localStorage.getItem('token');
if (token) {
  console.log("%c   ✓ Auth token present", "color: green");
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log("   Token expires:", new Date(payload.exp * 1000).toLocaleString());
    console.log("   User:", payload.unique_name || payload.sub || "Unknown");
  } catch (e) {
    console.log("%c   ⚠ Token present but could not decode", "color: orange");
  }
} else {
  console.log("%c   ✗ No auth token found", "color: red");
}

// Test 3: Monitor SignalR events
console.log("\n%c3. Setting up Event Monitors", "color: yellow; font-weight: bold");
if (typeof ptsSignalRService !== 'undefined' && ptsSignalRService.on) {
  
  // Monitor upload status updates
  const uploadRemover = ptsSignalRService.on('uploadStatusUpdate', (data) => {
    console.log("%c   ⚡ UploadStatusUpdate received!", "color: lime; font-weight: bold", {
      deviceId: data?.deviceId,
      timestamp: new Date().toISOString(),
      pumpsCount: data?.status?.Pumps?.length || 0,
      data: data
    });
  });
  
  // Monitor connection status changes
  const connRemover = ptsSignalRService.on('connectionStatusChanged', (isConnected) => {
    console.log(`%c   ${isConnected ? '✓' : '✗'} Connection status changed: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`, 
      isConnected ? "color: green; font-weight: bold" : "color: red; font-weight: bold");
  });
  
  // Monitor filling status
  const fillingRemover = ptsSignalRService.on('fillingStatus', (data) => {
    console.log("%c   ⚡ FillingStatus received!", "color: cyan", data);
  });
  
  // Monitor nozzle state changes
  const nozzleRemover = ptsSignalRService.on('nozzleStateChange', (data) => {
    console.log("%c   ⚡ NozzleStateChange received!", "color: yellow", data);
  });
  
  console.log("%c   ✓ Event monitors installed", "color: green");
  console.log("   - uploadStatusUpdate");
  console.log("   - connectionStatusChanged");
  console.log("   - fillingStatus");
  console.log("   - nozzleStateChange");
  
  // Store removers for cleanup
  window.__signalRMonitorCleanup = () => {
    uploadRemover();
    connRemover();
    fillingRemover();
    nozzleRemover();
    console.log("%c   ✓ Event monitors removed", "color: green");
  };
  
  console.log("\n   To remove monitors, run: __signalRMonitorCleanup()");
} else {
  console.log("%c   ✗ Cannot set up monitors - ptsSignalRService not available", "color: red");
}

// Test 4: Test connection manually
console.log("\n%c4. Manual Connection Test", "color: yellow; font-weight: bold");
if (typeof ptsSignalRService !== 'undefined') {
  if (!ptsSignalRService.isConnected) {
    console.log("   Attempting to connect...");
    ptsSignalRService.start()
      .then(() => {
        console.log("%c   ✓ Connection successful!", "color: green; font-weight: bold");
        console.log("   Transport:", ptsSignalRService.connection?.transport);
        console.log("   Connection ID:", ptsSignalRService.connection?.connectionId);
      })
      .catch(err => {
        console.log("%c   ✗ Connection failed!", "color: red; font-weight: bold");
        console.error("   Error:", err);
      });
  } else {
    console.log("%c   ✓ Already connected", "color: green");
    console.log("   Transport:", ptsSignalRService.connection?.transport);
  }
}

// Test 5: Redux store check
console.log("\n%c5. Redux Store Status", "color: yellow; font-weight: bold");
if (typeof store !== 'undefined') {
  console.log("%c   ✓ Redux store available", "color: green");
  const state = store.getState();
  
  // Check realtime status
  if (state.realtimeStatus) {
    console.log("   Real-time Status:");
    console.log("     - Live data enabled:", state.realtimeStatus.isLiveDataEnabled);
    console.log("     - Update frequency:", state.realtimeStatus.updateFrequency);
  }
  
  // Check PTS device status
  if (state.ptsDeviceStatus) {
    const deviceIds = Object.keys(state.ptsDeviceStatus);
    console.log(`   PTS Device Status: ${deviceIds.length} devices tracked`);
    if (deviceIds.length > 0) {
      console.log("   Sample device:", deviceIds[0], state.ptsDeviceStatus[deviceIds[0]]);
    }
  }
  
  // Check pump status
  if (state.pumpStatus) {
    console.log("   Pump Status:", Object.keys(state.pumpStatus).length, "devices");
  }
} else {
  console.log("%c   ✗ Redux store not available", "color: red");
}

// Test 6: Check environment variables
console.log("\n%c6. Environment Configuration", "color: yellow; font-weight: bold");
console.log("   REACT_APP_SIGNALR_URL:", process.env.REACT_APP_SIGNALR_URL || "Not set");
console.log("   REACT_APP_API_URL:", process.env.REACT_APP_API_URL || "Not set");
console.log("   NODE_ENV:", process.env.NODE_ENV || "Not set");

// Summary
console.log("\n%c========================================", "color: cyan; font-weight: bold");
console.log("%cDiagnostic Complete", "color: cyan; font-weight: bold");
console.log("%c========================================", "color: cyan; font-weight: bold");
console.log("\n%cMonitor console for SignalR events marked with ⚡", "color: lime; font-weight: bold");
console.log("%cEvents will be logged automatically when received from backend", "color: white");
console.log("\n%cUseful commands:", "color: yellow; font-weight: bold");
console.log("  ptsSignalRService.getConnectionStatus()  - Check if connected");
console.log("  ptsSignalRService.connection.state       - Get connection state");
console.log("  ptsSignalRService.requestDeviceStatusSummary() - Request device status");
console.log("  __signalRMonitorCleanup()                 - Remove event monitors");
console.log("");
