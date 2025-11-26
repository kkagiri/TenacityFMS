# Tank Selection - Quick Start Guide

## Overview
Manual tank selection has been added to the fueling process header with real-time balance display.

## Visual Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Back to ATG              FMS - Site Name                                │
│                             Device ID: 003400483233511238383435            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  🔧 Select Tank for Fueling                    📊 Tank Balance            │
│  ┌─────────────────────────────────────┐       ┌──────────────────────┐  │
│  │ Tank 1 - Diesel ▼                   │       │ Current Level        │  │
│  │ 5,000L / 10,000L - 50% 🟡          │       │ 5,000L               │  │
│  │                                     │       │                      │  │
│  │ • Tank 1 - Diesel                   │       │ Capacity             │  │
│  │   5,000L / 10,000L         50% 🟡  │       │ 10,000L              │  │
│  │ • Tank 2 - Petrol                   │       │                      │  │
│  │   7,500L / 12,000L         62% 🟢  │       │ Status               │  │
│  │ • Tank 3 - Kerosene                 │       │ 50% 🟡 🔵           │  │
│  │   2,100L / 8,000L          26% 🔴  │       │                      │  │
│  └─────────────────────────────────────┘       │ ████████░░░░░░░░░░  │  │
│                                                 │                      │  │
│                                                 │ 🌡️ Temp: 21.3°C     │  │
│                                                 └──────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  🟢 Connected  |  Pump 1: Busy  |  [Active (2)]  [Transactions]  [+New]  │
└────────────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Tank Selector
- **Search**: Type tank name or ID to filter
- **Display**: Shows current level, capacity, and percentage
- **Status Indicator**:
  - 🟢 Green (>60%) - Good
  - 🟡 Yellow (30-60%) - Medium
  - 🔴 Red (<30%) - Low

### 2. Tank Balance Display
Shows when tank is selected:
- Current Level (liters)
- Total Capacity (liters)
- Fill Percentage with color
- Visual progress bar
- Temperature (if probe connected)
- 🔵 Probe online indicator

### 3. Real-Time Updates
- Tank levels update via SignalR
- Probe data refreshes automatically
- No manual refresh needed

## How to Use

### Step 1: Select Tank
1. Click tank dropdown in header
2. Search or scroll to find tank
3. Click to select

### Step 2: View Balance
- Tank balance appears automatically
- Shows real-time level and percentage
- Progress bar updates live

### Step 3: Authorize Fueling
- Tank ID is automatically included
- No additional action needed
- Stock deducts after fueling (if bookkeeping enabled)

## Mobile View

```
┌─────────────────────────────────┐
│ ← Back         Site Name        │
│ Device ID: 003...435            │
├─────────────────────────────────┤
│ 🔧 Select Tank                  │
│ ┌─────────────────────────────┐ │
│ │ Tank 1 - Diesel ▼           │ │
│ │ 5,000L / 10,000L - 50%      │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📊 Tank Balance                 │
│ ┌─────────────────────────────┐ │
│ │ Current: 5,000L             │ │
│ │ Capacity: 10,000L           │ │
│ │ Status: 50% 🟡              │ │
│ │ ████████░░░░░░░░░░          │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 🟢 Connected                    │
│ [Active] [TX] [+New]            │
└─────────────────────────────────┘
```

## Data Sources

### Tank List
- Loaded from database by site ID
- Filters to current device's site
- Shows capacity and configuration

### Real-Time Levels
- From UploadStatus probe measurements
- Updates every 10 seconds via SignalR
- Falls back to database if probe offline

### Fallback Mode
If probe offline:
- Shows `currentStock` from database
- Calculates percentage from capacity
- No temperature display
- Missing 🔵 probe indicator

## Troubleshooting

### No tanks showing?
1. Check device has site assigned
2. Verify tanks exist for that site
3. Check tank configuration in Tank Management

### Balance not updating?
1. Check probe is online (🔵 indicator)
2. Verify probe linked to tank (probeId)
3. Check SignalR connection status

### Tank not listed in dropdown?
1. Verify tank siteId matches device site
2. Check tank is not deleted/inactive
3. Refresh page to reload tanks

## Technical Notes

### Probe Data Structure
```javascript
// UploadStatus probe measurements array
[
  probeNumber,      // 0: Probe ID
  productHeight,    // 1: Height in mm
  waterHeight,      // 2: Water height
  temperature,      // 3: Degrees C
  productVolume,    // 4: ✅ Current level (L)
  waterVolume,      // 5: Water volume
  productUllage,    // 6: Empty space
  productTCVolume,  // 7: Temp compensated
  density,          // 8: Fuel density
  mass,             // 9: Product mass
  fillingPercentage // 10: ✅ Percentage (0-100)
]
```

### Tank Entity Fields Used
- `id` - Primary key
- `name` - Display name
- `capacity` - Max volume (L)
- `currentStock` - Book balance (L)
- `physicalStockValue` - Last physical reading
- `siteId` - Site linkage
- `probeId` - Probe linkage (optional)
- `useBookKeeping` - Auto-deduct flag

## Configuration Examples

### Example 1: Tank with Probe
```javascript
{
  id: 1,
  name: "Tank 1 - Diesel",
  capacity: 10000,
  currentStock: 5000,
  probeId: 1,
  siteId: 5,
  useBookKeeping: 1
}
```
**Result**: Shows real-time probe data, auto-deducts stock

### Example 2: Tank without Probe
```javascript
{
  id: 2,
  name: "Tank 2 - Petrol",
  capacity: 12000,
  currentStock: 7500,
  probeId: null,
  siteId: 5,
  useBookKeeping: 0
}
```
**Result**: Shows database stock, no auto-deduction

## Performance

- **Initial Load**: ~200ms (loads tanks)
- **Real-Time Update**: Instant (via SignalR)
- **Search**: Client-side filtering (instant)
- **No API Polling**: Uses WebSocket events

## Accessibility

- ✅ Keyboard navigation supported
- ✅ Screen reader friendly
- ✅ Color blindness safe (uses patterns + colors)
- ✅ Touch-friendly mobile interface

---

**Need Help?** Check the full implementation doc:
`Documentation/Features/ATG/TANK_SELECTION_IMPLEMENTATION.md`
