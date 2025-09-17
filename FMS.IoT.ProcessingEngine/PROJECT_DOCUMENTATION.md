# FMS.IoT.ProcessingEngine Project Documentation

## 🎯 Project Overview

**Purpose**: The "brain" of the IoT system - processes all device data, transforms it into business-friendly formats, generates events, and executes commands.

**What it Does**:
- Receives messages from the Gateway
- Validates and transforms device data
- Generates business events and alerts
- Executes commands to control devices
- Tracks processing performance and statistics

**Real-World Analogy**: Like a smart factory that receives raw materials (device data), processes them into finished products (business information), and sends instructions back to the production line (device commands).

---

## 📁 File Structure & Purpose

### 🔧 Services Folder

#### MessageProcessingService.cs
**What it is**: The main orchestrator for all message processing

**Key Responsibilities**:
- Receives DeviceMessage objects from Gateway
- Routes messages to appropriate processors based on type
- Coordinates between data transformation, event processing, and command execution
- Tracks processing statistics and performance metrics

**Key Methods**:
```csharp
public async Task<ProcessingResult> ProcessMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
// Main entry point - processes a single device message

public async Task<IEnumerable<ProcessingResult>> ProcessBatchAsync(IEnumerable<DeviceMessage> messages, CancellationToken cancellationToken)
// Efficiently processes multiple messages at once

public async Task<ProcessingStatistics> GetStatisticsAsync(CancellationToken cancellationToken)
// Returns processing performance metrics

public async Task<bool> ValidateMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
// Validates message before processing
```

**Processing Flow**:
```
DeviceMessage → Validation → Route by Type → Process → Generate Events → Execute Commands → Return Result
```

**Message Type Routing**:
```csharp
// Example routing logic
switch (message.MessageType)
{
    case IoTConstants.MessageTypes.Telemetry:
        return await ProcessTelemetryMessageAsync(message, cancellationToken);

    case IoTConstants.MessageTypes.Status:
        return await ProcessStatusMessageAsync(message, cancellationToken);

    case IoTConstants.MessageTypes.Alert:
        return await ProcessAlertMessageAsync(message, cancellationToken);

    default:
        return ProcessingResult.Failure($"Unknown message type: {message.MessageType}");
}
```

**Junior Engineer Tip**: Think of this service as a traffic controller that directs different types of messages to the right processing lanes.

---

### 🔄 Transformers Folder

#### DataTransformerService.cs
**What it is**: Converts device data into business-friendly formats

**Key Responsibilities**:
- Transforms raw device data into structured business objects
- Handles different data formats (JSON, XML, binary, custom protocols)
- Validates transformed data for business rules
- Applies unit conversions and normalization

**Key Methods**:
```csharp
public async Task<T> TransformAsync<T>(DeviceMessage message, CancellationToken cancellationToken) where T : class
// Transforms device message data to specified business type

public async Task<ValidationResult> ValidateTransformedDataAsync<T>(T data, CancellationToken cancellationToken) where T : class
// Validates business object meets requirements

public async Task<IEnumerable<string>> GetSupportedFormatsAsync(CancellationToken cancellationToken)
// Returns list of supported data formats

public async Task<object> NormalizeDataAsync(object rawData, string sourceFormat, CancellationToken cancellationToken)
// Converts data to standard internal format
```

**Transformation Examples**:

**Fuel Tank Telemetry**:
```csharp
// Raw device data
{
    "lvl": 85.5,        // Fuel level percentage
    "tmp": 22.3,        // Temperature in Celsius
    "prs": 14.7,        // Pressure in PSI
    "ts": 1736975400    // Unix timestamp
}

// Transformed business object
public class FuelTankReading
{
    public double FuelLevelPercentage { get; set; } = 85.5;
    public Temperature Temperature { get; set; } = new(22.3, TemperatureUnit.Celsius);
    public Pressure Pressure { get; set; } = new(14.7, PressureUnit.PSI);
    public DateTime ReadingTime { get; set; } = DateTime.FromUnixTimeSeconds(1736975400);
    public string DeviceId { get; set; } = "TANK_001";
    public TankStatus Status { get; set; } = TankStatus.Normal;
}
```

**Pump Command**:
```csharp
// Business command
var command = new StartPumpCommand
{
    PumpId = "PUMP_002",
    FlowRate = 50.0, // Gallons per minute
    MaxVolume = 100.0, // Maximum gallons to pump
    EmergencyStopEnabled = true
};

// Transformed device command
{
    "cmd": "start",
    "flow": 50.0,
    "max_vol": 100.0,
    "e_stop": true,
    "timeout": 3600
}
```

**Data Validation Rules**:
```csharp
// Business validation examples
- Fuel level: 0-100%
- Temperature: -40°C to 80°C
- Pressure: 0-50 PSI
- Timestamps: Within last hour
- Device IDs: Must be registered
```

---

### 📢 Events Folder

#### EventProcessingService.cs
**What it is**: Manages system events, notifications, and business rule triggers

**Key Responsibilities**:
- Publishes events when significant things happen
- Manages event subscriptions and routing
- Applies business rules to trigger alerts
- Maintains event history for auditing

**Key Methods**:
```csharp
public async Task PublishEventAsync(ProcessingEvent eventData, CancellationToken cancellationToken)
// Publishes event to all subscribers

public async Task<OperationResult> SubscribeAsync(string eventType, Func<ProcessingEvent, Task> handler, CancellationToken cancellationToken)
// Subscribes to specific event types

public async Task<IEnumerable<ProcessingEvent>> GetEventHistoryAsync(string deviceId, TimeSpan timeRange, CancellationToken cancellationToken)
// Retrieves event history for debugging/auditing

public async Task<EventStatistics> GetStatisticsAsync(CancellationToken cancellationToken)
// Returns event processing metrics
```

**Event Types and Triggers**:

**Critical Alerts**:
```csharp
// Fuel level critical (< 10%)
var criticalEvent = new ProcessingEvent
{
    EventType = "FuelLevelCritical",
    DeviceId = "TANK_001",
    Severity = EventSeverity.Critical,
    Data = new { CurrentLevel = 8.5, ThresholdLevel = 10.0 },
    Timestamp = DateTime.UtcNow
};
```

**Maintenance Alerts**:
```csharp
// Pump maintenance due
var maintenanceEvent = new ProcessingEvent
{
    EventType = "MaintenanceDue",
    DeviceId = "PUMP_002",
    Severity = EventSeverity.Warning,
    Data = new { LastMaintenance = DateTime.Parse("2024-12-01"), NextDue = DateTime.Parse("2025-01-01") }
};
```

**Performance Alerts**:
```csharp
// High processing latency
var performanceEvent = new ProcessingEvent
{
    EventType = "HighLatency",
    Severity = EventSeverity.Warning,
    Data = new { AverageLatency = 2500, ThresholdLatency = 1000 } // milliseconds
};
```

**Business Rules Engine**:
```csharp
// Example business rules
private async Task ApplyBusinessRulesAsync(FuelTankReading reading)
{
    // Critical fuel level
    if (reading.FuelLevelPercentage < 10)
    {
        await PublishEventAsync(new ProcessingEvent
        {
            EventType = "FuelLevelCritical",
            Severity = EventSeverity.Critical
        });
    }

    // Temperature warning
    if (reading.Temperature.Celsius > 60)
    {
        await PublishEventAsync(new ProcessingEvent
        {
            EventType = "HighTemperature",
            Severity = EventSeverity.Warning
        });
    }

    // Schedule maintenance
    if (reading.OperatingHours > 1000)
    {
        await PublishEventAsync(new ProcessingEvent
        {
            EventType = "MaintenanceDue",
            Severity = EventSeverity.Info
        });
    }
}
```

---

### 📋 Commands Folder

#### CommandProcessingService.cs
**What it is**: Executes commands sent to devices and tracks their results

**Key Responsibilities**:
- Queues commands for execution
- Sends commands to devices via Gateway
- Tracks command execution status and results
- Handles retries for failed commands
- Provides command execution statistics

**Key Methods**:
```csharp
public async Task<CommandResult> ExecuteCommandAsync(DeviceCommand command, CancellationToken cancellationToken)
// Immediately executes a command and waits for result

public async Task<OperationResult> QueueCommandAsync(DeviceCommand command, CancellationToken cancellationToken)
// Adds command to execution queue for later processing

public async Task<CommandResult?> GetCommandStatusAsync(string commandId, CancellationToken cancellationToken)
// Checks the status of a previously queued command

public async Task<OperationResult> CancelCommandAsync(string commandId, CancellationToken cancellationToken)
// Cancels a pending or executing command
```

**Command Execution Flow**:
```
Business Logic → Create DeviceCommand → Queue Command → Execute → Wait for Response → Return Result
```

**Command Types and Examples**:

**Pump Control**:
```csharp
var startPumpCommand = new DeviceCommand
{
    CommandId = Guid.NewGuid().ToString(),
    DeviceId = "PUMP_002",
    CommandType = "start_pump",
    Parameters = new Dictionary<string, object>
    {
        ["flow_rate"] = 50.0,  // GPM
        ["max_volume"] = 100.0, // Gallons
        ["timeout"] = 3600      // Seconds
    },
    Timeout = TimeSpan.FromMinutes(5)
};
```

**Valve Control**:
```csharp
var closeValveCommand = new DeviceCommand
{
    CommandId = Guid.NewGuid().ToString(),
    DeviceId = "VALVE_003",
    CommandType = "close_valve",
    Parameters = new Dictionary<string, object>
    {
        ["position"] = 0,       // 0 = closed, 100 = fully open
        ["speed"] = "slow"      // Closing speed
    }
};
```

**System Commands**:
```csharp
var diagnosticsCommand = new DeviceCommand
{
    CommandId = Guid.NewGuid().ToString(),
    DeviceId = "TANK_001",
    CommandType = "run_diagnostics",
    Parameters = new Dictionary<string, object>
    {
        ["test_type"] = "full", // full, quick, sensors_only
        ["save_results"] = true
    }
};
```

**Command Queue Management**:
```csharp
// Priority queue for critical commands
public enum CommandPriority
{
    Emergency = 0,    // Emergency stop, safety commands
    High = 1,         // Operational commands
    Normal = 2,       // Regular operations
    Low = 3          // Maintenance, diagnostics
}

// Retry logic for failed commands
private async Task<CommandResult> ExecuteWithRetryAsync(DeviceCommand command)
{
    int maxRetries = 3;
    TimeSpan delay = TimeSpan.FromSeconds(1);

    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        var result = await ExecuteCommandAsync(command);

        if (result.IsSuccess || !ShouldRetry(result.ErrorType))
            return result;

        if (attempt < maxRetries)
            await Task.Delay(delay * attempt); // Exponential backoff
    }

    return CommandResult.Failure("Max retries exceeded");
}
```

---

### ⚙️ Configuration Folder

#### ProcessingEngineOptions.cs
**What it is**: Configuration settings for the entire processing engine

**Key Settings**:
```csharp
public class ProcessingEngineOptions
{
    // Message processing
    public int MaxConcurrentProcessing { get; set; } = 100;
    public TimeSpan ProcessingTimeout { get; set; } = TimeSpan.FromSeconds(30);
    public int MessageBatchSize { get; set; } = 10;

    // Event processing
    public TimeSpan EventRetentionPeriod { get; set; } = TimeSpan.FromDays(30);
    public int MaxEventsInMemory { get; set; } = 1000;
    public bool EnableEventHistory { get; set; } = true;

    // Command processing
    public int MaxQueuedCommands { get; set; } = 500;
    public TimeSpan DefaultCommandTimeout { get; set; } = TimeSpan.FromMinutes(5);
    public int CommandRetryAttempts { get; set; } = 3;

    // Performance monitoring
    public TimeSpan StatisticsInterval { get; set; } = TimeSpan.FromMinutes(1);
    public bool EnableDetailedMetrics { get; set; } = false;

    // Business rules
    public Dictionary<string, object> BusinessRuleSettings { get; set; } = new();
    public bool EnableRealTimeProcessing { get; set; } = true;
}
```

**Configuration Examples**:
```csharp
// Development settings
{
    "ProcessingEngine": {
        "MaxConcurrentProcessing": 10,
        "ProcessingTimeout": "00:00:10",
        "EnableDetailedMetrics": true,
        "BusinessRuleSettings": {
            "FuelLevelCriticalThreshold": 5.0,
            "TemperatureWarningThreshold": 50.0
        }
    }
}

// Production settings
{
    "ProcessingEngine": {
        "MaxConcurrentProcessing": 1000,
        "ProcessingTimeout": "00:01:00",
        "EnableDetailedMetrics": false,
        "BusinessRuleSettings": {
            "FuelLevelCriticalThreshold": 10.0,
            "TemperatureWarningThreshold": 60.0
        }
    }
}
```

---

## 🔄 How Components Work Together

### Complete Processing Flow

```
1. Gateway → ProcessingEngine → MessageProcessingService.ProcessMessageAsync()
2. MessageProcessingService → DataTransformerService.TransformAsync()
3. Transformed Data → EventProcessingService.ApplyBusinessRules()
4. Business Rules → EventProcessingService.PublishEventAsync() (if needed)
5. Events → CommandProcessingService.QueueCommandAsync() (if action required)
6. Commands → Gateway → Device
7. Device Response → CommandProcessingService.UpdateCommandStatus()
8. Results → Business Layer (via events/callbacks)
```

### Data Flow Example

**Scenario**: Fuel tank reports low fuel level

```csharp
// 1. Device Message (from Gateway)
var message = new DeviceMessage
{
    DeviceId = "TANK_001",
    MessageType = "telemetry",
    Data = new Dictionary<string, object> { ["fuel_level"] = 8.5 }
};

// 2. Transform to Business Object
var reading = await _dataTransformer.TransformAsync<FuelTankReading>(message);

// 3. Apply Business Rules
if (reading.FuelLevelPercentage < 10)
{
    // 4. Generate Critical Event
    await _eventProcessor.PublishEventAsync(new ProcessingEvent
    {
        EventType = "FuelLevelCritical",
        Severity = EventSeverity.Critical,
        DeviceId = "TANK_001"
    });

    // 5. Queue Emergency Command
    await _commandProcessor.QueueCommandAsync(new DeviceCommand
    {
        DeviceId = "PUMP_002",
        CommandType = "emergency_stop",
        Priority = CommandPriority.Emergency
    });
}

// 6. Return Processing Result
return ProcessingResult.Success($"Processed fuel level reading: {reading.FuelLevelPercentage}%");
```

---

## 🎓 Junior Engineer Guidelines

### Understanding the Processing Pipeline

**Think of it like a smart factory assembly line**:
- **MessageProcessingService** = Factory Manager (directs work)
- **DataTransformerService** = Quality Control (standardizes products)
- **EventProcessingService** = Notification System (alerts when issues occur)
- **CommandProcessingService** = Automation Controller (sends instructions to machines)

### Adding New Message Types

1. **Add to Constants** (in Contracts project):
```csharp
public const string Maintenance = "maintenance";
```

2. **Handle in MessageProcessingService**:
```csharp
case IoTConstants.MessageTypes.Maintenance:
    return await ProcessMaintenanceMessageAsync(message, cancellationToken);
```

3. **Create Processing Method**:
```csharp
private async Task<ProcessingResult> ProcessMaintenanceMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
{
    // Transform data
    var maintenanceData = await _dataTransformer.TransformAsync<MaintenanceReport>(message, cancellationToken);

    // Apply business logic
    if (maintenanceData.RequiresAttention)
    {
        await _eventProcessor.PublishEventAsync(new ProcessingEvent
        {
            EventType = "MaintenanceRequired",
            Severity = EventSeverity.Warning,
            DeviceId = message.DeviceId
        }, cancellationToken);
    }

    return ProcessingResult.Success("Maintenance message processed");
}
```

### Creating Business Rules

```csharp
// In EventProcessingService.cs
private async Task<bool> EvaluateBusinessRules(object data, string deviceId)
{
    var rules = new List<IBusinessRule>
    {
        new FuelLevelRule(),
        new TemperatureRule(),
        new PressureRule(),
        new MaintenanceRule()
    };

    foreach (var rule in rules)
    {
        if (await rule.EvaluateAsync(data, deviceId))
        {
            await rule.ExecuteActionAsync(data, deviceId);
        }
    }

    return true;
}

// Example business rule
public class FuelLevelRule : IBusinessRule
{
    public async Task<bool> EvaluateAsync(object data, string deviceId)
    {
        if (data is FuelTankReading reading)
        {
            return reading.FuelLevelPercentage < 10.0;
        }
        return false;
    }

    public async Task ExecuteActionAsync(object data, string deviceId)
    {
        // Send critical alert
        // Queue emergency response commands
        // Notify operations team
    }
}
```

### Performance Optimization Tips

#### Batch Processing
```csharp
// Process multiple messages efficiently
public async Task<IEnumerable<ProcessingResult>> ProcessBatchAsync(IEnumerable<DeviceMessage> messages, CancellationToken cancellationToken)
{
    var tasks = messages.Select(async message =>
    {
        try
        {
            return await ProcessMessageAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            return ProcessingResult.Failure($"Processing failed: {ex.Message}");
        }
    });

    return await Task.WhenAll(tasks);
}
```

#### Caching Frequently Used Data
```csharp
// Cache device configurations
private readonly MemoryCache _deviceConfigCache = new();

private async Task<DeviceConfiguration> GetDeviceConfigAsync(string deviceId)
{
    if (_deviceConfigCache.TryGetValue(deviceId, out DeviceConfiguration? config))
    {
        return config;
    }

    config = await LoadDeviceConfigurationAsync(deviceId);
    _deviceConfigCache.Set(deviceId, config, TimeSpan.FromMinutes(15));
    return config;
}
```

---

## 🚀 Common Tasks

### 1. Adding Real-Time Monitoring

```csharp
// In MessageProcessingService.cs
private readonly IMetrics _metrics;

public async Task<ProcessingResult> ProcessMessageAsync(DeviceMessage message, CancellationToken cancellationToken)
{
    var stopwatch = Stopwatch.StartNew();

    try
    {
        var result = await ProcessMessageInternalAsync(message, cancellationToken);

        // Record metrics
        _metrics.RecordProcessingTime(stopwatch.ElapsedMilliseconds);
        _metrics.IncrementCounter("messages_processed_total");

        return result;
    }
    catch (Exception ex)
    {
        _metrics.IncrementCounter("messages_failed_total");
        throw;
    }
}
```

### 2. Implementing Data Validation

```csharp
// In DataTransformerService.cs
public async Task<ValidationResult> ValidateTransformedDataAsync<T>(T data, CancellationToken cancellationToken) where T : class
{
    var errors = new List<string>();
    var warnings = new List<string>();

    if (data is FuelTankReading reading)
    {
        if (reading.FuelLevelPercentage < 0 || reading.FuelLevelPercentage > 100)
            errors.Add("Fuel level must be between 0 and 100%");

        if (reading.Temperature.Celsius < -40 || reading.Temperature.Celsius > 80)
            warnings.Add("Temperature outside normal operating range");
    }

    return new ValidationResult
    {
        IsValid = errors.Count == 0,
        Errors = errors,
        Warnings = warnings
    };
}
```

### 3. Creating Custom Event Handlers

```csharp
// Register event handler
await _eventProcessor.SubscribeAsync("FuelLevelCritical", async (eventData) =>
{
    // Send email notification
    await _notificationService.SendEmailAsync("ops@company.com",
        $"CRITICAL: Low fuel in {eventData.DeviceId}");

    // Create maintenance ticket
    await _maintenanceService.CreateTicketAsync(new MaintenanceTicket
    {
        DeviceId = eventData.DeviceId,
        Priority = Priority.Critical,
        Description = "Fuel level critical - immediate attention required"
    });
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Processing Timeouts
**Problem**: Messages taking too long to process
**Solution**: Increase ProcessingTimeout or optimize business logic

#### 2. Memory Leaks
**Problem**: Memory usage growing over time
**Solution**: Implement proper disposal and limit in-memory collections

#### 3. Command Failures
**Problem**: Commands not reaching devices
**Solution**: Check Gateway connectivity and command format

#### 4. Event Subscription Issues
**Problem**: Event handlers not firing
**Solution**: Verify event type names match exactly

### Debugging Techniques

```csharp
// Detailed logging for troubleshooting
_logger.LogDebug("Processing message {MessageId} of type {MessageType} from device {DeviceId}",
    message.MessageId, message.MessageType, message.DeviceId);

// Performance monitoring
var stopwatch = Stopwatch.StartNew();
var result = await ProcessMessageAsync(message);
_logger.LogInformation("Processed message in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);

// Statistics for health monitoring
var stats = await GetStatisticsAsync();
if (stats.AverageProcessingTime > TimeSpan.FromSeconds(5))
{
    _logger.LogWarning("High processing latency detected: {AverageTime}", stats.AverageProcessingTime);
}
```

---

## 📝 Summary

**FMS.IoT.ProcessingEngine** is the intelligent core of the IoT system. It:

- ✅ **Processes device data** efficiently and reliably
- ✅ **Transforms raw data** into business-friendly formats
- ✅ **Generates intelligent events** based on business rules
- ✅ **Executes commands** to control device behavior
- ✅ **Monitors performance** and provides detailed metrics

**Junior Engineer Takeaway**: Focus on understanding the processing pipeline first (message → transform → events → commands), then dive into specific business logic for your use case.

---

*Remember: The processing engine handles business-critical logic - always test thoroughly and monitor performance!*
