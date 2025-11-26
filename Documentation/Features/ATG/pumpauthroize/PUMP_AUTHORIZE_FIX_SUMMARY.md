# Pump Authorization Timeout Fix - Quick Summary

## The Problem
API wasn't receiving `PumpAuthorizeConfirmation` from PTS devices within 3 seconds, causing authorization failures.

## The Solution (3 Key Changes)

### 1. ✅ Enhanced Response Handler
**File**: `FMS.Application/Handlers/PumpAuthorizeResponseHandler.cs`

**What Changed**:
- Now publishes confirmations to Redis channel
- Stores confirmation in Redis for 30 seconds as fallback
- Added dependency: `IConnectionMultiplexer _redis`

**Why**: The handler was receiving confirmations but not forwarding them to waiting commands.

### 2. ✅ Extended Timeout
**File**: `FMS.Application/Communication/Redis/RedisCommandService.cs`

**What Changed**:
- Added `_pumpAuthorizeTimeout = 15 seconds` (was 10s)
- Dynamically selects timeout based on command type
- Better logging for timeout tracking

**Why**: PumpAuthorize needs more time than other commands due to:
- Device processing
- Transaction ID generation
- Confirmation message routing

### 3. ✅ Improved Logging
**All Files**

**What Changed**:
- Added correlation ID tracking
- Log timeout values used
- Log response times
- Better error categorization

**Why**: Essential for debugging timeout issues in production.

## How It Works Now

```
Frontend Request
    ↓
API Handler (validates)
    ↓
PumpService
    ↓
CommandExecutor
    ↓
RedisCommandService (15s timeout for PumpAuthorize)
    ↓ publishes to "pts-commands"
Redis Pub/Sub
    ↓
PTS.WindowsService
    ↓ sends to device via WebSocket
PTS Device (processes, generates transaction ID)
    ↓ returns PumpAuthorizeConfirmation
PTS.WindowsService
    ↓ publishes to "pts-command-responses"
RedisCommandService (receives within 15s)
    ↓
Response flows back to Frontend
```

## What You Need to Test

### Basic Test
1. Authorize a pump from the frontend
2. Check logs for: `"Sending PumpAuthorize command with 15s timeout"`
3. Verify: `"Received response for PumpAuthorize (correlation: {id}) in {ms}ms"`
4. Confirm: Transaction ID is returned correctly

### Timeout Test
1. Disconnect device temporarily
2. Try to authorize pump
3. Should timeout after 15 seconds (not 3 seconds)
4. Should show proper error message

### Load Test
1. Authorize 5 pumps concurrently
2. All should complete successfully
3. None should timeout if devices are connected

## Key Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Default Command Timeout | 10s | `RedisCommandService._commandTimeout` |
| PumpAuthorize Timeout | 15s | `RedisCommandService._pumpAuthorizeTimeout` |
| Confirmation Cache TTL | 30s | `PumpAuthorizeConfirmationHandler` |
| Max Retries | 3 | `RedisCommandService.SendCommandAsync` |

## Troubleshooting

### Still getting timeouts?

**Check these in order**:

1. **Is Windows Service running?**
   ```bash
   # Check service status
   Get-Service -Name "FMS.PTS.WindowsService"
   ```

2. **Is device connected via WebSocket?**
   ```bash
   # Check Redis
   redis-cli HGETALL device:websocket-connections
   ```

3. **Is Redis working?**
   ```bash
   # Test Redis pub/sub
   redis-cli SUBSCRIBE pts-commands
   ```

4. **Check logs for correlation ID**:
   - Look for: `"Sending PumpAuthorize command with {Timeout}s timeout (correlation: {CorrelationId})"`
   - Then search for same correlation ID in WindowsService logs

### Wrong transaction ID?

**Not a bug** - PTS devices generate their own transaction IDs. The API receives and returns whatever the device assigns. This prevents ID conflicts.

### Authorization works but frontend shows error?

Check `PumpAuthorizeCommandHandler` - it should:
1. Receive `PumpAuthorizeConfirmation`
2. Store transaction context in Redis
3. Return `FMSResponse<PumpAuthorizeConfirmation>`

## Quick Wins

### If you need even more time:
```csharp
// In RedisCommandService.cs
private readonly TimeSpan _pumpAuthorizeTimeout = TimeSpan.FromSeconds(20); // was 15
```

### If you want to see all Redis messages:
```bash
# Terminal 1: Monitor commands
redis-cli SUBSCRIBE pts-commands

# Terminal 2: Monitor responses
redis-cli SUBSCRIBE pts-command-responses

# Terminal 3: Monitor confirmations
redis-cli SUBSCRIBE pts-pump-authorize-confirmations
```

### If you need to verify a specific pump authorization:
```bash
# Check Redis for transaction context
redis-cli GET "device:PTS001:transaction:12345"

# Check for stored confirmation
redis-cli GET "device:PTS001:pump-auth-confirmation:123"
```

## Files Modified

1. ✅ `FMS.Application/Handlers/PumpAuthorizeResponseHandler.cs` - Added Redis publishing
2. ✅ `FMS.Application/Communication/Redis/RedisCommandService.cs` - Extended timeout
3. ✅ `FMS.Application/PTSServices/PumpService/PumpService.cs` - Already had good error handling
4. ✅ `Documentation/Features/ATG/PUMP_AUTHORIZE_TIMEOUT_FIX.md` - Full documentation

## Next Steps

1. **Test locally** with real PTS device connected
2. **Monitor logs** during testing
3. **Verify timeout** is actually 15 seconds (not 3)
4. **Check confirmation** arrives in logs
5. **Deploy to staging** for broader testing
6. **Add unit tests** (see full documentation)

## Success Criteria

- ✅ No more timeout errors with connected devices
- ✅ Confirmations arrive within 15 seconds
- ✅ Transaction IDs properly returned to frontend
- ✅ Logs show detailed timing information
- ✅ Concurrent authorizations work without issues

---

**Status**: ✅ Implementation Complete
**Testing**: Pending
**Deployment**: Ready for staging

For detailed implementation guide, see: `PUMP_AUTHORIZE_TIMEOUT_FIX.md`
