# FMS Mobile Application Documentation

## Overview

The FMS Mobile application is a React Native application that provides field operators with mobile access to the Fleet Management System. It enables on-site fueling operations, transaction viewing, and real-time device monitoring.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.72+ | Mobile framework |
| Redux Toolkit | Latest | State management |
| SignalR | Latest | Real-time communication |
| React Navigation | v6 | Navigation |
| AsyncStorage | Latest | Local storage |
| FontAwesome 5 | Latest | Icons |

## Architecture

```
fms.mobile/
├── src/
│   ├── App.js                    # Main app entry
│   ├── components/
│   │   ├── common/               # Shared components
│   │   │   ├── LoadingScreen.js
│   │   │   └── LoadingOverlay.js
│   │   └── fueling/              # Fueling step components
│   │       ├── PumpSelectionStep.js
│   │       ├── NozzleSelectionStep.js
│   │       ├── ScanStep.js
│   │       ├── FuelingDetailsStep.js
│   │       ├── FuelingHeader.js
│   │       └── TransactionMonitoringModal.js
│   ├── hooks/
│   │   └── useDeviceData.js      # Device data hook
│   ├── navigation/
│   │   └── AppNavigator.js       # Navigation configuration
│   ├── redux/
│   │   ├── store.js              # Redux store config
│   │   └── slices/               # Redux slices
│   │       ├── authSlice.js
│   │       ├── deviceSlice.js
│   │       ├── fuelingSlice.js
│   │       ├── fuelingEventSlice.js
│   │       ├── siteSlice.js
│   │       ├── tagSlice.js
│   │       ├── transactionSlice.js
│   │       └── vehicleSlice.js
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── DeviceListScreen.js
│   │   ├── FuelingProcessScreen.js
│   │   ├── TransactionHistoryScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   ├── apiService.js         # HTTP API client
│   │   ├── pumpControlService.js # Pump operations
│   │   └── signalRService.js     # Real-time updates
│   └── utils/
│       └── FuelingUtils.js       # Fueling utilities
```

## Key Features

### 1. Authentication
- JWT-based authentication
- Token persistence via AsyncStorage
- Auto-login with stored credentials
- Token refresh handling

### 2. Fueling Process
- Multi-step wizard flow
- Real-time pump status via SignalR
- Vehicle selection (lookup, scan, manual)
- Authorization type selection (Full, Amount, Volume)
- Transaction monitoring

### 3. Transaction History
- Paginated transaction list
- Filter by date, pump, device
- Transaction summary statistics
- Export capabilities

### 4. Real-time Updates
- SignalR connection management
- Device subscription handling
- Auto-reconnection with exponential backoff
- Connection state notifications

## Navigation Flow

```
LoginScreen
    │
    ▼ (on auth success)
MainTabs
    ├── Devices (DeviceListScreen)
    │       │
    │       ▼ (select device)
    │   FuelingProcessScreen
    │       ├── Step 1: PumpSelectionStep
    │       ├── Step 2: NozzleSelectionStep
    │       ├── Step 3: ScanStep
    │       └── Step 4: FuelingDetailsStep
    │               │
    │               ▼ (on authorize)
    │           TransactionMonitoringModal
    │
    ├── History (TransactionHistoryScreen)
    │
    └── Settings (SettingsScreen)
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
API_BASE_URL=http://your-api-server:5000/api
SIGNALR_BASE_URL=http://your-api-server:5000

# Feature Flags
ENABLE_SCANNING=true
ENABLE_NFC=false
```

### Android Setup

For Android emulator connecting to local backend:
- Use `10.0.2.2` instead of `localhost`
- Ensure network security config allows cleartext traffic for development

### iOS Setup

For iOS simulator:
- Use `localhost` directly
- Configure App Transport Security exceptions if needed

## Running the App

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Related Documentation

- [Fueling Process Feature](./Features/FuelingProcess.md)
- [SignalR Integration](./Features/SignalRIntegration.md)
- [Transaction Viewing](./Features/TransactionViewing.md)
- [Backend Integration](../BACKEND_INTEGRATION.md)
