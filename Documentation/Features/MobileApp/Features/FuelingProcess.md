# Fueling Process Feature - Mobile

## Overview

The Fueling Process is the core feature of the FMS Mobile application, enabling field operators to authorize and monitor fuel dispensing operations directly from their mobile devices.

## Feature Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FUELING PROCESS FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  Step 1  │──▶│  Step 2  │──▶│  Step 3  │──▶│  Step 4  │    │
│  │  Select  │   │  Select  │   │  Select  │   │ Configure │    │
│  │   Pump   │   │  Nozzle  │   │ Vehicle  │   │  Details  │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│                                                     │           │
│                                                     ▼           │
│                                            ┌──────────────┐     │
│                                            │  Transaction │     │
│                                            │  Monitoring  │     │
│                                            └──────────────┘     │
│                                                     │           │
│                                                     ▼           │
│                                            ┌──────────────┐     │
│                                            │   Complete   │     │
│                                            └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. FuelingProcessScreen (`screens/FuelingProcessScreen.js`)

The main container screen that manages:
- Step navigation state
- SignalR connection for the device
- Redux state integration
- Transaction lifecycle

**Key State:**
```javascript
const [step, setStep] = useState('pump');
const [selectedPump, setSelectedPump] = useState(null);
const [selectedNozzle, setSelectedNozzle] = useState(null);
const [vehicleInfo, setVehicleInfo] = useState(null);
const [isAuthorizing, setIsAuthorizing] = useState(false);
const [currentTransactionId, setCurrentTransactionId] = useState(null);
```

### 2. PumpSelectionStep (`components/fueling/PumpSelectionStep.js`)

Displays available pumps in a grid layout with real-time status.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| pumps | Array | Available pumps from device |
| activePumps | Array | Currently active fueling processes |
| onPumpSelect | Function | Callback when pump is selected |
| connectionStatus | String | Device connection status |

**Pump Status Colors:**
- 🟢 Green - Available/Idle
- 🟡 Yellow - Nozzle Up
- 🔵 Blue - Fueling
- 🔴 Red - Offline

### 3. NozzleSelectionStep (`components/fueling/NozzleSelectionStep.js`)

Allows selection of fuel type/nozzle for the selected pump.

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| pump | Object | Selected pump |
| nozzles | Array | Available nozzles |
| fuelGrades | Array | Fuel grade information |
| onNozzleSelect | Function | Selection callback |
| onBack | Function | Navigate back |

**Fuel Type Colors:**
- Diesel: Orange (#f59e0b)
- Petrol: Green (#10b981)
- Premium: Purple (#8b5cf6)

### 4. ScanStep (`components/fueling/ScanStep.js`)

Vehicle identification step with three methods:

1. **Lookup** - Search from vehicle database
2. **Scan** - QR code or NFC tag scanning
3. **Manual** - Direct registration entry

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| selectionMethod | String | Current method (lookup/scan/manual) |
| vehicles | Array | Available vehicles for lookup |
| onVehicleSelect | Function | Vehicle selection callback |
| onScan | Function | Trigger scan action |
| onNext | Function | Proceed to next step |
| onBack | Function | Navigate back |

### 5. FuelingDetailsStep (`components/fueling/FuelingDetailsStep.js`)

Configures authorization parameters before starting.

**Authorization Types:**
- **Full** - Fill until full or manually stopped
- **Amount** - Specify dollar amount limit
- **Volume** - Specify liter limit

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| pump | Object | Selected pump |
| nozzle | Object | Selected nozzle |
| vehicleInfo | Object | Selected vehicle data |
| selectedType | String | Authorization type |
| amount/volume | String | Dose value |
| useMasterTag | Boolean | Use operator's master tag |
| onAuthorize | Function | Start authorization |

### 6. TransactionMonitoringModal (`components/fueling/TransactionMonitoringModal.js`)

Real-time transaction progress display.

**Features:**
- Live volume/amount display
- Elapsed time counter
- Flow rate indicator
- Stop fueling action
- Auto-updates via SignalR

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| visible | Boolean | Modal visibility |
| deviceId | String | PTS device ID |
| pumpId | Number | Pump identifier |
| transactionId | String | Active transaction ID |
| onComplete | Function | Completion callback |
| onCancel | Function | Cancel/minimize action |

### 7. FuelingHeader (`components/fueling/FuelingHeader.js`)

Header component showing:
- Site name
- Device ID
- Connection status
- Step progress indicator

## Data Flow

### Redux State Structure

```javascript
{
  fueling: {
    deviceStatuses: {
      [deviceId]: {
        uploadStatus: {...},
        lastUpdated: timestamp
      }
    },
    connectionStatuses: {
      [deviceId]: 'connected' | 'disconnected' | 'reconnecting'
    },
    activeTransactions: [
      {
        deviceId,
        transactionId,
        pumpId,
        status,
        volume,
        amount
      }
    ],
    currentProcess: {
      step: 'pump',
      selectedPump: null,
      selectedNozzle: null,
      ...
    }
  }
}
```

### SignalR Events

| Event | Direction | Description |
|-------|-----------|-------------|
| SubscribeToDevice | Client → Server | Subscribe to device updates |
| UnsubscribeFromDevice | Client → Server | Unsubscribe from device |
| UploadStatusUpdate | Server → Client | Pump status changes |
| TransactionUpdate | Server → Client | Transaction progress |
| EndOfTransaction | Server → Client | Transaction completed |
| AuthorizationResponse | Server → Client | Authorization result |

## API Endpoints Used

### Pump Control

```javascript
// Authorize pump
POST /api/pump/authorize
Body: {
  deviceId: string,
  pumpId: number,
  nozzle: number,
  type: 'Full' | 'Amount' | 'Volume',
  dose: number | null,
  vehicleId: string,
  tag: string,
  useMasterTag: boolean
}

// Stop pump
POST /api/pump/stop
Body: { deviceId, pumpId }

// Complete transaction
POST /api/pump/complete
Body: { deviceId, pumpId, transactionId }
```

### Vehicle & Tag

```javascript
// Get vehicle list
GET /api/vehicle/list

// Validate vehicle
POST /api/vehicle/validate
Body: { vehicleId }

// Validate tag
POST /api/tag/validate
Body: { tagId }
```

## Usage Example

```javascript
import { FuelingProcessScreen } from '../screens/FuelingProcessScreen';

// Navigate to fueling with device ID
navigation.navigate('FuelingProcess', { ptsId: 'PTS001' });
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Device disconnected | Show overlay, disable interactions |
| Authorization failed | Alert with error message |
| Transaction timeout | Auto-cleanup after 5 minutes |
| Network error | Retry with exponential backoff |

## Testing

### Manual Test Cases

1. **Happy Path**
   - Select idle pump → Select nozzle → Search vehicle → Authorize
   - Verify transaction appears in monitoring
   - Complete fueling → Verify completion

2. **Offline Handling**
   - Disconnect network mid-process
   - Verify reconnection and state recovery

3. **Validation**
   - Try to authorize without vehicle
   - Try invalid dose amounts
   - Verify error messages

## Related Files

- `services/pumpControlService.js` - API calls
- `services/signalRService.js` - Real-time connection
- `utils/FuelingUtils.js` - Helper functions
- `hooks/useDeviceData.js` - Device data hook
