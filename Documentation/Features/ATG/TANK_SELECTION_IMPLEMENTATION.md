# Tank Selection Implementation - Complete

## Summary

Implemented **Option A - Simple Manual Tank Selection** for the fueling process with real-time tank balance display.

## What Was Implemented

### 1. ✅ Backend Verification
- **Tank API Endpoint**: Confirmed `GET /api/v1/tank/site/{siteId}` exists and works
- **Authorization Support**: `PumpAuthorizeCommand.cs` already accepts `tankId` parameter
- **Tank Stock Deduction**: Automatic via `TankVolumeHistoryIntegrationService` when `UseBookKeeping=1`
- **No backend changes needed** - everything was already in place!

### 2. ✅ Tank Service Created
**File**: `fms.frontend/src/services/tankService.js`

Functions:
- `getTanksBySite(siteId)` - Load tanks for specific site
- `enrichTanksWithProbeData(uploadStatus, tanks)` - Map probe measurements to tanks
- `formatTankDisplay(tank)` - Format display text for SelectBox
- `getTankStatusColor(percentage)` - Get color based on fill level

**Key Feature**: Real-time tank data from `UploadStatus.probes.onlineStatus.measurements` array

### 3. ✅ State Management Updated
**Files**:
- `useFuelingState.js` - Added tank selection state variables
- `useFuelingActions.js` - Pass `tankId` to authorization, reset on new fueling

**New State Variables**:
```javascript
const [selectedTankId, setSelectedTankId] = useState(null);
const [availableTanks, setAvailableTanks] = useState([]);
const [isLoadingTanks, setIsLoadingTanks] = useState(false);
```

**Authorization Updated**:
```javascript
const authParams = {
  // ... existing params
  tankId: state.selectedTankId, // ✅ Added
  // ... rest of params
};
```

### 4. ✅ FuelingHeader Component Enhanced
**File**: `fms.frontend/src/pages/ATG/fuelingprocess/Components/FuelingHeader.js`

**Features Added**:
1. **Tank Selector Dropdown**:
   - SelectBox with search functionality
   - Display: `"{tankName} ({currentLevel}L / {capacity}L) - {percentage}%"`
   - Shows tank status indicator (green/yellow/red dot)
   - Custom item render with detailed info

2. **Tank Balance Display** (shown when tank selected):
   - Current Level (liters)
   - Capacity (liters)
   - Fill Percentage with color coding
   - Visual progress bar
   - Temperature (if probe online)
   - Probe online indicator

3. **Real-Time Updates**:
   - Loads tanks on component mount
   - Enriches with probe data from `rawUploadStatus`
   - Updates automatically via SignalR

### 5. ✅ Styling Added
**File**: `fms.frontend/src/pages/ATG/fuelingprocess/fuelingprocess.scss`

Added `.header-tank-section` styling:
- Responsive layout (column on mobile)
- Visual separation with borders
- Styled balance display card

## How It Works

### Data Flow

```
1. Component Mount
   └─> Load tanks by site: GET /api/v1/tank/site/{siteId}
   └─> Store in availableTanks state

2. UploadStatus Update (via SignalR)
   └─> Extract probe measurements from rawUploadStatus.probes.onlineStatus.measurements
   └─> Enrich tanks with real-time data:
       - ProductVolume (measurement[4])
       - TankFillingPercentage (measurement[10])
       - Temperature (measurement[3])
   └─> Update tanksWithProbeData

3. User Selects Tank
   └─> Store tankId in selectedTankId state
   └─> Display tank balance details

4. User Authorizes Pump
   └─> Pass tankId to authorizePump API
   └─> Backend stores in Redis transaction context

5. Fueling Completes
   └─> CreatePumpTransactionCommand saves transaction with tankId
   └─> TankVolumeHistoryIntegrationService processes
   └─> Tank stock deducted automatically (if UseBookKeeping=1)
```

### Probe Data Mapping

**UploadStatus Structure**:
```javascript
rawUploadStatus.probes.onlineStatus = {
  ids: [1, 2, 3],  // Probe IDs
  measurements: [
    [probeNumber, productHeight, waterHeight, temperature,
     productVolume, waterVolume, productUllage, productTCVolume,
     density, mass, fillingPercentage],
    // Index: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  ]
}
```

**Data Extraction**:
- `currentLevel` = measurement[4] (ProductVolume in liters)
- `fillingPercentage` = measurement[10] (0-100)
- `temperature` = measurement[3] (degrees Celsius)

## User Experience

### Tank Selector UI

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 Select Tank for Fueling                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tank 1 - Diesel ▼                                   │ │
│ │ (5,000L / 10,000L) - 50%                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Tank Balance Display (when selected)

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Tank Balance                                         │
│                                                         │
│ Current Level    Capacity       Status                 │
│ 5,000L          10,000L         50% 🟡 🔵              │
│                                                         │
│ ████████████████░░░░░░░░░░░░░░░░                       │
│                                                         │
│ 🌡️ Temperature: 21.3°C                                 │
└─────────────────────────────────────────────────────────┘
```

Legend:
- 🟢 Green (>60%) - Good level
- 🟡 Yellow (30-60%) - Medium level
- 🔴 Red (<30%) - Low level
- 🔵 Probe online indicator

## Testing Checklist

### ✅ Completed
1. ✅ Tank service created with probe data enrichment
2. ✅ State management updated (tankId passed to authorization)
3. ✅ FuelingHeader component with tank selector
4. ✅ Real-time balance display with progress bar
5. ✅ Styling added with responsive design

### 🔄 Ready for Testing
1. **Tank Loading**: Verify tanks load correctly for device site
2. **Tank Selection**: Select tank and verify balance display
3. **Real-Time Updates**: Check probe data updates via SignalR
4. **Authorization**: Verify tankId passed to authorization API
5. **Tank Stock Deduction**: Confirm stock deduction after fueling (if UseBookKeeping=1)

## Configuration Notes

### Prerequisites
- **Tank Configuration**: Each tank must have:
  - `SiteId` matching the PTS device site
  - `ProbeId` matching probe number (optional for probe data)
  - `Capacity` set correctly
  - `UseBookKeeping` = 1 (if auto-deduction desired)

### Optional Features
- **Probe Data**: If no probe linked, shows database values (CurrentStock)
- **Tank Selection**: Can be made required/optional via validation
- **Bookkeeping**: Only deducts stock if `tank.UseBookKeeping = 1`

## API Endpoints Used

### Frontend API Calls
```javascript
GET /api/v1/tank/site/{siteId}
// Returns: Array of tank objects with capacity, currentStock, etc.

POST /api/v1/pump/authorize
// Body includes: { ..., tankId: selectedTankId, ... }
```

### Backend Processing (Automatic)
```csharp
// Authorization stores tankId in Redis
await _redisDb.HashSetAsync(transactionKey, "tankId", request.TankId);

// Transaction save with tankId
await _mediator.Send(new CreatePumpTransactionCommand {
    TankId = tankId,
    // ... other fields
});

// Automatic stock deduction (if UseBookKeeping=1)
await _integrationService.ProcessPumpTransactionAsync(
    transaction.TankId.Value,
    transaction.Transaction,
    transaction.DateTime,
    transaction.Volume.Value,
    userId
);
```

## Files Changed

### Created
- ✅ `fms.frontend/src/services/tankService.js`

### Modified
- ✅ `fms.frontend/src/pages/ATG/fuelingprocess/hooks/useFuelingState.js`
- ✅ `fms.frontend/src/pages/ATG/fuelingprocess/hooks/useFuelingActions.js`
- ✅ `fms.frontend/src/pages/ATG/fuelingprocess/Components/FuelingHeader.js`
- ✅ `fms.frontend/src/pages/ATG/fuelingprocess/fuelingprocess.js`
- ✅ `fms.frontend/src/pages/ATG/fuelingprocess/fuelingprocess.scss`

## Next Steps

1. **Test the Implementation**:
   ```bash
   cd fms.frontend
   npm start
   ```
   - Navigate to fueling process
   - Verify tank selector appears
   - Select tank and check balance display
   - Authorize pump and verify tankId in request

2. **Optional Enhancements** (Future):
   - Make tank selection required before authorization
   - Add tank filtering by fuel type
   - Show tank alarm indicators
   - Add tank history quick view
   - Export tank selector as reusable component

## Questions Answered

### ❓ Where does TankId come from?
**Answer**: Manual user selection via dropdown (Option A implemented)

### ❓ Do we have Redis cleanup for transactions?
**Answer**: Yes, multiple mechanisms:
- ✅ Automatic TTL: 10 minutes
- ✅ TransactionCompletionService cleanup
- ✅ RedisCommandService cleanup
- ✅ Manual cleanup after completion

### ❓ Does bookkeeping deduct tank stock?
**Answer**: Yes, automatically via TankVolumeHistoryIntegrationService when UseBookKeeping=1

### ❓ How to display tank balance?
**Answer**: Use UploadStatus probe data (real-time) - implemented! Pattern from PTSDeviceDetails.js

## Success Criteria Met

✅ Tank selector in FuelingHeader
✅ Load tanks by site
✅ Pass tankId to authorization
✅ Display tank balance with percentage
✅ Real-time updates from UploadStatus
✅ Visual progress bar (color-coded)
✅ Responsive mobile design
✅ No backend changes required

**Status**: 🎉 **Implementation Complete** - Ready for Testing
