# PTS-IoT Migration Configuration Guide

## 📋 Setup Instructions

### 1. Add PTS Protocol Handler to Gateway

**Register in Program.cs:**
```csharp
// In FMS.IoT.Gateway or your main application
services.AddSingleton<IProtocolHandler, PTSProtocolHandler>();
services.AddSingleton<PTSDataIntegrationService>();

// Configure gateway options
services.Configure<GatewayOptions>(configuration.GetSection("Gateway"));
```

**Update appsettings.json:**
```json
{
  "Gateway": {
    "MaxConcurrentConnections": 1000,
    "ConnectionTimeout": "00:05:00",
    "HeartbeatInterval": "00:00:30",
    "MaxMessageSize": 1048576,
    "Protocols": {
      "jsonPTS": {
        "MaxFrameSize": 1048576,
        "EnableCompression": false,
        "PingInterval": "00:00:30"
      }
    }
  },
  "IoTMigration": {
    "EnableIoTProcessing": true,
    "DevicesUsingIoT": ["PTS001", "PTS002"],
    "FallbackToLegacy": true,
    "LogAllProcessing": true
  }
}
```

### 2. Create Migration Service

```csharp
// Services/PTSMigrationService.cs
public class PTSMigrationService
{
    private readonly ILogger<PTSMigrationService> _logger;
    private readonly GpsdataContext _context;
    private readonly IConfiguration _configuration;
    private readonly PTSMessageProcessor _legacyProcessor;
    private readonly PTSDataIntegrationService _iotService;

    public PTSMigrationService(
        ILogger<PTSMigrationService> logger,
        GpsdataContext context,
        IConfiguration configuration,
        PTSMessageProcessor legacyProcessor,
        PTSDataIntegrationService iotService)
    {
        _logger = logger;
        _context = context;
        _configuration = configuration;
        _legacyProcessor = legacyProcessor;
        _iotService = iotService;
    }

    public async Task<bool> ShouldUseIoTProcessingAsync(string deviceId)
    {
        var enableIoT = _configuration.GetValue<bool>("IoTMigration:EnableIoTProcessing");
        if (!enableIoT) return false;

        var iotDevices = _configuration.GetSection("IoTMigration:DevicesUsingIoT").Get<string[]>();
        return iotDevices?.Contains(deviceId) == true;
    }

    public async Task<ProcessingResult> ProcessMessageAsync(string deviceId, PTSMessage ptsMessage)
    {
        var useIoT = await ShouldUseIoTProcessingAsync(deviceId);

        if (useIoT)
        {
            return await ProcessViaIoTAsync(deviceId, ptsMessage);
        }
        else
        {
            return await ProcessViaLegacyAsync(deviceId, ptsMessage);
        }
    }

    private async Task<ProcessingResult> ProcessViaIoTAsync(string deviceId, PTSMessage ptsMessage)
    {
        try
        {
            _logger.LogInformation("Processing message from device {DeviceId} via IoT system", deviceId);

            // Convert PTSMessage to DeviceMessage
            var deviceMessage = new DeviceMessage
            {
                MessageId = ptsMessage.PtsId ?? Guid.NewGuid().ToString(),
                DeviceId = deviceId,
                Protocol = "jsonPTS",
                MessageType = DetermineMessageType(ptsMessage),
                Data = new Dictionary<string, object>
                {
                    ["ptsMessage"] = ptsMessage,
                    ["uploadStatus"] = ExtractUploadStatus(ptsMessage),
                    ["pumpData"] = ExtractPumpData(ptsMessage)
                },
                Timestamp = DateTime.UtcNow
            };

            // Process through IoT system
            await _iotService.TransformAsync<UploadStatus>(deviceMessage);

            return new ProcessingResult
            {
                IsSuccess = true,
                ProcessedMessageId = deviceMessage.MessageId,
                ProcessingTime = TimeSpan.FromMilliseconds(50),
                ProcessedData = new Dictionary<string, object> { ["method"] = "IoT" }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "IoT processing failed for device {DeviceId}, falling back to legacy", deviceId);

            if (_configuration.GetValue<bool>("IoTMigration:FallbackToLegacy"))
            {
                return await ProcessViaLegacyAsync(deviceId, ptsMessage);
            }

            throw;
        }
    }

    private async Task<ProcessingResult> ProcessViaLegacyAsync(string deviceId, PTSMessage ptsMessage)
    {
        try
        {
            _logger.LogInformation("Processing message from device {DeviceId} via legacy system", deviceId);

            // Use existing PTSMessageProcessor
            var response = await _legacyProcessor.ProcessMessageAsync(deviceId, ptsMessage);

            return new ProcessingResult
            {
                IsSuccess = true,
                ProcessedMessageId = ptsMessage.PtsId ?? Guid.NewGuid().ToString(),
                ProcessingTime = TimeSpan.FromMilliseconds(100),
                ProcessedData = new Dictionary<string, object>
                {
                    ["method"] = "Legacy",
                    ["response"] = response
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Legacy processing failed for device {DeviceId}", deviceId);

            return new ProcessingResult
            {
                IsSuccess = false,
                ProcessedMessageId = ptsMessage.PtsId ?? Guid.NewGuid().ToString(),
                ProcessingTime = TimeSpan.FromMilliseconds(10),
                ErrorMessage = ex.Message
            };
        }
    }

    private string DetermineMessageType(PTSMessage ptsMessage)
    {
        var firstPacket = ptsMessage.Packets?.FirstOrDefault();
        return firstPacket?.Type?.ToLowerInvariant() switch
        {
            "uploadstatus" => "telemetry",
            "pumpauthorize" => "command",
            "pumpclose" => "command",
            _ => "status"
        };
    }

    private object? ExtractUploadStatus(PTSMessage ptsMessage)
    {
        var uploadPacket = ptsMessage.Packets?.FirstOrDefault(p =>
            p.Type?.Equals("UploadStatus", StringComparison.OrdinalIgnoreCase) == true);

        return uploadPacket?.Data;
    }

    private object? ExtractPumpData(PTSMessage ptsMessage)
    {
        var pumpPackets = ptsMessage.Packets?.Where(p =>
            p.Type?.Contains("Pump", StringComparison.OrdinalIgnoreCase) == true);

        return pumpPackets?.Select(p => new { p.Type, p.Data });
    }
}

public class ProcessingResult
{
    public bool IsSuccess { get; set; }
    public string ProcessedMessageId { get; set; } = string.Empty;
    public TimeSpan ProcessingTime { get; set; }
    public Dictionary<string, object> ProcessedData { get; set; } = new();
    public string? ErrorMessage { get; set; }
}
```

### 3. Update Existing PTSMessageProcessor

```csharp
// Modify your existing PTSMessageProcessor.cs
public class PTSMessageProcessor : IPTSMessageProcessor
{
    private readonly ILogger<PTSMessageProcessor> _logger;
    private readonly MessageHandlerRegistry _handlerRegistry;
    private readonly IPTSConnectionManager _connectionManager;
    private readonly PTSMigrationService _migrationService; // Add this

    public PTSMessageProcessor(
        ILogger<PTSMessageProcessor> logger,
        MessageHandlerRegistry handlerRegistry,
        IPTSConnectionManager connectionManager,
        PTSMigrationService migrationService) // Add this
    {
        _logger = logger;
        _handlerRegistry = handlerRegistry;
        _connectionManager = connectionManager;
        _migrationService = migrationService; // Add this
    }

    public async Task<PTSMessage> ProcessMessageAsync(string deviceId, PTSMessage message)
    {
        // Route through migration service
        var result = await _migrationService.ProcessMessageAsync(deviceId, message);

        if (result.IsSuccess)
        {
            // Extract response from processing result
            if (result.ProcessedData.TryGetValue("response", out var response) &&
                response is PTSMessage ptsResponse)
            {
                return ptsResponse;
            }

            // Create success response
            return CreateSuccessResponse(message);
        }
        else
        {
            // Create error response
            return CreateErrorResponse(message, result.ErrorMessage);
        }
    }

    public async Task HandleMessageAsync(string deviceId, PTSMessage message)
    {
        var response = await ProcessMessageAsync(deviceId, message);

        // Send response back to device (existing logic)
        var responseJson = JsonConvert.SerializeObject(response);
        await _connectionManager.SendMessageAsync(deviceId, responseJson);
    }

    // Keep existing methods...
}
```

### 4. Database Migration (Optional)

```sql
-- Add IoT tracking columns to existing device table
ALTER TABLE ptsdevice
ADD COLUMN iot_enabled TINYINT DEFAULT 0 COMMENT 'Whether device uses IoT processing',
ADD COLUMN iot_migration_date DATETIME NULL COMMENT 'When device was migrated to IoT',
ADD COLUMN processing_mode ENUM('legacy', 'iot', 'hybrid') DEFAULT 'legacy' COMMENT 'Current processing mode',
ADD COLUMN iot_message_count BIGINT DEFAULT 0 COMMENT 'Number of messages processed via IoT',
ADD COLUMN legacy_message_count BIGINT DEFAULT 0 COMMENT 'Number of messages processed via legacy';

-- Create IoT message tracking table
CREATE TABLE iot_message_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    message_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    processing_method ENUM('iot', 'legacy', 'fallback') NOT NULL,
    processing_time_ms INT NOT NULL,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_result ENUM('success', 'failure', 'partial') NOT NULL,
    error_message TEXT NULL,

    INDEX idx_device_processed_at (device_id, processed_at),
    INDEX idx_message_type (message_type),
    INDEX idx_processing_method (processing_method)
) COMMENT='Tracks IoT vs Legacy message processing performance';
```

### 5. Redis Configuration

```json
{
  "ConnectionStrings": {
    "RedisConnection": "localhost:6379",
    "DefaultConnection": "Server=localhost;Database=fms;..."
  },
  "Redis": {
    "Channels": {
      "PTSCommands": "pts-commands",
      "PTSCommandResponses": "pts-command-responses",
      "PTSStatusUpdates": "pts-status-updates",
      "IoTDeviceEvents": "iot-device-events",
      "IoTProcessingResults": "iot-processing-results"
    },
    "CacheSettings": {
      "DeviceStatusTTL": "00:05:00",
      "DeviceInfoTTL": "01:00:00",
      "TransactionContextTTL": "24:00:00"
    }
  }
}
```

## 🚀 Deployment Steps

### Step 1: Prepare Environment
```bash
# 1. Update configuration files
cp appsettings.example.json appsettings.json
# Edit appsettings.json with your settings

# 2. Run database migrations (if using new tables)
dotnet ef database update

# 3. Test Redis connectivity
redis-cli ping
```

### Step 2: Deploy with Feature Flags
```csharp
// Start with IoT disabled
{
  "IoTMigration": {
    "EnableIoTProcessing": false,  // Start disabled
    "DevicesUsingIoT": [],
    "FallbackToLegacy": true,
    "LogAllProcessing": true
  }
}
```

### Step 3: Enable for Test Device
```csharp
// Enable for one test device
{
  "IoTMigration": {
    "EnableIoTProcessing": true,
    "DevicesUsingIoT": ["TEST_PTS_001"], // One test device
    "FallbackToLegacy": true,
    "LogAllProcessing": true
  }
}
```

### Step 4: Monitor and Validate
```bash
# Monitor logs for both systems
tail -f logs/application.log | grep "Processing message"

# Check Redis for cached data
redis-cli keys "device:*"

# Validate database updates
SELECT * FROM iot_message_log ORDER BY processed_at DESC LIMIT 10;
```

### Step 5: Gradual Rollout
```csharp
// Add more devices gradually
{
  "IoTMigration": {
    "EnableIoTProcessing": true,
    "DevicesUsingIoT": ["TEST_PTS_001", "PTS_002", "PTS_003"],
    "FallbackToLegacy": true,
    "LogAllProcessing": true
  }
}
```

## 📊 Monitoring & Validation

### Performance Metrics
```csharp
// Add to your monitoring dashboard
public class PTSPerformanceMetrics
{
    public int IoTMessagesProcessed { get; set; }
    public int LegacyMessagesProcessed { get; set; }
    public double IoTAverageProcessingTime { get; set; }
    public double LegacyAverageProcessingTime { get; set; }
    public int IoTErrors { get; set; }
    public int LegacyErrors { get; set; }
    public int FallbackOccurrences { get; set; }
}
```

### Health Check Endpoint
```csharp
// Add to your API
[HttpGet("api/health/pts-migration")]
public async Task<IActionResult> GetMigrationHealth()
{
    var metrics = await _migrationService.GetMetricsAsync();
    return Ok(new
    {
        IoTEnabled = _configuration.GetValue<bool>("IoTMigration:EnableIoTProcessing"),
        DevicesOnIoT = _configuration.GetSection("IoTMigration:DevicesUsingIoT").Get<string[]>(),
        Performance = metrics
    });
}
```

## ⚠️ Rollback Plan

If issues occur, rollback is simple:

```csharp
// Immediate rollback - disable IoT processing
{
  "IoTMigration": {
    "EnableIoTProcessing": false,  // Disable immediately
    "DevicesUsingIoT": [],
    "FallbackToLegacy": true
  }
}
```

All devices will immediately revert to legacy processing without application restart.

---

This configuration provides a safe, gradual migration path while preserving all existing functionality.
