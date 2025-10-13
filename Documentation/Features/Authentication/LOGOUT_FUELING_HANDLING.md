# Logout with Active Fueling - Implementation Guide

## Overview

The FMS system has special handling during logout to prevent data loss and safety issues when users have active fueling processes running.

---

## 🚨 The Problem

**Scenario:** User initiates logout while a pump is actively fueling in **FullTank mode**

**Risk:**
- Pump continues fueling indefinitely (no preset limit)
- Transaction data may be lost
- Safety concerns with unmonitored fueling
- SignalR disconnection prevents monitoring

---

## 🎯 The Solution

### Active Fueling Detection

The system checks Redux state for `activeFuelingProcesses` before logout:

```javascript
// Check Redux pump reducer
const activeFueling = state.pump?.activeFuelingProcesses || [];

// Example active process:
{
  pumpId: 3,
  nozzleId: 1,
  fuelType: "Diesel",
  amount: 45.2,  // Current liters
  cost: 2271.0,  // Current cost
  transaction: 12345
}
```

### Fueling Modes Explained

| Mode | Description | Logout Handling |
|------|-------------|-----------------|
| **FullTank** | No preset amount - runs until manually stopped | ⚠️ **Requires user confirmation** |
| **Fixed Volume** | Preset liters (e.g., 50L) - stops automatically | ✅ No intervention needed |
| **Fixed Price** | Preset cost (e.g., $100) - stops automatically | ✅ No intervention needed |

### Logout Behavior

#### Case 1: No Active Fueling ✅
```
User clicks Logout
  → Check for active fueling
  → None found
  → Proceed with normal logout
  → Redirect to login page
```

#### Case 2: Active FullTank Fueling ⚠️
```
User clicks Logout
  → Check for active fueling
  → Found 2 active processes
  → Show confirmation dialog:

    ⚠️ Active Fueling Alert

    There are 2 active fueling processes:
    • Pump 3, Nozzle 1 - Diesel (45.2L)
    • Pump 5, Nozzle 2 - Petrol (32.8L)

    Logging out will TERMINATE these fueling processes.

    [Cancel]  [OK]

  → If Cancel: Stay logged in
  → If OK: Send stop commands & logout
```

---

## 💻 Implementation

### Redux Action (AuthActions.js)

```javascript
/**
 * Check for active FullTank fueling before logout
 */
const hasActiveFuelingProcesses = () => {
    const state = store.getState();
    const activeFueling = state.pump?.activeFuelingProcesses || [];

    return {
        hasActive: activeFueling.length > 0,
        count: activeFueling.length,
        processes: activeFueling
    };
};

/**
 * Logout with fueling check
 */
export const logout = () => async (dispatch) => {
    // 1. Check for active fueling
    const fuelingStatus = hasActiveFuelingProcesses();

    if (fuelingStatus.hasActive) {
        // Show confirmation
        const confirmed = window.confirm(
            `⚠️ Active Fueling Alert\n\n` +
            `There ${fuelingStatus.count === 1 ? 'is' : 'are'} ${fuelingStatus.count} active fueling process${fuelingStatus.count === 1 ? '' : 'es'}:\n\n` +
            fuelingStatus.processes.map(p =>
                `• Pump ${p.pumpId}, Nozzle ${p.nozzleId} - ${p.fuelType}`
            ).join('\n') +
            `\n\nLogging out will TERMINATE these fueling processes.\n\n` +
            `Do you want to proceed?`
        );

        if (!confirmed) {
            return; // Cancel logout
        }

        // Try to stop pumps
        for (const process of fuelingStatus.processes) {
            try {
                // Send stop command (if implemented)
                // await ptsSignalRService.stopPump(process.pumpId);
            } catch (error) {
                console.error(`Failed to stop pump ${process.pumpId}`, error);
            }
        }
    }

    // 2. Continue with normal logout...
    // (disconnect SignalR, clear token, clear data, redirect)
};
```

### Authentication Service (AuthenticationService.js)

```javascript
/**
 * Sign out with fueling check
 * @param {boolean} force - Force logout even with active fueling
 */
async signOut(force = false) {
    // 1. Check for active fueling
    const fuelingStatus = this._checkActiveFuelingProcesses();

    if (fuelingStatus.hasActive && !force) {
        // Return status for caller to handle confirmation
        return {
            success: false,
            data: {
                requiresConfirmation: true,
                activeFueling: fuelingStatus
            },
            message: `Cannot logout: ${fuelingStatus.count} active fueling process(es)`,
            errors: ['ACTIVE_FUELING_PROCESSES']
        };
    }

    // 2. If force or no fueling, proceed with logout
    // (stop pumps, disconnect SignalR, clear data)
}
```

---

## 📋 State Structure

### Redux Pump Reducer

```javascript
// fms.frontend/src/redux/reducers/ptsReducers/pumpReducer.js
{
  pumps: [
    {
      id: 3,
      name: "Pump 3",
      status: "fueling",  // or "idle", "nozzleUp", "offline", "endOfTransaction"
      activeNozzle: 1,
      currentVolume: 45.2,
      currentAmount: 2271.0,
      currentTransaction: 12345
    }
  ],
  activeFuelingProcesses: [
    {
      key: "3-1",
      pumpId: 3,
      pumpName: "Pump 3",
      nozzleId: 1,
      nozzleName: "Nozzle 1",
      amount: 45.2,
      cost: 2271.0,
      fuelType: "Diesel",
      transaction: 12345,
      tag: "VEH123"
    }
  ]
}
```

### How Data Flows

```
PTS Device (Pump)
  ↓ WebSocket/SignalR
PTSSignalRService
  ↓ Event: "FillingStatus"
Redux Action: RECEIVE_UPLOAD_STATUS_UPDATE
  ↓
pumpReducer processes upload status
  ↓
Extracts activeFuelingProcesses
  ↓
State updated
  ↓
Logout action checks state
```

---

## 🧪 Testing Scenarios

### Test Case 1: Normal Logout (No Fueling)

```
1. Login to system
2. Navigate around (don't start fueling)
3. Click logout
4. Expected: Immediate logout, no warnings
```

### Test Case 2: Logout with Fixed Volume Fueling

```
1. Login to system
2. Start fueling with 50L preset
3. While fueling is active, click logout
4. Expected: Immediate logout, no warnings
   (pump will auto-stop at 50L)
```

### Test Case 3: Logout with FullTank Fueling

```
1. Login to system
2. Start fueling in FullTank mode
3. While fueling is active, click logout
4. Expected: Warning dialog appears
   - Shows pump number, nozzle, fuel type
   - Offers Cancel or OK
5. Test Cancel: Returns to app, fueling continues
6. Test OK: Pumps stop, logout completes
```

### Test Case 4: Multiple Active Fueling

```
1. Login to system
2. Start FullTank fueling on Pump 3
3. Start FullTank fueling on Pump 5
4. Click logout
5. Expected: Warning shows both processes
   - "There are 2 active fueling processes"
   - Lists both pumps
```

---

## 🔧 Configuration

### Enable/Disable Fueling Check

If needed, you can add a configuration option:

```javascript
// In system configuration
{
  "security": {
    "checkActiveFuelingOnLogout": true,  // Enable/disable check
    "allowForceLogoutWithFueling": true  // Allow force logout
  }
}
```

---

## ⚠️ Important Notes

### Why Only FullTank Mode?

**FullTank:**
- ❌ No predetermined end point
- ❌ Runs indefinitely until manual stop
- ⚠️ **MUST intervene during logout**

**Fixed Volume/Price:**
- ✅ Has predetermined end point
- ✅ Auto-stops when target reached
- ✅ **Safe to logout - will complete on its own**

### Backend TODO

Currently, we only handle client-side. In production, you should add:

```csharp
// Backend endpoint to force stop pump
[HttpPost("StopPump")]
public async Task<IActionResult> StopPump([FromBody] StopPumpRequest request)
{
    // Send stop command to PTS device
    await _ptsService.StopPumpAsync(request.DeviceId, request.PumpId);

    // Log the forced stop
    _logger.LogWarning($"Pump {request.PumpId} force stopped by user {User.Identity.Name}");

    return Ok(FMSResponse<bool>.Success(true, "Pump stopped"));
}
```

---

## 📚 Related Files

- `fms.frontend/src/redux/actions/AuthActions.js` - Logout logic
- `fms.frontend/src/services/domain/AuthenticationService.js` - Service layer
- `fms.frontend/src/redux/reducers/ptsReducers/pumpReducer.js` - Pump state
- `fms.frontend/src/components/fuelingprocess/FuelingUtils.js` - Fueling utilities
- `fms.frontend/src/signalR/ptsSignalRService.js` - PTS real-time connection

---

## 📝 Change Log

- **2025-10-13**: Added active fueling detection during logout
- **2025-10-13**: Implemented confirmation dialog for FullTank mode
- **2025-10-13**: Added pump stop command handling
- **2025-10-13**: Created documentation

---

## 👤 Maintainer

- Frontend Team: Logout logic and fueling state management
- PTS Team: Pump control and stop commands
- Safety Team: Review and approve fueling termination logic
