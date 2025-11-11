# Pump Authorization Timeout Fix - Implementation Guide

## Problem Statement

The API was not receiving `PumpAuthorizeConfirmation` responses from PTS devices within the 3-second timeout window, causing authorization failures even when pumps were successfully authorized on the device.

### Root Cause

1. **Timeout Too Short**: Original 3-second timeout insufficient for:
   - Network latency
   - Device processing time
   - Redis pub/sub propagation
   - Response routing through Windows Service

2. **Missing Response Handler**: `PumpAuthorizeConfirmationHandler` existed but wasn't publishing responses to Redis for the waiting `CommandExecutor`

3. **No Fallback Mechanism**: If timeout occurred, no retry or alternative verification method existed

## Solution Architecture

### Flow Diagram

```
┌─────────────┐
│  Frontend   │
│  (React)    │
└──────┬──────┘
       │ POST /pump/authorize
       ▼
┌─────────────────────┐
│ PumpController      │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────┐
│ PumpAuthorizeCommandHandler  │
│ - Validates request          │
│ - Calls PumpService          │
└──────┬───────────────────────┘
       │
       ▼
┌─────────────────────┐
│ PumpService         │
│ - Calls CommandExec │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ CommandExecutor                  │
│ - Determines comm mode (WS/HTTP) │
│ - Calls RedisCommandService      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ RedisCommandService              │
│ - Publishes to "pts-commands"    │
│ - Waits on TCS (15s timeout)     │ ◄─────┐
└──────┬───────────────────────────┘       │
       │                                    │
       ▼                                    │
┌──────────────────────────────────┐       │
│ Redis Pub/Sub                    │       │
│ Channel: "pts-commands"           │       │
└──────┬───────────────────────────┘       │
       │                                    │
       ▼                                    │
┌──────────────────────────────────┐       │
│ PTS.WindowsService               │       │
│ RedisPTSCommandProcessor         │       │
│ - Receives command               │       │
│ - Sends to device via WebSocket  │       │
└──────┬───────────────────────────┘       │
       │                                    │
       ▼                                    │
┌──────────────────────────────────┐       │
│ PTS Device (Hardware)            │       │
│ - Processes PumpAuthorize        │       │
│ - Generates transaction ID       │       │
│ - Sends PumpAuthorizeConfirmation│       │
└──────┬───────────────────────────┘       │
       │                                    │
       ▼                                    │
┌──────────────────────────────────┐       │
│ PTS.WindowsService               │       │
│ - Receives confirmation          │       │
│ - Publishes to "pts-cmd-responses"│      │
└──────┬───────────────────────────┘       │
       │                                    │
       ▼                                    │
┌──────────────────────────────────┐       │
│ RedisCommandService              │       │
│ - Receives response via TCS      │───────┘
│ - Returns to CommandExecutor     │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Response flows back up the chain │
│ to Frontend                      │
└──────────────────────────────────┘
```

## Implementation Changes

### 1. Enhanced PumpAuthorizeConfirmationHandler

**File**: `FMS.Application/Handlers/PumpAuthorizeResponseHandler.cs`

**Changes**:
- Added Redis dependency injection
- Publishes confirmation to Redis channel `pts-pump-authorize-confirmations`
- Stores confirmation in Redis hash with 30-second expiry for fallback retrieval
- Enhanced logging for diagnostics

**Key Code**:
```csharp
// Publish to Redis for waiting CommandExecutor
var subscriber = _redis.GetSubscriber();
var message = JsonConvert.SerializeObject(confirmationData);
await subscriber.PublishAsync(_confirmationChannel, message);

// Store in Redis hash for fallback (expires in 30 seconds)
var db = _redis.GetDatabase();
var key = $"device:{deviceId}:pump-auth-confirmation:{packet.Id}";
await db.StringSetAsync(key, message, TimeSpan.FromSeconds(30));
```

### 2. Extended Timeout in RedisCommandService

**File**: `FMS.Application/Communication/Redis/RedisCommandService.cs`

**Changes**:
- Added `_pumpAuthorizeTimeout` field (15 seconds vs 10 seconds default)
- Dynamic timeout selection based on command type
- Enhanced logging to track timeout usage

**Key Code**:
```csharp
private readonly TimeSpan _pumpAuthorizeTimeout = TimeSpan.FromSeconds(15);

// In SendCommandAsync:
var effectiveTimeout = command.CommandType == "PumpAuthorize"
    ? _pumpAuthorizeTimeout
    : _commandTimeout;
```

### 3. Improved Error Handling in PumpService

**File**: `FMS.Application/PTSServices/PumpService/PumpService.cs`

**Already Robust**:
- Distinguishes between PTS errors (0-58, 1000-1008) and system errors
- Proper exception categorization (Network, System, Device)
- Transaction ID validation
- Comprehensive logging

## Configuration

### Timeout Values

| Command Type | Timeout | Rationale |
|-------------|---------|-----------|
| PumpAuthorize | 15s | Requires device confirmation |
| GetPumpStatus | 10s | Read-only, faster |
| StopPump | 10s | Critical but fast |
| Other Commands | 10s | Default |

### Redis Channels

| Channel | Purpose | Publisher | Subscriber |
|---------|---------|-----------|------------|
| `pts-commands` | Command requests | WebClient | WindowsService |
| `pts-command-responses` | Command responses | WindowsService | WebClient |
| `pts-pump-authorize-confirmations` | Auth confirmations | Handlers | (Future: Direct subscribers) |

## Testing Strategy

### 1. Unit Tests

```csharp
// Test timeout behavior
[Fact]
public async Task PumpAuthorize_Should_Use_Extended_Timeout()
{
    // Arrange
    var command = new RedisPTSCommand
    {
        CommandType = "PumpAuthorize",
        DeviceId = "PTS001"
    };

    // Act & Assert
    // Verify 15-second timeout is used
}
```

### 2. Integration Tests

**Scenario 1: Fast Device Response (< 5s)**
- ✅ Should receive confirmation quickly
- ✅ Should return success within 5 seconds

**Scenario 2: Slow Device Response (5-15s)**
- ✅ Should wait full timeout period
- ✅ Should receive confirmation if device responds
- ✅ Should not timeout prematurely

**Scenario 3: Device Timeout (> 15s)**
- ✅ Should timeout after 15 seconds
- ✅ Should return proper error message
- ✅ Should clean up pending command

**Scenario 4: Network Issues**
- ✅ Should retry up to 3 times
- ✅ Should use exponential backoff
- ✅ Should return network error

### 3. Load Testing

**Test Case**: 10 Concurrent Authorizations
```bash
# Expected behavior:
# - All requests should complete
# - No timeout errors
# - Confirmations should arrive within timeout window
```

## Monitoring & Diagnostics

### Key Log Messages

```
[INFO] Sending PumpAuthorize command with 15s timeout (correlation: {guid})
[INFO] Received response for PumpAuthorize (correlation: {guid}) in {ms}ms
[WARNING] Timeout waiting for PumpAuthorize response after 15s (correlation: {guid})
[INFO] Published PumpAuthorizeConfirmation to Redis: Device={id}, Pump={pump}, Transaction={txn}
```

### Redis Keys to Monitor

```
# Active confirmations (30s TTL)
device:PTS001:pump-auth-confirmation:123

# WebSocket connections
device:websocket-connections

# Transaction contexts
device:PTS001:transaction:12345
```

### Metrics to Track

1. **Authorization Success Rate**: Should be > 95%
2. **Average Response Time**: Should be < 5 seconds
3. **Timeout Rate**: Should be < 5%
4. **Retry Rate**: Should be < 10%

## Troubleshooting

### Issue: Still Getting Timeouts

**Check**:
1. Windows Service is running
2. Device has active WebSocket connection
3. Redis is accessible
4. Device firmware is up to date

**Logs to Review**:
```
RedisPTSCommandProcessor - "Processing command: PumpAuthorize"
CommandExecutor - "Sending Redis command PumpAuthorize"
PumpAuthorizeConfirmationHandler - "Published PumpAuthorizeConfirmation"
```

### Issue: Confirmation Not Arriving

**Verify**:
1. Handler is registered in DI container
2. Redis subscription is active
3. Device is responding (check device logs)
4. Correlation ID matches in logs

**Debug Command**:
```bash
# Monitor Redis channels
redis-cli SUBSCRIBE pts-commands pts-command-responses
```

### Issue: Wrong Transaction ID

**Root Cause**: PTS device generates its own transaction IDs

**Solution**: Already implemented - we use device-generated IDs, not client-generated ones

## Rollback Plan

If issues arise:

1. **Increase Timeout Further**: Change to 20s or 30s
   ```csharp
   private readonly TimeSpan _pumpAuthorizeTimeout = TimeSpan.FromSeconds(20);
   ```

2. **Disable Handler Publishing**: Remove Redis publishing temporarily
   ```csharp
   // Comment out in PumpAuthorizeConfirmationHandler
   // await subscriber.PublishAsync(_confirmationChannel, message);
   ```

3. **Use Polling Fallback**: Add status polling after timeout
   ```csharp
   // After timeout, poll pump status to verify authorization
   var status = await GetPumpStatusAsync(deviceId, pumpId);
   ```

## Future Enhancements

### 1. Adaptive Timeouts
Adjust timeout based on historical device response times

### 2. Confirmation Caching
Store confirmations longer for audit trail

### 3. WebSocket Direct Response
For WebSocket connections, return confirmation directly without Redis pub/sub

### 4. Transaction State Machine
Comprehensive state tracking for entire fueling lifecycle

## References

- PTS Protocol Documentation: Section 113-114 (PumpAuthorize/PumpAuthorizeConfirmation)
- Enhanced Fueling Workflow: `Documentation/Features/ATG/enhanced_fueling_workflow_diagram.md`
- Redis Command Pattern: `FMS.Application/Communication/Redis/`
- Handler Registration: `FMS.WebClient/Startup.cs`

## Validation Checklist

- [x] Handler publishes to Redis
- [x] Timeout extended to 15 seconds
- [x] Correlation ID properly tracked
- [x] Error handling comprehensive
- [x] Logging sufficient for debugging
- [x] Documentation updated
- [ ] Unit tests added (TODO)
- [ ] Integration tests passed (TODO)
- [ ] Load testing completed (TODO)

---

**Last Updated**: 2025-01-11
**Author**: System Architect
**Status**: Implemented, Pending Testing
