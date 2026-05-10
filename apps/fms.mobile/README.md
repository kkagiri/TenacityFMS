# FMS Mobile - React Native Fueling Management System

A mobile application for managing fuel dispensing operations, built with React Native and adapted from the existing web-based FMS frontend.

## Features

### Core Fueling Process
- **Pump Selection**: Visual grid of available pumps with real-time status indicators
- **Nozzle Selection**: Choose specific nozzle with fuel type and pricing information
- **Vehicle/Tag Identification**: Support for RFID scanning and manual vehicle lookup
- **Authorization Types**: Amount-based, Volume-based, and Full Tank fueling options
- **Real-time Monitoring**: Live transaction progress with volume and amount updates
- **Transaction Management**: Cancel, complete, and monitor active transactions

### Mobile-Specific Features
- **Touch-Optimized UI**: Large touch targets and mobile-friendly navigation
- **Camera Integration**: QR code and barcode scanning for tags
- **Offline Support**: Local data persistence with Redux Persist
- **Push Notifications**: Transaction alerts and system notifications
- **Haptic Feedback**: Physical feedback for important actions
- **Portrait/Landscape**: Responsive design for different orientations

### Shared Functionality with Web Frontend
- **FuelingUtils**: Core business logic for pump status processing
- **Redux State Management**: Similar state structure and actions
- **SignalR Integration**: Real-time device communication
- **Transaction Flow**: Same end-to-end fueling process
- **Device Communication**: WebSocket, HTTP Polling, and Direct HTTP methods

## Architecture

### Project Structure
```
fms.mobile/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Generic components (LoadingOverlay, etc.)
│   │   └── fueling/        # Fueling-specific components
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation configuration
│   ├── redux/              # State management
│   │   ├── store.js        # Redux store configuration
│   │   └── slices/         # RTK slices
│   ├── services/           # API services
│   ├── utils/              # Utility functions (FuelingUtils)
│   ├── hooks/              # Custom React hooks
│   └── assets/             # Images, fonts, etc.
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
└── package.json
```

### Key Components

#### Fueling Process Components
- **`FuelingProcessScreen`**: Main orchestrator (adapted from `fuelingprocess.js`)
- **`PumpSelectionStep`**: Mobile pump selection with grid layout
- **`NozzleSelectionStep`**: Nozzle selection with fuel grade information
- **`ScanStep`**: RFID/QR scanning and vehicle lookup
- **`FuelingDetailsStep`**: Authorization configuration and confirmation
- **`TransactionMonitoringModal`**: Real-time transaction progress

#### Shared Business Logic
- **`FuelingUtils`**: Adapted from web frontend with mobile-specific additions
  - Pump status processing
  - Nozzle information extraction
  - Currency and volume formatting
  - Transaction validation
  - Mobile UI helpers (colors, icons)

### State Management

The app uses Redux Toolkit with persistence:

```javascript
// Redux Store Structure
{
  auth: {
    isAuthenticated: boolean,
    user: UserObject,
    masterTag: string
  },
  device: {
    ptsDeviceList: DeviceObject[],
    connectionStatuses: {}
  },
  fueling: {
    currentProcess: {
      step: 'pump' | 'nozzle' | 'scan' | 'details',
      selectedPump: PumpObject,
      selectedNozzle: NozzleObject,
      // ... other selections
    },
    deviceStatuses: {}, // Real-time pump statuses
    activeTransactions: TransactionObject[]
  },
  // ... other slices
}
```

## Installation & Setup

### Prerequisites
- Node.js 16+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Initial Setup
```bash
# Clone and navigate to mobile project
cd fms.mobile

# Install dependencies
npm install

# iOS specific setup
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Environment Configuration
Create `.env` file in the root directory:
```env
API_BASE_URL=http://your-backend-url/api
SIGNALR_HUB_URL=http://your-backend-url/fuelingHub
```

## Integration with Existing Backend

The mobile app integrates with the same backend APIs as the web frontend:

### API Endpoints
- `POST /api/pump/authorize` - Pump authorization
- `GET /api/device/{id}/status` - Device status
- `GET /api/vehicle/list` - Vehicle management
- `POST /api/tag/validate` - Tag validation
- `GET /api/transaction/history` - Transaction history

### SignalR Hub
- Real-time device status updates
- Transaction progress notifications
- Connection status monitoring

## Reusable Components from Web Frontend

### Adapted Components
1. **`FuelingUtils`** - Core business logic with mobile enhancements
2. **Authorization Flow** - Same command/handler pattern
3. **Transaction Monitoring** - Similar real-time update processing
4. **Device Communication** - Same WebSocket/HTTP integration

### Mobile-Specific Enhancements
1. **Touch Interface** - Large buttons and touch-friendly interactions
2. **Camera Integration** - QR/Barcode scanning for tags
3. **Mobile Navigation** - Stack and tab navigation
4. **Offline Persistence** - Local storage with Redux Persist
5. **Performance Optimization** - FlatList for large data sets

## Development Workflow

### Adding New Features
1. Create components in appropriate directories
2. Add Redux slice if state management needed
3. Update navigation if new screens required
4. Add API service methods if backend integration needed
5. Update this README with new functionality

### Testing
```bash
# Run tests
npm test

# Run on specific platform
npm run android
npm run ios

# Clean and rebuild
npm run clean
```

### Building for Production
```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
# Use Xcode to archive and distribute
```

## Key Differences from Web Frontend

### Mobile Adaptations
1. **Navigation**: Stack/Tab navigation instead of routing
2. **UI Components**: Native components instead of DevExtreme
3. **Storage**: AsyncStorage instead of localStorage
4. **Permissions**: Camera/NFC permissions for scanning
5. **Gestures**: Touch gestures instead of mouse interactions

### Enhanced Features
1. **Offline Capability**: Works without constant internet connection
2. **Push Notifications**: Real-time alerts
3. **Biometric Auth**: Fingerprint/Face ID support
4. **Camera Scanning**: Built-in QR/barcode scanning
5. **Haptic Feedback**: Physical interaction feedback

## Contributing

1. Follow existing code structure and patterns
2. Maintain compatibility with web frontend business logic
3. Add mobile-specific enhancements where appropriate
4. Update documentation for new features
5. Test on both Android and iOS platforms

## Future Enhancements

- [ ] Biometric authentication
- [ ] Push notifications for transaction events
- [ ] Offline transaction queue
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Voice commands for hands-free operation
- [ ] GPS location tracking
- [ ] Integration with fuel card readers