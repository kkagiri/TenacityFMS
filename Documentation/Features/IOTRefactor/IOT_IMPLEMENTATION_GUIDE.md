# IoT System Implementation Guide
## Following ISO/IEC 30141:2018 IoT Reference Architecture

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [ISO Standards Compliance](#iso-standards-compliance)
3. [Project Architecture](#project-architecture)
4. [FMS.IoT.Contracts Project](#fmsiotcontracts-project)
5. [FMS.IoT.Gateway Project](#fmsiotgateway-project)
6. [FMS.IoT.ProcessingEngine Project](#fmsiotprocessingengine-project)
7. [Data Flow](#data-flow)
8. [Getting Started for Junior Engineers](#getting-started-for-junior-engineers)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This IoT system implements a **fuel management solution** following international standards. Think of it like a smart system that:
- **Listens** to fuel devices (tanks, pumps, sensors)
- **Processes** their data (fuel levels, flow rates, alerts)
- **Responds** with commands (start pump, stop flow, send alerts)

### What Makes This Special?
- ✅ **ISO Compliant**: Follows international IoT standards
- ✅ **Scalable**: Can handle thousands of devices
- ✅ **Testable**: Easy to write tests for each component
- ✅ **Maintainable**: Clear structure makes changes easy

---

## 🏛️ ISO Standards Compliance

### ISO/IEC 30141:2018 IoT Reference Architecture

Our implementation maps to ISO layers as follows:

| ISO Layer | Our Implementation | Purpose |
|-----------|-------------------|---------|
| **Device Layer** | FMS.IoT.Gateway | Handles device connections and protocols |
| **Connectivity Layer** | Gateway Protocols | Manages WebSocket, HTTP, TCP connections |
| **Information Processing** | FMS.IoT.ProcessingEngine | Processes and transforms device data |
| **Application Layer** | FMS.Application (existing) | Business logic and fuel management |
| **Business Layer** | Business Services | Fuel management workflows |
| **Management & Security** | Cross-cutting concerns | Logging, monitoring, authentication |

### Why This Matters for Junior Engineers
- **Standards = Quality**: Following ISO standards means our code is enterprise-grade
- **Interoperability**: Other systems can easily integrate with ours
- **Future-Proof**: Standards evolve, so our system can evolve too
- **Documentation**: ISO provides clear guidelines on what each layer should do

---

## 🏗️ Project Architecture

```
Tenacy.Fms Solution
├── FMS.IoT.Contracts      ← Defines "what" (interfaces & models)
├── FMS.IoT.Gateway        ← Handles "device communication"
├── FMS.IoT.ProcessingEngine ← Handles "data processing"
└── Existing Projects      ← Business logic & web application
```

### Think of it Like a Restaurant:
- **Contracts** = Menu (what dishes are available)
- **Gateway** = Waiters (take orders from customers/devices)
- **ProcessingEngine** = Kitchen (processes orders into food)
- **Business Layer** = Manager (decides pricing, inventory, etc.)

---

## 📄 FMS.IoT.Contracts Project

### Purpose
**Defines the "rules of the game"** - all interfaces and data models that other projects must follow.

### 📁 Folder Structure Explained

#### 🌐 Common/
**What it is**: Shared utilities used everywhere
```
Common/
├── IoTConstants.cs         ← System-wide constants (like "websocket", "telemetry")
└── OperationResult.cs      ← Standard way to return success/failure
```

**Junior Engineer Note**: Think of Constants like a dictionary of terms everyone agrees to use.

#### 🔌 Gateway/
**What it is**: Everything related to device connections

```
Gateway/
├── Interfaces/                    ← "What" the gateway should do
│   ├── IDeviceGateway.cs         ← Main gateway operations
│   ├── IProtocolHandler.cs       ← Handle different protocols (WebSocket, HTTP)
│   ├── IConnectionManager.cs     ← Manage device connections
│   └── IDeviceConnection.cs      ← Individual device connection
└── Models/                        ← "How" data looks
    ├── DeviceConnection.cs        ← Info about a connected device
    ├── DeviceMessage.cs           ← Messages from/to devices
    ├── ConnectionStatus.cs        ← Connection states (Connected, Disconnected, etc.)
    ├── ValidationResult.cs        ← Result of message validation
    ├── ConnectionStatistics.cs    ← Connection monitoring data
    ├── GatewayStatus.cs          ← Gateway health info
    └── ProtocolConfiguration.cs   ← Protocol settings
```

**Real-World Example**:
```csharp
// DeviceMessage example - what a fuel tank might send
{
    "MessageId": "12345",
    "DeviceId": "TANK_001",
    "Protocol": "websocket",
    "MessageType": "telemetry",
    "Data": {
        "FuelLevel": 85.5,
        "Temperature": 22.3,
        "Timestamp": "2025-09-15T10:30:00Z"
    }
}
```

#### ⚙️ ProcessingEngine/
**What it is**: Everything related to processing device data

```
ProcessingEngine/
├── Interfaces/                    ← "What" the engine should do
│   ├── IMessageProcessor.cs      ← Process incoming messages
│   ├── IDataTransformer.cs       ← Transform data between formats
│   ├── IEventProcessor.cs        ← Handle events and notifications
│   ├── ICommandProcessor.cs      ← Execute commands to devices
│   └── IBatchProcessor.cs        ← Process multiple messages at once
└── Models/                        ← "How" data looks
    ├── DeviceCommand.cs           ← Commands to send to devices
    ├── ProcessingResult.cs        ← Result of processing a message
    ├── CommandResult.cs           ← Result of executing a command
    ├── ProcessingStatistics.cs    ← Processing performance metrics
    ├── EventStatistics.cs         ← Event processing metrics
    ├── ProcessingEvent.cs         ← Events generated during processing
    ├── ProcessingRequest.cs       ← Request to process data
    └── BatchProcessing.cs         ← Batch processing configurations
```

**Real-World Example**:
```csharp
// DeviceCommand example - telling a pump to start
{
    "CommandId": "CMD_789",
    "DeviceId": "PUMP_002",
    "CommandType": "start_pump",
    "Parameters": {
        "FlowRate": 50.0,
        "MaxVolume": 100.0
    }
}
```

---

## 🔌 FMS.IoT.Gateway Project

### Purpose
**The "front door" for all device communication** - handles connections and protocols.

### 📁 Folder Structure Explained

#### 🔧 Services/
```
Services/
└── DeviceGatewayService.cs ← Main gateway service (the "manager")
```

**What it does**:
- Starts/stops the gateway
- Accepts new device connections
- Routes messages between devices and processing engine
- Monitors gateway health

**Junior Engineer Analogy**: Like a hotel receptionist who greets guests, assigns rooms, and handles requests.

#### 🔗 Connection/
```
Connection/
├── ConnectionManager.cs         ← Manages all device connections
└── WebSocketDeviceConnection.cs ← Handles individual WebSocket connections
```

**What it does**:
- Keeps track of which devices are connected
- Monitors connection health
- Cleans up disconnected devices

**Real Example**: If Tank_001 disconnects, ConnectionManager removes it from the active list.

#### 📡 Protocols/
```
Protocols/
└── WebSocketProtocolHandler.cs ← Handles WebSocket communication
```

**What it does**:
- Parses incoming WebSocket messages
- Validates message format
- Converts messages to standard format

**Why Different Protocols**: Different devices speak different "languages":
- WebSocket: Real-time web communication
- HTTP: Request/response web communication
- TCP: Direct socket communication
- PTS: Custom fuel industry protocol

#### ⚙️ Configuration/
```
Configuration/
└── GatewayOptions.cs ← Gateway settings and options
```

**What it contains**:
- Maximum number of connections
- Timeout settings
- Protocol configurations
- Health check intervals

---

## ⚙️ FMS.IoT.ProcessingEngine Project

### Purpose
**The "brain" of the system** - processes all device data and makes decisions.

### 📁 Folder Structure Explained

#### 🔧 Services/
```
Services/
└── MessageProcessingService.cs ← Main processing service
```

**What it does**:
- Receives messages from Gateway
- Validates message content
- Routes to appropriate processor
- Tracks processing statistics

**Processing Flow Example**:
1. Receive: Tank sends fuel level data
2. Validate: Check if data format is correct
3. Process: Convert to business format
4. Action: If fuel low, trigger alert

#### 🔄 Transformers/
```
Transformers/
└── DataTransformerService.cs ← Converts data between formats
```

**What it does**:
- Converts device data to business objects
- Handles different data formats (JSON, XML, binary)
- Validates transformed data

**Real Example**:
```csharp
// Device sends: {"temp": 22.3}
// Transformed to: { Temperature: 22.3, Unit: "Celsius" }
```

#### 📢 Events/
```
Events/
└── EventProcessingService.cs ← Handles system events
```

**What it does**:
- Publishes events when things happen
- Manages event subscriptions
- Tracks event statistics

**Event Examples**:
- "Tank fuel level critical"
- "Pump started successfully"
- "Device disconnected"

#### 📋 Commands/
```
Commands/
└── CommandProcessingService.cs ← Executes commands to devices
```

**What it does**:
- Queues commands for devices
- Executes commands in order
- Tracks command results
- Handles retries for failed commands

**Command Flow**:
1. Business layer: "Start pump 002"
2. Command processor: Queue the command
3. Gateway: Send to device
4. Device: Execute and respond
5. Command processor: Record result

#### ⚙️ Configuration/
```
Configuration/
└── ProcessingEngineOptions.cs ← Processing engine settings
```

---

## 🔄 Data Flow

### High-Level Flow (Like a Post Office)

```
Device → Gateway → ProcessingEngine → Business Logic
  📱        📮          ⚙️              🏢
(Sender) (Post Office) (Sorting Center) (Recipient)
```

### Detailed Flow with Examples

#### 1. Device Sends Data
```
Fuel Tank → WebSocket → Gateway
"My fuel level is 85.5%"
```

#### 2. Gateway Processing
```
Gateway → ConnectionManager → ProtocolHandler
"Validate this WebSocket message"
```

#### 3. Message Processing
```
ProcessingEngine → MessageProcessor → DataTransformer
"Convert tank data to business format"
```

#### 4. Business Action
```
Business Logic → Command → Gateway → Device
"Fuel level OK, send acknowledgment"
```

---

## 🎓 Getting Started for Junior Engineers

### Step 1: Understanding the Basics

**Start with these files in order**:

1. **IoTConstants.cs** - Learn the vocabulary
2. **DeviceMessage.cs** - Understand message structure
3. **IDeviceGateway.cs** - See what the gateway does
4. **IMessageProcessor.cs** - See what processing does

### Step 2: Following a Message Journey

**Pick one message type and follow it through**:

1. Look at **DeviceMessage.cs** - what does a message contain?
2. Check **WebSocketProtocolHandler.cs** - how is it received?
3. See **MessageProcessingService.cs** - how is it processed?
4. Review **EventProcessingService.cs** - what events are generated?

### Step 3: Common Development Tasks

#### Adding a New Message Type

1. **Add constant** in `IoTConstants.cs`:
```csharp
public const string Maintenance = "maintenance";
```

2. **Handle in processor** in `MessageProcessingService.cs`:
```csharp
IoTConstants.MessageTypes.Maintenance => await ProcessMaintenanceMessageAsync(message, cancellationToken),
```

3. **Create processing method**:
```csharp
private async Task<ProcessingResult> ProcessMaintenanceMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
{
    // Your logic here
}
```

#### Adding a New Protocol

1. **Create protocol handler** in `Protocols/` folder
2. **Implement IProtocolHandler** interface
3. **Register in dependency injection**

### Step 4: Testing Your Changes

#### Unit Test Structure
```
MyFeature.Tests/
├── DeviceMessageTests.cs      ← Test message creation/validation
├── ProtocolHandlerTests.cs    ← Test protocol parsing
└── ProcessingServiceTests.cs  ← Test message processing
```

#### Example Test
```csharp
[Test]
public void DeviceMessage_WithValidData_ShouldBeValid()
{
    // Arrange
    var message = new DeviceMessage
    {
        DeviceId = "TANK_001",
        MessageType = IoTConstants.MessageTypes.Telemetry
    };

    // Act
    var isValid = ValidateMessage(message);

    // Assert
    Assert.IsTrue(isValid);
}
```

---

## 📚 Common Tasks

### 1. Adding a New Device Type

**Files to modify**:
- `IoTConstants.cs` - Add device type constant
- `DeviceConnection.cs` - Add device-specific properties if needed
- `MessageProcessingService.cs` - Add processing logic
- Create new protocol handler if needed

### 2. Adding Real-Time Alerts

**Files to modify**:
- `ProcessingEvent.cs` - Define alert event structure
- `EventProcessingService.cs` - Add alert publishing
- `MessageProcessingService.cs` - Trigger alerts during processing

### 3. Adding New Communication Protocol

**Steps**:
1. Create new protocol handler in `Protocols/` folder
2. Implement `IProtocolHandler` interface
3. Add protocol configuration in `GatewayOptions.cs`
4. Register in dependency injection

### 4. Performance Monitoring

**Built-in statistics**:
- `ConnectionStatistics.cs` - Connection metrics
- `ProcessingStatistics.cs` - Processing performance
- `EventStatistics.cs` - Event processing metrics

**How to use**:
```csharp
var stats = await _messageProcessor.GetStatisticsAsync();
Console.WriteLine($"Processed: {stats.TotalMessagesProcessed}");
Console.WriteLine($"Success Rate: {stats.ProcessingSuccessRate}%");
```

---

## 🔧 Troubleshooting

### Common Issues for Junior Engineers

#### 1. "Interface not found" Error
**Problem**: Dependency injection not configured
**Solution**: Make sure interfaces are registered in `Program.cs`

```csharp
builder.Services.AddScoped<IDeviceGateway, DeviceGatewayService>();
```

#### 2. Messages Not Processing
**Problem**: Message type not handled
**Solution**: Check `MessageProcessingService.cs` switch statement

#### 3. Device Not Connecting
**Problem**: Protocol handler not found
**Solution**: Verify protocol handler is registered and protocol name matches

#### 4. Performance Issues
**Problem**: Too many concurrent operations
**Solution**: Check configuration limits in Options files

### Debugging Tips

#### 1. Use Logging
```csharp
_logger.LogInformation("Processing message {MessageId} from device {DeviceId}",
    message.MessageId, message.DeviceId);
```

#### 2. Check Statistics
```csharp
var stats = await _processingService.GetStatisticsAsync();
if (stats.FailedProcessing > 0)
{
    // Investigate failed messages
}
```

#### 3. Monitor Health
```csharp
var gatewayStatus = await _gateway.GetStatusAsync();
if (gatewayStatus.Health != GatewayHealth.Healthy)
{
    // Check what's wrong
}
```

---

## 🚀 Next Steps

### For Junior Engineers
1. **Read this documentation completely**
2. **Study one project at a time** (start with Contracts)
3. **Write simple unit tests** for understanding
4. **Make small changes** to see how system responds
5. **Ask questions** about anything unclear

### For Development
1. **Implement real device protocols** (replace TODO comments)
2. **Add authentication** and security
3. **Implement persistent storage** (replace in-memory collections)
4. **Add comprehensive monitoring** and alerting
5. **Performance optimization** based on load testing

---

## 📝 Summary

This IoT system follows **ISO/IEC 30141:2018** standards and provides:

- ✅ **Clear separation** of device communication and data processing
- ✅ **Scalable architecture** that can grow with your needs
- ✅ **Easy testing** with interface-based design
- ✅ **Comprehensive monitoring** and statistics
- ✅ **Junior-friendly structure** with clear responsibilities

**Remember**: Start small, understand one piece at a time, and don't hesitate to ask questions!

---

*This documentation is maintained by the development team. Please update it when making architectural changes.*
