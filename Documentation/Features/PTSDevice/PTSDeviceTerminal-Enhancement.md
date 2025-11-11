# PTS Device Terminal Enhancement

## Overview
Enhanced the PTSDeviceTerminal component to monitor ALL raw PTS messages from SignalR, providing comprehensive device communication visibility for debugging and monitoring.

## Implementation Date
January 2025

## Component Location
`fms.frontend/src/pages/PTSDevice/PTSDeviceDetail/components/PTSDeviceTerminal.js`

## Features

### 1. Comprehensive SignalR Event Monitoring
The terminal now subscribes to ALL 11 PTS SignalR events:

```javascript
const ptsEvents = [
  "UploadStatus",           // Full device status updates
  "UploadStatusUpdate",     // Device status changes
  "NozzleStateChange",      // Nozzle up/down events
  "FillingStatus",          // Active fueling data
  "PumpTransactionCompleted", // Transaction completion
  "PumpOffline",            // Pump offline notifications
  "ReceiveRFIDTag",         // RFID tag reads
  "UploadstatusTagRead",    // Tag read from upload status
  "ProbeStatusUpdate",      // Tank probe updates
  "ReaderStatusUpdate",     // RFID reader status
  "FuelingEvent"            // General fueling events
];
```

### 2. Real-Time Message Display
- **Automatic Scrolling**: Terminal auto-scrolls to show latest messages
- **Manual Scroll Override**: Automatically detects when user scrolls up to review history
- **Scroll Indicator**: Shows when auto-scroll is disabled with visual feedback

### 3. Message Filtering
- **Filter by Event Type**: Dropdown to select specific event types or view all
- **Visual Color Coding**: Each event type has a unique color for quick identification:
  - UploadStatus: Blue
  - NozzleStateChange: Purple
  - FillingStatus: Green
  - PumpTransactionCompleted: Indigo
  - PumpOffline: Red
  - RFID Events: Yellow
  - Probe/Reader: Teal/Cyan
  - FuelingEvent: Orange

### 4. Pause/Resume Functionality
- **Pause Button**: Stop message capture to analyze current logs
- **Resume Button**: Continue capturing messages
- **Visual Indicator**: Shows "PAUSED" status in footer
- **Buffer Management**: Maintains up to 500 messages (configurable)

### 5. Log Management
- **Clear Button**: Remove all messages from terminal
- **Export Button**: Download logs as text file with timestamp
- **Buffer Limit**: Automatically removes oldest messages when buffer is full (500 max)
- **Message Count**: Displays current message count in real-time

### 6. Device Filtering
Messages are automatically filtered to show only data for the current device:
```javascript
if (
  data.deviceId === deviceId ||
  data.ptsid === deviceId ||
  data.DeviceId === deviceId
) {
  addLog(eventType, data);
}
```

### 7. Dark Terminal Theme
- **Professional Terminal UI**: Dark background with colored text
- **JSON Formatting**: Automatic JSON pretty-printing with syntax highlighting
- **Hover Effects**: Interactive log entries with hover highlighting
- **Custom Scrollbar**: Styled scrollbar matching terminal theme

## UI Components

### Terminal Header
- Device identifier (PTSID)
- Message count display
- Control buttons: Filter, Pause/Resume, Clear, Export

### Terminal Body
- Scrollable log display area (500px height, max 70vh)
- Auto-scroll with manual override detection
- Color-coded event types
- Formatted JSON message data
- Timestamp for each entry

### Terminal Footer
- Connection status indicator (green/red)
- Active filter display
- Buffer usage (current/max)
- Pause status indicator
- Auto-scroll status indicator

## Technical Implementation

### SignalR Integration
```javascript
useEffect(() => {
  if (!device || !isConnected || isPaused) return;

  const deviceId = device.ptsid;
  const subscriptions = [];

  ptsEvents.forEach((eventType) => {
    const handler = (data) => {
      if (
        data.deviceId === deviceId ||
        data.ptsid === deviceId ||
        data.DeviceId === deviceId
      ) {
        addLog(eventType, data);
      }
    };

    const unsubscribe = ptsSignalRService.on(eventType, handler);
    subscriptions.push(unsubscribe);
  });

  return () => {
    subscriptions.forEach((unsub) => unsub());
  };
}, [device, isPaused, maxLogs]);
```

### Auto-Scroll Detection
```javascript
const handleScroll = () => {
  if (!terminalRef.current) return;

  const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

  autoScrollRef.current = isNearBottom;
};
```

### Buffer Management
```javascript
const addLog = useCallback((eventType, data) => {
  if (isPaused) return;

  setLogs((prevLogs) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      deviceId: data.deviceId || data.ptsid || data.DeviceId,
    };

    const newLogs = [...prevLogs, newLog];
    return newLogs.slice(-maxLogs); // Keep only last maxLogs entries
  });
}, [isPaused, maxLogs]);
```

## Usage

### Accessing Terminal
1. Navigate to Admin > PTS Devices
2. Click on a device row to open detail page
3. Click "Terminal" tab
4. Terminal automatically starts capturing messages

### Filtering Messages
1. Use the "Filter messages" dropdown in header
2. Select specific event type or "All Messages"
3. Log display updates immediately

### Pausing for Analysis
1. Click "Pause" button to stop message capture
2. Scroll through historical messages
3. Click "Resume" to continue capturing

### Exporting Logs
1. Click "Export" button
2. Logs download as text file with format:
   ```
   [timestamp] EventType
   {formatted JSON data}
   ```

### Manual Scroll Override
1. Scroll up in terminal to review history
2. Auto-scroll automatically disables
3. Footer shows "Scroll to bottom for auto-scroll" indicator
4. Scroll to bottom to re-enable auto-scroll

## Related Files

### Backend
- `FMS.Application/Features/PTS/Commands/UploadStatusCommand.cs` - Processes device status, triggers SignalR
- `FMS.WebClient/Hubs/PTSHub.cs` - Broadcasts all 11 PTS events
- `FMS.Application/PTSServices/RedisPTSCommandProcessor.cs` - Processes Redis commands, publishes responses

### Frontend
- `fms.frontend/src/pages/PTSDevice/PTSDeviceDetail/components/PTSDeviceTerminal.js` - Main terminal component
- `fms.frontend/src/pages/PTSDevice/PTSDeviceDetail/components/PTSDeviceTerminal.scss` - Terminal styling
- `fms.frontend/src/signalR/ptsSignalRService.js` - SignalR client service

## Benefits

### For Developers
- **Real-time Debugging**: See exactly what messages device is sending
- **Event Visibility**: Monitor all communication types in one place
- **Message Analysis**: Pause and review message content in detail
- **Export Capability**: Save logs for offline analysis

### For Operations
- **Troubleshooting**: Quickly identify communication issues
- **Device Monitoring**: Watch device behavior in real-time
- **Transaction Tracking**: Follow complete transaction lifecycle
- **Offline Detection**: Immediately see when pumps go offline

### For Support
- **Issue Diagnosis**: Capture exact messages during problem scenarios
- **Customer Support**: Export logs to attach to support tickets
- **Pattern Recognition**: Identify recurring issues through message analysis

## Future Enhancements

### Potential Improvements
1. **Search/Grep**: Add text search within log messages
2. **Time Range Filter**: Filter by timestamp range
3. **Regex Filtering**: Advanced pattern matching in messages
4. **Split View**: Show multiple event types side-by-side
5. **Message Statistics**: Show count per event type
6. **Alerts**: Highlight error conditions or anomalies
7. **Message Replay**: Replay captured messages for testing
8. **Compare View**: Compare messages from multiple devices

### Configuration Options
1. **Buffer Size**: Make maxLogs user-configurable
2. **Theme Options**: Light/dark theme toggle
3. **Font Size**: Adjustable terminal font size
4. **Auto-Export**: Automatic periodic log exports
5. **Persistence**: Save logs to browser storage

## Testing Checklist

- [x] Terminal connects to SignalR on component mount
- [x] All 11 event types are captured
- [x] Device filtering works correctly
- [x] Event type filtering updates display
- [x] Pause stops message capture
- [x] Resume continues message capture
- [x] Clear removes all messages
- [x] Export creates valid log file
- [x] Auto-scroll works with new messages
- [x] Manual scroll disables auto-scroll
- [x] Scroll to bottom re-enables auto-scroll
- [x] Buffer limit enforced (500 max)
- [x] Color coding displays correctly
- [x] JSON formatting is readable
- [x] Connection status indicator accurate
- [x] Footer displays correct statistics
- [x] Component unmount cleans up subscriptions

## Known Issues
None at this time.

## Performance Notes
- **Buffer Management**: Automatically limits to 500 messages to prevent memory issues
- **Subscription Cleanup**: All SignalR subscriptions properly cleaned up on unmount
- **Render Optimization**: Uses React best practices for efficient re-rendering
- **Memory Footprint**: Typical usage: ~5-10MB for full buffer with JSON data
