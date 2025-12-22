# Tank Selection with Mock Data - Quick Start Guide

## 🚀 Quick Start

### 1. Launch the App

```bash
cd fms.mobile
npm start
# In another terminal:
npm run android  # or npm run ios
```

### 2. Navigate to Fueling

- Login with your credentials
- Go to "Devices" tab
- Select any PTS device
- You'll see: "Mock Mode: Using simulated PTS data for testing"

### 3. Tank Selection Screen

You should now see the **Tank Selection** screen with:

#### Visual Layout:

```
┌─────────────────────────────────────────────────┐
│  [1] Select Source Tank                         │
│  Choose the tank to dispense fuel from          │
├─────────────────────────────────────────────────┤
│  ⚗️ Using simulated tank data from PTS          │ ← Mock Banner
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │ [🗄️] Tank 1 - Diesel               [✓] │   │ ← Selected
│  │      [Diesel]                           │   │
│  │      💧 25,000 / 50,000 L              │   │
│  │      ████████░░░░░░ 50% Full           │   │
│  │      🌡️ 22°C                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ [🗄️] Tank 2 - Petrol 95                │   │
│  │      [Petrol 95]                        │   │
│  │      💧 18,500 / 40,000 L              │   │
│  │      ████████░░░░░░░ 46% Full          │   │
│  │      🌡️ 23°C                           │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ [🗄️] Tank 3 - Petrol 98                │   │
│  │      [Petrol 98]                        │   │
│  │      💧 12,000 / 30,000 L              │   │
│  │      ████░░░░░░░░░░░ 40% Full          │   │
│  │      🌡️ 23°C                           │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  [← Back]                    [Continue →]       │
└─────────────────────────────────────────────────┘
```

## 📊 Tank Card Features

### Each tank displays:

✅ **Tank Icon** - Database icon (blue or white when selected)
✅ **Tank Name** - "Tank X - Product Name"
✅ **Product Badge** - Blue badge showing fuel type
✅ **Volume Info** - Current / Capacity in liters
✅ **Progress Bar** - Visual fill level (green bar)
✅ **Percentage** - "X% Full" indicator
✅ **Temperature** - Current temperature in °C
✅ **Selection Check** - Green checkmark when selected

### Visual States:

#### Unselected Tank:

- White background
- Blue icon background
- Gray borders

#### Selected Tank:

- Light blue background (#f0f0ff)
- Blue border (#6366f1)
- White icon background
- Indigo tank name
- Green checkmark on right

## 🎯 User Interactions

### 1. Select a Tank

**Action**: Tap on any tank card
**Result**:

- Card highlights with blue border
- Background changes to light blue
- Green checkmark appears
- "Continue" button becomes active

### 2. Change Selection

**Action**: Tap on a different tank
**Result**:

- Previous selection clears
- New tank highlights
- Checkmark moves to new selection

### 3. Continue to Next Step

**Action**: Tap "Continue" button
**Result**:

- Selected tank data saved
- Navigate to Pump Selection screen
- Tank info passed to next step

### 4. Go Back

**Action**: Tap "Back" button
**Result**:

- Return to device list
- Selection cleared

## 🔧 Mock Data Details

### Generated Tanks:

#### Tank 1 - Diesel

- **Volume**: 25,000 L / 50,000 L (50% full)
- **Product**: Diesel (ID: 1)
- **Temperature**: 22°C
- **Status**: Normal
- **Color**: Gold (#FFD700)

#### Tank 2 - Petrol 95

- **Volume**: 18,500 L / 40,000 L (46% full)
- **Product**: Petrol 95 (ID: 2)
- **Temperature**: 23°C
- **Status**: Normal
- **Color**: Green (#32CD32)

#### Tank 3 - Petrol 98

- **Volume**: 12,000 L / 30,000 L (40% full)
- **Product**: Petrol 98 (ID: 3)
- **Temperature**: 23°C
- **Status**: Normal
- **Color**: Red (#FF6347)

## 🎨 Color Scheme

### UI Colors:

- **Primary**: #6366f1 (Indigo)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Background**: #f8fafc (Slate)
- **Card**: #ffffff (White)
- **Text**: #1f2937 (Gray-dark)
- **Secondary Text**: #6b7280 (Gray)
- **Mock Banner**: #fef3c7 (Yellow-light)

### Progress Bar Colors:

- **Fill**: #10b981 (Green) - Shows filled portion
- **Background**: #e5e7eb (Gray-light) - Shows empty portion

## 📱 Responsive Behavior

### Portrait Mode:

- Full-width tank cards
- Stacked vertically
- Scrollable list

### Landscape Mode:

- Same layout (optimized for portrait)
- May show multiple tanks at once

## 🐛 Troubleshooting

### No tanks showing?

**Check**:

1. Metro bundler is running
2. Mock data generated (check console logs)
3. Toast message appeared: "Mock Mode: Using simulated PTS data"

**Fix**: Restart app or clear Metro cache:

```bash
npm start -- --reset-cache
```

### Tanks not selectable?

**Check**:

1. Tank cards are touchable (not loading state)
2. Console for any errors

**Fix**: Check that `onSelectTank` prop is properly connected

### Continue button not working?

**Check**:

1. A tank is selected (checkmark visible)
2. Button is not disabled (should be blue, not gray)

**Fix**: Select a tank first

## 🔄 Data Flow

```
FuelingProcessScreen loads
         ↓
useDeviceData(ptsId) hook runs
         ↓
No real PTS data detected
         ↓
generateMockPTSData() creates mock upload status
         ↓
Mock data dispatched to Redux
         ↓
probeTanks extracted from Probes data
         ↓
availableTanks = probeTanks (3 tanks)
         ↓
TankSelectionStep receives tanks
         ↓
Renders 3 tank cards with:
  - Names, products
  - Volumes, capacities
  - Progress bars
  - Temperatures
         ↓
User selects Tank 1
         ↓
selectedTank state updated
         ↓
Continue button enabled
         ↓
User clicks Continue
         ↓
Navigate to Pump Selection
```

## ✨ Next Steps After Tank Selection

Once you select a tank and continue:

1. **Pump Selection** - Choose an available pump
2. **Nozzle Selection** - Select fuel grade/nozzle
3. **Mode Selection** - Vehicle fueling or tank transfer
4. **Volume Entry** - Specify amount/volume
5. **Transaction** - Authorize and monitor fueling

## 📚 Related Files

### Core Files:

- `src/utils/mockPTSData.js` - Mock data generator
- `src/hooks/useDeviceData.js` - Data extraction hook
- `src/screens/FuelingProcessScreen.js` - Main flow controller
- `src/components/fueling/TankSelectionStep.js` - Tank selection UI

### Documentation:

- `MOCK_DATA_TANK_SELECTION.md` - Complete technical details
- `BACKEND_INTEGRATION.md` - API integration guide

---

**Ready to test?** Start the app and navigate to any PTS device! 🚀
