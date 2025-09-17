# FMS.IoT.Gateway Project Documentation

## 🎯 Project Overview

**Purpose**: The "front door" of the IoT system - handles all device connections and communication protocols.

**What it Does**:
- Accepts connections from fuel devices (tanks, pumps, sensors)
- Manages different communication protocols (WebSocket, HTTP, TCP)
- Routes messages between devices and the processing engine
- Monitors connection health and performance

**Real-World Analogy**: Like a hotel reception desk that welcomes guests, assigns rooms, handles requests, and keeps track of who's staying where.

---

## 📁 File Structure & Purpose

### 🔧 Services Folder

#### DeviceGatewayService.cs
**What it is**: The main service that orchestrates the entire gateway

**Key Responsibilities**:
- Starting/stopping the gateway
- Coordinating connection manager and protocol handlers
- Health monitoring
- Message routing between devices and processing engine

**Key Methods**:
```csharp
public async Task StartAsync(CancellationToken cancellationToken)
// Starts accepting device connections

public async Task StopAsync(CancellationToken cancellationToken)
// Gracefully shuts down all connections

public async Task<GatewayStatus> GetStatusAsync(CancellationToken cancellationToken)
// Returns gateway health and statistics

public async Task BroadcastMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
// Sends message to all connected devices
```

**Startup Flow**:
1. Initialize connection manager
2. Register protocol handlers
3. Start listening for connections
4. Begin health monitoring

**Junior Engineer Tip**: This is like the "manager" of the gateway - it coordinates everything but doesn't do the detailed work itself.

---

### 🔗 Connection Folder

#### ConnectionManager.cs
**What it is**: Manages all active device connections

**Key Responsibilities**:
- Tracking connected devices
- Connection lifecycle management (add/remove/update)
- Connection health monitoring
- Statistics collection

**Key Methods**:
```csharp
public async Task<OperationResult> AddConnectionAsync(DeviceConnection connection)
// Registers a new device connection

public async Task<OperationResult> RemoveConnectionAsync(string deviceId)
// Removes and cleans up a device connection

public async Task<DeviceConnection?> GetConnectionAsync(string deviceId)
// Finds a specific device connection

public async Task<IEnumerable<DeviceConnection>> GetAllConnectionsAsync()
// Returns all active connections

public async Task<ConnectionStatistics> GetStatisticsAsync()
// Returns connection metrics and performance data
```

**Data Structures**:
```csharp
// In-memory storage (replace with database in production)
private readonly ConcurrentDictionary<string, DeviceConnection> _connections;
private readonly ConcurrentDictionary<string, DateTime> _lastHeartbeat;
```

**Connection Lifecycle**:
1. Device connects → `AddConnectionAsync()`
2. Regular heartbeats → Update last seen time
3. Connection lost → `RemoveConnectionAsync()`
4. Cleanup resources → Memory/handles freed

#### WebSocketDeviceConnection.cs
**What it is**: Handles individual WebSocket connections to devices

**Key Responsibilities**:
- Managing WebSocket connection state
- Sending/receiving messages over WebSocket
- Connection-specific error handling
- Message queuing for reliable delivery

**Key Methods**:
```csharp
public async Task<OperationResult> SendMessageAsync(DeviceMessage message)
// Sends message to the connected device

public async Task<DeviceMessage?> ReceiveMessageAsync(CancellationToken cancellationToken)
// Waits for and receives message from device

public async Task DisconnectAsync()
// Gracefully closes the WebSocket connection

public async Task<ConnectionStatistics> GetStatisticsAsync()
// Returns connection-specific metrics
```

**WebSocket Features**:
- Automatic reconnection on connection drops
- Message queuing during temporary disconnections
- Heartbeat/ping-pong for connection monitoring
- Binary and text message support

**Error Handling**:
```csharp
// Example error scenarios
- Network timeout → Retry with exponential backoff
- Invalid message format → Log error, request resend
- Authentication failure → Close connection, notify admin
- Buffer overflow → Throttle messages, alert monitoring
```

---

### 📡 Protocols Folder

#### WebSocketProtocolHandler.cs
**What it is**: Handles WebSocket-specific message parsing and formatting

**Key Responsibilities**:
- Converting WebSocket frames to DeviceMessage objects
- Validating incoming message format
- Formatting outgoing messages for WebSocket transmission
- Protocol-specific error handling

**Key Methods**:
```csharp
public bool CanHandle(string protocol)
// Returns true if this handler supports the given protocol

public async Task<DeviceMessage?> ParseMessageAsync(byte[] rawData, string deviceId)
// Converts raw WebSocket data to DeviceMessage

public async Task<byte[]> FormatResponseAsync(DeviceMessage message)
// Converts DeviceMessage to WebSocket frame format

public async Task<ValidationResult> ValidateMessageAsync(DeviceMessage message)
// Validates message structure and content
```

**Message Flow**:
```
Raw WebSocket Frame → ParseMessageAsync() → DeviceMessage → Processing Engine
Processing Engine → DeviceMessage → FormatResponseAsync() → WebSocket Frame
```

**Supported WebSocket Features**:
- JSON message format (extensible to binary)
- Message compression (if enabled)
- Automatic heartbeat/keepalive
- Error message formatting

**Protocol Validation**:
```csharp
// Example validation checks
- Required fields present (DeviceId, MessageType, Timestamp)
- Valid message type (telemetry, command, status, alert)
- Reasonable timestamp (not too old/future)
- Data payload within size limits
- Device ID matches connection
```

**Junior Engineer Note**: Each protocol (WebSocket, HTTP, TCP) needs its own handler. They all implement the same `IProtocolHandler` interface but handle the specifics of their protocol.

---

### ⚙️ Configuration Folder

#### GatewayOptions.cs
**What it is**: Configuration settings for the entire gateway

**Key Settings**:
```csharp
public class GatewayOptions
{
    // Connection limits
    public int MaxConcurrentConnections { get; set; } = 1000;
    public TimeSpan ConnectionTimeout { get; set; } = TimeSpan.FromMinutes(5);
    public TimeSpan HeartbeatInterval { get; set; } = TimeSpan.FromSeconds(30);

    // Message handling
    public int MaxMessageSize { get; set; } = 1024 * 1024; // 1MB
    public int MessageQueueSize { get; set; } = 100;
    public TimeSpan MessageTimeout { get; set; } = TimeSpan.FromSeconds(30);

    // Health monitoring
    public TimeSpan HealthCheckInterval { get; set; } = TimeSpan.FromMinutes(1);
    public TimeSpan StatisticsInterval { get; set; } = TimeSpan.FromMinutes(5);

    // Protocol settings
    public Dictionary<string, object> ProtocolSettings { get; set; } = new();

    // Security (for future implementation)
    public bool RequireAuthentication { get; set; } = false;
    public string[] AllowedDeviceTypes { get; set; } = Array.Empty<string>();
}
```

**Configuration Usage**:
```csharp
// In Program.cs or Startup.cs
builder.Services.Configure<GatewayOptions>(
    builder.Configuration.GetSection("Gateway"));

// In service constructor
public DeviceGatewayService(IOptions<GatewayOptions> options)
{
    _options = options.Value;
}
```

**Environment-Specific Settings**:
- **Development**: Low connection limits, verbose logging
- **Testing**: Mock protocols, deterministic timeouts
- **Production**: High limits, optimized settings

---

## 🔄 How Components Work Together

### Connection Flow
```
1. Device connects → WebSocketDeviceConnection created
2. ConnectionManager.AddConnectionAsync() → Device registered
3. WebSocketProtocolHandler.CanHandle() → Protocol validated
4. Device sends message → WebSocketProtocolHandler.ParseMessageAsync()
5. DeviceMessage created → Sent to ProcessingEngine
6. Response from ProcessingEngine → WebSocketProtocolHandler.FormatResponseAsync()
7. Response sent → WebSocketDeviceConnection.SendMessageAsync()
```

### Dependency Injection Setup
```csharp
// Program.cs
builder.Services.Configure<GatewayOptions>(builder.Configuration.GetSection("Gateway"));
builder.Services.AddSingleton<IConnectionManager, ConnectionManager>();
builder.Services.AddSingleton<IProtocolHandler, WebSocketProtocolHandler>();
builder.Services.AddSingleton<IDeviceGateway, DeviceGatewayService>();
```

### Error Handling Strategy
```csharp
// Layered error handling
DeviceConnection → Protocol Handler → Connection Manager → Gateway Service

// Each layer handles appropriate errors:
- DeviceConnection: Network/transport errors
- Protocol Handler: Message format errors
- Connection Manager: Connection lifecycle errors
- Gateway Service: System-wide errors
```

---

## 🎓 Junior Engineer Guidelines

### Understanding the Architecture

**Think of it like a restaurant**:
- **Gateway Service** = Restaurant Manager (oversees everything)
- **Connection Manager** = Host/Hostess (seats guests, tracks tables)
- **Protocol Handlers** = Translators (convert different languages)
- **Device Connections** = Individual waiters (serve specific tables)

### Adding a New Protocol

1. **Create Protocol Handler**:
```csharp
public class HttpProtocolHandler : IProtocolHandler
{
    public bool CanHandle(string protocol) => protocol == "http";

    public async Task<DeviceMessage?> ParseMessageAsync(byte[] rawData, string deviceId)
    {
        // Parse HTTP request to DeviceMessage
    }

    // Implement other interface methods...
}
```

2. **Register in DI**:
```csharp
builder.Services.AddSingleton<IProtocolHandler, HttpProtocolHandler>();
```

3. **Update Configuration**:
```csharp
// Add HTTP-specific settings to GatewayOptions
public HttpProtocolSettings HttpSettings { get; set; } = new();
```

### Testing Your Changes

#### Unit Testing Structure
```
Gateway.Tests/
├── Services/
│   └── DeviceGatewayServiceTests.cs
├── Connection/
│   ├── ConnectionManagerTests.cs
│   └── WebSocketDeviceConnectionTests.cs
└── Protocols/
    └── WebSocketProtocolHandlerTests.cs
```

#### Example Test
```csharp
[Test]
public async Task AddConnectionAsync_ValidConnection_ShouldSucceed()
{
    // Arrange
    var connectionManager = new ConnectionManager(Options.Create(new GatewayOptions()));
    var connection = new DeviceConnection
    {
        DeviceId = "TEST_001",
        Protocol = "websocket"
    };

    // Act
    var result = await connectionManager.AddConnectionAsync(connection);

    // Assert
    Assert.IsTrue(result.IsSuccess);

    var retrieved = await connectionManager.GetConnectionAsync("TEST_001");
    Assert.IsNotNull(retrieved);
    Assert.AreEqual("TEST_001", retrieved.DeviceId);
}
```

### Performance Considerations

#### Memory Management
```csharp
// Use ConcurrentDictionary for thread-safe collections
private readonly ConcurrentDictionary<string, DeviceConnection> _connections;

// Dispose connections properly
public async Task RemoveConnectionAsync(string deviceId)
{
    if (_connections.TryRemove(deviceId, out var connection))
    {
        await connection.DisconnectAsync(); // Cleanup resources
    }
}
```

#### Scalability Tips
- Use connection pooling for high-frequency connections
- Implement message batching for better throughput
- Consider using channels for producer-consumer scenarios
- Monitor memory usage and implement connection limits

---

## 🚀 Common Tasks

### 1. Adding Connection Monitoring

```csharp
// In ConnectionManager.cs
public async Task MonitorConnectionsAsync(CancellationToken cancellationToken)
{
    while (!cancellationToken.IsCancellationRequested)
    {
        var staleConnections = _connections.Values
            .Where(c => DateTime.UtcNow - c.LastHeartbeat > _options.ConnectionTimeout)
            .ToList();

        foreach (var connection in staleConnections)
        {
            await RemoveConnectionAsync(connection.DeviceId);
            _logger.LogWarning("Removed stale connection: {DeviceId}", connection.DeviceId);
        }

        await Task.Delay(_options.HealthCheckInterval, cancellationToken);
    }
}
```

### 2. Implementing Message Queuing

```csharp
// In WebSocketDeviceConnection.cs
private readonly Channel<DeviceMessage> _messageQueue;

public async Task<OperationResult> SendMessageAsync(DeviceMessage message)
{
    if (!_messageQueue.Writer.TryWrite(message))
    {
        return OperationResult.Failure("Message queue full");
    }

    return OperationResult.Success("Message queued");
}
```

### 3. Adding Protocol-Specific Configuration

```csharp
// In GatewayOptions.cs
public WebSocketProtocolSettings WebSocketSettings { get; set; } = new();

public class WebSocketProtocolSettings
{
    public int MaxFrameSize { get; set; } = 1024 * 1024;
    public bool EnableCompression { get; set; } = true;
    public TimeSpan PingInterval { get; set; } = TimeSpan.FromSeconds(30);
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Too many connections" Error
**Problem**: Exceeded MaxConcurrentConnections limit
**Solution**: Increase limit in configuration or implement connection pooling

#### 2. Messages Not Reaching Devices
**Problem**: Protocol handler not registered or wrong protocol
**Solution**: Check DI registration and protocol names match exactly

#### 3. Memory Leaks
**Problem**: Connections not properly disposed
**Solution**: Ensure all IDisposable resources are properly disposed

#### 4. High CPU Usage
**Problem**: Too frequent heartbeat/monitoring
**Solution**: Increase intervals in GatewayOptions

### Debugging Tips

```csharp
// Add extensive logging
_logger.LogDebug("Processing message {MessageId} from device {DeviceId}",
    message.MessageId, message.DeviceId);

// Monitor statistics
var stats = await _connectionManager.GetStatisticsAsync();
_logger.LogInformation("Active connections: {Count}, Total processed: {Total}",
    stats.ActiveConnections, stats.TotalMessagesProcessed);

// Use structured logging for better filtering
_logger.LogError("Connection failed for device {DeviceId} with error {Error}",
    deviceId, ex.Message);
```

---

## 📝 Summary

**FMS.IoT.Gateway** is the communication hub of the IoT system. It:

- ✅ **Manages device connections** efficiently and reliably
- ✅ **Supports multiple protocols** through pluggable handlers
- ✅ **Monitors health** and provides statistics
- ✅ **Handles errors gracefully** with proper logging
- ✅ **Scales** to handle many concurrent connections

**Junior Engineer Takeaway**: Start by understanding the main flow (device connects → sends message → processes → responds), then dive into specific components.

---

*Remember: The gateway is critical infrastructure - test thoroughly and monitor in production!*
