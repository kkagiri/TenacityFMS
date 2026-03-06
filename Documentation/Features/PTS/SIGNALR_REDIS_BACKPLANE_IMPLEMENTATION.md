# SignalR Redis Backplane Implementation - Change Summary

**Date:** November 7, 2025
**Issue:** ATG Dashboard not displaying pump status because Windows Service couldn't broadcast to WebClient's SignalR clients
**Solution:** Added SignalR Redis backplane for cross-process communication

---

## Changes Made

### 1. NuGet Packages

#### FMS.PTS.WindowsService.csproj
**Added:**
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="8.0.4" />
```

#### FMS.WebClient.csproj
**Already had:** ✅
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="8.0.4" />
```

### 2. WebClient Configuration

**File:** `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`

**Changed:**
```csharp
// BEFORE
services.AddSignalR(options => { ... });

// AFTER
var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
var signalRBuilder = services.AddSignalR(options => { ... });

if (!string.IsNullOrEmpty(redisConn))
{
    signalRBuilder.AddStackExchangeRedis(redisConn, options =>
    {
        options.Configuration.ChannelPrefix = "fms-signalr";
    });
    Log.Information("SignalR Redis backplane configured for cross-process communication");
}
```

### 3. Windows Service Configuration

**File:** `FMS.PTS.WindowsService/Program.cs`

**Changed Method:** `ConfigureCommunicationServices()`

```csharp
// BEFORE
services.AddSignalR();
// Comment said: "No need for AddStackExchangeRedis() here..." ❌ WRONG

// AFTER
var redisConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
var signalRBuilder = services.AddSignalR(options => { options.EnableDetailedErrors = true; });

if (!string.IsNullOrEmpty(redisConnectionString))
{
    signalRBuilder.AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = "fms-signalr"; // Must match WebClient
    });
    Log.Information("SignalR Redis backplane configured - Windows Service can now communicate with WebClient hubs");
}
```

### 4. Documentation

**Created:** `Documentation/PTS/SIGNALR_REDIS_BACKPLANE.md`

Comprehensive guide covering:
- Architecture diagrams (before/after)
- Configuration details
- Testing procedures
- Troubleshooting guide
- Migration steps

---

## How It Works Now

### Complete Flow: Device → Frontend

```
1. Device sends upload status via WebSocket
   ↓
2. Windows Service receives in PTSWebSocketListenerService
   ↓
3. UploadStatusCommand.Handle() executes
   ↓
4. Broadcasts via: await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", data)
   ↓
5. Redis backplane intercepts → publishes to "fms-signalr:PTSHub:all"
   ↓
6. WebClient subscribes to channel → receives from Redis
   ↓
7. WebClient broadcasts to connected SignalR clients
   ↓
8. Frontend ptsSignalRService.js receives event
   ↓
9. Redux store updated with RECEIVE_UPLOAD_STATUS_UPDATE
   ↓
10. ATG Dashboard displays pump status ✅
```

---

## Deployment Steps

### 1. Build Projects

```powershell
# Restore packages (includes new SignalR backplane package)
dotnet restore

# Build Windows Service
dotnet build FMS.PTS.WindowsService/FMS.PTS.WindowsService.csproj

# Build WebClient
dotnet build FMS.WebClient/FMS.WebClient.csproj
```

### 2. Verify Environment Variable

```powershell
# Check if Redis connection is configured
[System.Environment]::GetEnvironmentVariable("ConnectionStrings__RedisConnection", [System.EnvironmentVariableTarget]::Machine)

# Should return something like: localhost:6379,abortConnect=false
```

### 3. Restart Services

```powershell
# Stop Windows Service
Stop-Service "FMS.PTS.WindowsService"

# Stop WebClient (if running as Windows Service)
Stop-Service "FMS.WebClient"
# Or restart IIS if hosted there:
iisreset

# Start Redis (if not already running)
.\scripts\redis\start-redis.bat

# Start Windows Service
Start-Service "FMS.PTS.WindowsService"

# Start WebClient
Start-Service "FMS.WebClient"
```

### 4. Verify Logs

**Windows Service logs should show:**
```
[INFO] SignalR Redis backplane configured - Windows Service can now communicate with WebClient hubs
```

**WebClient logs should show:**
```
[INFO] SignalR Redis backplane configured for cross-process communication
```

---

## Testing the Fix

### Test 1: Check Redis Channels

```bash
redis-cli
PUBSUB CHANNELS fms-signalr:*

# Should see channels like:
# 1) "fms-signalr:PTSHub"
# 2) "fms-signalr:DashboardHub"
```

### Test 2: Monitor Upload Status Flow

1. Open browser console on ATG Dashboard
2. Send upload status from PTS device
3. Should see in console:
   ```javascript
   PTS SignalR - UploadStatusUpdate received: { deviceId: "...", ... }
   ```
4. Pump status should update in dashboard UI

### Test 3: Check Logs

**Windows Service:**
```
[INFO] Broadcasting upload status update for device: {DeviceId}
[DEBUG] SignalR backplane published message to Redis
```

**WebClient:**
```
[DEBUG] Received SignalR message from Redis backplane
[DEBUG] Broadcasting to 5 connected clients
```

---

## Key Configuration Points

### ✅ Both Processes Must Have

1. **Same Redis connection string**
   - Environment variable: `ConnectionStrings__RedisConnection`
   - Value: `localhost:6379,abortConnect=false`

2. **Same channel prefix**
   - Both use: `"fms-signalr"`
   - Must match exactly or messages won't route

3. **Redis backplane configured**
   - Both call: `.AddStackExchangeRedis()`
   - Windows Service needs this to broadcast
   - WebClient needs this to receive

4. **Redis server running**
   - Port 6379 accessible from both processes
   - Use `scripts/redis/start-redis.bat`

---

## What This Fixes

### ✅ Problems Solved

1. **ATG Dashboard pump status not updating**
   - Windows Service can now broadcast to frontend clients

2. **Cross-process SignalR communication**
   - IHubContext works across process boundaries

3. **Upload status delivery**
   - Device → Windows Service → Redis → WebClient → Frontend (complete flow)

### ❌ Previous Architecture Issues

1. **Hub context mismatch** (FIXED in previous PR)
   - Was using `IHubContext<FrontEndHub>` → Changed to `IHubContext<PTSHub>`

2. **No backplane** (FIXED in this PR)
   - IHubContext only worked within same process
   - Broadcasts never reached WebClient's SignalR clients

---

## Alternatives Considered

### Option 1: Redis Pub/Sub (NOT CHOSEN)
- Would require implementing custom channels
- Duplicate pattern (backplane uses Redis pub/sub internally)
- More code to maintain

### Option 2: SignalR Redis Backplane (✅ CHOSEN)
- Standard ASP.NET Core pattern
- Minimal code changes
- Transparent to application logic
- Industry best practice
- Built-in retry/reconnection logic

---

## Rollback Plan

If issues occur, revert these changes:

1. **Remove from FMS.PTS.WindowsService.csproj:**
   ```xml
   <PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="8.0.4" />
   ```

2. **Revert FMS.PTS.WindowsService/Program.cs ConfigureCommunicationServices():**
   ```csharp
   services.AddSignalR();
   ```

3. **Revert FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs:**
   ```csharp
   services.AddSignalR(options => { ... }); // No backplane
   ```

4. **Rebuild and restart both services**

---

## Next Steps

### Immediate
- [ ] Deploy to development environment
- [ ] Test upload status flow end-to-end
- [ ] Monitor Redis memory usage
- [ ] Verify logs show backplane messages

### Future Enhancements
- [ ] Add metrics for backplane message volume
- [ ] Implement health checks for Redis backplane
- [ ] Add alerting for backplane disconnections
- [ ] Consider Redis Sentinel for high availability

---

## References

- **Documentation:** `Documentation/PTS/SIGNALR_REDIS_BACKPLANE.md`
- **Microsoft Docs:** [ASP.NET Core SignalR Redis Backplane](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane)
- **Related Issues:** ATG dashboard not displaying pumps
- **Previous Fix:** Hub context mismatch (FrontEndHub → PTSHub)

---

**Status:** ✅ Implementation Complete - Ready for Testing
**Impact:** HIGH - Fixes critical real-time communication issue
**Risk:** LOW - Standard pattern, well-tested backplane implementation
