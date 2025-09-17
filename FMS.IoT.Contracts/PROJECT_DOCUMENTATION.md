# FMS.IoT.Contracts Project Documentation

## 🎯 Project Overview

**Purpose**: Defines all interfaces and data models that the IoT system uses. Think of this as the "contract" that all other projects must follow.

**Why This Exists**:
- All projects agree on the same data structures
- Changes to interfaces force updates everywhere (catching errors early)
- Makes testing easier (you can mock interfaces)
- Clear separation between "what" (contracts) and "how" (implementations)

---

## 📁 File Structure & Purpose

### 🌐 Common Folder

#### IoTConstants.cs
**What it is**: A dictionary of terms everyone in the system uses

**Key Constants**:
```csharp
// Message Types - What kind of message is this?
public const string Telemetry = "telemetry";      // Device data (fuel level, temperature)
public const string Command = "command";          // Instructions to device (start pump)
public const string Status = "status";           // Device status updates
public const string Alert = "alert";             // Emergency notifications

// Connection States - Is the device connected?
public const string Connected = "connected";
public const string Disconnected = "disconnected";
public const string Connecting = "connecting";

// Protocols - How are we talking to the device?
public const string WebSocket = "websocket";
public const string Http = "http";
public const string Tcp = "tcp";
```

**Junior Engineer Tip**: When adding new message types, add them here first!

#### OperationResult.cs
**What it is**: Standard way to return success/failure from any operation

**Why Use This**: Instead of throwing exceptions everywhere, we return a result that says "success" or "failure" with details.

**Example Usage**:
```csharp
// Good result
return OperationResult.Success("Device connected successfully");

// Bad result
return OperationResult.Failure("Connection timeout after 30 seconds");

// Check result
var result = await ConnectDeviceAsync("TANK_001");
if (result.IsSuccess)
{
    Console.WriteLine($"Success: {result.Message}");
}
else
{
    Console.WriteLine($"Failed: {result.Message}");
}
```

---

### 🔌 Gateway Folder

#### Interfaces/

##### IDeviceGateway.cs
**What it is**: The main interface for the entire gateway system

**Key Methods**:
- `StartAsync()` - Starts accepting device connections
- `StopAsync()` - Gracefully shuts down all connections
- `GetStatusAsync()` - Health check for the gateway
- `BroadcastMessageAsync()` - Send message to all connected devices

**When to Use**: Any time you need to control the gateway as a whole

##### IProtocolHandler.cs
**What it is**: Interface for handling different communication protocols (WebSocket, HTTP, etc.)

**Key Methods**:
- `CanHandle()` - Can this handler work with this protocol?
- `ParseMessageAsync()` - Convert raw data into DeviceMessage
- `FormatResponseAsync()` - Convert response back to device format

**Real Example**: WebSocket handler converts WebSocket frame → DeviceMessage

##### IConnectionManager.cs
**What it is**: Interface for managing all device connections

**Key Methods**:
- `AddConnectionAsync()` - Register new device connection
- `RemoveConnectionAsync()` - Clean up disconnected device
- `GetConnectionAsync()` - Find specific device connection
- `GetAllConnectionsAsync()` - List all connected devices

**Junior Engineer Analogy**: Like a phone book for all connected devices

##### IDeviceConnection.cs
**What it is**: Interface for a single device connection

**Key Methods**:
- `SendMessageAsync()` - Send message to this specific device
- `ReceiveMessageAsync()` - Wait for message from this device
- `DisconnectAsync()` - Close this connection
- `GetStatisticsAsync()` - Get metrics for this connection

---

#### Models/

##### DeviceConnection.cs
**What it is**: Information about a connected device

**Key Properties**:
```csharp
public string DeviceId { get; set; }           // "TANK_001", "PUMP_005"
public string Protocol { get; set; }           // "websocket", "http"
public ConnectionStatus Status { get; set; }   // Connected, Disconnected, etc.
public DateTime ConnectedAt { get; set; }      // When did it connect?
public IPAddress RemoteAddress { get; set; }   // Where is it connecting from?
```

**Junior Engineer Example**: Like a visitor badge with name, department, and entry time

##### DeviceMessage.cs
**What it is**: The standard format for ALL messages in the system

**Key Properties**:
```csharp
public string MessageId { get; set; }          // Unique ID for this message
public string DeviceId { get; set; }           // Which device sent this?
public string MessageType { get; set; }        // telemetry, command, status, alert
public string Protocol { get; set; }           // How was it sent?
public Dictionary<string, object> Data { get; set; }  // The actual message content
public DateTime Timestamp { get; set; }        // When was this sent?
```

**Real Example**:
```json
{
  "MessageId": "msg_12345",
  "DeviceId": "TANK_001",
  "MessageType": "telemetry",
  "Protocol": "websocket",
  "Data": {
    "FuelLevel": 85.5,
    "Temperature": 22.3,
    "Pressure": 14.7
  },
  "Timestamp": "2025-01-15T10:30:00Z"
}
```

##### ConnectionStatus.cs
**What it is**: Enum defining all possible connection states

**Values**:
- `Unknown` - We don't know the status yet
- `Connecting` - Trying to establish connection
- `Connected` - Successfully connected and working
- `Disconnected` - Connection lost or intentionally closed
- `Error` - Something went wrong

##### ValidationResult.cs
**What it is**: Result of validating a message

**Why Important**: Before processing any message, we check if it's valid (has required fields, correct format, etc.)

**Properties**:
```csharp
public bool IsValid { get; set; }              // Pass/fail
public List<string> Errors { get; set; }       // What went wrong?
public List<string> Warnings { get; set; }     // Non-critical issues
```

---

### ⚙️ ProcessingEngine Folder

#### Interfaces/

##### IMessageProcessor.cs
**What it is**: Main interface for processing device messages

**Key Methods**:
- `ProcessMessageAsync()` - Process a single message
- `ProcessBatchAsync()` - Process multiple messages efficiently
- `GetStatisticsAsync()` - Get processing performance metrics

**Processing Flow**: DeviceMessage → Validation → Business Logic → Result

##### IDataTransformer.cs
**What it is**: Interface for converting data between formats

**Key Methods**:
- `TransformAsync()` - Convert data from one format to another
- `ValidateInputAsync()` - Check if input data is valid for transformation
- `GetSupportedFormats()` - What formats can this transformer handle?

**Real Example**: Convert device-specific format → standard business format

##### IEventProcessor.cs
**What it is**: Interface for handling system events and notifications

**Key Methods**:
- `PublishEventAsync()` - Send event to all subscribers
- `SubscribeAsync()` - Listen for specific types of events
- `GetEventHistoryAsync()` - Get recent events for debugging

**Event Examples**: "Tank fuel critical", "Pump maintenance needed", "Connection lost"

##### ICommandProcessor.cs
**What it is**: Interface for executing commands sent to devices

**Key Methods**:
- `ExecuteCommandAsync()` - Send command to device and wait for result
- `QueueCommandAsync()` - Add command to execution queue
- `GetCommandStatusAsync()` - Check if command completed
- `CancelCommandAsync()` - Stop a running command

---

#### Models/

##### DeviceCommand.cs
**What it is**: Standard format for commands sent to devices

**Key Properties**:
```csharp
public string CommandId { get; set; }          // Unique command ID
public string DeviceId { get; set; }           // Target device
public string CommandType { get; set; }        // "start_pump", "stop_flow"
public Dictionary<string, object> Parameters { get; set; }  // Command data
public DateTime CreatedAt { get; set; }        // When was command created?
public TimeSpan Timeout { get; set; }          // How long to wait?
```

**Real Example**:
```json
{
  "CommandId": "cmd_789",
  "DeviceId": "PUMP_002",
  "CommandType": "start_pump",
  "Parameters": {
    "FlowRate": 50.0,
    "MaxVolume": 100.0,
    "EmergencyStop": true
  },
  "Timeout": "00:01:00"
}
```

##### ProcessingResult.cs
**What it is**: Result of processing a device message

**Key Properties**:
```csharp
public bool IsSuccess { get; set; }            // Did processing succeed?
public string ProcessedMessageId { get; set; }  // Which message was processed?
public List<ProcessingEvent> GeneratedEvents { get; set; }  // What events occurred?
public Dictionary<string, object> ProcessedData { get; set; }  // Transformed data
public TimeSpan ProcessingTime { get; set; }   // How long did it take?
public string ErrorMessage { get; set; }       // What went wrong (if failed)?
```

---

## 🔄 How Files Work Together

### Message Flow Example

1. **Device sends data** → `DeviceMessage` format
2. **Gateway validates** → `ValidationResult`
3. **Processing transforms** → `ProcessingResult`
4. **Events generated** → `ProcessingEvent`
5. **Commands created** → `DeviceCommand`

### Interface Dependencies

```
IDeviceGateway
├── Uses IConnectionManager
├── Uses IProtocolHandler
└── Creates DeviceMessage

IMessageProcessor
├── Uses IDataTransformer
├── Uses IEventProcessor
└── Uses ICommandProcessor
```

---

## 🎓 Junior Engineer Guidelines

### When to Create New Interfaces

✅ **Do create** when:
- Multiple classes will implement the same behavior
- You need to mock something for testing
- The behavior might change based on configuration

❌ **Don't create** when:
- Only one class will ever implement it
- It's just a data container (use class instead)

### When to Create New Models

✅ **Do create** when:
- Data is passed between projects
- Data needs validation
- Data represents a business concept

❌ **Don't create** when:
- It's only used inside one method
- It's just a wrapper around a single value

### Naming Conventions

- **Interfaces**: Start with "I" (IDeviceGateway)
- **Models**: Descriptive nouns (DeviceMessage, ConnectionStatus)
- **Constants**: PascalCase descriptive names
- **Methods**: Async methods end with "Async"

### Testing Your Changes

1. **Add to IoTConstants** if needed
2. **Create/update interface** with new method
3. **Create/update model** for data structure
4. **Write unit test** to verify interface works
5. **Update implementation** in Gateway/ProcessingEngine projects

---

## 🚀 Common Tasks

### Adding a New Message Type

1. Add constant in `IoTConstants.cs`:
```csharp
public const string Maintenance = "maintenance";
```

2. Update validation in implementations
3. Handle in processing logic

### Adding a New Device Property

1. Update `DeviceConnection.cs`:
```csharp
public string FirmwareVersion { get; set; }
```

2. Update all code that creates DeviceConnection objects

### Adding a New Command Type

1. Add constant in `IoTConstants.cs`
2. Update `DeviceCommand.cs` if needed
3. Implement handling in command processor

---

## 📝 Summary

**FMS.IoT.Contracts** is the foundation of the entire IoT system. It:

- ✅ **Defines the rules** everyone must follow
- ✅ **Ensures consistency** across all projects
- ✅ **Makes testing easier** with mockable interfaces
- ✅ **Prevents integration bugs** with shared models
- ✅ **Documents the system** through interface definitions

**Junior Engineer Takeaway**: Master this project first, and the rest of the system will make sense!

---

*Remember: Changes to contracts affect all other projects. Test thoroughly!*
