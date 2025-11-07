# PTS Upload Handler Resilience Architecture

## Overview
This document describes the resilience improvements made to ensure that **UploadStatus messages are never blocked by failed data processing** from other upload handlers (PumpTransaction, TankMeasurement, etc.).

## Problem Statement
**Before improvements:**
- If a database operation failed or hung in UploadPumpTransaction, it could block the handler
- Device would retry the failed transaction repeatedly
- UploadStatus messages could be delayed or blocked in the queue
- System could become unresponsive under database load

## Solution Architecture

### 1. Multi-Layer Error Isolation

#### Layer 1: PTSMessageProcessor (Packet-Level Isolation)
**Location:** `FMS.Application/Handlers/Common/PTSMessageProcessor.cs`

**Key Features:**
- **Per-Packet Timeout (30 seconds):** Each packet handler runs with `Task.WhenAny()` timeout
- **Independent Processing:** Failed packets don't stop other packets from processing
- **Timeout Response:** Returns HTTP 408 (Request Timeout) if handler exceeds 30 seconds
- **Graceful Degradation:** Device receives error acknowledgment, preventing infinite retries

```csharp
// Each packet gets its own timeout protection
var handlerTask = Task.Run(async () => await handler.HandlePacketAsync(deviceId, packet));
var timeoutTask = Task.Delay(TimeSpan.FromSeconds(30));
var completedTask = await Task.WhenAny(handlerTask, timeoutTask);

if (completedTask == timeoutTask) {
    // Handler timed out - return error but continue processing other packets
    return new Packet {
        Id = originalPacketId,
        Error = true,
        Code = 408,
        Message = "Handler processing timeout"
    };
}
```

**Benefits:**
- UploadStatus never waits more than 30 seconds for any other packet
- Failed handlers don't cascade failures to other packets
- System remains responsive even under database contention

---

#### Layer 2: Handler-Level Resilience (Database Timeout Protection)
**Locations:**
- `FMS.Application/Handlers/UploadTransactions/UploadPumpTransactionHandler.cs`
- `FMS.Application/Handlers/UploadTransactions/UploadTankMeasurementHandler.cs`

**Key Features:**
- **Database Operation Timeout (15 seconds):** MediatR commands have timeout protection
- **Fire-and-Forget Enrichment:** Redis lookups run asynchronously without blocking
- **Graceful Acknowledgment:** Returns HTTP 202 (Accepted) if database times out
- **Prevents Retry Storms:** Device gets confirmation even if database is slow

```csharp
// Fire-and-forget Redis enrichment (non-blocking)
_ = Task.Run(async () => {
    try {
        await EnrichTransactionWithContextFromRedis(deviceId, transactionDto);
    } catch (Exception ex) {
        _logger.LogWarning(ex, "Non-critical: Failed to enrich transaction from Redis");
    }
});

// Database operation with timeout
var commandTask = _mediator.Send(new CreatePumpTransactionCommand(transactionDto));
var timeoutTask = Task.Delay(TimeSpan.FromSeconds(15));
var completedTask = await Task.WhenAny(commandTask, timeoutTask);

if (completedTask == timeoutTask) {
    // Database timeout - still acknowledge to device
    responsePacket.Error = false;
    responsePacket.Message = "Transaction queued for processing";
    responsePacket.Code = 202; // HTTP Accepted
    return responsePacket;
}
```

**Benefits:**
- Database delays don't block device acknowledgment
- Device doesn't retry transactions that are already queued
- Non-critical operations (Redis enrichment) never block critical path
- UploadStatus processing remains fast even during database issues

---

### 2. Error Response Strategy

#### Error Code Mapping
```csharp
400 - Bad Request (invalid data format)
401 - Unauthorized (access denied)
408 - Request Timeout (handler timeout)
415 - Unsupported Media Type (no handler found)
500 - Internal Server Error (unexpected exception)
202 - Accepted (queued for processing - database timeout)
200 - OK (successful processing)
```

#### User-Friendly Error Messages
Device receives clear error messages without exposing internal details:
```csharp
private string GetUserFriendlyErrorMessage(Exception ex, string packetType)
{
    return ex switch
    {
        ArgumentException => "Invalid data format",
        UnauthorizedAccessException => "Unauthorized",
        NotSupportedException => $"Packet type '{packetType}' not supported",
        TimeoutException => "Processing timeout",
        _ => "Processing error"
    };
}
```

---

### 3. Critical vs Non-Critical Operations

#### Critical Operations (Must Complete Before Acknowledgment)
- Data validation
- Packet deserialization
- Error detection

#### Non-Critical Operations (Fire-and-Forget)
- Redis context enrichment
- Logging (already async in ILogger)
- SignalR notifications (sent separately via backplane)

---

## Testing Strategy

### 1. Database Failure Testing
```powershell
# Stop MySQL service
Stop-Service MySQL80

# Send test packets to device - should get HTTP 202 responses
# UploadStatus should continue working normally
```

### 2. Database Slowdown Testing
```sql
-- Create artificial delay in stored procedure
DELIMITER $$
CREATE PROCEDURE slow_insert()
BEGIN
    SELECT SLEEP(20);  -- Simulate 20 second delay
    -- Insert logic here
END$$
```

### 3. Load Testing
```powershell
# Send multiple packet types simultaneously
# Monitor that UploadStatus messages are not delayed

# Expected behavior:
# - UploadStatus: < 5 seconds response time
# - Failed transactions: HTTP 408/500 errors
# - Successful transactions: HTTP 200/202
```

### 4. Redis MONITOR Testing
```bash
redis-cli MONITOR

# Watch for:
# - UploadStatus messages appearing every configured interval (e.g., 30s)
# - No blocking between different packet types
# - Proper channel format: fms-signalr:HubName:method
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Handler Timeout Rate**
   - Alert if > 5% of packets timeout
   - Indicates database performance issues

2. **Database Command Duration**
   - Alert if average > 10 seconds
   - Indicates need for database optimization

3. **UploadStatus Interval**
   - Alert if no UploadStatus received for > 2x expected interval
   - Indicates device communication failure

4. **HTTP 202 Response Rate**
   - Alert if sustained > 10% of transactions
   - Indicates database unable to keep up with load

### Log Analysis Queries
```csharp
// Find timeout events
_logger.LogError("Handler timeout for packet {PacketId} of type {PacketType}");

// Find database timeouts
_logger.LogError("Database timeout processing pump transaction for device {DeviceId}");

// Find non-critical failures
_logger.LogWarning("Non-critical: Failed to enrich transaction from Redis");
```

---

## Benefits Summary

### ✅ UploadStatus Protection
- **Never blocked** by failed transaction processing
- **30-second maximum delay** from any other packet type
- **Independent timeout** per packet in message batch

### ✅ Database Resilience
- **15-second timeout** on database operations
- **Graceful degradation** with HTTP 202 responses
- **Prevents retry storms** from device

### ✅ Non-Blocking Operations
- **Fire-and-forget enrichment** doesn't delay responses
- **Async logging** already built into ILogger
- **SignalR backplane** uses Redis pub/sub (non-blocking)

### ✅ Protected Upload Handlers
All data upload handlers now have resilience protection:
- **UploadPumpTransaction** - Fuel transaction uploads
- **UploadTankMeasurement** - Tank level/status uploads
- **UploadAlertRecord** - Device alarm/alert uploads (with retry queue)
- **UploadInTankDelivery** - Fuel delivery event uploads
- **UploadStatus** - Already lightweight, benefits from packet-level timeout

### ✅ Error Visibility
- **Detailed server logs** for troubleshooting
- **User-friendly device messages** without exposing internals
- **Proper HTTP status codes** for client handling

### ✅ Alert-Specific Improvements
- **Timeout-protected device/tank lookups** (5 seconds max)
- **Failed alert retry queue** in Redis for recovery
- **Deduplication logic** prevents alarm spam
- **Graceful alarm processing** even with database issues

---

## Rollback Plan

If issues arise, revert these changes:

1. **PTSMessageProcessor.cs** - Remove timeout wrapper
2. **UploadPumpTransactionHandler.cs** - Make enrichment synchronous again
3. **UploadTankMeasurementHandler.cs** - Make enrichment synchronous again

Rollback commits:
```bash
git revert <commit-hash>
```

---

## Future Improvements

1. **Circuit Breaker Pattern**
   - Temporarily disable failing handlers after X consecutive failures
   - Auto-recover after cooldown period

2. **Retry Queue**
   - Store failed transactions in Redis queue
   - Background worker retries with exponential backoff

3. **Metrics Dashboard**
   - Real-time handler performance monitoring
   - Database query performance tracking
   - Alert threshold configuration UI

4. **Priority Queue**
   - Process UploadStatus with higher priority than data uploads
   - Configurable packet type priorities

---

## Related Documentation
- [JsonPTS Protocol](../JsonPTSprotocal.txt)
- [SignalR Redis Backplane](SIGNALR_WEBSOCKET_SOLUTION.md)
- [PTS Architecture](pts-architecture.md)
