# SignalR Redis Backplane Configuration

## Overview

The FMS system uses SignalR Redis backplane to enable **cross-process real-time communication** between:
- **FMS.PTS.WindowsService** (separate process) → broadcasts to →
- **FMS.WebClient** (ASP.NET Core application) → connected SignalR clients (browsers)

Without the Redis backplane, `IHubContext<PTSHub>` in the Windows Service cannot reach clients connected to the WebClient's SignalR hubs because they run in separate processes with independent memory spaces.

## Architecture

### Before Redis Backplane (Broken)
```
Device → Windows Service → IHubContext<PTSHub> ❌ Cannot reach WebClient
                                                  ↓
                                            WebClient (Different Process)
                                                  ↓
                                            Frontend Clients (No updates received)
```

### After Redis Backplane (Working)
```
Device → Windows Service → IHubContext<PTSHub> → Redis Backplane
                                                       ↓
                                                  WebClient subscribes
                                                       ↓
                                                  SignalR Hub broadcasts
                                                       ↓
                                                  Frontend Clients ✅
```

## Implementation Details

### 1. NuGet Package (Added to Both Projects)

**FMS.WebClient.csproj:**
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="8.0.4" />
```

**FMS.PTS.WindowsService.csproj:**
```xml
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="8.0.4" />
```

### 2. WebClient Configuration

**Location:** `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`

```csharp
// Get Redis connection from environment variable
var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);

var signalRBuilder = services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 102400000; // 100MB
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
});

// Add Redis backplane for cross-process SignalR communication
if (!string.IsNullOrEmpty(redisConn))
{
    signalRBuilder.AddStackExchangeRedis(redisConn, options =>
    {
        options.Configuration.ChannelPrefix = "fms-signalr"; // Namespace SignalR channels
    });
    Log.Information("SignalR Redis backplane configured for cross-process communication");
}
```

### 3. Windows Service Configuration

**Location:** `FMS.PTS.WindowsService/Program.cs` → `ConfigureCommunicationServices()`

```csharp
// Get Redis connection string from environment variable
var redisConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);

// Register SignalR core services with Redis backplane
var signalRBuilder = services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

// Add Redis backplane to enable IHubContext to communicate with WebClient's SignalR hubs
if (!string.IsNullOrEmpty(redisConnectionString))
{
    signalRBuilder.AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = "fms-signalr"; // Must match WebClient configuration
    });
    Log.Information("SignalR Redis backplane configured - Windows Service can now communicate with WebClient hubs");
}
```

### 4. Environment Variable Configuration

Both projects read from the same environment variable:

**Environment Variable:**
```
ConnectionStrings__RedisConnection
```

**Typical Value:**
```
localhost:6379,abortConnect=false,connectTimeout=5000,syncTimeout=10000
```

**How to Set (Windows Machine-Level):**
```powershell
# Set machine-level environment variable
[System.Environment]::SetEnvironmentVariable(
    "ConnectionStrings__RedisConnection",
    "localhost:6379,abortConnect=false",
    [System.EnvironmentVariableTarget]::Machine
)

# Restart services to pick up new value
```

## How It Works

### Message Flow

1. **Device sends upload status** → Windows Service receives via WebSocket
2. **Windows Service processes** → `UploadStatusCommand.Handle()` executes
3. **Broadcast via IHubContext:**
   ```csharp
   await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", uploadStatusUpdate);
   ```
4. **Redis backplane intercepts** → Publishes to `fms-signalr:PTSHub:all` channel
5. **WebClient subscribes to channel** → Receives message from Redis
6. **WebClient broadcasts locally** → Connected SignalR clients receive update
7. **Frontend receives event** → `ptsSignalRService.js` dispatches to Redux

### Channel Naming Convention

The Redis backplane automatically creates channels with this pattern:
```
{ChannelPrefix}:{HubName}:{Method}
```

Examples:
- `fms-signalr:PTSHub:all` - Broadcasts to all PTSHub clients
- `fms-signalr:DashboardHub:all` - Broadcasts to all DashboardHub clients
- `fms-signalr:FrontEndHub:all` - Broadcasts to all FrontEndHub clients

## Key Benefits

### ✅ Cross-Process Communication
- Windows Service can broadcast to WebClient's SignalR clients
- No need for separate Redis pub/sub implementation for real-time updates
- Unified SignalR pattern for all real-time communication

### ✅ Scalability
- Can scale WebClient horizontally (multiple instances)
- All instances share the same Redis backplane
- Clients connected to any instance receive broadcasts from Windows Service

### ✅ Consistency
- Same `IHubContext` API works regardless of process boundary
- No code changes needed in broadcasting logic
- Transparent to application code

## Configuration Requirements

### Critical Settings

Both processes **MUST** have:
1. ✅ Same Redis connection string
2. ✅ Same `ChannelPrefix` value (`"fms-signalr"`)
3. ✅ SignalR backplane configured via `.AddStackExchangeRedis()`
4. ✅ Redis server running and accessible

### Verification Checklist

- [ ] Redis server is running (`redis-server.exe` or via `scripts/redis/start-redis.bat`)
- [ ] Environment variable `ConnectionStrings__RedisConnection` is set
- [ ] Both WebClient and Windows Service have been rebuilt after changes
- [ ] Both processes have been restarted to pick up new configuration
- [ ] Check logs for "SignalR Redis backplane configured" message in both processes

## Testing the Backplane

### 1. Check Redis Channels

```bash
# Connect to Redis CLI
redis-cli

# Monitor all channel activity
PSUBSCRIBE fms-signalr:*

# Should see messages like:
# 1) "pmessage"
# 2) "fms-signalr:*"
# 3) "fms-signalr:PTSHub:all"
# 4) <binary message data>
```

### 2. Verify Upload Status Flow

1. **Send device upload status** via PTS device or test command
2. **Check Windows Service logs:**
   ```
   [INFO] Broadcasting upload status update for device: {DeviceId}
   ```
3. **Check WebClient logs:**
   ```
   [DEBUG] Received SignalR message from backplane
   ```
4. **Check Frontend console:**
   ```javascript
   PTS SignalR - UploadStatusUpdate received: {...}
   ```

### 3. Test Cross-Process Broadcast

**In Windows Service (UploadStatusCommand.cs):**
```csharp
_logger.LogInformation("Broadcasting upload status via IHubContext<PTSHub>");
await _hubContext.Clients.All.SendAsync("UploadStatusUpdate", uploadStatusUpdate);
_logger.LogInformation("Broadcast completed");
```

**Frontend should receive event** within milliseconds if backplane is working.

## Troubleshooting

### Issue: Upload Status Not Received in Frontend

**Symptoms:**
- Windows Service logs show successful broadcast
- Frontend `ptsSignalRService.js` never receives event
- Redux state not updated

**Diagnosis:**
```bash
# Check if Redis backplane channels exist
redis-cli
PUBSUB CHANNELS fms-signalr:*

# Should return channels like:
# 1) "fms-signalr:PTSHub"
# 2) "fms-signalr:DashboardHub"
```

**Solutions:**
1. ✅ Verify both processes have backplane configured (check logs for "SignalR Redis backplane configured")
2. ✅ Ensure `ChannelPrefix` matches exactly in both processes
3. ✅ Restart both WebClient and Windows Service
4. ✅ Check Redis connectivity from both processes

### Issue: "SignalR Redis backplane not configured" in Logs

**Cause:** Environment variable `ConnectionStrings__RedisConnection` not found

**Solution:**
```powershell
# Check current value
[System.Environment]::GetEnvironmentVariable("ConnectionStrings__RedisConnection", [System.EnvironmentVariableTarget]::Machine)

# Set if missing
[System.Environment]::SetEnvironmentVariable(
    "ConnectionStrings__RedisConnection",
    "localhost:6379,abortConnect=false",
    [System.EnvironmentVariableTarget]::Machine
)

# Restart services
```

### Issue: Redis Connection Timeout

**Symptoms:**
- Services start but backplane fails to connect
- Logs show: "Redis connection failed" or "Timeout awaiting response"

**Solutions:**
1. ✅ Start Redis server: `scripts/redis/start-redis.bat`
2. ✅ Test connectivity: `redis-cli ping` (should return "PONG")
3. ✅ Check firewall rules for port 6379
4. ✅ Increase timeout in connection string:
   ```
   localhost:6379,abortConnect=false,connectTimeout=10000,syncTimeout=20000
   ```

## Performance Considerations

### Redis Channel Overhead

- Each hub broadcast creates 1 Redis pub message
- Minimal overhead (<1ms for local Redis)
- Scales well with multiple instances

### Message Size Limits

- SignalR backplane uses Redis pub/sub (no size limit in Redis 7.0+)
- WebClient configured with `MaximumReceiveMessageSize = 102400000` (100MB)
- Typical upload status ~5KB, well within limits

### Connection Pooling

- Redis backplane uses StackExchange.Redis connection pooler
- Shared `IConnectionMultiplexer` instance across services
- Automatic reconnection on failures

## Migration Guide

### Before (Broken Architecture)
```csharp
// Windows Service Program.cs
services.AddSignalR(); // ❌ No backplane, broadcasts don't reach WebClient
```

### After (Working Architecture)
```csharp
// Windows Service Program.cs
var redisConn = Environment.GetEnvironmentVariable("ConnectionStrings__RedisConnection", EnvironmentVariableTarget.Machine);
var signalRBuilder = services.AddSignalR();

if (!string.IsNullOrEmpty(redisConn))
{
    signalRBuilder.AddStackExchangeRedis(redisConn, options =>
    {
        options.Configuration.ChannelPrefix = "fms-signalr"; // ✅ Cross-process broadcasts work
    });
}
```

## Related Documentation

- [SIGNALR_WEBSOCKET_SOLUTION.md](./SIGNALR_WEBSOCKET_SOLUTION.md) - WebSocket protocol fixes
- [TESTING_SIGNALR.md](./TESTING_SIGNALR.md) - SignalR testing procedures
- [uploadstatusformat.md](./uploadstatusformat.md) - Upload status message format
- [Redis Configuration](../../scripts/redis/README.md) - Redis setup guide

## References

- [ASP.NET Core SignalR Redis Backplane](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane)
- [StackExchange.Redis Documentation](https://stackexchange.github.io/StackExchange.Redis/)
- [SignalR Scaleout](https://learn.microsoft.com/en-us/aspnet/signalr/overview/performance/scaleout-in-signalr)

---

**Last Updated:** November 7, 2025
**Author:** System Architecture Team
**Status:** ✅ Implemented and Tested
