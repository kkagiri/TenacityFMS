# Mock Data Integration - Tank Selection

## Overview

Integrated mock PTS data for the tank selection step in the fueling process. The system now displays tank/probe data from the simulated PTS upload status.

## Changes Made

### 1. **Enhanced useDeviceData Hook** (`src/hooks/useDeviceData.js`)

- **Added `probeTanks` extraction** from PTS `Probes` data structure
- Parses probe information into tank objects with:
  - Tank ID and name
  - Product name and ID
  - Current volume & capacity
  - Height, temperature, water level
  - Status indicators
  - Percentage full calculation
  - Color coding from fuel grades

```javascript
probeTanks: [
  {
    id: "probe-1",
    probeId: 1,
    name: "Tank 1 - Diesel",
    productName: "Diesel",
    currentVolume: 25000,
    capacity: 50000,
    percentFull: 50,
    temperature: 22,
    status: 0,
    statusText: "Normal",
  },
  // ... more tanks
];
```

### 2. **Updated FuelingProcessScreen** (`src/screens/FuelingProcessScreen.js`)

- **Added `probeTanks`** from useDeviceData hook
- **Created `availableTanks`** that prioritizes probe tanks over API tanks
- **Updated TankSelectionStep props**:
  - Passes `availableTanks` instead of `filteredTanks`
  - Added `isMockData` flag when using probe tanks
  - Added `isLoadingTanks` indicator

```javascript
const availableTanks = probeTanks?.length > 0 ? probeTanks : filteredTanks;

<TankSelectionStep
  tanks={availableTanks}
  selectedTank={selectedTank}
  onSelectTank={setSelectedTank}
  onNext={() => handleStepNext("pump", { tank: selectedTank })}
  onBack={() => navigation.goBack()}
  isLoadingTanks={!probeTanks?.length && !filteredTanks?.length}
  isMockData={probeTanks?.length > 0}
/>;
```

### 3. **Enhanced TankSelectionStep Component** (`src/components/fueling/TankSelectionStep.js`)

- **Refactored to use props** instead of Redux selectors
- **Enhanced tank card UI** with real-time data:

  - Volume progress bar (visual indicator)
  - Current volume / Capacity display
  - Percentage full indicator
  - Temperature display
  - Product badge
  - Different layouts for mock vs. API data

- **Added mock data banner** - Yellow banner indicating simulated data mode
- **Updated empty states** - Different messages for mock vs. API mode
- **Removed dependencies** on Redux dispatch and selectors

#### New Tank Card Features:

```
┌─────────────────────────────────────┐
│ [Icon] Tank 1 - Diesel             │
│        [Diesel Product Badge]       │
│        🔵 25,000 / 50,000 L        │
│        ███████░░░░░░ 50% Full      │
│        🌡️ 22°C                      │
└─────────────────────────────────────┘
```

### 4. **New Styles Added**

- `mockBanner` - Yellow banner for mock mode indicator
- `mockText` - Styled text for banner
- `volumeContainer` - Container for volume info
- `volumeRow` - Row layout for volume display
- `volumeText` - Volume text styling
- `percentBar` - Progress bar background
- `percentFill` - Progress bar fill (green)
- `percentText` - Percentage label
- `tempRow` - Temperature display row
- `tempText` - Temperature text styling

## Mock Data Structure

The mock PTS data generates **3 tanks** with different products:

```javascript
Probes: {
  Count: 3,
  Ids: [1, 2, 3],
  ProductIds: [1, 2, 3],
  ProductNames: ["Diesel", "Petrol 95", "Petrol 98"],
  Volumes: [25000, 18500, 12000],      // Current volumes (liters)
  Heights: [1850, 1420, 980],          // Heights (mm)
  Temperatures: [22, 23, 23],          // Temperatures (°C)
  Waters: [0, 0, 0],                   // Water levels (mm)
  Capacities: [50000, 40000, 30000],   // Tank capacities
  Statuses: [0, 0, 0],                 // 0 = Normal
}
```

## How It Works

### Data Flow:

```
1. FuelingProcessScreen mounts
   ↓
2. useDeviceData(ptsId) hook called
   ↓
3. If no real PTS data:
   - generateMockPTSData() creates mock upload status
   - Dispatched to Redux store
   ↓
4. useDeviceData extracts probeTanks from mock data
   ↓
5. FuelingProcessScreen creates availableTanks
   ↓
6. TankSelectionStep displays tanks with:
   - Visual progress bars
   - Real-time volume/capacity
   - Temperature indicators
   - Mock data banner
```

### Selection Flow:

```
User opens fueling screen
  → Sees "Using simulated tank data from PTS" banner
  → Views 3 tanks with live data visualization
  → Selects a tank (e.g., Tank 1 - Diesel)
  → Tank card highlights with blue border
  → "Continue" button enabled
  → Clicks Continue
  → Proceeds to Pump Selection step
```

## Testing the Integration

### 1. Start the App

```bash
cd fms.mobile
npm start
# Press 'a' for Android or 'i' for iOS
```

### 2. Navigate to Fueling

1. Login to the app
2. Navigate to "Devices" tab
3. Select a PTS device
4. Should see mock data toast: "Using simulated PTS data for testing"

### 3. Tank Selection Step

- Should see yellow banner: "Using simulated tank data from PTS"
- Should see 3 tanks:
  - Tank 1 - Diesel (25,000 / 50,000 L, 50% full)
  - Tank 2 - Petrol 95 (18,500 / 40,000 L, 46% full)
  - Tank 3 - Petrol 98 (12,000 / 30,000 L, 40% full)
- Each tank shows:
  - Product badge
  - Volume with icon
  - Visual progress bar (green)
  - Percentage indicator
  - Temperature (22-23°C)

### 4. Tank Selection

- Tap any tank card
- Card should highlight with blue border and light blue background
- Tank name turns indigo color
- Green checkmark appears on right
- "Continue" button becomes active

### 5. Next Step

- Click "Continue"
- Should navigate to Pump Selection step
- Selected tank data passed to next step

## Benefits

### ✅ **Real-time Visualization**

- Visual progress bars show tank fill levels
- Percentage indicators for quick assessment
- Temperature monitoring
- Status indicators (Normal/Low/High/Alarm)

### ✅ **Mock Data Support**

- No backend/API needed for testing
- Realistic PTS probe data simulation
- Clear indication of mock mode
- Easy testing of UI without devices

### ✅ **Flexible Data Source**

- Seamlessly switches between mock and real data
- Same UI for both data sources
- Falls back to API tanks if no PTS probes
- Maintains backward compatibility

### ✅ **Enhanced UX**

- Clear visual feedback
- More information at a glance
- Professional tank monitoring UI
- Responsive selection states

## Next Steps

### Recommended Enhancements:

1. **Color-coded status indicators** - Red for low, yellow for warning, green for normal
2. **Tank filtering** - Filter by product type
3. **Sort options** - Sort by volume, capacity, product
4. **Detailed tank view** - Modal with full tank stats
5. **History graphs** - Volume trends over time
6. **Alerts integration** - Show tank alerts/warnings

### Next Flow Steps:

- ✅ Tank Selection (Complete with mock data)
- ⏳ Pump Selection (Next to integrate)
- ⏳ Nozzle Selection
- ⏳ Mode Selection (Vehicle/Transfer)
- ⏳ Volume Entry
- ⏳ Transaction Monitoring

## Files Modified

1. **`src/hooks/useDeviceData.js`**

   - Added probeTanks extraction
   - Enhanced fuel grades with color

2. **`src/screens/FuelingProcessScreen.js`**

   - Added availableTanks logic
   - Updated TankSelectionStep props

3. **`src/components/fueling/TankSelectionStep.js`**
   - Refactored to use props
   - Enhanced UI with mock data support
   - Added new styles for volume/temp display
   - Removed Redux dependencies

## Mock Data Generator

Located in: `src/utils/mockPTSData.js`

Key functions:

- `generateMockPTSData()` - Creates complete PTS upload status
- `mockAuthorizePump()` - Simulates pump authorization
- `mockStartFueling()` - Simulates fueling start
- `mockFuelingProgress()` - Updates fueling volume/amount
- `mockEndTransaction()` - Completes transaction
- `mockResetPump()` - Resets pump to idle

---

**Status**: ✅ Tank Selection with Mock Data - Complete and Tested
**Next**: Pump Selection Integration
