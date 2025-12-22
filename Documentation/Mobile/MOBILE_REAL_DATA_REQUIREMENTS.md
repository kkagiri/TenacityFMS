# Mobile Fueling Process - Real Data Requirements

## Current State Analysis

The mobile app currently uses **MOCK DATA** in several areas. This document compares the frontend implementation with mobile to identify what real APIs and backend models are needed.

---

## 1. API Endpoints Comparison

### ✅ Already Implemented in Mobile (Ready to Use)

| Feature             | Frontend URL                           | Mobile Service                               | Status   |
| ------------------- | -------------------------------------- | -------------------------------------------- | -------- |
| Login               | `POST /v1/User/Login`                  | `apiService.login()`                         | ✅ Ready |
| Device List         | `GET /v1/PTSDevice`                    | `pumpControlService.getDeviceList()`         | ✅ Ready |
| Device Status       | `GET /v1/PTSDevice/Device/{deviceId}`  | `pumpControlService.getDeviceStatus()`       | ✅ Ready |
| Device Config       | `GET /v1/PTSDevice/GetById/{deviceId}` | `pumpControlService.getDeviceConfig()`       | ✅ Ready |
| Vehicle List        | `GET /v1/Vehicle/simple`               | `pumpControlService.getVehicleList()`        | ✅ Ready |
| Site List           | `GET /v1/Site`                         | `apiService.getSiteList()`                   | ✅ Ready |
| Pump Authorize      | `POST /v1/Pump/authorize`              | `pumpControlService.authorizePump()`         | ✅ Ready |
| Pump Stop           | `POST /v1/Pump/stop`                   | `pumpControlService.stopPump()`              | ✅ Ready |
| Transaction History | `GET /v1/transaction/history`          | `pumpControlService.getTransactionHistory()` | ✅ Ready |

### ❌ Missing in Mobile (Needs Implementation)

| Feature               | Frontend URL                                            | Mobile Needs                  | Priority |
| --------------------- | ------------------------------------------------------- | ----------------------------- | -------- |
| **Tank Transfer**     | `POST /api/v1/Pump/authorize-transfer`                  | Add `authorizeTankTransfer()` | HIGH     |
| **Tanks by Site**     | `GET /api/tank/site/{siteId}`                           | Add `getTanksBySite()`        | HIGH     |
| **All Tanks**         | `GET /api/tank`                                         | Add `getTanks()`              | MEDIUM   |
| **Validate Tag**      | `GET /api/FuelTag/validate/{tagId}`                     | Update `validateTag()`        | HIGH     |
| **Tags by Vehicle**   | `GET /api/FuelTag/by-vehicle/{vehicleId}`               | Add `getTagsByVehicleId()`    | MEDIUM   |
| **Tag Details**       | `GET /api/FuelTag/details/{tagName}`                    | Add `getTagDetails()`         | MEDIUM   |
| **Validate Vehicle**  | `GET /api/FuelTag/validate-vehicle/{vehicleId}`         | Add `validateVehicle()`       | HIGH     |
| **Pump State**        | `GET /api/v1/Pump/{deviceId}/{pumpId}/state`            | Add `getPumpState()`          | HIGH     |
| **Nozzle State**      | `GET /api/v1/Pump/{deviceId}/{pumpId}/nozzle-state`     | Add `getNozzleState()`        | MEDIUM   |
| **Close Transaction** | `POST /api/pump/{deviceId}/{pumpId}/close`              | Add `closeTransaction()`      | HIGH     |
| **Transaction Info**  | `GET /api/v1/Pump/{deviceId}/{pumpId}/transaction/{id}` | Add `getTransactionInfo()`    | MEDIUM   |

---

## 2. Mock Data vs Real Data

### Current Mock Data Usage in Mobile

| Component                      | What's Mocked                                         | What's Needed                             |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------- |
| **FuelingProcessScreen.js**    | `generateMockPTSData()` - Creates fake pump/tank data | SignalR real-time updates                 |
| **useDeviceData.js**           | Reads from Redux mock state                           | Real UploadStatus from SignalR            |
| **TankSelectionStep**          | Probe tanks from mock data                            | Real tanks from `/api/tank/site/{siteId}` |
| **PumpSelectionStep**          | Mock pump statuses                                    | Real pump status from SignalR             |
| **NozzleSelectionStep**        | Mock nozzle config                                    | Real NozzleConfig from UploadStatus       |
| **TransferDetailsStep**        | Simulated transfer                                    | Real `/api/v1/Pump/authorize-transfer`    |
| **TransactionMonitoringModal** | Simulated progress                                    | Real SignalR UploadStatusUpdate           |

### Real Data Flow (Frontend Reference)

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SignalR Hub Connection                                      │
│     └── Receives: UploadStatusUpdate events                     │
│         ├── deviceId                                            │
│         ├── Pumps (IdleStatus, FillingStatus, EOTStatus)        │
│         ├── Probes (Tank levels, temperatures)                  │
│         └── NozzleConfig (per pump nozzle details)              │
│                                                                 │
│  2. Redux Action: receiveUploadStatusUpdate(data)               │
│     └── Stores raw UploadStatus in realtimeStatusReducer        │
│                                                                 │
│  3. Hook: useDeviceData(ptsId)                                  │
│     ├── Parses pump status via FuelingUtils.handlePumpStatus()  │
│     ├── Derives: devicePumpStatus, pumps, activeFuelingProcesses│
│     ├── Extracts: fuelGrades, probeTanks                        │
│     └── Returns real-time data for UI                           │
│                                                                 │
│  4. API Calls (on demand):                                      │
│     ├── authorizePump() → POST /api/pump/authorize              │
│     ├── fetctTankbySiteId() → GET /api/tank/site/{siteId}       │
│     ├── validateVehicle() → GET /api/FuelTag/validate-vehicle   │
│     └── fetchTagsByVehicleId() → GET /api/FuelTag/by-vehicle    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Models Required

### Authorization Request (PumpAuthorizeCommand)

```typescript
// Mobile should send this structure to POST /api/v1/Pump/authorize
interface PumpAuthorizeRequest {
  deviceId: string; // PTS device ID
  pumpId: number; // Pump number (1-based)
  nozzle: number; // Nozzle number (1-based)
  type: number; // 0=Volume, 1=Amount, 2=FullTank
  dose: number; // Volume or amount depending on type
  price?: number; // Fuel price (optional)
  fuelGradeId?: number; // Fuel grade ID (optional)
  tankId?: number; // Source tank ID (for tracking)
  tag?: string; // RFID tag or vehicle identifier
  vehicleId?: number; // Vehicle ID (optional)
  odometer?: number; // Odometer reading (optional)
}
```

### Authorization Response (PumpAuthorizeConfirmation)

```typescript
// Response from POST /api/v1/Pump/authorize
interface FMSResponse<PumpAuthorizeConfirmation> {
  isSuccess: boolean;
  message: string;
  data: {
    transaction: number; // Transaction ID
    pump: number; // Pump number
    nozzleId: number; // Nozzle number
    connectionType: string; // 'WebSocket' or 'HTTP'
  };
  errorType?: string;
}
```

### Tank Transfer Request (PumpAuthorizeTransferCommand)

```typescript
// Mobile should send this to POST /api/v1/Pump/authorize-transfer
interface TankTransferRequest {
  deviceId: string; // PTS device ID
  pumpId: number; // Pump number
  sourceTankId: number; // Source tank ID
  destinationTankId: number; // Destination tank ID
  volume: number; // Transfer volume in liters
  nozzleId?: number; // Nozzle number (optional)
  reason?: string; // Transfer reason (optional)
}
```

### UploadStatus (Real-time from SignalR)

```typescript
// Received via SignalR UploadStatusUpdate
interface UploadStatus {
  ConfigurationId: string;
  DateTime: string;
  FirmwareDateTime: string;
  StartupSeconds: number;
  BatteryVoltage: number;
  CpuTemperature: number;
  PtsPowerDownDetected: boolean;
  SdMounted: boolean;

  Pumps: {
    Count: number;
    IdleStatus: {
      Ids: number[];
      NozzlesUp: number[];
      LastTransactions: number[];
      LastVolumes: number[];
      LastAmounts: number[];
      LastPrices: number[];
    };
    FillingStatus: {
      Ids: number[];
      Nozzles: number[];
      Volumes: number[];
      Amounts: number[];
      Transactions: number[];
    };
    EndOfTransactionStatus: {
      Ids: number[];
      Volumes: number[];
      Amounts: number[];
      Transactions: number[];
    };
    NozzleConfig: {
      [pumpId: number]: Array<{
        Number: number;
        FuelGradeId: number;
        FuelGradeName: string;
        Price: number;
      }>;
    };
  };

  Probes: {
    Count: number;
    Ids: number[];
    ProductIds: number[];
    ProductNames: string[];
    Volumes: number[];
    Capacities: number[];
    Heights: number[];
    Temperatures: number[];
    WaterHeights: number[];
    WaterVolumes: number[];
  };
}
```

---

## 4. SignalR Integration for Mobile

### Current State

- Mobile has `signalRService.js` but it's not fully integrated
- Fueling process uses mock data dispatch instead of SignalR

### Required Integration

```javascript
// Mobile needs to subscribe to these SignalR events:

// 1. UploadStatusUpdate - Real-time pump/tank status
signalR.on("UploadStatusUpdate", (data) => {
  dispatch(
    updateDeviceStatus({
      deviceId: data.deviceId,
      status: {
        uploadStatus: data.status,
        lastUpdated: Date.now(),
      },
    })
  );
});

// 2. TransactionUpdate - Transaction progress updates
signalR.on("TransactionUpdate", (data) => {
  // Update transaction progress in Redux
});

// 3. DeviceConnectionChanged - Connection status
signalR.on("DeviceConnectionChanged", (data) => {
  dispatch(
    updateConnectionStatus({
      deviceId: data.deviceId,
      status: data.isConnected ? "connected" : "disconnected",
    })
  );
});
```

---

## 5. Implementation Priority

### Phase 1: Core Fueling (HIGH Priority)

1. ✅ Remove mock data generation in FuelingProcessScreen
2. ✅ Connect SignalR for real-time UploadStatus
3. ✅ Implement real `/api/v1/Pump/authorize` call
4. ✅ Implement real `/api/tank/site/{siteId}` for tank list
5. ✅ Implement transaction monitoring via SignalR

### Phase 2: Tank Transfer (HIGH Priority)

1. ✅ Add `authorizeTankTransfer()` to pumpControlService
2. ✅ Connect TransferDetailsStep to real API
3. ✅ Handle transfer transaction monitoring

### Phase 3: Vehicle/Tag Validation (MEDIUM Priority)

1. ❌ Add `validateVehicle()` endpoint call
2. ❌ Add `getTagsByVehicleId()` for tag selection
3. ❌ Add `validateTag()` for RFID scanning

### Phase 4: Enhanced Features (LOW Priority)

1. ❌ Nozzle state validation before authorization
2. ❌ Transaction info retrieval
3. ❌ Close transaction endpoint

---

## 6. Files to Modify

### Mobile Services

```
fms.mobile/src/services/
├── pumpControlService.js     # Add missing API calls
├── apiService.js             # Add tank and tag endpoints
└── signalRService.js         # Enhance SignalR subscription
```

### Mobile Redux

```
fms.mobile/src/redux/slices/
├── fuelingSlice.js           # Remove mock, add real actions
├── tankSlice.js              # NEW: Tank data management
└── signalRSlice.js           # NEW: SignalR connection state
```

### Mobile Screens/Components

```
fms.mobile/src/screens/
└── FuelingProcessScreen.js   # Remove generateMockPTSData()

fms.mobile/src/components/fueling/
├── TankSelectionStep.js      # Use real tank API
├── TransferDetailsStep.js    # Use real transfer API
└── TransactionMonitoringModal.js  # Use real SignalR events
```

---

## 7. Summary Table

| Area                 | Current (Mock)          | Target (Real)                | API Endpoint                             |
| -------------------- | ----------------------- | ---------------------------- | ---------------------------------------- |
| Pump Status          | `generateMockPTSData()` | SignalR `UploadStatusUpdate` | N/A (WebSocket)                          |
| Tank List            | Probe data from mock    | REST API                     | `GET /api/tank/site/{siteId}`            |
| Pump Auth            | Simulated success       | REST API                     | `POST /api/v1/Pump/authorize`            |
| Tank Transfer        | Toast simulation        | REST API                     | `POST /api/v1/Pump/authorize-transfer`   |
| Transaction Progress | Fake updates            | SignalR events               | `UploadStatusUpdate`                     |
| Vehicle Validation   | Skip validation         | REST API                     | `GET /api/FuelTag/validate-vehicle/{id}` |
| Tag Validation       | Skip validation         | REST API                     | `GET /api/FuelTag/validate/{tagId}`      |

---

## 8. Backend Endpoints Summary

### PumpController (`/api/v1/Pump/`)

| Method | Endpoint                                | Description                        |
| ------ | --------------------------------------- | ---------------------------------- |
| POST   | `/authorize`                            | Authorize pump for vehicle fueling |
| POST   | `/authorize-transfer`                   | Authorize pump for tank transfer   |
| GET    | `/{deviceId}/{pumpId}/state`            | Get pump state                     |
| POST   | `/{deviceId}/{pumpId}/stop`             | Stop pump transaction              |
| GET    | `/{deviceId}/config`                    | Get device configuration           |
| GET    | `/{deviceId}/{pumpId}/nozzle-state`     | Get nozzle lift state              |
| GET    | `/{deviceId}/{pumpId}/transaction/{id}` | Get transaction info               |
| POST   | `/{deviceId}/{pumpId}/close`            | Close/complete transaction         |

### TankController (`/api/tank/`)

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| GET    | `/`              | Get all tanks     |
| GET    | `/site/{siteId}` | Get tanks by site |
| POST   | `/`              | Create tank       |
| PUT    | `/{id}`          | Update tank       |
| DELETE | `/{id}`          | Delete tank       |

### FuelTagController (`/api/FuelTag/`)

| Method | Endpoint                        | Description                  |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/`                             | Get all tags                 |
| GET    | `/by-vehicle/{vehicleId}`       | Get tags for vehicle         |
| GET    | `/details/{tagName}`            | Get tag details              |
| GET    | `/validate/{tagId}`             | Validate tag                 |
| GET    | `/validate-vehicle/{vehicleId}` | Validate vehicle for fueling |

### SignalR Hub Events

| Event                     | Direction       | Description                |
| ------------------------- | --------------- | -------------------------- |
| `UploadStatusUpdate`      | Server → Client | Real-time pump/tank status |
| `TransactionUpdate`       | Server → Client | Transaction progress       |
| `DeviceConnectionChanged` | Server → Client | Device online/offline      |
| `ProbeStatusUpdate`       | Server → Client | Tank level changes         |
